-- ============================================================================
-- Per-user activity.
--
-- A ledger transaction has many legs across several accounts and two
-- currencies. What a user wants to see is a single row: what moved, in which
-- direction, and who was on the other side.
--
-- This collapses the legs that touch a given user into one row per transaction,
-- netted per currency. Assembling this client side would mean shipping every
-- leg of every transaction to the browser and hoping the arithmetic matches the
-- database. It does not belong there.
-- ============================================================================

create or replace view v_user_activity as
select
  e.txn_id                as id,
  a.user_id               as user_id,
  t.kind                  as kind,
  t.memo                  as memo,
  t.created_at            as created_at,
  sum(case when e.currency = 'USD' then e.amount_minor else 0 end)::bigint as usd_minor,
  sum(case when e.currency = 'NGN' then e.amount_minor else 0 end)::bigint as ngn_minor,
  (
    -- The other party on this transaction, if there is one. Deposits and test
    -- credits have only a system account on the far side, so this is null.
    select coalesce(nullif(u2.business_name, ''), nullif(u2.display_name, ''), u2.email)
      from ledger_entries e2
      join accounts  a2 on a2.id = e2.account_id
      join app_users u2 on u2.id = a2.user_id
     where e2.txn_id = e.txn_id
       and a2.user_id is distinct from a.user_id
     limit 1
  )                       as counterparty
from ledger_entries e
join accounts            a on a.id = e.account_id
join ledger_transactions t on t.id = e.txn_id
where a.kind = 'user'
group by e.txn_id, a.user_id, t.kind, t.memo, t.created_at;

grant select on v_user_activity to anon, authenticated;

comment on view v_user_activity is
  'One row per (user, ledger transaction): the net USD and NGN movement for '
  'that user and the counterparty name. Negative means money left the user.';
