-- ============================================================================
-- Two corrections found by running the assistant against real data.
--
-- 1. THE MODEL MUST NOT DIVIDE BY 100.
--
--    Verification caught it reporting a ₦1,200 sale as "₦120,000" and a ₦500
--    request as "₦50,000". The proposals were correct, because those are the
--    right numbers in kobo. The English was wrong by a factor of a hundred.
--
--    Telling it more firmly in the prompt is the wrong fix. Every tool that
--    returns money now also returns the formatted string, and the model is told
--    to repeat that verbatim. This is the same principle as the analytics
--    views: if a number can be got wrong, do not ask the model to derive it.
--
-- 2. WHEN WE DO NOT KNOW WHO, THE MODEL DOES NOT GET AN ID.
--
--    Asked to pay one of two people called Aisha Bala, the model picked one.
--    It asked correctly on an earlier run, which is worse than always failing:
--    it means the behaviour is a coin flip.
--
--    ai_find_payee now withholds user_id entirely when the match is ambiguous.
--    The model cannot propose a payment to the wrong person because it is not
--    given the means to name one. That is enforcement, not instruction.
-- ============================================================================

create or replace function fmt_ngn(p_minor bigint) returns text
language sql immutable as $$
  select '₦' || to_char(p_minor / 100.0, 'FM999,999,999,990.00')
$$;

create or replace function fmt_usd(p_minor bigint) returns text
language sql immutable as $$
  select '$' || to_char(p_minor / 100.0, 'FM999,999,999,990.00')
$$;

comment on function fmt_ngn(bigint) is
  'Formats NGN kobo for display. Exists so a language model never divides by 100.';

-- ---------------------------------------------------------------------------

create or replace function ai_get_balances(p_user uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_usd bigint; v_ngn bigint; v_saved bigint;
begin
  select
    coalesce(sum(case when currency='USD' and purpose='spendable'     then balance_minor end), 0),
    coalesce(sum(case when currency='NGN' and purpose='spendable'     then balance_minor end), 0),
    coalesce(sum(case when currency='USD' and purpose='savings_goal'  then balance_minor end), 0)
  into v_usd, v_ngn, v_saved
  from account_balances where user_id = p_user;

  return jsonb_build_object(
    'usd_spendable_minor', v_usd, 'usd_spendable_display', fmt_usd(v_usd),
    'ngn_spendable_minor', v_ngn, 'ngn_spendable_display', fmt_ngn(v_ngn),
    'usd_saved_minor',     v_saved, 'usd_saved_display',   fmt_usd(v_saved)
  );
end $$;

create or replace function ai_list_transactions(
  p_user uuid, p_days int default 7, p_limit int default 20
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  p_days  := least(greatest(coalesce(p_days, 7), 1), 365);
  p_limit := least(greatest(coalesce(p_limit, 20), 1), 100);

  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) into v from (
    select created_at, kind, memo, counterparty,
           ngn_minor, fmt_ngn(ngn_minor) as ngn_display,
           usd_minor, fmt_usd(usd_minor) as usd_display
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
    select counterparty, category, txn_count,
           ngn_out_minor, fmt_ngn(ngn_out_minor) as ngn_out_display,
           usd_out_minor, fmt_usd(usd_out_minor) as usd_out_display
      from v_spending_by_counterparty
     where user_id = p_user and ngn_out_minor > 0
     order by ngn_out_minor desc limit 20
  ) t;

  select coalesce(jsonb_agg(row_to_json(d)), '[]'::jsonb) into v_days from (
    select day, txn_count,
           fmt_ngn(ngn_in_minor)  as ngn_in_display,
           fmt_ngn(ngn_out_minor) as ngn_out_display,
           fmt_usd(usd_in_minor)  as usd_in_display,
           fmt_usd(usd_out_minor) as usd_out_display
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
    select goal_id, saved_usd_minor, fmt_usd(saved_usd_minor) as saved_display
      from v_savings_progress where user_id = p_user
  ) g;
  return jsonb_build_object('autosave_pct', coalesce(v_pct, 0), 'goals', v);
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
    select day, sales_count,
           ngn_minor, fmt_ngn(ngn_minor) as ngn_display,
           fmt_ngn(avg_sale_ngn_minor)   as avg_sale_display
      from v_business_sales_summary
     where user_id = p_user
       and day >= (now() at time zone 'Africa/Lagos')::date - p_days
     order by day desc
  ) s;

  return jsonb_build_object('is_business', true, 'profile', v_profile,
                            'days', p_days, 'sales_by_day', v_sales);
