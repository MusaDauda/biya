-- ============================================================================
-- Fix: execute_mandate could not persist a status change on a refused call.
--
-- Caught by scripted verification, not by inspection. `execute_mandate` used
-- to UPDATE the mandate to 'revoked' or 'exhausted' and then RAISE an
-- exception in the same call. RAISE aborts the whole function's writes, so
-- the status update was silently rolled back every time: the money-safety
-- check was still correct (spent_total_ngn_minor is recomputed fresh on
-- every call, so it kept refusing correctly), but the row stayed 'active'
-- forever, which means the mandates list would have shown a dead mandate as
-- runnable.
--
-- Fix: the two refusal paths that need a persisted status change (expired,
-- lifetime cap reached) now RETURN a normal jsonb with ok:false instead of
-- raising, so the write commits. Paths that need no companion write (not
-- found, already inactive) still raise, unchanged. Callers must check
-- `data.ok === false` in addition to the Postgres-level error.
-- ============================================================================

create or replace function execute_mandate(p_mandate uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_m mandates; v_q fx_quotes; v_result jsonb; v_spent bigint;
begin
  select * into v_m from mandates where id = p_mandate for update;

  if v_m.id is null then raise exception 'Mandate not found'; end if;

  -- Status here was already committed by a previous call, so raising costs
  -- nothing: there is no write to lose.
  if v_m.status <> 'active' then raise exception 'This mandate is %, not active', v_m.status; end if;

  if v_m.expires_at < now() then
    update mandates set status = 'revoked', revoked_at = now() where id = v_m.id;
    return jsonb_build_object('ok', false, 'mandate_id', v_m.id, 'reason', 'This mandate expired');
  end if;

  -- Unreachable in practice: the table's own check constraint guarantees
  -- amount_ngn_minor <= max_per_run_ngn_minor for the life of the row. Kept
  -- as a raise, since a state this constraint already prevents needs no
  -- companion write if it somehow fired.
  if v_m.amount_ngn_minor > v_m.max_per_run_ngn_minor then
    raise exception 'Amount exceeds the per-run limit';
  end if;

  if v_m.spent_total_ngn_minor + v_m.amount_ngn_minor > v_m.max_total_ngn_minor then
    update mandates set status = 'exhausted' where id = v_m.id;
    return jsonb_build_object('ok', false, 'mandate_id', v_m.id,
      'reason', 'This mandate has spent its lifetime limit');
  end if;

  v_q := create_fx_quote(v_m.payer_id, v_m.payee_id, v_m.amount_ngn_minor);
  v_result := _post_priced_payment(v_q, 'mandate_run', jsonb_build_object('mandate_id', v_m.id, 'quote_id', v_q.id));
  update fx_quotes set consumed_by = (v_result->>'txn_id')::uuid where id = v_q.id;

  v_spent := v_m.spent_total_ngn_minor + v_m.amount_ngn_minor;
  update mandates set
    spent_total_ngn_minor = v_spent,
    status = case when v_spent >= v_m.max_total_ngn_minor then 'exhausted' else status end
    where id = v_m.id;

  return v_result || jsonb_build_object('ok', true, 'mandate_id', v_m.id);
end $$;

revoke all on function execute_mandate(uuid) from public, anon, authenticated;
grant execute on function execute_mandate(uuid) to anon, authenticated, service_role;
