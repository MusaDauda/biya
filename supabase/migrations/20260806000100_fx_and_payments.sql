-- ============================================================================
-- FX and payments.
--
-- Biya quotes the BANK rate, fetched from a live feed, plus a margin that is
-- shown to the user as its own line and posted to the ledger as its own leg.
-- There is no hardcoded rate anywhere in this system.
--
-- A quote is single use and expires in 90 seconds. Consuming it under a row
-- lock is the double-submission defence: two taps serialise, the second loses.
-- ============================================================================

create table if not exists fx_rates (
  id         uuid primary key default gen_random_uuid(),
  pair       text not null default 'USD/NGN',
  mid        numeric(18,6) not null check (mid > 0),
  source     text not null,
  rate_type  text not null check (rate_type in ('bank','official','parallel')),
  fetched_at timestamptz not null default now()
);
create index if not exists fx_rates_recent on fx_rates(pair, fetched_at desc);

create table if not exists fx_config (
  pair                  text primary key,
  rate_type             text not null default 'bank',
  margin_bps            int  not null default 150,
  max_staleness_seconds int  not null default 3600,
  quote_ttl_seconds     int  not null default 90
);
insert into fx_config (pair) values ('USD/NGN') on conflict (pair) do nothing;

create table if not exists fx_quotes (
  id            uuid primary key default gen_random_uuid(),
  payer_id      uuid not null references app_users(id),
  payee_id      uuid not null references app_users(id),
  pair          text not null default 'USD/NGN',
  mid           numeric(18,6) not null,
  rate          numeric(18,6) not null,
  rate_type     text not null,
  margin_bps    int  not null,
  usd_minor     bigint not null check (usd_minor > 0),
  ngn_minor     bigint not null check (ngn_minor > 0),
  fee_usd_minor bigint not null check (fee_usd_minor >= 0),
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null,
  consumed_by   uuid references ledger_transactions(id)
);
create index if not exists fx_quotes_payer on fx_quotes(payer_id, created_at desc);

alter table fx_rates  enable row level security;
alter table fx_config enable row level security;
alter table fx_quotes enable row level security;

drop policy if exists fx_rates_read  on fx_rates;
drop policy if exists fx_config_read on fx_config;
drop policy if exists fx_quotes_read on fx_quotes;
create policy fx_rates_read  on fx_rates  for select using (true);
create policy fx_config_read on fx_config for select using (true);
create policy fx_quotes_read on fx_quotes for select using (true);

-- ---------------------------------------------------------------------------
-- Quoting.
--
-- The user pays MORE dollars than mid would imply. The difference between what
-- they pay and what the pool needs is our fee, and it is returned separately so
-- the interface can show it as a line rather than burying it in the rate.
-- ---------------------------------------------------------------------------
create or replace function create_fx_quote(
  p_payer uuid, p_payee uuid, p_ngn_minor bigint
) returns fx_quotes
language plpgsql security definer set search_path = public as $$
declare
  v_cfg  fx_config;
  v_rate fx_rates;
  v_eff  numeric;
  v_usd  bigint;
  v_pool bigint;
  v_q    fx_quotes;
begin
  if p_ngn_minor is null or p_ngn_minor <= 0 then
    raise exception 'Enter an amount above zero';
  end if;
  if p_payer = p_payee then
    raise exception 'You cannot pay yourself';
  end if;
  if not exists (select 1 from app_users where id = p_payee) then
    raise exception 'That account does not exist';
  end if;

  select * into v_cfg from fx_config where pair = 'USD/NGN';

  select * into v_rate from fx_rates
    where pair = 'USD/NGN' and rate_type = v_cfg.rate_type
    order by fetched_at desc limit 1;

  -- Refuse rather than quote a stale number. "If we do not have a fresh rate we
  -- do not let you pay" is a defensible position; a silently old rate is not.
  if v_rate.id is null then
    raise exception 'No exchange rate available yet';
  end if;
  if v_rate.fetched_at < now() - make_interval(secs => v_cfg.max_staleness_seconds) then
    raise exception 'Exchange rate is out of date. Try again shortly.';
  end if;

  v_eff  := v_rate.mid / (1 + v_cfg.margin_bps::numeric / 10000);
  v_usd  := ceil(p_ngn_minor / v_eff);
  v_pool := floor(p_ngn_minor / v_rate.mid);

  insert into fx_quotes (
    payer_id, payee_id, mid, rate, rate_type, margin_bps,
    usd_minor, ngn_minor, fee_usd_minor, expires_at
  ) values (
    p_payer, p_payee, v_rate.mid, v_eff, v_rate.rate_type, v_cfg.margin_bps,
    v_usd, p_ngn_minor, greatest(v_usd - v_pool, 0),
    now() + make_interval(secs => v_cfg.quote_ttl_seconds)
  ) returning * into v_q;

  return v_q;
