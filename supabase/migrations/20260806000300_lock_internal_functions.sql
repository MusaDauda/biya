-- ============================================================================
-- Close a real hole.
--
-- Postgres grants EXECUTE ON FUNCTION TO PUBLIC by default. Every earlier
-- migration in this project relied on "we simply did not grant it to anon",
-- which is not the same thing and does not work: anon inherits PUBLIC. Two
-- SECURITY DEFINER functions were therefore reachable from any browser holding
-- the publishable key:
--
--   post_transaction(...)  -- would let anyone mint money into any account
--   record_fx_rate(...)    -- would let anyone forge the exchange rate
--
-- Both were confirmed callable before this migration. Neither is now.
--
-- The rule from here: a SECURITY DEFINER function is deny-by-default, and the
-- client surface is an explicit list. Anything not on that list is internal,
-- callable only by the functions that need it (which run as the owner) and by
-- the services process holding the secret key.
-- ============================================================================

do $$
declare
  fn record;

  -- Internal. The ledger's write path and anything that fabricates truth.
  internal text[] := array[
    'post_transaction',      -- the only way entries are created
    'ensure_account',
    'system_account',
    'record_fx_rate',        -- only the rate service may write a rate
    'gen_receive_code',
    'assert_txn_balanced',
    'ai_propose_payment',    -- only the agent may author a proposal
    'log_agent_action',      -- an audit log a client can write is not one
    'start_agent_session',
    'prove_ledger_invariant'
  ];

  -- The client surface, deliberate and small. Every one of these validates its
  -- own arguments and none of them can post an unbalanced transaction.
  client text[] := array[
    'signup_user', 'login_user', 'set_profile', 'set_autosave',
    'credit_test_funds',                       -- demo faucet, bounded amount
    'create_fx_quote', 'execute_payment',
    'quote_proposal', 'resolve_proposal', 'set_business_profile',
    'ai_get_balances', 'ai_list_transactions', 'ai_spending_summary',
    'ai_get_goals', 'ai_find_payee', 'ai_business_summary'
  ];
begin
  -- Iterating pg_proc rather than writing signatures by hand: a typo in an
  -- argument list would silently revoke nothing, which is the exact failure
  -- mode being fixed here.
  for fn in
    select p.oid::regprocedure as sig, p.proname
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = any(internal || client)
  loop
    execute format('revoke all on function %s from public, anon, authenticated', fn.sig);

    if fn.proname = any(client) then
      execute format('grant execute on function %s to anon, authenticated', fn.sig);
    end if;

    execute format('grant execute on function %s to service_role', fn.sig);
  end loop;
end $$;

-- Future functions inherit the same posture, so the next migration cannot
-- reintroduce this by forgetting.
alter default privileges in schema public revoke execute on functions from public;
