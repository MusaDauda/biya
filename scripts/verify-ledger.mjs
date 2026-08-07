// Verifies the core ledger from the client's point of view.
//
// Deliberately uses the PUBLISHABLE key, not the secret key, so this also
// proves the grants are right: a browser client can read balances and call the
// definer RPCs, but cannot forge a ledger entry.
//
//   node scripts/verify-ledger.mjs

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
}

const db = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)

const sha256 = (s) => createHash('sha256').update(s).digest('hex')
let failures = 0

const ok = (label, pass, detail = '') => {
  if (!pass) failures++
  console.log(`${pass ? '  PASS' : '  FAIL'}  ${label}${detail ? `  ${detail}` : ''}`)
}

console.log('\n1. The balance invariant\n')
{
  const { data, error } = await db.rpc('prove_ledger_invariant')
  if (error) {
    ok('prove_ledger_invariant callable', false, error.message)
  } else {
    for (const row of data) {
      const shouldReject = !row.case_name.includes('control')
      ok(row.case_name, row.rejected === shouldReject,
         row.reason.split('\n')[0].slice(0, 90))
    }
  }
}

console.log('\n2. Account lifecycle\n')
const email = `verify+${Date.now()}@biya.test`
const pin = sha256('123456')
let user = null
{
  const { data, error } = await db.rpc('signup_user', { p_email: email, p_pin_hash: pin })
  user = data
  ok('signup_user creates a user', !error && !!data?.id, error?.message ?? '')
  ok('receive code allocated', /^\d{10}$/.test(data?.receive_code ?? ''), data?.receive_code ?? '')
}
{
  const { error } = await db.rpc('signup_user', { p_email: email, p_pin_hash: pin })
  ok('duplicate email rejected', !!error, error?.message?.slice(0, 60) ?? 'no error raised')
}
{
  const { error } = await db.rpc('login_user', { p_email: email, p_pin_hash: sha256('999999') })
  ok('wrong PIN rejected', !!error, error?.message?.slice(0, 60) ?? 'no error raised')
}
{
  const { data, error } = await db.rpc('login_user', { p_email: email, p_pin_hash: pin })
  ok('correct PIN accepted', !error && data?.id === user?.id, error?.message ?? '')
}

console.log('\n3. Money movement\n')
{
  const { error } = await db.rpc('credit_test_funds', { p_user: user.id, p_usd_minor: 5000 })
  ok('credit_test_funds posts a balanced transaction', !error, error?.message ?? '')
}
{
  const { data } = await db.from('account_balances')
    .select('currency, purpose, balance_minor').eq('user_id', user.id)
  const usd = data?.find((r) => r.currency === 'USD' && r.purpose === 'spendable')
  ok('USD spendable balance is $50.00', usd?.balance_minor === 5000,
     `got ${usd?.balance_minor ?? 'nothing'}`)
  const ngn = data?.find((r) => r.currency === 'NGN' && r.purpose === 'spendable')
  ok('NGN spendable account exists at zero', ngn?.balance_minor === 0,
     `got ${ngn?.balance_minor ?? 'nothing'}`)
}
{
  const { error } = await db.rpc('credit_test_funds', { p_user: user.id, p_usd_minor: -100 })
  ok('negative test credit rejected', !!error, error?.message?.slice(0, 60) ?? 'no error raised')
}

console.log('\n4. The ledger is not client-writable\n')
{
  const { error } = await db.from('ledger_entries').insert({
    txn_id: '00000000-0000-0000-0000-000000000000',
    account_id: '00000000-0000-0000-0000-000000000000',
    currency: 'USD', amount_minor: 1000000,
  })
  ok('direct ledger_entries insert refused', !!error, error?.message?.slice(0, 70) ?? 'INSERT SUCCEEDED')
}
{
  const { error } = await db.from('ledger_transactions').insert({ kind: 'payment', memo: 'forged' })
  ok('direct ledger_transactions insert refused', !!error, error?.message?.slice(0, 70) ?? 'INSERT SUCCEEDED')
}

console.log('\n5. Global integrity\n')
{
  const { data, error } = await db.from('ledger_integrity').select('*')
  if (error) ok('ledger_integrity readable', false, error.message)
  else if (!data.length) ok('ledger has entries', false, 'no entries at all')
  else for (const row of data) {
    ok(`${row.currency} nets to zero across the whole ledger`, row.balanced,
       `net ${row.net_minor} over ${row.entry_count} entries`)
  }
}

console.log(failures === 0
  ? '\nAll checks passed.\n'
  : `\n${failures} check(s) failed.\n`)
process.exit(failures === 0 ? 0 : 1)
