-- Atomic transfer_payment function
-- Fixes BUG-001 (non-atomic transfer), BUG-002 (stale balance), BUG-003 (vendor lost update)
-- All three operations (debit sender, credit receiver, record transaction) run in a single
-- database transaction. If any step fails, all changes are rolled back automatically.

CREATE OR REPLACE FUNCTION transfer_payment(
  p_sender text,
  p_receiver text,
  p_amount numeric,
  p_ref text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_txn_id text;
  v_ts bigint;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be positive';
  END IF;

  -- Generate transaction ID and timestamp
  v_ts := (extract(epoch from now()) * 1000)::bigint;
  v_txn_id := 't' || v_ts;

  -- Debit sender (atomic: uses current DB balance, not a stale client value)
  UPDATE users
    SET balance = balance - p_amount
    WHERE id = p_sender AND balance >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  -- Credit receiver (atomic: uses balance = balance + amount, safe for concurrent payments)
  UPDATE users
    SET balance = balance + p_amount
    WHERE id = p_receiver;

  IF NOT FOUND THEN
    -- Rollback the sender debit by re-raising
    RAISE EXCEPTION 'Vendor not found';
  END IF;

  -- Record the transaction
  INSERT INTO transactions (id, sender_id, receiver_id, amount, status, reference, created_at)
    VALUES (v_txn_id, p_sender, p_receiver, p_amount, 'completed', p_ref, v_ts);

  -- Return the created transaction details
  RETURN jsonb_build_object(
    'id', v_txn_id,
    'amount', p_amount,
    'created_at', v_ts
  );
END;
$$;

-- Allow anon to call this function (prototype — lock down with auth later)
GRANT EXECUTE ON FUNCTION transfer_payment(text, text, numeric, text) TO anon;
GRANT EXECUTE ON FUNCTION transfer_payment(text, text, numeric, text) TO authenticated;
