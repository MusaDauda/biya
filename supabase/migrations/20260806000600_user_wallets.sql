-- ============================================================================
-- One EVM address per user. Address only — no key material touches this table.
--
-- The mnemonic is generated in the browser and never leaves it (see
-- src/lib/wallet.ts). What is stored here is exactly what a block explorer
-- would show anyone anyway: a public address. That is why the read policy is
-- open, same as receive_code.
--
-- This is deliberately smaller than the full Phase 8 wallet design (no
-- envelope encryption, no recovery key, no export flow). It exists so the
-- stablecoin screen can show every user a real, unique deposit address. No
-- listener watches it yet, so nothing credits automatically — the UI says so.
-- ============================================================================

create table if not exists user_wallets (
  user_id      uuid primary key references app_users(id) on delete cascade,
  address      text not null unique check (address ~ '^0x[0-9a-fA-F]{40}$'),
  chain_family text not null default 'evm',
  created_at   timestamptz not null default now()
);

alter table user_wallets enable row level security;
drop policy if exists user_wallets_read on user_wallets;
create policy user_wallets_read on user_wallets for select using (true);

-- Idempotent by design: a device that already generated an address calls this
-- again on every load, and it is a no-op past the first row.
create or replace function ensure_user_wallet(p_user uuid, p_address text)
returns user_wallets
language plpgsql security definer set search_path = public as $$
declare v user_wallets;
begin
  insert into user_wallets (user_id, address)
    values (p_user, lower(p_address))
    on conflict (user_id) do nothing;
  select * into v from user_wallets where user_id = p_user;
  return v;
end $$;

revoke all on function ensure_user_wallet(uuid, text) from public, anon, authenticated;
grant execute on function ensure_user_wallet(uuid, text) to anon, authenticated, service_role;
