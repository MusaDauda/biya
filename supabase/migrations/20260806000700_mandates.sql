-- ============================================================================
-- Phase 7: mandates. The spine of the future-of-payments argument.
--
-- Without this the AI layer from Phase 4 is a chatbot: it can propose a
-- payment, but a human confirms every single one with a PIN. A mandate is a
-- bound a human sets ONCE, in advance, and the agent can then act inside that
-- bound without asking again. Four numbers make the bound real: an amount, a
-- per-run ceiling, a lifetime total, and an expiry. Revoking is one call and
-- takes effect immediately.
--
-- WHAT THIS DOES NOT DO, on purpose: no scheduler. There is a "Run now"
-- control in the UI, labelled as a demo control. Real cadence is a pg_cron
-- job calling execute_mandate on a schedule, which is a config change, not a
-- rewrite. Say that plainly rather than pretending it exists.
--
-- The payment math (balance check, five-to-nine ledger legs, autosave) is
-- factored into _post_priced_payment so execute_payment and execute_mandate
-- share one implementation of the thing that actually moves money. Two copies
-- of that logic is how they eventually disagree.
-- ============================================================================

create table if not exists mandates (
  id                     uuid primary key default gen_random_uuid(),
  payer_id               uuid not null references app_users(id) on delete cascade,
  payee_id               uuid not null references app_users(id),
  amount_ngn_minor       bigint not null check (amount_ngn_minor > 0),
  cadence                text   not null default 'manual',
  max_per_run_ngn_minor  bigint not null check (max_per_run_ngn_minor > 0),
  max_total_ngn_minor    bigint not null check (max_total_ngn_minor > 0),
  spent_total_ngn_minor  bigint not null default 0,
  expires_at             timestamptz not null,
  status                 text not null default 'active'
                           check (status in ('active','revoked','exhausted')),
  reason                 text,
  created_at             timestamptz not null default now(),
  revoked_at             timestamptz,
  check (amount_ngn_minor <= max_per_run_ngn_minor)
);
create index if not exists mandates_payer on mandates(payer_id, created_at desc);

alter table mandates enable row level security;
drop policy if exists mandates_read on mandates;
create policy mandates_read on mandates for select using (true);

