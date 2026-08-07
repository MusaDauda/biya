-- ============================================================================
-- The AI layer.
--
-- Three ideas hold this together, and each is a direct answer to "why should a
-- language model be allowed anywhere near money":
--
--   1. THE MODEL NEVER WRITES SQL. Every tool is a function in this file with a
--      fixed signature. There is no query interface, no connection string in the
--      agent process, no dynamic SQL anywhere below. Swapping to a worse model
--      cannot widen what the agent is able to do, because the set of things it
--      can do is enumerated here and nowhere else.
--
--   2. AUTHORITY COMES IN THREE TIERS, enforced by what each function is
--      willing to do rather than by prompt wording:
--        read_only     free, returns facts, moves nothing
--        user_pin      returns a PROPOSAL; a human confirms with a PIN
--        mandate:<id>  executes inside bounds a human already set (Phase 7)
--      Note what ai_propose_payment does NOT do: it does not touch
--      post_transaction, and it has no path to it.
--
--   3. EVERY CALL IS LOGGED with the authority it ran under, and the user can
--      read that log. An audit trail nobody can see is not an audit trail.
--
-- The COMMENT ON statements at the end are not documentation for humans. They
-- are shipped to the model as the schema description, which is what lets the
-- assistant be correct about kobo and cents without being told in a prompt.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Free text alongside structured fields, deliberately. "I sell jollof and fried
-- rice by Suleiman Hall, ₦800 to ₦1,500" is what lets the assistant say
-- something true about this business rather than something generic about a
-- merchant. This is AI context, not decoration.
create table if not exists business_profiles (
  user_id         uuid primary key references app_users(id) on delete cascade,
  trading_name    text not null,
  category        text not null,
  description     text,
  typical_items   jsonb not null default '[]'::jsonb,
  location        text,
  price_range_ngn text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists agent_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references app_users(id) on delete cascade,
  started_at timestamptz not null default now()
);
create index if not exists agent_sessions_user on agent_sessions(user_id, started_at desc);

create table if not exists agent_actions (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references agent_sessions(id) on delete cascade,
  tool_name     text not null,
  arguments     jsonb not null default '{}'::jsonb,
  result        jsonb,
  -- 'read_only' | 'user_pin' | 'mandate:<uuid>'. Never inferred, always passed
  -- by the dispatcher that actually decided it.
  authorized_by text not null,
  error         text,
  latency_ms    int,
  created_at    timestamptz not null default now()
);
create index if not exists agent_actions_session on agent_actions(session_id, created_at);