end $$;

-- ---------------------------------------------------------------------------
-- Execution. Five legs, one transaction, balanced in both currencies.
-- ---------------------------------------------------------------------------
create or replace function execute_payment(p_quote uuid, p_pin_hash text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_q         fx_quotes;
  v_pin       text;
  v_payer_usd uuid;
  v_payee_ngn uuid;
  v_balance   bigint;
  v_pool_usd  bigint;
  v_txn       uuid;
begin
  -- FOR UPDATE is the whole double-submit defence. Two concurrent calls queue
  -- here; whichever arrives second sees consumed_by already set.
  select * into v_q from fx_quotes where id = p_quote for update;

  if v_q.id is null then
    raise exception 'Quote not found';
  end if;
  if v_q.consumed_by is not null then
    raise exception 'This payment has already gone through';
  end if;
  if v_q.expires_at < now() then
    raise exception 'The rate expired. Get a new quote.';
  end if;

  select pin_hash into v_pin from app_users where id = v_q.payer_id;
  if v_pin is null or v_pin is distinct from p_pin_hash then
    raise exception 'Incorrect PIN';
  end if;

  v_payer_usd := ensure_account(v_q.payer_id, 'USD', 'spendable');
  v_payee_ngn := ensure_account(v_q.payee_id, 'NGN', 'spendable');

  select balance_minor into v_balance
    from account_balances where account_id = v_payer_usd;

  if coalesce(v_balance, 0) < v_q.usd_minor then
    raise exception 'Not enough dollars in your balance';
  end if;

  v_pool_usd := v_q.usd_minor - v_q.fee_usd_minor;

  v_txn := post_transaction(
    'payment', null, 'Payment',
    jsonb_build_object('quote_id', v_q.id, 'mid', v_q.mid, 'rate', v_q.rate,
                       'margin_bps', v_q.margin_bps),
    array[
      (v_payer_usd,                        'USD', -v_q.usd_minor)::ledger_leg,
      (system_account('USD','fx_pool'),     'USD',  v_pool_usd)::ledger_leg,
      (system_account('USD','fee_revenue'), 'USD',  v_q.fee_usd_minor)::ledger_leg,
      (system_account('NGN','fx_pool'),     'NGN', -v_q.ngn_minor)::ledger_leg,
      (v_payee_ngn,                        'NGN',  v_q.ngn_minor)::ledger_leg
    ]
  );

  update fx_quotes set consumed_by = v_txn where id = v_q.id;

  return jsonb_build_object(
    'txn_id', v_txn,
    'usd_minor', v_q.usd_minor,
    'ngn_minor', v_q.ngn_minor,
    'fee_usd_minor', v_q.fee_usd_minor
  );
end $$;

-- Called by the rate service with the secret key, never from a browser.
create or replace function record_fx_rate(
  p_mid numeric, p_source text, p_rate_type text default 'bank'
) returns fx_rates
language plpgsql security definer set search_path = public as $$
declare v_row fx_rates;
begin
  if p_mid is null or p_mid <= 0 then
    raise exception 'Rate must be positive';
  end if;
  insert into fx_rates (pair, mid, source, rate_type)
    values ('USD/NGN', p_mid, p_source, p_rate_type)
    returning * into v_row;
  return v_row;
end $$;

-- Convenience for the interface: the rate we would quote right now, and
-- whether it is fresh enough to pay with.
create or replace view current_fx as
  select r.mid,
         r.source,
         r.rate_type,
         r.fetched_at,
         c.margin_bps,
         c.quote_ttl_seconds,
         (r.mid / (1 + c.margin_bps::numeric / 10000))::numeric(18,6) as effective_rate,
         (r.fetched_at >= now() - make_interval(secs => c.max_staleness_seconds)) as is_fresh
  from fx_config c
  left join lateral (
    select * from fx_rates
     where pair = c.pair and rate_type = c.rate_type
     order by fetched_at desc limit 1
  ) r on true
  where c.pair = 'USD/NGN';

grant select on current_fx to anon, authenticated;
grant execute on function create_fx_quote(uuid, uuid, bigint)     to anon, authenticated;
grant execute on function execute_payment(uuid, text)             to anon, authenticated;
-- record_fx_rate is intentionally NOT granted to anon: only the rate service,
-- holding the secret key, may write a rate.