-- ---------------------------------------------------------------------------
-- Shared posting logic. NOT callable directly: no grant is issued below, and
-- the ALTER DEFAULT PRIVILEGES statement in the lockdown migration already
-- denies it to anon and authenticated by default. It only runs when called
-- from inside another SECURITY DEFINER function, which executes as owner
-- regardless of who invoked the outer call.
-- ---------------------------------------------------------------------------
create or replace function _post_priced_payment(
  p_quote fx_quotes, p_kind text, p_metadata jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_payer_usd uuid;
  v_payee_ngn uuid;
  v_balance   bigint;
  v_pool_usd  bigint;
  v_txn       uuid;
  v_autosave  smallint;
  v_goal      uuid;
  v_save_ngn  bigint;
  v_save_usd  bigint;
  v_legs      ledger_leg[];
begin
  v_payer_usd := ensure_account(p_quote.payer_id, 'USD', 'spendable');
  v_payee_ngn := ensure_account(p_quote.payee_id, 'NGN', 'spendable');

  select balance_minor into v_balance
    from account_balances where account_id = v_payer_usd;
  if coalesce(v_balance, 0) < p_quote.usd_minor then
    raise exception 'Not enough dollars in your balance';
  end if;

  v_pool_usd := p_quote.usd_minor - p_quote.fee_usd_minor;

  v_legs := array[
    (v_payer_usd,                        'USD', -p_quote.usd_minor)::ledger_leg,
    (system_account('USD','fx_pool'),     'USD',  v_pool_usd)::ledger_leg,
    (system_account('USD','fee_revenue'), 'USD',  p_quote.fee_usd_minor)::ledger_leg,
    (system_account('NGN','fx_pool'),     'NGN', -p_quote.ngn_minor)::ledger_leg,
    (v_payee_ngn,                        'NGN',  p_quote.ngn_minor)::ledger_leg
  ];

  select autosave_pct into v_autosave from app_users where id = p_quote.payee_id;
  if coalesce(v_autosave, 0) > 0 then
    select id into v_goal from savings_goals where user_id = p_quote.payee_id
      order by created_at limit 1;
    if v_goal is not null then
      v_save_ngn := p_quote.ngn_minor * v_autosave / 100;
      v_save_usd := floor(v_save_ngn / p_quote.mid);
      if v_save_usd > 0 then
        v_legs := v_legs || array[
          (v_payee_ngn,                    'NGN', -v_save_ngn)::ledger_leg,
          (system_account('NGN','fx_pool'), 'NGN',  v_save_ngn)::ledger_leg,
          (system_account('USD','fx_pool'), 'USD', -v_save_usd)::ledger_leg,
          (ensure_account(p_quote.payee_id, 'USD', 'savings_goal', v_goal), 'USD', v_save_usd)::ledger_leg
        ];
      end if;
    end if;
  end if;

  v_txn := post_transaction(p_kind, null, 'Payment',
    p_metadata || jsonb_build_object('mid', p_quote.mid, 'rate', p_quote.rate,
                                     'margin_bps', p_quote.margin_bps),
    v_legs);

  return jsonb_build_object(
    'txn_id', v_txn, 'usd_minor', p_quote.usd_minor, 'ngn_minor', p_quote.ngn_minor,
    'fee_usd_minor', p_quote.fee_usd_minor, 'autosave_usd_minor', coalesce(v_save_usd, 0)
  );
end $$;

revoke all on function _post_priced_payment(fx_quotes, text, jsonb) from public, anon, authenticated;

-- execute_payment rewritten to call the shared function. Behaviour is
-- unchanged; this is the refactor, not a new feature.
create or replace function execute_payment(p_quote uuid, p_pin_hash text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_q fx_quotes; v_pin text; v_result jsonb;
begin
  select * into v_q from fx_quotes where id = p_quote for update;

  if v_q.id is null then raise exception 'Quote not found'; end if;
  if v_q.consumed_by is not null then raise exception 'This payment has already gone through'; end if;
  if v_q.expires_at < now() then raise exception 'The rate expired. Get a new quote.'; end if;

  select pin_hash into v_pin from app_users where id = v_q.payer_id;
  if v_pin is null or v_pin is distinct from p_pin_hash then
    raise exception 'Incorrect PIN';
  end if;

  v_result := _post_priced_payment(v_q, 'payment', jsonb_build_object('quote_id', v_q.id));
  update fx_quotes set consumed_by = (v_result->>'txn_id')::uuid where id = v_q.id;
  return v_result;
end $$;

-- ---------------------------------------------------------------------------
-- Mandates.
-- ---------------------------------------------------------------------------

-- Creating a mandate grants standing authority to spend without a future PIN
-- prompt, so it demands the same PIN check as a normal payment does once.
create or replace function create_mandate(
  p_payer uuid, p_pin_hash text, p_payee uuid, p_amount_ngn_minor bigint,
  p_max_per_run_ngn_minor bigint, p_max_total_ngn_minor bigint,
  p_expires_at timestamptz, p_reason text default null
) returns mandates
language plpgsql security definer set search_path = public as $$
declare v_pin text; v_m mandates;
begin
  select pin_hash into v_pin from app_users where id = p_payer;
  if v_pin is null or v_pin is distinct from p_pin_hash then
    raise exception 'Incorrect PIN';
  end if;
  if p_payer = p_payee then raise exception 'You cannot pay yourself'; end if;
  if p_amount_ngn_minor is null or p_amount_ngn_minor <= 0 then
    raise exception 'Amount must be above zero';
  end if;
  if p_max_per_run_ngn_minor < p_amount_ngn_minor then
    raise exception 'The per-run limit cannot be less than the amount';
  end if;
  if p_max_total_ngn_minor < p_max_per_run_ngn_minor then
    raise exception 'The lifetime limit cannot be less than the per-run limit';
  end if;
  if p_expires_at <= now() then raise exception 'Expiry must be in the future'; end if;

  insert into mandates (payer_id, payee_id, amount_ngn_minor, max_per_run_ngn_minor,
                        max_total_ngn_minor, expires_at, reason)
    values (p_payer, p_payee, p_amount_ngn_minor, p_max_per_run_ngn_minor,
            p_max_total_ngn_minor, p_expires_at, p_reason)
    returning * into v_m;
  return v_m;
end $$;

-- Effective immediately: only an active mandate can run, so a revoke that
-- lands mid-race with a run either wins the lock or the run already committed.
-- Nothing in between is possible; there is no polling window to close.
create or replace function revoke_mandate(p_mandate uuid)
returns mandates
language plpgsql security definer set search_path = public as $$
declare v_m mandates;
begin
  update mandates set status = 'revoked', revoked_at = now()
    where id = p_mandate and status = 'active'
    returning * into v_m;
  if v_m.id is null then raise exception 'Mandate is not active'; end if;
  return v_m;
end $$;

-- The "Run now" demo control, and what a real cadence would call on a
-- schedule. Checks every bound before moving anything: status, expiry,
-- per-run ceiling, and the lifetime cap. No PIN, because the PIN was already
-- spent at creation to authorise exactly this.
create or replace function execute_mandate(p_mandate uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_m mandates; v_q fx_quotes; v_result jsonb; v_spent bigint;
begin
  select * into v_m from mandates where id = p_mandate for update;

  if v_m.id is null then raise exception 'Mandate not found'; end if;
  if v_m.status <> 'active' then raise exception 'This mandate is %, not active', v_m.status; end if;
  if v_m.expires_at < now() then
    update mandates set status = 'revoked', revoked_at = now() where id = v_m.id;
    raise exception 'This mandate expired';
  end if;
  if v_m.amount_ngn_minor > v_m.max_per_run_ngn_minor then
    raise exception 'Amount exceeds the per-run limit';
  end if;
  if v_m.spent_total_ngn_minor + v_m.amount_ngn_minor > v_m.max_total_ngn_minor then
    update mandates set status = 'exhausted' where id = v_m.id;
    raise exception 'This mandate has spent its lifetime limit';
  end if;

  v_q := create_fx_quote(v_m.payer_id, v_m.payee_id, v_m.amount_ngn_minor);
  v_result := _post_priced_payment(v_q, 'mandate_run', jsonb_build_object('mandate_id', v_m.id, 'quote_id', v_q.id));
  update fx_quotes set consumed_by = (v_result->>'txn_id')::uuid where id = v_q.id;

  v_spent := v_m.spent_total_ngn_minor + v_m.amount_ngn_minor;
  update mandates set
    spent_total_ngn_minor = v_spent,
    status = case when v_spent >= v_m.max_total_ngn_minor then 'exhausted' else status end
    where id = v_m.id;

  return v_result || jsonb_build_object('mandate_id', v_m.id);
end $$;

revoke all on function create_mandate(uuid,text,uuid,bigint,bigint,bigint,timestamptz,text)
  from public, anon, authenticated;
revoke all on function revoke_mandate(uuid)  from public, anon, authenticated;
revoke all on function execute_mandate(uuid) from public, anon, authenticated;
revoke all on function execute_payment(uuid,text) from public, anon, authenticated;

grant execute on function create_mandate(uuid,text,uuid,bigint,bigint,bigint,timestamptz,text)
  to anon, authenticated, service_role;
grant execute on function revoke_mandate(uuid)  to anon, authenticated, service_role;
grant execute on function execute_mandate(uuid) to anon, authenticated, service_role;
grant execute on function execute_payment(uuid,text) to anon, authenticated, service_role;

comment on table mandates is
  'A standing spend authorisation with four bounds: amount per run, a per-run '
  'ceiling, a lifetime total, and an expiry. execute_mandate re-checks every '
  'bound before moving money and needs no PIN, because the PIN was already '
  'spent at creation to authorise exactly this. Revoke is immediate.';
