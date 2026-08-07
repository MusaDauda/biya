-- The review screen states the fee as 0.75%, so the ledger charges 0.75%.
--
-- The number a person reads on the quote and the number the ledger takes are
-- the same number, or the fee line is a decoration. Config, not code, so this
-- is one row rather than a redeploy.
update fx_config set margin_bps = 75 where pair = 'USD/NGN';
