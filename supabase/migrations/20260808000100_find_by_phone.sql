-- Phone-based recipient lookup for the Pay flow.
-- Phone is stored as digits-only (e.g. '08034127788') by claim_tag.

create or replace function find_by_phone(p_phone text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_phone text; v_id uuid; v_name text; v_code text;
begin
  v_phone := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  if length(v_phone) < 10 then
    return jsonb_build_object('found', false, 'reason', 'Enter a valid phone number');
  end if;

  select id,
         coalesce(nullif(display_name, ''), concat_ws(' ', first_name, last_name), 'Biya account'),
         receive_code
    into v_id, v_name, v_code
    from app_users
   where phone = v_phone;

  if v_id is null then
    return jsonb_build_object('found', false, 'reason', 'No account linked to that phone number');
  end if;

  return jsonb_build_object(
    'found', true,
    'user_id', v_id,
    'name', upper(v_name),
    'receive_code', v_code
  );
end $$;

-- Grant execute to the same roles as the other lookup functions
grant execute on function find_by_phone(text) to authenticated, anon, service_role;
