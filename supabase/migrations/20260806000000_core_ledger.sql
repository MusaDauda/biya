-- ============================================================================
-- Biya core ledger
--
-- Replaces the mutable `users.balance` column with immutable double-entry rows.
-- Balances are NEVER stored. They are derived by summing ledger_entries.
--
-- All money is a signed bigint in minor units: USD cents, NGN kobo.
-- No floating point touches the money path anywhere.
--
-- Within one ledger_transaction, entries MUST sum to zero for every currency
-- present. A deferred constraint trigger enforces this, so an unbalanced
-- transaction cannot physically exist in this database.
--
-- The legacy `users` and `transactions` tables are left untouched by this
-- migration so the existing app keeps running during the cutover.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
create table if not exists app_users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  display_name  text not null default '',
  pin_hash      text,
  is_business   boolean not null default false,
  business_name text,
  autosave_pct  smallint not null default 0 check (autosave_pct between 0 and 100),
  receive_code  text unique,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Accounts. One per (user, currency, purpose). System accounts have no user.
-- ---------------------------------------------------------------------------
create table if not exists accounts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references app_users(id) on delete cascade,
  kind       text not null check (kind in ('user','system')),
  currency   text not null check (currency in ('USD','NGN')),
  purpose    text not null check (purpose in
               ('spendable','savings_goal','fx_pool','usdt_inbound','fee_revenue')),
  goal_id    uuid,
  created_at timestamptz not null default now(),
  constraint accounts_system_has_no_user
    check ((kind = 'system' and user_id is null) or (kind = 'user' and user_id is not null))
);

-- Exactly one system account per (currency, purpose).
create unique index if not exists accounts_system_unique
  on accounts(currency, purpose) where kind = 'system';

-- Exactly one non-goal account per (user, currency, purpose).
create unique index if not exists accounts_user_unique
  on accounts(user_id, currency, purpose) where kind = 'user' and goal_id is null;

-- One account per savings goal.
create unique index if not exists accounts_goal_unique
  on accounts(goal_id) where goal_id is not null;

-- ---------------------------------------------------------------------------
-- Ledger
-- ---------------------------------------------------------------------------
create table if not exists ledger_transactions (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in
                 ('usdt_deposit','payment','mandate_run','test_credit',
                  'goal_release','cleva_in','ngn_in','bank_payout')),
  external_ref text,
  memo         text,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

-- Idempotency. A repeated on-chain tx hash, bank reference or retry becomes a
-- duplicate key error the caller swallows. This is what makes the deposit
-- watcher safe across restarts and chain reorgs.
create unique index if not exists ledger_txn_external_ref
  on ledger_transactions(kind, external_ref) where external_ref is not null;

create index if not exists ledger_txn_created on ledger_transactions(created_at desc);

create table if not exists ledger_entries (
  id           bigserial primary key,
  txn_id       uuid not null references ledger_transactions(id) on delete cascade,
  account_id   uuid not null references accounts(id),
  currency     text not null check (currency in ('USD','NGN')),
  amount_minor bigint not null,
  created_at   timestamptz not null default now()
);

create index if not exists ledger_entries_account on ledger_entries(account_id);
create index if not exists ledger_entries_txn     on ledger_entries(txn_id);

-- ---------------------------------------------------------------------------
-- The balance invariant.
--
-- Deferred so it runs at COMMIT, by which time the entries for the transaction
-- have been written. An unbalanced transaction aborts the whole commit.
-- ---------------------------------------------------------------------------
create or replace function assert_txn_balanced() returns trigger
language plpgsql as $$
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

drop trigger if exists ledger_txn_balanced on ledger_transactions;
create constraint trigger ledger_txn_balanced
  after insert on ledger_transactions
  deferrable initially deferred
  for each row execute function assert_txn_balanced();

-- ---------------------------------------------------------------------------
-- Derived balances. Never stored.
-- ---------------------------------------------------------------------------
create or replace view account_balances as
  select a.id      as account_id,
         a.user_id,
         a.kind,
         a.currency,
         a.purpose,
         a.goal_id,
         coalesce(sum(e.amount_minor), 0)::bigint as balance_minor
  from accounts a
  left join ledger_entries e on e.account_id = a.id
  group by a.id;

