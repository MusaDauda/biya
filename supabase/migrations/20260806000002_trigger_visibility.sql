-- ============================================================================
-- Fix: the balance invariant must not be subject to row-level visibility.
--
-- assert_txn_balanced() runs from a DEFERRED constraint trigger, which fires at
-- COMMIT. By then the security-definer function that wrote the entries has
-- returned and the effective role is back to the caller (anon). With RLS
-- enabled on ledger_entries and no SELECT policy, the trigger could not see the
-- rows it was meant to check, so every posted transaction looked empty.
--
-- A global invariant is not a per-row concern. The check runs as definer so it
-- always sees the whole transaction.
-- ============================================================================

create or replace function assert_txn_balanced() returns trigger
language plpgsql
security definer set search_path = public as $$
declare
  bad record;
begin
  if not exists (select 1 from ledger_entries where txn_id = new.id) then
    raise exception 'Ledger transaction % has no entries', new.id;
  end if;

  select e.currency, sum(e.amount_minor) as total
    into bad
    from ledger_entries e
    where e.txn_id = new.id
    group by e.currency
    having sum(e.amount_minor) <> 0
    limit 1;

  if found then
    raise exception 'Unbalanced ledger transaction %: % nets to %',
      new.id, bad.currency, bad.total;
  end if;

  return null;
end $$;

-- ----------------------------------------------------------------------------
-- Read policies.
--
-- Reads are open. This is the documented demo shortcut, taken knowingly in
-- place of full auth. Writes are a different matter: there is no INSERT,
-- UPDATE or DELETE policy on the ledger tables and none is granted, so the
-- ledger is reachable only through security-definer functions. A client cannot
-- forge an entry even with the publishable key in hand.
-- ----------------------------------------------------------------------------
alter table app_users           enable row level security;
alter table accounts            enable row level security;
alter table ledger_transactions enable row level security;
alter table ledger_entries      enable row level security;

drop policy if exists app_users_read           on app_users;
drop policy if exists accounts_read            on accounts;
drop policy if exists ledger_transactions_read on ledger_transactions;
drop policy if exists ledger_entries_read      on ledger_entries;

create policy app_users_read           on app_users           for select using (true);
create policy accounts_read            on accounts            for select using (true);
create policy ledger_transactions_read on ledger_transactions for select using (true);
create policy ledger_entries_read      on ledger_entries      for select using (true);
