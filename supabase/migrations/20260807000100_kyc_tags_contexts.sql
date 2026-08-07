-- Onboarding, identity, tags and business contexts.
--
-- Everything here is additive. No existing column is dropped and no existing
-- function is replaced, so the ledger and the payment path are untouched.
--
-- Partner is undecided, so identity is modelled as two tiers: a NIN or BVN
-- unlocks Tier 1, an address plus a selfie unlocks Tier 2. The limits are
-- carried in a table rather than in code precisely because they are placeholder
-- bands that change the day a partner is fixed.

-- ---------------------------------------------------------------------------
-- Identity on the account
-- ---------------------------------------------------------------------------

alter table app_users add column if not exists password_hash  text;
alter table app_users add column if not exists email_verified boolean not null default false;
alter table app_users add column if not exists first_name     text;
alter table app_users add column if not exists last_name      text;
alter table app_users add column if not exists date_of_birth  date;
alter table app_users add column if not exists phone          text;
alter table app_users add column if not exists tag            text;
alter table app_users add column if not exists nin_last4      text;
alter table app_users add column if not exists bvn_last4      text;
alter table app_users add column if not exists street         text;
alter table app_users add column if not exists city           text;
alter table app_users add column if not exists state_name     text;
alter table app_users add column if not exists selfie_done    boolean not null default false;
alter table app_users add column if not exists kyc_tier       smallint not null default 0;

create unique index if not exists app_users_tag_unique   on app_users(lower(tag)) where tag is not null;
create unique index if not exists app_users_phone_unique on app_users(phone)      where phone is not null;

comment on column app_users.tag is
  'The handle a person is paid by, derived from their phone number at onboarding. '
  'Lowercase, unique across users and business accounts. Never a bank account number.';
comment on column app_users.kyc_tier is
  '0 unverified, 1 identity confirmed by NIN or BVN, 2 address and selfie added. '
  'Send and hold limits come from tier_limits, not from application code.';
comment on column app_users.nin_last4 is
  'Only the last four digits are retained. The full number is checked once and never stored.';

-- ---------------------------------------------------------------------------
-- Tier bands
-- ---------------------------------------------------------------------------

create table if not exists tier_limits (
  tier                smallint primary key,
  send_per_day_minor  bigint,   -- null means no limit
  hold_max_minor      bigint,
  withdraw_allowed    boolean not null default false,
  label               text not null
);

insert into tier_limits (tier, send_per_day_minor, hold_max_minor, withdraw_allowed, label) values
  (0, 0,      0,      false, 'Not verified'),
  (1, 50000,  200000, true,  'Tier 1'),
  (2, 500000, null,   true,  'Tier 2')
on conflict (tier) do nothing;

comment on table tier_limits is
  'Placeholder partner bands in minor units, USD cents. Replace when the partner is fixed.';

-- ---------------------------------------------------------------------------
-- Email verification
-- ---------------------------------------------------------------------------