-- ---------------------------------------------------------------------------
-- Posting helpers. post_transaction is the ONLY way entries are ever created.
-- ---------------------------------------------------------------------------
do $$ begin
  create type ledger_leg as (account_id uuid, currency text, amount_minor bigint);
exception when duplicate_object then null;
end $$;

create or replace function post_transaction(
  p_kind         text,
  p_external_ref text,
  p_memo         text,
  p_metadata     jsonb,
  p_legs         ledger_leg[]
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_txn uuid;
  v_leg ledger_leg;
begin
  if array_length(p_legs, 1) is null then
    raise exception 'post_transaction called with no legs';
  end if;

  insert into ledger_transactions (kind, external_ref, memo, metadata)
    values (p_kind, p_external_ref, p_memo, coalesce(p_metadata, '{}'::jsonb))
    returning id into v_txn;

  foreach v_leg in array p_legs loop
    insert into ledger_entries (txn_id, account_id, currency, amount_minor)
      values (v_txn, v_leg.account_id, v_leg.currency, v_leg.amount_minor);
  end loop;

  return v_txn;
end $$;

create or replace function system_account(p_currency text, p_purpose text)
returns uuid
language sql stable security definer set search_path = public as $$
  select id from accounts
   where kind = 'system' and currency = p_currency and purpose = p_purpose
$$;

create or replace function ensure_account(
  p_user uuid, p_currency text, p_purpose text, p_goal uuid default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if p_goal is not null then
    select id into v_id from accounts where goal_id = p_goal;
  else
    select id into v_id from accounts
      where user_id = p_user and currency = p_currency
        and purpose = p_purpose and goal_id is null;
  end if;

  if v_id is null then
    insert into accounts (user_id, kind, currency, purpose, goal_id)
      values (p_user, 'user', p_currency, p_purpose, p_goal)
      returning id into v_id;
  end if;

  return v_id;
end $$;

-- ---------------------------------------------------------------------------
-- Seed the system accounts.
-- ---------------------------------------------------------------------------
insert into accounts (user_id, kind, currency, purpose)
select v.user_id, v.kind, v.currency, v.purpose
from (values
  (null::uuid, 'system', 'USD', 'fx_pool'),
  (null::uuid, 'system', 'NGN', 'fx_pool'),
  (null::uuid, 'system', 'USD', 'fee_revenue'),
  (null::uuid, 'system', 'USD', 'usdt_inbound')
) as v(user_id, kind, currency, purpose)
where not exists (
  select 1 from accounts a
   where a.kind = 'system' and a.currency = v.currency and a.purpose = v.purpose
);

-- ---------------------------------------------------------------------------
-- Receive codes. Every user gets one, business or not.
-- ---------------------------------------------------------------------------
create or replace function gen_receive_code() returns text
language plpgsql security definer set search_path = public as $$
declare v_code text; v_tries int := 0;
begin
  loop
    v_code := lpad((floor(random() * 9000000000) + 1000000000)::bigint::text, 10, '0');
    exit when not exists (select 1 from app_users where receive_code = v_code);
    v_tries := v_tries + 1;
    if v_tries > 20 then raise exception 'Could not allocate a receive code'; end if;
  end loop;
  return v_code;
end $$;

-- ---------------------------------------------------------------------------
-- Test funds. Balances like everything else: debits the inbound system
-- account, credits the user. No magic money.
-- ---------------------------------------------------------------------------
create or replace function credit_test_funds(p_user uuid, p_usd_minor bigint)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_acct uuid;
begin
  if p_usd_minor <= 0 then
    raise exception 'Amount must be positive';
  end if;

  v_acct := ensure_account(p_user, 'USD', 'spendable');

  return post_transaction(
    'test_credit',
    gen_random_uuid()::text,
    'Test funds',
    '{}'::jsonb,
    array[
      (system_account('USD','usdt_inbound'), 'USD', -p_usd_minor)::ledger_leg,
      (v_acct,                               'USD',  p_usd_minor)::ledger_leg
    ]
  );
end $$;

-- ---------------------------------------------------------------------------
-- Account lifecycle.
--
-- One credential: a PIN, hashed client side. It authenticates login, authorises
-- payment, and derives the wrapping key for the user's wallet. That is one
-- secret for a user to remember instead of three, which is the whole point.
--
-- These are security-definer because clients have no INSERT grant on app_users.
-- ---------------------------------------------------------------------------
create or replace function signup_user(p_email text, p_pin_hash text)
returns app_users
language plpgsql security definer set search_path = public as $$
declare v_user app_users;
begin
  if p_email is null or length(trim(p_email)) = 0 then
    raise exception 'Email is required';
  end if;
  if p_pin_hash is null or length(p_pin_hash) < 32 then
    raise exception 'A hashed PIN is required';
  end if;

  if exists (select 1 from app_users where email = lower(trim(p_email))) then
    raise exception 'That email is already registered';
  end if;

  insert into app_users (email, pin_hash, receive_code)
    values (lower(trim(p_email)), p_pin_hash, gen_receive_code())
    returning * into v_user;

  -- Every user can hold both currencies from the moment they exist.
  perform ensure_account(v_user.id, 'USD', 'spendable');
  perform ensure_account(v_user.id, 'NGN', 'spendable');

  return v_user;
end $$;

create or replace function login_user(p_email text, p_pin_hash text)
returns app_users
language plpgsql security definer set search_path = public as $$
declare v_user app_users;
begin
  select * into v_user from app_users where email = lower(trim(p_email));

  if v_user.id is null then
    raise exception 'No account found for that email';
  end if;
  if v_user.pin_hash is distinct from p_pin_hash then
    raise exception 'Incorrect PIN';
  end if;

  -- Backfill for any row predating these columns.
  if v_user.receive_code is null then
    update app_users set receive_code = gen_receive_code()
      where id = v_user.id returning * into v_user;
  end if;

  perform ensure_account(v_user.id, 'USD', 'spendable');
  perform ensure_account(v_user.id, 'NGN', 'spendable');

  return v_user;
end $$;

create or replace function set_profile(
  p_user          uuid,
  p_display_name  text,
  p_is_business   boolean,
  p_business_name text default null
) returns app_users
language plpgsql security definer set search_path = public as $$
declare v_user app_users;
begin
  update app_users
     set display_name  = coalesce(nullif(trim(p_display_name), ''), display_name),
         is_business   = coalesce(p_is_business, is_business),
         business_name = case
                           when p_is_business then nullif(trim(p_business_name), '')
                           else null
                         end
   where id = p_user
   returning * into v_user;

  if v_user.id is null then
    raise exception 'No such user';
  end if;

  return v_user;
end $$;

create or replace function set_autosave(p_user uuid, p_pct smallint)
returns app_users
language plpgsql security definer set search_path = public as $$
declare v_user app_users;
begin
  if p_pct < 0 or p_pct > 100 then
    raise exception 'Auto-save percentage must be between 0 and 100';
  end if;
  update app_users set autosave_pct = p_pct where id = p_user returning * into v_user;
  if v_user.id is null then raise exception 'No such user'; end if;
  return v_user;
end $$;

-- ---------------------------------------------------------------------------
-- Grants.
--
-- Note what is deliberately absent: the anon role gets NO insert, update or
-- delete on ledger_transactions or ledger_entries. The ledger is writable only
-- through security-definer functions. Row level security is still open on
-- reads (a demo shortcut), but no client can forge an entry.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on app_users, accounts, ledger_transactions, ledger_entries to anon, authenticated;
grant select on account_balances to anon, authenticated;

-- post_transaction is intentionally NOT granted. It is called only from other
-- security-definer functions, never from a client.
grant execute on function system_account(text, text)              to anon, authenticated;
grant execute on function ensure_account(uuid, text, text, uuid)  to anon, authenticated;
grant execute on function gen_receive_code()                      to anon, authenticated;
grant execute on function credit_test_funds(uuid, bigint)         to anon, authenticated;
grant execute on function signup_user(text, text)                 to anon, authenticated;
grant execute on function login_user(text, text)                  to anon, authenticated;
grant execute on function set_profile(uuid, text, boolean, text)  to anon, authenticated;
grant execute on function set_autosave(uuid, smallint)            to anon, authenticated;