end $$;

-- ---------------------------------------------------------------------------
-- Ambiguity. The important one.
-- ---------------------------------------------------------------------------
create or replace function ai_find_payee(p_query text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_matches jsonb; v_count int; v_q text;
begin
  v_q := trim(coalesce(p_query, ''));
  if length(v_q) < 2 then
    return jsonb_build_object('matches', '[]'::jsonb,
      'note', 'Query too short. Ask for a name or a 10-digit code.');
  end if;

  with hits as (
    select id,
           coalesce(nullif(business_name,''), nullif(display_name,''), email) as name,
           receive_code, is_business
      from app_users
     where receive_code = regexp_replace(v_q, '\D', '', 'g')
        or display_name  ilike '%' || v_q || '%'
        or business_name ilike '%' || v_q || '%'
     limit 6
  )
  select count(*), jsonb_agg(row_to_json(hits))
    into v_count, v_matches
    from hits;

  if v_count = 0 then
    return jsonb_build_object('matches', '[]'::jsonb,
      'note', 'Nobody found. Ask the user for the payee''s 10-digit Biya code.');
  end if;

  -- More than one match: hand back names WITHOUT ids. The model then has no
  -- way to name a payee, so it cannot pay the wrong person even if it tries.
  if v_count > 1 then
    return jsonb_build_object(
      'ambiguous', true,
      'candidates', (
        select jsonb_agg(jsonb_build_object(
                 'name', m ->> 'name',
                 'code_ends_with', right(m ->> 'receive_code', 4),
                 'is_business', m -> 'is_business'))
          from jsonb_array_elements(v_matches) m
      ),
      'note', 'More than one match, so no user ids are provided. You cannot '
           || 'propose a payment yet. Show these names to the user and ask '
           || 'which one, or ask for the payee''s full 10-digit code.'
    );
  end if;

  return jsonb_build_object(
    'ambiguous', false,
    'matches', (
      select jsonb_agg(jsonb_build_object(
               'user_id', m ->> 'id',
               'name', m ->> 'name',
               'receive_code', m ->> 'receive_code',
               'is_business', m -> 'is_business'))
        from jsonb_array_elements(v_matches) m
    )
  );
end $$;

-- The proposal carries its own display string too, so the sentence the model
-- writes alongside the card cannot disagree with the card.
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
    'ngn_minor', v_p.ngn_minor, 'ngn_display', fmt_ngn(v_p.ngn_minor),
    'reason', v_p.reason, 'status', v_p.status,
    'note', 'Proposal created. No money has moved. Tell the user you have set '
         || 'up ' || fmt_ngn(v_p.ngn_minor) || ' to ' || v_name
         || ' for them to confirm with their PIN. Use that exact amount.'
  );
end $$;

revoke all on function ai_propose_payment(uuid,uuid,uuid,bigint,text) from public, anon, authenticated;
grant execute on function ai_propose_payment(uuid,uuid,uuid,bigint,text) to service_role;

grant execute on function fmt_ngn(bigint) to anon, authenticated, service_role;
grant execute on function fmt_usd(bigint) to anon, authenticated, service_role;
grant execute on function ai_get_balances(uuid)              to anon, authenticated, service_role;
grant execute on function ai_list_transactions(uuid,int,int) to anon, authenticated, service_role;
grant execute on function ai_spending_summary(uuid,int)      to anon, authenticated, service_role;
grant execute on function ai_get_goals(uuid)                 to anon, authenticated, service_role;
grant execute on function ai_find_payee(text)                to anon, authenticated, service_role;
grant execute on function ai_business_summary(uuid,int)      to anon, authenticated, service_role;