create table if not exists email_codes (
  user_id    uuid primary key references app_users(id) on delete cascade,
  code       text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create or replace function gen_email_code() returns text
language sql as $$ select lpad((floor(random() * 1000000))::int::text, 6, '0') $$;

-- ---------------------------------------------------------------------------
-- Business contexts
--
-- Personal and business sit behind a switch at the top of the home screen. The
-- tabs never change under you, so a business is a row here rather than a second
-- account with its own login.
-- ---------------------------------------------------------------------------

create table if not exists business_accounts (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references app_users(id) on delete cascade,
  name           text not null,
  tag            text,
  receive_code   text unique not null,
  settle_bank    text,
  settle_last4   text,
  settle_hour    smallint not null default 21,
  created_at     timestamptz not null default now()
);
create index if not exists business_accounts_owner on business_accounts(owner_id);
create unique index if not exists business_accounts_tag_unique on business_accounts(lower(tag)) where tag is not null;

-- ---------------------------------------------------------------------------
-- Banks
--
-- Reference data only. Biya does not hold a payout integration, so nothing here
-- moves money; it exists so a person can name the bank they are sending to.
-- ---------------------------------------------------------------------------

create table if not exists banks (
  code text primary key,
  name text not null,
  short_name text not null
);

insert into banks (code, name, short_name) values
  ('044', 'Access Bank', 'Access'),
  ('023', 'Citibank Nigeria', 'Citi'),
  ('050', 'Ecobank Nigeria', 'Ecobank'),
  ('070', 'Fidelity Bank', 'Fidelity'),
  ('011', 'First Bank of Nigeria', 'First Bank'),
  ('214', 'First City Monument Bank', 'FCMB'),
  ('058', 'Guaranty Trust Bank', 'GTBank'),
  ('030', 'Heritage Bank', 'Heritage'),
  ('301', 'Jaiz Bank', 'Jaiz'),
  ('082', 'Keystone Bank', 'Keystone'),
  ('076', 'Polaris Bank', 'Polaris'),
  ('101', 'Providus Bank', 'Providus'),
  ('221', 'Stanbic IBTC Bank', 'Stanbic'),
  ('068', 'Standard Chartered Bank', 'StanChart'),
  ('232', 'Sterling Bank', 'Sterling'),
  ('100', 'Suntrust Bank', 'Suntrust'),
  ('032', 'Union Bank of Nigeria', 'Union'),
  ('033', 'United Bank for Africa', 'UBA'),
  ('215', 'Unity Bank', 'Unity'),
  ('035', 'Wema Bank', 'Wema'),
  ('057', 'Zenith Bank', 'Zenith')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Onboarding functions
-- ---------------------------------------------------------------------------

create or replace function signup_with_password(p_email text, p_password_hash text)
returns app_users
language plpgsql security definer set search_path = public as $$
declare v_user app_users;
begin
  if p_email is null or position('@' in p_email) = 0 then
    raise exception 'Enter a valid email address';
  end if;
  if p_password_hash is null or length(p_password_hash) < 32 then
    raise exception 'A hashed password is required';
  end if;
  if exists (select 1 from app_users where email = lower(trim(p_email))) then
    raise exception 'That email is already registered';
  end if;

  insert into app_users (email, password_hash, receive_code)
    values (lower(trim(p_email)), p_password_hash, gen_receive_code())
    returning * into v_user;

  perform ensure_account(v_user.id, 'USD', 'spendable');
  perform ensure_account(v_user.id, 'NGN', 'spendable');

  insert into email_codes (user_id, code, expires_at)
    values (v_user.id, gen_email_code(), now() + interval '10 minutes');

  return v_user;
end $$;

create or replace function login_with_password(p_email text, p_password_hash text)
returns app_users
language plpgsql security definer set search_path = public as $$
declare v_user app_users;
begin
  select * into v_user from app_users
   where email = lower(trim(p_email)) and password_hash = p_password_hash;
  if v_user.id is null then
    raise exception 'That email and password do not match';
  end if;
  return v_user;
end $$;

/** Issues a fresh code and returns it. There is no mail transport wired, so the
    code is returned to the caller rather than pretending to have been sent. */
create or replace function request_email_code(p_user uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  v_code := gen_email_code();
  insert into email_codes (user_id, code, expires_at)
    values (p_user, v_code, now() + interval '10 minutes')
  on conflict (user_id) do update
    set code = excluded.code, expires_at = excluded.expires_at, created_at = now();
  return v_code;
end $$;

create or replace function verify_email_code(p_user uuid, p_code text)
returns app_users
language plpgsql security definer set search_path = public as $$
declare v_row email_codes; v_user app_users;
begin
  select * into v_row from email_codes where user_id = p_user;
  if v_row.user_id is null then
    raise exception 'Ask for a new code';
  end if;
  if v_row.expires_at < now() then
    raise exception 'That code has expired. Ask for a new one';
  end if;
  if v_row.code <> trim(p_code) then
    raise exception 'That code is not right';
  end if;

  update app_users set email_verified = true where id = p_user returning * into v_user;
  delete from email_codes where user_id = p_user;
  return v_user;
end $$;

create or replace function save_legal_name(
  p_user uuid, p_first text, p_last text, p_dob date
) returns app_users
language plpgsql security definer set search_path = public as $$
declare v_user app_users;
begin
  if coalesce(trim(p_first), '') = '' or coalesce(trim(p_last), '') = '' then
    raise exception 'Both names are required';
  end if;
  if p_dob is null or p_dob > current_date - interval '16 years' then
    raise exception 'You must be at least 16 to open an account';
  end if;

  update app_users
     set first_name = trim(p_first),
         last_name = trim(p_last),
         date_of_birth = p_dob,
         display_name = trim(p_first) || ' ' || trim(p_last)
   where id = p_user
   returning * into v_user;
  return v_user;
end $$;

/** Claims the phone number and the tag derived from it, in one step, so a tag
    can never exist without the number it was derived from. */
create or replace function claim_tag(p_user uuid, p_phone text, p_tag text)
returns app_users
language plpgsql security definer set search_path = public as $$
declare v_user app_users; v_tag text; v_phone text;
begin
  v_phone := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  if length(v_phone) < 10 then
    raise exception 'Enter a valid phone number';
  end if;

  v_tag := lower(regexp_replace(coalesce(p_tag, ''), '[^a-zA-Z0-9._]', '', 'g'));
  if length(v_tag) < 3 then
    raise exception 'A tag needs at least three characters';
  end if;

  if exists (select 1 from app_users where lower(tag) = v_tag and id <> p_user)
     or exists (select 1 from business_accounts where lower(tag) = v_tag) then
    raise exception 'That tag is taken';
  end if;
  if exists (select 1 from app_users where phone = v_phone and id <> p_user) then
    raise exception 'That number is already on another account';
  end if;

  update app_users set phone = v_phone, tag = v_tag where id = p_user returning * into v_user;
  return v_user;
end $$;

/** Records that an identity number was checked. Only the last four digits are
    kept. There is no partner wired, so the check here is format and uniqueness
    of shape only, and the tier it grants is a placeholder band. */
create or replace function submit_identity(p_user uuid, p_kind text, p_number text)
returns app_users
language plpgsql security definer set search_path = public as $$
declare v_user app_users; v_digits text;
begin
  if p_kind not in ('nin', 'bvn') then
    raise exception 'Choose NIN or BVN';
  end if;
  v_digits := regexp_replace(coalesce(p_number, ''), '[^0-9]', '', 'g');
  if length(v_digits) <> 11 then
    raise exception 'That number should be 11 digits';
  end if;

  update app_users
     set nin_last4 = case when p_kind = 'nin' then right(v_digits, 4) else nin_last4 end,
         bvn_last4 = case when p_kind = 'bvn' then right(v_digits, 4) else bvn_last4 end,
         kyc_tier  = greatest(kyc_tier, 1)
   where id = p_user
   returning * into v_user;
  return v_user;
end $$;

create or replace function save_address(
  p_user uuid, p_street text, p_city text, p_state text
) returns app_users
language plpgsql security definer set search_path = public as $$
declare v_user app_users;
begin
  if coalesce(trim(p_street), '') = '' or coalesce(trim(p_state), '') = '' then
    raise exception 'A street address and state are required';
  end if;
  update app_users
     set street = trim(p_street), city = trim(p_city), state_name = trim(p_state)
   where id = p_user
   returning * into v_user;
  return v_user;
end $$;

create or replace function complete_selfie(p_user uuid)
returns app_users
language plpgsql security definer set search_path = public as $$
declare v_user app_users;
begin
  update app_users
     set selfie_done = true,
         kyc_tier = case when street is not null then 2 else kyc_tier end
   where id = p_user
   returning * into v_user;
  return v_user;
end $$;

create or replace function set_transaction_pin(p_user uuid, p_pin_hash text)
returns app_users
language plpgsql security definer set search_path = public as $$
declare v_user app_users;
begin
  if p_pin_hash is null or length(p_pin_hash) < 32 then
    raise exception 'A hashed PIN is required';
  end if;
  update app_users set pin_hash = p_pin_hash where id = p_user returning * into v_user;
  return v_user;
end $$;

-- ---------------------------------------------------------------------------
-- Business contexts and lookups
-- ---------------------------------------------------------------------------

create or replace function create_business_account(
  p_owner uuid, p_name text, p_tag text default null
) returns business_accounts
language plpgsql security definer set search_path = public as $$
declare v_row business_accounts; v_tag text;
begin
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Give the business a name';
  end if;

  v_tag := lower(regexp_replace(coalesce(nullif(trim(p_tag), ''), p_name), '[^a-zA-Z0-9._]', '', 'g'));
  if exists (select 1 from business_accounts where lower(tag) = v_tag)
     or exists (select 1 from app_users where lower(tag) = v_tag) then
    v_tag := v_tag || substr(gen_random_uuid()::text, 1, 4);
  end if;

  insert into business_accounts (owner_id, name, tag, receive_code)
    values (p_owner, trim(p_name), v_tag, gen_receive_code())
    returning * into v_row;

  update app_users
     set is_business = true,
         business_name = coalesce(business_name, trim(p_name))
   where id = p_owner;

  return v_row;
end $$;

/** Resolves a ten digit number to the name behind it.
    Biya has no bank name-enquiry integration, so this resolves within Biya
    only. A number that is not a Biya code returns not_found rather than a
    fabricated name. */
create or replace function resolve_account(p_number text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_digits text; v_name text; v_kind text; v_id uuid;
begin
  v_digits := regexp_replace(coalesce(p_number, ''), '[^0-9]', '', 'g');
  if length(v_digits) <> 10 then
    return jsonb_build_object('found', false, 'reason', 'An account number is ten digits');
  end if;

  select id, coalesce(nullif(display_name, ''), business_name, 'Biya account'), 'user'
    into v_id, v_name, v_kind
    from app_users where receive_code = v_digits;

  if v_id is null then
    select owner_id, name, 'business' into v_id, v_name, v_kind
      from business_accounts where receive_code = v_digits;
  end if;

  if v_id is null then
    return jsonb_build_object('found', false, 'reason', 'No account matches that number');
  end if;

  return jsonb_build_object(
    'found', true, 'user_id', v_id, 'name', upper(v_name), 'kind', v_kind
  );
end $$;

create or replace function find_by_tag(p_tag text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_tag text; v_id uuid; v_name text; v_code text;
begin
  v_tag := lower(regexp_replace(coalesce(p_tag, ''), '[^a-zA-Z0-9._]', '', 'g'));
  if length(v_tag) < 3 then
    return jsonb_build_object('found', false, 'reason', 'That tag is too short');
  end if;

  select id, coalesce(nullif(display_name, ''), business_name), receive_code
    into v_id, v_name, v_code
    from app_users where lower(tag) = v_tag;

  if v_id is null then
    select owner_id, name, receive_code into v_id, v_name, v_code
      from business_accounts where lower(tag) = v_tag;
  end if;

  if v_id is null then
    return jsonb_build_object('found', false, 'reason', 'No one is using that tag');
  end if;

  return jsonb_build_object('found', true, 'user_id', v_id, 'name', v_name, 'receive_code', v_code);
end $$;

-- ---------------------------------------------------------------------------
-- Reads
-- ---------------------------------------------------------------------------

alter table business_accounts enable row level security;
alter table tier_limits       enable row level security;
alter table banks             enable row level security;

drop policy if exists business_accounts_read on business_accounts;
create policy business_accounts_read on business_accounts for select using (true);
drop policy if exists tier_limits_read on tier_limits;
create policy tier_limits_read on tier_limits for select using (true);
drop policy if exists banks_read on banks;
create policy banks_read on banks for select using (true);

grant select on business_accounts, tier_limits, banks to anon, authenticated;

-- email_codes carries a secret and is never readable by a client. Verification
-- happens inside verify_email_code, which is security definer.
alter table email_codes enable row level security;

-- ---------------------------------------------------------------------------
-- Grants. Default privileges deny execute, so every new function is listed.
-- ---------------------------------------------------------------------------

do $$
declare fn record;
  client text[] := array[
    'signup_with_password', 'login_with_password',
    'request_email_code', 'verify_email_code',
    'save_legal_name', 'claim_tag', 'submit_identity', 'save_address',
    'complete_selfie', 'set_transaction_pin',
    'create_business_account', 'resolve_account', 'find_by_tag'
  ];
begin
  for fn in
    select p.oid::regprocedure as sig, p.proname
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = any(client || array['gen_email_code'])
  loop
    execute format('revoke all on function %s from public, anon, authenticated', fn.sig);
    if fn.proname = any(client) then
      execute format('grant execute on function %s to anon, authenticated', fn.sig);
    end if;
    execute format('grant execute on function %s to service_role', fn.sig);
  end loop;
end $$;
