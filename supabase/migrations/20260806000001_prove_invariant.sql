-- ============================================================================
-- Reproducible proof of the ledger balance invariant.
--
-- Rather than screenshotting a failed INSERT once, this makes the guarantee
-- callable. Anyone, including someone auditing the system, can run
--
--   select * from prove_ledger_invariant();
--
-- and watch the database refuse to hold an unbalanced transaction.
--
-- Each case runs inside a subtransaction, forces the deferred constraint to
-- fire immediately, captures the error, and rolls back. Nothing is left behind.
-- ============================================================================

create or replace function prove_ledger_invariant()
returns table (case_name text, rejected boolean, reason text)
language plpgsql security definer set search_path = public as $$
declare
  v_txn  uuid;
  v_usd  uuid := system_account('USD','fx_pool');
  v_ngn  uuid := system_account('NGN','fx_pool');
  v_fee  uuid := system_account('USD','fee_revenue');
begin
  -- Case 1: a single leg that does not net to zero.
  begin
    insert into ledger_transactions (kind, memo)
      values ('payment', 'invariant probe: one-sided') returning id into v_txn;
    insert into ledger_entries (txn_id, account_id, currency, amount_minor)
      values (v_txn, v_usd, 'USD', 100);
    set constraints ledger_txn_balanced immediate;
    case_name := 'one-sided USD entry'; rejected := false;
    reason := 'ACCEPTED. This is a bug.';
  exception when others then
    case_name := 'one-sided USD entry'; rejected := true; reason := sqlerrm;
  end;
  return next;

  -- Case 2: USD balances but NGN does not. Catches the naive
  -- "sum every entry regardless of currency" mistake.
  begin
    insert into ledger_transactions (kind, memo)
      values ('payment', 'invariant probe: one currency short') returning id into v_txn;
    insert into ledger_entries (txn_id, account_id, currency, amount_minor) values
      (v_txn, v_usd, 'USD',  100),
      (v_txn, v_fee, 'USD', -100),
      (v_txn, v_ngn, 'NGN',  5000);
    set constraints ledger_txn_balanced immediate;
    case_name := 'USD balanced, NGN unbalanced'; rejected := false;
    reason := 'ACCEPTED. This is a bug.';
  exception when others then
    case_name := 'USD balanced, NGN unbalanced'; rejected := true; reason := sqlerrm;
  end;
  return next;

  -- Case 3: a transaction with no entries at all.
  begin
    insert into ledger_transactions (kind, memo)
      values ('payment', 'invariant probe: empty') returning id into v_txn;
    set constraints ledger_txn_balanced immediate;
    case_name := 'transaction with no entries'; rejected := false;
    reason := 'ACCEPTED. This is a bug.';
  exception when others then
    case_name := 'transaction with no entries'; rejected := true; reason := sqlerrm;
  end;
  return next;

  -- Case 4: the control. A correctly balanced two-currency transaction must
  -- be accepted, otherwise the trigger is simply rejecting everything.
  begin
    insert into ledger_transactions (kind, memo)
      values ('payment', 'invariant probe: control') returning id into v_txn;
    insert into ledger_entries (txn_id, account_id, currency, amount_minor) values
      (v_txn, v_usd, 'USD',  100),
      (v_txn, v_fee, 'USD', -100),
      (v_txn, v_ngn, 'NGN',  5000),
      (v_txn, v_ngn, 'NGN', -5000);
    set constraints ledger_txn_balanced immediate;
    delete from ledger_transactions where id = v_txn;  -- leave no trace
    case_name := 'balanced control (must pass)'; rejected := false;
    reason := 'Accepted, as it should be.';
  exception when others then
    case_name := 'balanced control (must pass)'; rejected := true;
    reason := 'REJECTED a valid transaction. This is a bug: ' || sqlerrm;
  end;
  return next;
end $$;

grant execute on function prove_ledger_invariant() to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Global integrity check. Across the entire ledger, every currency must net to
-- zero. Run this after any demo run. A non-zero row means money was created or
-- destroyed and must be found before shipping.
-- ----------------------------------------------------------------------------
create or replace view ledger_integrity as
  select currency,
         sum(amount_minor)      as net_minor,
         count(*)               as entry_count,
         sum(amount_minor) = 0  as balanced
  from ledger_entries
  group by currency;

grant select on ledger_integrity to anon, authenticated;
