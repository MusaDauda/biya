-- ============================================================================
-- Phase 5: auto-save and goals.
--
-- Four extra legs on a transaction that already exists. When the payee has
-- autosave_pct > 0, execute_payment appends legs 6-9 from the worked example:
-- a slice of the payment naira moves into a savings goal, converted to USD at
-- MID rate (not the margin rate) so the vendor is not charged a spread to save
-- her own money.
-- ============================================================================

create table if not exists savings_goals (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references app_users(id) on delete cascade,
  name             text not null,
  target_ngn_minor bigint not null check (target_ngn_minor > 0),
  created_at       timestamptz not null default now()
);
create index if not exists savings_goals_user on savings_goals(user_id);

alter table savings_goals enable row level security;
drop policy if exists savings_goals_read on savings_goals;
create policy savings_goals_read on savings_goals for select using (true);

create or replace function create_savings_goal(p_user uuid, p_name text, p_target_ngn_minor bigint)
returns savings_goals
language plpgsql security definer set search_path = public as $$
declare v savings_goals;
begin
  if p_target_ngn_minor is null or p_target_ngn_minor <= 0 then
    raise exception 'Target must be above zero';
  end if;
  insert into savings_goals (user_id, name, target_ngn_minor)
    values (p_user, trim(p_name), p_target_ngn_minor)
    returning * into v;
  perform ensure_account(p_user, 'USD', 'savings_goal', v.id);
  return v;
end $$;

-- Extended with the autosave legs. Same transaction, so a save can never
-- happen without its payment or vice versa: the balance trigger covers both.
create or replace function execute_payment(p_quote uuid, p_pin_hash text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_q          fx_quotes;
  v_pin        text;
  v_payer_usd  uuid;
  v_payee_ngn  uuid;
  v_balance    bigint;
  v_pool_usd   bigint;
  v_txn        uuid;
  v_autosave   smallint;
  v_goal       uuid;
  v_save_ngn   bigint;
  v_save_usd   bigint;
  v_mid        numeric;
  v_legs       ledger_leg[];
begin
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

  v_legs := array[
    (v_payer_usd,                        'USD', -v_q.usd_minor)::ledger_leg,
    (system_account('USD','fx_pool'),     'USD',  v_pool_usd)::ledger_leg,
    (system_account('USD','fee_revenue'), 'USD',  v_q.fee_usd_minor)::ledger_leg,
    (system_account('NGN','fx_pool'),     'NGN', -v_q.ngn_minor)::ledger_leg,
    (v_payee_ngn,                        'NGN',  v_q.ngn_minor)::ledger_leg
  ];

  select autosave_pct into v_autosave from app_users where id = v_q.payee_id;

  if coalesce(v_autosave, 0) > 0 then
    select id into v_goal from savings_goals where user_id = v_q.payee_id
      order by created_at limit 1;

    if v_goal is not null then
      v_save_ngn := v_q.ngn_minor * v_autosave / 100;
      v_mid := v_q.mid; -- mid rate, not the margin rate: no spread on her own savings
      v_save_usd := floor(v_save_ngn / v_mid);

      if v_save_usd > 0 then
        v_legs := v_legs || array[
          (v_payee_ngn,                    'NGN', -v_save_ngn)::ledger_leg,
          (system_account('NGN','fx_pool'), 'NGN',  v_save_ngn)::ledger_leg,
          (system_account('USD','fx_pool'), 'USD', -v_save_usd)::ledger_leg,
          (ensure_account(v_q.payee_id, 'USD', 'savings_goal', v_goal), 'USD', v_save_usd)::ledger_leg
        ];
      end if;
    end if;
  end if;

  v_txn := post_transaction(
    'payment', null, 'Payment',
    jsonb_build_object('quote_id', v_q.id, 'mid', v_q.mid, 'rate', v_q.rate,
                       'margin_bps', v_q.margin_bps, 'autosave_usd_minor', coalesce(v_save_usd, 0)),
    v_legs
  );

  update fx_quotes set consumed_by = v_txn where id = v_q.id;

  return jsonb_build_object(
    'txn_id', v_txn,
    'usd_minor', v_q.usd_minor,
    'ngn_minor', v_q.ngn_minor,
    'fee_usd_minor', v_q.fee_usd_minor,
    'autosave_usd_minor', coalesce(v_save_usd, 0)
  );
end $$;

create or replace function release_goal_funds(p_goal uuid, p_usd_minor bigint)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_user uuid; v_goal_acct uuid; v_spendable uuid; v_balance bigint; v_txn uuid;
begin
  select user_id into v_user from savings_goals where id = p_goal;
  if v_user is null then raise exception 'Goal not found'; end if;
  if p_usd_minor is null or p_usd_minor <= 0 then raise exception 'Amount must be above zero'; end if;

  v_goal_acct := ensure_account(v_user, 'USD', 'savings_goal', p_goal);
  select balance_minor into v_balance from account_balances where account_id = v_goal_acct;
  if coalesce(v_balance, 0) < p_usd_minor then
    raise exception 'Not enough saved to move that much';
  end if;

  v_spendable := ensure_account(v_user, 'USD', 'spendable');

  v_txn := post_transaction('goal_release', null, 'Moved from a goal', '{}'::jsonb, array[
    (v_goal_acct,  'USD', -p_usd_minor)::ledger_leg,
    (v_spendable,  'USD',  p_usd_minor)::ledger_leg
  ]);

  return jsonb_build_object('txn_id', v_txn, 'usd_minor', p_usd_minor);
end $$;

revoke all on function create_savings_goal(uuid,text,bigint) from public, anon, authenticated;
grant execute on function create_savings_goal(uuid,text,bigint) to anon, authenticated, service_role;
revoke all on function release_goal_funds(uuid,bigint) from public, anon, authenticated;
grant execute on function release_goal_funds(uuid,bigint) to anon, authenticated, service_role;
revoke all on function execute_payment(uuid,text) from public, anon, authenticated;
grant execute on function execute_payment(uuid,text) to anon, authenticated, service_role;