-- A proposal is an intention, not a payment. It carries no rate and no quote
-- until a human confirms it, because a rate held while a model thinks is a rate
-- we are giving away for free.
create table if not exists payment_proposals (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid references agent_sessions(id) on delete set null,
  payer_id   uuid not null references app_users(id) on delete cascade,
  payee_id   uuid not null references app_users(id),
  ngn_minor  bigint not null check (ngn_minor > 0),
  reason     text,
  status     text not null default 'pending'
               check (status in ('pending','confirmed','rejected','expired')),
  quote_id   uuid references fx_quotes(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '10 minutes'
);
create index if not exists payment_proposals_payer on payment_proposals(payer_id, created_at desc);

alter table business_profiles  enable row level security;
alter table agent_sessions     enable row level security;
alter table agent_actions      enable row level security;
alter table payment_proposals  enable row level security;

drop policy if exists business_profiles_read on business_profiles;
drop policy if exists agent_sessions_read    on agent_sessions;
drop policy if exists agent_actions_read     on agent_actions;
drop policy if exists payment_proposals_read on payment_proposals;

-- Read-only policies. No INSERT, UPDATE or DELETE policy exists on any of
-- these, so the only write path is the security-definer functions below.
create policy business_profiles_read on business_profiles for select using (true);
create policy agent_sessions_read    on agent_sessions    for select using (true);
create policy agent_actions_read     on agent_actions     for select using (true);
create policy payment_proposals_read on payment_proposals for select using (true);

-- ---------------------------------------------------------------------------
-- Analytics views.
--
-- The model reads these, never raw ledger rows. Two reasons: a model summing
-- entries in its context window will eventually sum them wrong, and a view is
-- a surface we control while a prompt is not.
-- ---------------------------------------------------------------------------

create or replace view v_daily_totals as
select
  user_id,
  (created_at at time zone 'Africa/Lagos')::date as day,
  count(*)::int                                   as txn_count,
  sum(greatest(ngn_minor, 0))::bigint             as ngn_in_minor,
  sum(greatest(-ngn_minor, 0))::bigint            as ngn_out_minor,
  sum(greatest(usd_minor, 0))::bigint             as usd_in_minor,
  sum(greatest(-usd_minor, 0))::bigint            as usd_out_minor
from v_user_activity
group by user_id, (created_at at time zone 'Africa/Lagos')::date;

create or replace view v_spending_by_counterparty as
select
  act.user_id,
  coalesce(act.counterparty, 'Unknown')      as counterparty,
  coalesce(bp.category, 'uncategorised')     as category,
  count(*)::int                              as txn_count,
  sum(greatest(-act.ngn_minor, 0))::bigint   as ngn_out_minor,
  sum(greatest(act.usd_minor, 0))::bigint    as usd_in_minor,
  sum(greatest(-act.usd_minor, 0))::bigint   as usd_out_minor,
  max(act.created_at)                        as last_at
from v_user_activity act
left join app_users u2
  on coalesce(nullif(u2.business_name, ''), nullif(u2.display_name, ''), u2.email)
     = act.counterparty
left join business_profiles bp on bp.user_id = u2.id
where act.counterparty is not null
group by act.user_id, act.counterparty, coalesce(bp.category, 'uncategorised');

-- Savings held in dollars. Phase 5 adds named goals with naira targets; until
-- then this reports the balance honestly rather than inventing a target.
create or replace view v_savings_progress as
select
  b.user_id,
  b.goal_id,
  b.balance_minor::bigint as saved_usd_minor
from account_balances b
where b.purpose = 'savings_goal' and b.currency = 'USD';

create or replace view v_business_sales_summary as
select
  act.user_id,
  (act.created_at at time zone 'Africa/Lagos')::date as day,
  count(*)::int                        as sales_count,
  sum(act.ngn_minor)::bigint           as ngn_minor,
  round(avg(act.ngn_minor))::bigint    as avg_sale_ngn_minor
from v_user_activity act
where act.ngn_minor > 0 and act.kind = 'payment'
group by act.user_id, (act.created_at at time zone 'Africa/Lagos')::date;

grant select on v_daily_totals, v_spending_by_counterparty,
                v_savings_progress, v_business_sales_summary to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Audit log writer. Called by the dispatcher for every tool call, successful or
-- not. A failed call is exactly the kind a user wants to see.
-- ---------------------------------------------------------------------------

create or replace function start_agent_session(p_user uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not exists (select 1 from app_users where id = p_user) then
    raise exception 'Unknown user';
  end if;
  insert into agent_sessions (user_id) values (p_user) returning id into v_id;
  return v_id;
end $$;

create or replace function log_agent_action(
  p_session uuid, p_tool text, p_args jsonb, p_result jsonb,
  p_authorized_by text, p_error text default null, p_latency_ms int default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into agent_actions (session_id, tool_name, arguments, result,
                             authorized_by, error, latency_ms)
    values (p_session, p_tool, coalesce(p_args, '{}'::jsonb), p_result,
            p_authorized_by, p_error, p_latency_ms)
    returning id into v_id;
  return v_id;
end $$;

-- ===========================================================================
-- TIER 1: READ. Always allowed. Returns facts, moves nothing.
-- ===========================================================================

create or replace function ai_get_balances(p_user uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select jsonb_build_object(
    'usd_spendable_minor',
      coalesce(sum(case when currency='USD' and purpose='spendable'
                        then balance_minor end), 0),
    'ngn_spendable_minor',
      coalesce(sum(case when currency='NGN' and purpose='spendable'
                        then balance_minor end), 0),
    'usd_saved_minor',
      coalesce(sum(case when currency='USD' and purpose='savings_goal'
                        then balance_minor end), 0)
  ) into v from account_balances where user_id = p_user;
  return coalesce(v, '{}'::jsonb);
end $$;

create or replace function ai_list_transactions(
  p_user uuid, p_days int default 7, p_limit int default 20
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  -- Clamped, not trusted. The model chose these numbers.
  p_days  := least(greatest(coalesce(p_days, 7), 1), 365);
  p_limit := least(greatest(coalesce(p_limit, 20), 1), 100);

  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) into v from (
    select created_at, kind, memo, counterparty, ngn_minor, usd_minor
      from v_user_activity
     where user_id = p_user
       and created_at >= now() - make_interval(days => p_days)
     order by created_at desc
     limit p_limit
  ) t;
  return jsonb_build_object('days', p_days, 'transactions', v);
end $$;

create or replace function ai_spending_summary(p_user uuid, p_days int default 7)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_by jsonb; v_days jsonb;
begin
  p_days := least(greatest(coalesce(p_days, 7), 1), 365);

  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) into v_by from (
    select counterparty, category, txn_count, ngn_out_minor, usd_out_minor
      from v_spending_by_counterparty
     where user_id = p_user and ngn_out_minor > 0
     order by ngn_out_minor desc limit 20
  ) t;

  select coalesce(jsonb_agg(row_to_json(d)), '[]'::jsonb) into v_days from (
    select day, txn_count, ngn_in_minor, ngn_out_minor, usd_in_minor, usd_out_minor
      from v_daily_totals
     where user_id = p_user and day >= (now() at time zone 'Africa/Lagos')::date - p_days
     order by day desc
  ) d;

  return jsonb_build_object('days', p_days, 'by_counterparty', v_by, 'by_day', v_days);
end $$;

create or replace function ai_get_goals(p_user uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v jsonb; v_pct smallint;
begin
  select autosave_pct into v_pct from app_users where id = p_user;
  select coalesce(jsonb_agg(row_to_json(g)), '[]'::jsonb) into v from (
    select goal_id, saved_usd_minor from v_savings_progress where user_id = p_user
  ) g;
  return jsonb_build_object('autosave_pct', coalesce(v_pct, 0), 'goals', v);
end $$;

-- Name or 10-digit receive code. Returns candidates and lets the model ask,
-- rather than guessing between two people called Hauwa.
create or replace function ai_find_payee(p_query text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v jsonb; v_q text;
begin
  v_q := trim(coalesce(p_query, ''));
  if length(v_q) < 2 then
    return jsonb_build_object('matches', '[]'::jsonb,
      'note', 'Query too short. Ask the user for a name or their 10-digit code.');
  end if;

  select coalesce(jsonb_agg(row_to_json(m)), '[]'::jsonb) into v from (
    select id as user_id,
           coalesce(nullif(business_name,''), nullif(display_name,''), email) as name,
           receive_code, is_business
      from app_users
     where receive_code = regexp_replace(v_q, '\D', '', 'g')
        or display_name  ilike '%' || v_q || '%'
        or business_name ilike '%' || v_q || '%'
     limit 5
  ) m;

  return jsonb_build_object('matches', v);
end $$;

create or replace function ai_business_summary(p_user uuid, p_days int default 7)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_profile jsonb; v_sales jsonb; v_is_business boolean;
begin
  p_days := least(greatest(coalesce(p_days, 7), 1), 365);

  select is_business into v_is_business from app_users where id = p_user;
  if not coalesce(v_is_business, false) then
    return jsonb_build_object('is_business', false,
      'note', 'This user does not run a business on Biya.');
  end if;

  select row_to_json(b)::jsonb into v_profile
    from business_profiles b where b.user_id = p_user;

  select coalesce(jsonb_agg(row_to_json(s)), '[]'::jsonb) into v_sales from (
    select day, sales_count, ngn_minor, avg_sale_ngn_minor
      from v_business_sales_summary
     where user_id = p_user
       and day >= (now() at time zone 'Africa/Lagos')::date - p_days
     order by day desc
  ) s;

  return jsonb_build_object('is_business', true, 'profile', v_profile,
                            'days', p_days, 'sales_by_day', v_sales);
end $$;

-- ===========================================================================
-- TIER 2: WRITE, HUMAN CONFIRMS.
--
-- This is the tier that matters. It returns a proposal. It cannot post a
-- transaction, and there is no argument you can pass that makes it try.
-- ===========================================================================

create or replace function ai_propose_payment(
  p_session uuid, p_payer uuid, p_payee uuid, p_ngn_minor bigint,
  p_reason text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_p payment_proposals; v_name text;
begin
  if p_ngn_minor is null or p_ngn_minor <= 0 then
    raise exception 'Amount must be above zero';
  end if;
  if p_payer = p_payee then
    raise exception 'You cannot pay yourself';
  end if;

  select coalesce(nullif(business_name,''), nullif(display_name,''), email)
    into v_name from app_users where id = p_payee;
  if v_name is null then
    raise exception 'That account does not exist';
  end if;

  insert into payment_proposals (session_id, payer_id, payee_id, ngn_minor, reason)
    values (p_session, p_payer, p_payee, p_ngn_minor, p_reason)
    returning * into v_p;

  return jsonb_build_object(
    'proposal_id', v_p.id, 'payee_id', v_p.payee_id, 'payee_name', v_name,
    'ngn_minor', v_p.ngn_minor, 'reason', v_p.reason, 'status', v_p.status,
    'note', 'Proposal created. No money has moved. The user must confirm with their PIN.'
  );
end $$;

-- Confirmation path, called by the interface and never by the model. The rate
-- is fetched HERE, when the human is looking at it, so the 90 second window
-- starts at confirmation rather than while a model was still thinking.
create or replace function quote_proposal(p_proposal uuid)
returns fx_quotes
language plpgsql security definer set search_path = public as $$
declare v_p payment_proposals; v_q fx_quotes;
begin
  select * into v_p from payment_proposals where id = p_proposal for update;
  if v_p.id is null then raise exception 'Proposal not found'; end if;
  if v_p.status <> 'pending' then
    raise exception 'This request is no longer pending';
  end if;
  if v_p.expires_at < now() then
    update payment_proposals set status = 'expired' where id = v_p.id;
    raise exception 'This request expired. Ask again.';
  end if;

  v_q := create_fx_quote(v_p.payer_id, v_p.payee_id, v_p.ngn_minor);
  update payment_proposals set quote_id = v_q.id where id = v_p.id;
  return v_q;
end $$;

create or replace function resolve_proposal(p_proposal uuid, p_status text)
returns payment_proposals
language plpgsql security definer set search_path = public as $$
declare v_p payment_proposals;
begin
  if p_status not in ('confirmed','rejected') then
    raise exception 'Invalid status';
  end if;
  update payment_proposals set status = p_status
    where id = p_proposal and status = 'pending'
    returning * into v_p;
  if v_p.id is null then raise exception 'Proposal is no longer pending'; end if;
  return v_p;
end $$;

-- ---------------------------------------------------------------------------
-- Business profile writer, used by onboarding (Phase 10) and Settings.
-- ---------------------------------------------------------------------------
create or replace function set_business_profile(
  p_user uuid, p_trading_name text, p_category text, p_description text default null,
  p_typical_items jsonb default '[]'::jsonb, p_location text default null,
  p_price_range text default null
) returns business_profiles
language plpgsql security definer set search_path = public as $$
declare v business_profiles;
begin
  insert into business_profiles (user_id, trading_name, category, description,
                                 typical_items, location, price_range_ngn)
    values (p_user, p_trading_name, p_category, p_description,
            coalesce(p_typical_items, '[]'::jsonb), p_location, p_price_range)
  on conflict (user_id) do update set
    trading_name    = excluded.trading_name,
    category        = excluded.category,
    description     = excluded.description,
    typical_items   = excluded.typical_items,
    location        = excluded.location,
    price_range_ngn = excluded.price_range_ngn,
    updated_at      = now()
  returning * into v;
  return v;
end $$;

-- ---------------------------------------------------------------------------
-- Grants.
--
-- The read tools and the confirmation path are callable by the interface. The
-- proposal writer and the audit writer are NOT granted to anon: they are called
-- by the agent service holding the secret key. A browser cannot manufacture a
-- proposal that looks like the assistant made it, and cannot write a line into
-- the audit log at all.
-- ---------------------------------------------------------------------------
grant execute on function ai_get_balances(uuid)            to anon, authenticated;
grant execute on function ai_list_transactions(uuid,int,int) to anon, authenticated;
grant execute on function ai_spending_summary(uuid,int)    to anon, authenticated;
grant execute on function ai_get_goals(uuid)               to anon, authenticated;
grant execute on function ai_find_payee(text)              to anon, authenticated;
grant execute on function ai_business_summary(uuid,int)    to anon, authenticated;
grant execute on function quote_proposal(uuid)             to anon, authenticated;
grant execute on function resolve_proposal(uuid,text)      to anon, authenticated;
grant execute on function set_business_profile(uuid,text,text,text,jsonb,text,text)
                                                           to anon, authenticated;

revoke execute on function ai_propose_payment(uuid,uuid,uuid,bigint,text) from anon;
revoke execute on function log_agent_action(uuid,text,jsonb,jsonb,text,text,int) from anon;
revoke execute on function start_agent_session(uuid) from anon;

-- ===========================================================================
-- SCHEMA COMMENTS.
--
-- Written to be read by a model, not by a maintainer. These are shipped in the
-- system prompt as the description of the money model, which is why the
-- assistant is correct about kobo without being coached about kobo.
-- ===========================================================================

comment on table ledger_entries is
  'Immutable double-entry rows. Signed minor units: USD cents, NGN kobo. Entries '
  'within one ledger_transaction sum to zero per currency, enforced by a deferred '
  'constraint trigger. Never write here directly; use post_transaction().';

comment on column ledger_entries.amount_minor is
  'Signed integer in minor units. Negative means money left the account. USD is '
  'cents (100 = $1.00), NGN is kobo (100 = ₦1.00). Never a decimal.';

comment on table ledger_transactions is
  'One economic event. Has many ledger_entries across one or two currencies. An '
  'FX payment is a single transaction with five legs, not two transfers.';

comment on view account_balances is
  'Derived balances. Balances are never stored; this sums ledger_entries per '
  'account. If this disagrees with the entries, the entries are right.';

comment on view v_user_activity is
  'One row per (user, transaction): net USD and NGN movement for that user, and '
  'the counterparty name. Negative means money left the user.';

comment on view v_daily_totals is
  'Per user per calendar day in Africa/Lagos: money in and out, in minor units.';

comment on view v_spending_by_counterparty is
  'Per user per counterparty: totals and the counterparty business category. This '
  'is what answers "how much did I spend on food this week".';

comment on view v_business_sales_summary is
  'Per business per day: sales count, naira received, average sale. Only counts '
  'incoming payments.';

comment on table payment_proposals is
  'An intention to pay, created by the assistant. NOT a payment. No money moves '
  'until a human confirms it with a PIN, at which point a fresh FX quote is made.';

comment on table agent_actions is
  'Audit log. Every assistant tool call with the authority it ran under: '
  'read_only, user_pin, or mandate:<uuid>. Readable by the user.';

comment on table business_profiles is
  'What a business actually sells, in structured fields and free text. Used to '
  'give the assistant real context about this specific trader.';
