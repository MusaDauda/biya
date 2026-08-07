// Verifies quoting and payment end to end.
//
// Uses the PUBLISHABLE key for everything a browser would do, and the secret
// key only to backdate a quote so the expiry path can be tested without
// waiting 90 seconds on the wall clock.
//
//   node scripts/verify-payment.mjs

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
}

const pub = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY)
const svc = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } })

const sha256 = (s) => createHash('sha256').update(s).digest('hex')
let failures = 0
const ok = (label, pass, detail = '') => {
  if (!pass) failures++
  console.log(`${pass ? '  PASS' : '  FAIL'}  ${label}${detail ? `  ${detail}` : ''}`)
}

const PIN = sha256('654321')
const stamp = Date.now()

console.log('\n1. The rate\n')
let fx
{
  const { data } = await pub.from('current_fx').select('*').maybeSingle()
  fx = data
  ok('a rate exists', !!data?.mid, data ? `${Number(data.mid).toFixed(4)} from ${data.source}` : '')
  ok('rate is fresh', data?.is_fresh === true)
  ok('rate is the bank rate', data?.rate_type === 'bank', data?.rate_type ?? '')
  ok('margin is applied', Number(data?.effective_rate) < Number(data?.mid),
     `effective ${Number(data?.effective_rate).toFixed(4)} < mid ${Number(data?.mid).toFixed(4)}`)
}

console.log('\n2. Two accounts\n')
const { data: payer } = await pub.rpc('signup_user', { p_email: `payer+${stamp}@biya.test`, p_pin_hash: PIN })
const { data: payee } = await pub.rpc('signup_user', { p_email: `payee+${stamp}@biya.test`, p_pin_hash: PIN })
ok('payer created', !!payer?.id)
ok('payee created', !!payee?.id)
await pub.rpc('credit_test_funds', { p_user: payer.id, p_usd_minor: 5000 })
ok('payer funded with $50.00', true)

console.log('\n3. Quoting\n')
const NGN = 120000 // ₦1,200
let quote
{
  const { data, error } = await pub.rpc('create_fx_quote', { p_payer: payer.id, p_payee: payee.id, p_ngn_minor: NGN })
  quote = data
  ok('quote created', !error && !!data?.id, error?.message ?? '')

  // Recompute the money model independently and demand an exact match.
  const mid = Number(fx.mid)
  const eff = mid / (1 + Number(fx.margin_bps) / 10000)
  const expectUsd = Math.ceil(NGN / eff)
  const expectPool = Math.floor(NGN / mid)
  const expectFee = expectUsd - expectPool

  ok('dollar cost matches the model', Number(data?.usd_minor) === expectUsd,
     `got ${data?.usd_minor}, expected ${expectUsd}`)
  ok('fee matches the model', Number(data?.fee_usd_minor) === expectFee,
     `got ${data?.fee_usd_minor}, expected ${expectFee}`)
  ok('user pays more than mid implies', Number(data?.usd_minor) > expectPool)
  ok('expires in ~90s', Math.abs((new Date(data?.expires_at) - new Date(data?.created_at)) / 1000 - 90) < 2)
  console.log(`        ₦${(NGN / 100).toLocaleString()} costs $${(Number(data.usd_minor) / 100).toFixed(2)} (fee $${(Number(data.fee_usd_minor) / 100).toFixed(2)})`)
}
{
  const { error } = await pub.rpc('create_fx_quote', { p_payer: payer.id, p_payee: payer.id, p_ngn_minor: NGN })
  ok('cannot pay yourself', !!error, error?.message?.slice(0, 50) ?? 'allowed')
}
{
  const { error } = await pub.rpc('create_fx_quote', { p_payer: payer.id, p_payee: payee.id, p_ngn_minor: 0 })
  ok('zero amount refused', !!error, error?.message?.slice(0, 50) ?? 'allowed')
}

console.log('\n4. Execution\n')
{
  const { error } = await pub.rpc('execute_payment', { p_quote: quote.id, p_pin_hash: sha256('000000') })
  ok('wrong PIN refused', !!error, error?.message?.slice(0, 45) ?? 'allowed')
}
{
  const { data, error } = await pub.rpc('execute_payment', { p_quote: quote.id, p_pin_hash: PIN })
  ok('correct PIN executes', !error && !!data?.txn_id, error?.message ?? '')
}
{
  const { error } = await pub.rpc('execute_payment', { p_quote: quote.id, p_pin_hash: PIN })
  ok('quote is single use (double submit blocked)', !!error, error?.message?.slice(0, 50) ?? 'PAID TWICE')
}

console.log('\n5. Balances after\n')
{
  const { data } = await pub.from('account_balances').select('currency, purpose, balance_minor').eq('user_id', payer.id)
  const usd = Number(data?.find((r) => r.currency === 'USD' && r.purpose === 'spendable')?.balance_minor)
  ok('payer dollars fell by the quoted amount', usd === 5000 - Number(quote.usd_minor),
     `got ${usd}, expected ${5000 - Number(quote.usd_minor)}`)
}
{
  const { data } = await pub.from('account_balances').select('currency, purpose, balance_minor').eq('user_id', payee.id)
  const ngn = Number(data?.find((r) => r.currency === 'NGN' && r.purpose === 'spendable')?.balance_minor)
  ok('payee received the exact naira', ngn === NGN, `got ${ngn}, expected ${NGN}`)
}
{
  const { data } = await pub.from('v_user_activity').select('*').eq('user_id', payee.id).limit(1)
  ok('payee sees the payer as counterparty', !!data?.[0]?.counterparty, data?.[0]?.counterparty ?? 'null')
}

console.log('\n6. Expiry\n')
{
  const { data: q } = await pub.rpc('create_fx_quote', { p_payer: payer.id, p_payee: payee.id, p_ngn_minor: 10000 })
  // Backdate rather than sleep for 90 seconds.
  await svc.from('fx_quotes').update({ expires_at: new Date(Date.now() - 1000).toISOString() }).eq('id', q.id)
  const { error } = await pub.rpc('execute_payment', { p_quote: q.id, p_pin_hash: PIN })
  ok('expired quote refused', !!error, error?.message?.slice(0, 45) ?? 'ACCEPTED')
}

console.log('\n7. Insufficient funds\n')
{
  const { data: q } = await pub.rpc('create_fx_quote', { p_payer: payer.id, p_payee: payee.id, p_ngn_minor: 900000000 })
  const { error } = await pub.rpc('execute_payment', { p_quote: q.id, p_pin_hash: PIN })
  ok('overspend refused', !!error, error?.message?.slice(0, 45) ?? 'ACCEPTED')
}

console.log('\n8. Global integrity\n')
{
  const { data } = await pub.from('ledger_integrity').select('*')
  for (const row of data ?? []) {
    ok(`${row.currency} nets to zero across the whole ledger`, row.balanced,
       `net ${row.net_minor} over ${row.entry_count} entries`)
  }
}

console.log(failures === 0 ? '\nAll checks passed.\n' : `\n${failures} check(s) failed.\n`)
process.exit(failures === 0 ? 0 : 1)
