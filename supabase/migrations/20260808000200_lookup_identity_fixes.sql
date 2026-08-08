-- ============================================================================
-- Three corrections to recipient lookup.
--
-- 1. gen_receive_code allocated out of app_users only, so a business could be
--    handed a code an existing person already held. Both lookups check
--    app_users first, so the payment would have gone silently to the person.
-- 2. find_by_tag returned the account's name but not what kind of account it
--    was, leaving the client to guess. It guessed from app_users.business_name,
--    which is the owner's *first* business, not the one being paid.
-- 3. find_by_phone matched the stored digits exactly, so a number typed in
--    +234 form found nobody.
-- ============================================================================

-- 1 -------------------------------------------------------------------------
create or replace function gen_receive_code() returns text
language plpgsql security definer set search_path = public as $$
declare v_code text; v_tries int := 0;
begin
  loop
    v_code := lpad((floor(random() * 9000000000) + 1000000000)::bigint::text, 10, '0');
    -- One number space, two tables. A code is free only if neither holds it.
    exit when not exists (select 1 from app_users         where receive_code = v_code)
         and not exists (select 1 from business_accounts  where receive_code = v_code);
    v_tries := v_tries + 1;
    if v_tries > 20 then raise exception 'Could not allocate a receive code'; end if;
  end loop;
  return v_code;
end $$;

-- 2 -------------------------------------------------------------------------
create or replace function find_by_tag(p_tag text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_tag text; v_id uuid; v_name text; v_code text; v_kind text;
begin
  v_tag := lower(regexp_replace(coalesce(p_tag, ''), '[^a-zA-Z0-9._]', '', 'g'));
  if length(v_tag) < 3 then
    return jsonb_build_object('found', false, 'reason', 'That tag is too short');
  end if;

  select id, coalesce(nullif(display_name, ''), business_name), receive_code, 'user'
    into v_id, v_name, v_code, v_kind
    from app_users where lower(tag) = v_tag;

  -- A business tag resolves to the owner's user id, because that is where the
  -- money lands, but the name and code are the business's own.
  if v_id is null then
    select owner_id, name, receive_code, 'business'
      into v_id, v_name, v_code, v_kind
      from business_accounts where lower(tag) = v_tag;
  end if;

  if v_id is null then
    return jsonb_build_object('found', false, 'reason', 'No one is using that tag');
  end if;

  return jsonb_build_object(
    'found', true, 'user_id', v_id, 'name', v_name,
    'receive_code', v_code, 'kind', v_kind
  );
end $$;

-- 3 -------------------------------------------------------------------------
create or replace function find_by_phone(p_phone text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_phone text; v_local text; v_id uuid; v_name text; v_code text;
begin
  v_phone := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  if length(v_phone) < 10 then
    return jsonb_build_object('found', false, 'reason', 'Enter a valid phone number');
  end if;

  -- claim_tag stores digits as typed, which is normally 0803..., but people
  -- type +234 803... just as readily. Compare on the last ten digits, which
  -- both forms share, and accept the stored value in any of the three shapes.
  v_local := right(v_phone, 10);

  select id,
         coalesce(nullif(display_name, ''), nullif(concat_ws(' ', first_name, last_name), ''), 'Biya account'),
         receive_code
    into v_id, v_name, v_code
    from app_users
   where phone in (v_local, '0' || v_local, '234' || v_local, '+234' || v_local)
   limit 1;

  if v_id is null then
    return jsonb_build_object('found', false, 'reason', 'No account linked to that phone number');
  end if;

  return jsonb_build_object(
    'found', true,
    'user_id', v_id,
    'name', upper(v_name),
    'receive_code', v_code,
    'kind', 'user'
  );
end $$;

grant execute on function find_by_phone(text) to authenticated, anon, service_role;
