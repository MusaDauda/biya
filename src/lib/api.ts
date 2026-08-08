// The single data-access layer for Biya.
//
// Components import from here and never touch `supabase` directly. Two reasons
// that matter beyond tidiness:
//
//   1. Every amount crossing this boundary is an integer in minor units, USD
//      cents or NGN kobo. Nothing downstream ever sees a float, so nothing
//      downstream can introduce a rounding error.
//   2. Every mutation goes through a security-definer RPC. Clients have no
//      write grant on the ledger at all, so there is no second way to do it.

import { supabase } from "./supabase";
import { hashPassword, hashPin } from "./hash";

export type Me = {
  id: string;
  email: string;
  display_name: string;
  is_business: boolean;
  business_name: string | null;
  autosave_pct: number;
  receive_code: string;
  created_at: string;

  // Onboarding and identity. Everything below is null until the step that
  // fills it, so `onboardingStep` can be derived rather than stored.
  password_hash: string | null;
  email_verified: boolean;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  phone: string | null;
  tag: string | null;
  nin_last4: string | null;
  bvn_last4: string | null;
  street: string | null;
  city: string | null;
  state_name: string | null;
  selfie_done: boolean;
  kyc_tier: number;
  pin_hash: string | null;
};

export type TierLimits = {
  tier: number;
  label: string;
  /** Null means no limit. Cents. */
  sendPerDayMinor: number | null;
  holdMaxMinor: number | null;
  withdrawAllowed: boolean;
};

export type BusinessAccount = {
  id: string;
  ownerId: string;
  name: string;
  tag: string | null;
  receiveCode: string;
  settleBank: string | null;
  settleLast4: string | null;
  settleHour: number;
};

export type Bank = { code: string; name: string; shortName: string };

/** A resolved payee. `found` false carries the reason and never a name. */
export type Resolved =
  | { found: true; userId: string; name: string; kind?: string; receiveCode?: string }
  | { found: false; reason: string };

export type Balances = {
  usdMinor: number;
  ngnMinor: number;
  savedUsdMinor: number;
};

export type ActivityRow = {
  id: string;
  kind: string;
  memo: string | null;
  createdAt: number;
  usdMinor: number; // signed, from this user's point of view
  ngnMinor: number;
  counterparty: string | null;
};

/** Postgres exceptions arrive wrapped. Surface the message the RPC actually raised. */
function fail(error: { message?: string } | null, fallback: string): never {
  const raw = error?.message ?? "";
  // supabase-js prefixes plpgsql RAISE messages; strip the noise but keep the text.
  const cleaned = raw.replace(/^.*?(?:ERROR:\s*)?/, "").trim();
  throw new Error(cleaned || fallback);
}

// ---------------------------------------------------------------------------
// Session. Stored in localStorage: a deliberate demo shortcut, documented in
// the build plan. The ledger is protected by grants, not by this.
// ---------------------------------------------------------------------------

const SESSION_KEY = "biya_user_id";

export function storedUserId(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("biya_role"); // legacy key from the two-app build
}

function remember(user: Me): Me {
  localStorage.setItem(SESSION_KEY, user.id);
  return user;
}

// ---------------------------------------------------------------------------
// Account lifecycle
// ---------------------------------------------------------------------------

export async function signUp(email: string, pin: string): Promise<Me> {
  const { data, error } = await supabase.rpc("signup_user", {
    p_email: email,
    p_pin_hash: await hashPin(pin),
  });
  if (error || !data) fail(error, "Could not create your account.");
  return remember(data as Me);
}

export async function logIn(email: string, pin: string): Promise<Me> {
  const { data, error } = await supabase.rpc("login_user", {
    p_email: email,
    p_pin_hash: await hashPin(pin),
  });
  if (error || !data) fail(error, "Could not sign you in.");
  return remember(data as Me);
}

/** Resolves the stored session. Returns null if the id no longer exists. */
export async function getMe(userId: string): Promise<Me | null> {
  const { data, error } = await supabase
    .from("app_users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as Me;
}

export async function setProfile(
  userId: string,
  displayName: string,
  isBusiness: boolean,
  businessName?: string,
): Promise<Me> {
  const { data, error } = await supabase.rpc("set_profile", {
    p_user: userId,
    p_display_name: displayName,
    p_is_business: isBusiness,
    p_business_name: businessName ?? null,
  });
  if (error || !data) fail(error, "Could not save your profile.");
  return data as Me;
}

export async function setAutosave(userId: string, pct: number): Promise<Me> {
  const { data, error } = await supabase.rpc("set_autosave", {
    p_user: userId,
    p_pct: pct,
  });
  if (error || !data) fail(error, "Could not update auto-save.");
  return data as Me;
}

// ---------------------------------------------------------------------------
// Onboarding and identity
//
// The account exists from the moment the email and password are accepted, and
// each step below fills in one more thing. Nothing here can move money: the PIN
// is set at the last step and every payment still ends there.
// ---------------------------------------------------------------------------

/** Where a part-finished account should resume. Derived, never stored. */
export type OnboardingStep =
  | "verify_email" | "name" | "phone" | "identity" | "address" | "pin" | "tier" | "business" | "done";

export function onboardingStep(u: Me): OnboardingStep {
  if (!u.email_verified) return "verify_email";
  if (!u.first_name) return "name";
  if (!u.tag) return "phone";
  if (!u.nin_last4 && !u.bvn_last4) return "identity";
  if (!u.street) return "address";
  if (!u.pin_hash) return "pin";
  return "done";
}

export async function signUpWithPassword(email: string, password: string): Promise<Me> {
  const { data, error } = await supabase.rpc("signup_with_password", {
    p_email: email.trim(),
    p_password_hash: await hashPassword(password),
  });
  if (error || !data) fail(error, "Could not create your account.");
  return remember(data as Me);
}

export async function logInWithPassword(email: string, password: string): Promise<Me> {
  const { data, error } = await supabase.rpc("login_with_password", {
    p_email: email.trim(),
    p_password_hash: await hashPassword(password),
  });
  if (error || !data) fail(error, "Could not sign you in.");
  return remember(data as Me);
}

/** Issues a fresh six digit code and returns it. */
export async function requestEmailCode(userId: string): Promise<string> {
  const { data, error } = await supabase.rpc("request_email_code", { p_user: userId });
  if (error || !data) fail(error, "Could not send a new code.");
  return data as string;
}

export async function verifyEmailCode(userId: string, code: string): Promise<Me> {
  const { data, error } = await supabase.rpc("verify_email_code", {
    p_user: userId,
    p_code: code.trim(),
  });
  if (error || !data) fail(error, "That code is not right.");
  return data as Me;
}

export async function saveLegalName(
  userId: string, first: string, last: string, dob: string,
): Promise<Me> {
  const { data, error } = await supabase.rpc("save_legal_name", {
    p_user: userId, p_first: first, p_last: last, p_dob: dob,
  });
  if (error || !data) fail(error, "Could not save your name.");
  return data as Me;
}

/** Suggests the tag a phone number would produce, before it is claimed. */
export function suggestTag(firstName: string): string {
  return firstName.toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 20);
}

export async function claimTag(userId: string, phone: string, tag: string): Promise<Me> {
  const { data, error } = await supabase.rpc("claim_tag", {
    p_user: userId, p_phone: phone, p_tag: tag,
  });
  if (error || !data) fail(error, "Could not save your number.");
  return data as Me;
}

export async function submitIdentity(userId: string, kind: "nin" | "bvn", value: string): Promise<Me> {
  const { data, error } = await supabase.rpc("submit_identity", {
    p_user: userId, p_kind: kind, p_number: value,
  });
  if (error || !data) fail(error, "Could not check that number.");
  return data as Me;
}

export async function saveAddress(
  userId: string, street: string, city: string, state: string,
): Promise<Me> {
  const { data, error } = await supabase.rpc("save_address", {
    p_user: userId, p_street: street, p_city: city, p_state: state,
  });
  if (error || !data) fail(error, "Could not save your address.");
  return data as Me;
}

export async function completeSelfie(userId: string): Promise<Me> {
  const { data, error } = await supabase.rpc("complete_selfie", { p_user: userId });
  if (error || !data) fail(error, "Could not finish that step.");
  return data as Me;
}

export async function setTransactionPin(userId: string, pin: string): Promise<Me> {
  const { data, error } = await supabase.rpc("set_transaction_pin", {
    p_user: userId, p_pin_hash: await hashPin(pin),
  });
  if (error || !data) fail(error, "Could not set your PIN.");
  return data as Me;
}

export async function getTierLimits(): Promise<TierLimits[]> {
  const { data, error } = await supabase.from("tier_limits").select("*").order("tier");
  if (error || !data) return [];
  return data.map((r: any) => ({
    tier: r.tier,
    label: r.label,
    sendPerDayMinor: r.send_per_day_minor === null ? null : Number(r.send_per_day_minor),
    holdMaxMinor: r.hold_max_minor === null ? null : Number(r.hold_max_minor),
    withdrawAllowed: Boolean(r.withdraw_allowed),
  }));
}

// ---------------------------------------------------------------------------
// Business contexts
//
// Personal and business sit behind a switch at the top of home. Switching
// changes the home screen and the money being spent. The tabs stay put.
// ---------------------------------------------------------------------------

const CONTEXT_KEY = "biya_context";

/** "personal", or a business account id. */
export function storedContext(): string {
  return localStorage.getItem(CONTEXT_KEY) ?? "personal";
}

export function setStoredContext(id: string): void {
  localStorage.setItem(CONTEXT_KEY, id);
}

function toBusiness(r: any): BusinessAccount {
  return {
    id: r.id,
    ownerId: r.owner_id,
    name: r.name,
    tag: r.tag,
    receiveCode: r.receive_code,
    settleBank: r.settle_bank,
    settleLast4: r.settle_last4,
    settleHour: r.settle_hour,
  };
}

export async function listBusinessAccounts(ownerId: string): Promise<BusinessAccount[]> {
  const { data, error } = await supabase
    .from("business_accounts")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at");
  if (error || !data) return [];
  return data.map(toBusiness);
}

export async function createBusinessAccount(
  ownerId: string, name: string, tag?: string,
): Promise<BusinessAccount> {
  const { data, error } = await supabase.rpc("create_business_account", {
    p_owner: ownerId, p_name: name, p_tag: tag ?? null,
  });
  if (error || !data) fail(error, "Could not create the business account.");
  return toBusiness(data);
}

// ---------------------------------------------------------------------------
// Payee lookup
// ---------------------------------------------------------------------------

export async function listBanks(): Promise<Bank[]> {
  const { data, error } = await supabase.from("banks").select("*").order("name");
  if (error || !data) return [];
  return data.map((r: any) => ({ code: r.code, name: r.name, shortName: r.short_name }));
}

/** Ten digit number to the name behind it. Never returns an invented name. */
export async function resolveAccount(number: string): Promise<Resolved> {
  const { data, error } = await supabase.rpc("resolve_account", { p_number: number });
  if (error || !data) return { found: false, reason: "Could not check that number." };
  const r = data as any;
  return r.found
    ? { found: true, userId: r.user_id, name: r.name, kind: r.kind }
    : { found: false, reason: r.reason };
}

export async function findByTag(tag: string): Promise<Resolved> {
  const { data, error } = await supabase.rpc("find_by_tag", { p_tag: tag });
  if (error || !data) return { found: false, reason: "Could not look that up." };
  const r = data as any;
  return r.found
    ? { found: true, userId: r.user_id, name: r.name, receiveCode: r.receive_code }
    : { found: false, reason: r.reason };
}

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

export async function getBalances(userId: string): Promise<Balances> {
  const { data, error } = await supabase
    .from("account_balances")
    .select("currency, purpose, balance_minor")
    .eq("user_id", userId);

  if (error || !data) return { usdMinor: 0, ngnMinor: 0, savedUsdMinor: 0 };

  const pick = (currency: string, purpose: string) =>
    Number(
      data.find((r: any) => r.currency === currency && r.purpose === purpose)
        ?.balance_minor ?? 0,
    );

  return {
    usdMinor: pick("USD", "spendable"),
    ngnMinor: pick("NGN", "spendable"),
    savedUsdMinor: data
      .filter((r: any) => r.purpose === "savings_goal" && r.currency === "USD")
      .reduce((sum: number, r: any) => sum + Number(r.balance_minor), 0),
  };
}

export async function listActivity(userId: string, limit = 50): Promise<ActivityRow[]> {
  const { data, error } = await supabase
    .from("v_user_activity")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((r: any) => ({
    id: r.id,
    kind: r.kind,
    memo: r.memo,
    createdAt: new Date(r.created_at).getTime(),
    usdMinor: Number(r.usd_minor),
    ngnMinor: Number(r.ngn_minor),
    counterparty: r.counterparty,
  }));
}

/** Sales received, for Business mode. Only transactions where naira came in. */
export async function listSales(userId: string, limit = 50): Promise<ActivityRow[]> {
  const rows = await listActivity(userId, limit);
  return rows.filter((r) => r.ngnMinor > 0);
}

export async function findUserByCode(code: string): Promise<Me | null> {
  const digits = code.replace(/\D/g, "");
  if (digits.length !== 10) return null;

  // 1. Try personal account
  const { data: personal } = await supabase
    .from("app_users")
    .select("*")
    .eq("receive_code", digits)
    .maybeSingle();
  if (personal) return personal as Me;

  // 2. Try business account — return the owner's profile with business name
  const { data: biz } = await supabase
    .from("business_accounts")
    .select("owner_id, name")
    .eq("receive_code", digits)
    .maybeSingle();
  if (!biz) return null;

  const { data: owner } = await supabase
    .from("app_users")
    .select("*")
    .eq("id", biz.owner_id)
    .single();
  if (!owner) return null;

  return { ...owner, business_name: biz.name } as Me;
}

export async function creditTestFunds(userId: string, usdMinor: number): Promise<void> {
  const { error } = await supabase.rpc("credit_test_funds", {
    p_user: userId,
    p_usd_minor: usdMinor,
  });
  if (error) fail(error, "Could not add test funds.");
}

// ---------------------------------------------------------------------------
// Quoting and payment
// ---------------------------------------------------------------------------

export type Quote = {
  id: string;
  payerId: string;
  payeeId: string;
  /** Naira the payee receives, in kobo. */
  ngnMinor: number;
  /** Dollars the payer spends, in cents. Always >= ngnMinor / mid. */
  usdMinor: number;
  /** Our margin, in cents. Shown as its own line, never folded into the rate. */
  feeUsdMinor: number;
  /** The unmargined market mid, for display. */
  mid: number;
  /** What the payer actually got, after margin. */
  rate: number;
  rateType: string;
  expiresAt: number;
};

function toQuote(row: any): Quote {
  return {
    id: row.id,
    payerId: row.payer_id,
    payeeId: row.payee_id,
    ngnMinor: Number(row.ngn_minor),
    usdMinor: Number(row.usd_minor),
    feeUsdMinor: Number(row.fee_usd_minor),
    mid: Number(row.mid),
    rate: Number(row.rate),
    rateType: row.rate_type,
    expiresAt: new Date(row.expires_at).getTime(),
  };
}

// Nothing on Vercel polls fx_rates in the background the way the standalone
// `services` process did (see SERVICES_URL above), so a rate written once
// would age past create_fx_quote's one hour staleness window and every quote
// after that would be refused. Asking for a refresh here, right before the
// quote it gates, means freshness never depends on a process staying alive.
// Best effort: if this fails or times out, create_fx_quote still runs against
// whatever rate is already on file and refuses on its own terms if that is
// too old.
async function ensureFreshRate(): Promise<void> {
  try {
    await fetch(`${SERVICES_URL}/fx/refresh`, { method: "POST", signal: AbortSignal.timeout(6000) });
  } catch {
    // Ignored. See comment above.
  }
}

export async function createQuote(payerId: string, payeeId: string, ngnMinor: number): Promise<Quote> {
  await ensureFreshRate();
  const { data, error } = await supabase.rpc("create_fx_quote", {
    p_payer: payerId,
    p_payee: payeeId,
    p_ngn_minor: ngnMinor,
  });
  if (error || !data) fail(error, "Could not get a rate right now.");
  return toQuote(data);
}

export type PaymentResult = { txnId: string; usdMinor: number; ngnMinor: number };

export async function executePayment(quoteId: string, pin: string): Promise<PaymentResult> {
  const { data, error } = await supabase.rpc("execute_payment", {
    p_quote: quoteId,
    p_pin_hash: await hashPin(pin),
  });
  if (error || !data) fail(error, "Could not complete the payment.");
  return {
    txnId: data.txn_id,
    usdMinor: Number(data.usd_minor),
    ngnMinor: Number(data.ngn_minor),
  };
}

export type FxSnapshot = {
  mid: number;
  effectiveRate: number;
  source: string;
  rateType: string;
  isFresh: boolean;
  fetchedAt: number;
};

export async function getCurrentFx(): Promise<FxSnapshot | null> {
  const { data, error } = await supabase.from("current_fx").select("*").maybeSingle();
  if (error || !data?.mid) return null;
  return {
    mid: Number(data.mid),
    effectiveRate: Number(data.effective_rate),
    source: data.source,
    rateType: data.rate_type,
    isFresh: Boolean(data.is_fresh),
    fetchedAt: new Date(data.fetched_at).getTime(),
  };
}

// ---------------------------------------------------------------------------
// Goals. Auto-save appends to the same transaction as a payment (Phase 5), so
// there is nothing to trigger here. This is just reading and the two actions
// a user takes: create a goal, and move saved dollars back to spendable.
// ---------------------------------------------------------------------------

export type Goal = { id: string; name: string; targetNgnMinor: number; savedUsdMinor: number };

export async function getGoal(userId: string): Promise<Goal | null> {
  const { data, error } = await supabase
    .from("savings_goals")
    .select("id, name, target_ngn_minor")
    .eq("user_id", userId)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;

  const { data: bal } = await supabase
    .from("account_balances")
    .select("balance_minor")
    .eq("goal_id", data.id)
    .maybeSingle();

  return {
    id: data.id,
    name: data.name,
    targetNgnMinor: Number(data.target_ngn_minor),
    savedUsdMinor: Number(bal?.balance_minor ?? 0),
  };
}

export async function createGoal(userId: string, name: string, targetNgnMinor: number): Promise<Goal> {
  const { data, error } = await supabase.rpc("create_savings_goal", {
    p_user: userId, p_name: name, p_target_ngn_minor: targetNgnMinor,
  });
  if (error || !data) fail(error, "Could not create that goal.");
  return { id: data.id, name: data.name, targetNgnMinor: Number(data.target_ngn_minor), savedUsdMinor: 0 };
}

export async function releaseGoalFunds(goalId: string, usdMinor: number): Promise<void> {
  const { error } = await supabase.rpc("release_goal_funds", { p_goal: goalId, p_usd_minor: usdMinor });
  if (error) fail(error, "Could not move that money.");
}

// ---------------------------------------------------------------------------
// Mandates. A standing spend authorisation with four bounds: amount per run,
// a per-run ceiling, a lifetime total, and an expiry. Creating one spends a
// PIN once; running it afterward needs none, because that PIN already
// authorised exactly this. Revoking is immediate.
// ---------------------------------------------------------------------------

export type MandateStatus = "active" | "revoked" | "exhausted";

export type Mandate = {
  id: string;
  payeeId: string;
  payeeName: string;
  amountNgnMinor: number;
  maxPerRunNgnMinor: number;
  maxTotalNgnMinor: number;
  spentTotalNgnMinor: number;
  status: MandateStatus;
  reason: string | null;
  expiresAt: number;
  createdAt: number;
};

function toMandate(row: any): Mandate {
  return {
    id: row.id,
    payeeId: row.payee_id,
    payeeName: row.payee_name ?? "",
    amountNgnMinor: Number(row.amount_ngn_minor),
    maxPerRunNgnMinor: Number(row.max_per_run_ngn_minor),
    maxTotalNgnMinor: Number(row.max_total_ngn_minor),
    spentTotalNgnMinor: Number(row.spent_total_ngn_minor),
    status: row.status,
    reason: row.reason,
    expiresAt: new Date(row.expires_at).getTime(),
    createdAt: new Date(row.created_at).getTime(),
  };
}

export async function listMandates(userId: string): Promise<Mandate[]> {
  const { data, error } = await supabase
    .from("mandates")
    .select("*, payee:payee_id(display_name, business_name, email)")
    .eq("payer_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row: any) =>
    toMandate({ ...row, payee_name: nameOf(row.payee ?? { display_name: "", business_name: null, email: "" }) }),
  );
}

export async function createMandate(
  payerId: string,
  pin: string,
  payeeId: string,
  amountNgnMinor: number,
  maxPerRunNgnMinor: number,
  maxTotalNgnMinor: number,
  expiresAt: Date,
  reason?: string,
): Promise<Mandate> {
  const { data, error } = await supabase.rpc("create_mandate", {
    p_payer: payerId,
    p_pin_hash: await hashPin(pin),
    p_payee: payeeId,
    p_amount_ngn_minor: amountNgnMinor,
    p_max_per_run_ngn_minor: maxPerRunNgnMinor,
    p_max_total_ngn_minor: maxTotalNgnMinor,
    p_expires_at: expiresAt.toISOString(),
    p_reason: reason ?? null,
  });
  if (error || !data) fail(error, "Could not create that mandate.");
  return toMandate(data);
}

export async function revokeMandate(mandateId: string): Promise<void> {
  const { error } = await supabase.rpc("revoke_mandate", { p_mandate: mandateId });
  if (error) fail(error, "Could not revoke that mandate.");
}

export type MandateRunResult =
  | { ok: true; txnId: string; usdMinor: number; ngnMinor: number; autosaveUsdMinor: number }
  | { ok: false; reason: string };

/** The "Run now" demo control. A real cadence would call the same RPC from pg_cron. */
export async function runMandate(mandateId: string): Promise<MandateRunResult> {
  const { data, error } = await supabase.rpc("execute_mandate", { p_mandate: mandateId });
  if (error) fail(error, "Could not run that mandate.");
  if (data.ok === false) return { ok: false, reason: data.reason };
  return {
    ok: true,
    txnId: data.txn_id,
    usdMinor: Number(data.usd_minor),
    ngnMinor: Number(data.ngn_minor),
    autosaveUsdMinor: Number(data.autosave_usd_minor ?? 0),
  };
}

// ---------------------------------------------------------------------------
// The assistant.
//
// Chat goes through the services process, never straight to a provider: the key
// would otherwise be in the bundle. Everything the assistant can DO is a
// Postgres function, so this file only carries messages back and forth.
// ---------------------------------------------------------------------------

// In dev, `npm run services` runs the standalone Hono process on :8787. In a
// Vercel deploy there is no such process; `/api` resolves to the serverless
// functions in api/ai/*.ts instead, on the same origin as the static build.
const SERVICES_URL =
  import.meta.env.VITE_SERVICES_URL ?? (import.meta.env.DEV ? "http://localhost:8787" : "/api");

export type Proposal = {
  proposalId: string;
  payeeId: string;
  payeeName: string;
  ngnMinor: number;
  reason: string | null;
};

export type AgentReply = {
  text: string;
  proposals: Proposal[];
  steps: { tool: string; authorizedBy: string; ok: boolean }[];
  sessionId: string;
  provider: string;
  model: string;
};

export type AgentTurn = { role: "user" | "assistant"; content: string };

export async function askAssistant(
  userId: string,
  message: string,
  sessionId?: string,
  history: AgentTurn[] = [],
): Promise<AgentReply> {
  let res: Response;
  try {
    res = await fetch(`${SERVICES_URL}/ai/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId, message, sessionId, history }),
    });
  } catch {
    throw new Error("Can't reach the assistant. Everything else still works.");
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error ?? "The assistant could not answer.");

  return {
    text: body.text,
    proposals: (body.proposals ?? []).map((p: any) => ({
      proposalId: p.proposal_id,
      payeeId: p.payee_id,
      payeeName: p.payee_name,
      ngnMinor: Number(p.ngn_minor),
      reason: p.reason ?? null,
    })),
    steps: body.steps ?? [],
    sessionId: body.sessionId,
    provider: body.provider,
    model: body.model,
  };
}

export async function assistantStatus(): Promise<{ configured: boolean; model: string | null }> {
  try {
    const res = await fetch(`${SERVICES_URL}/ai/status`);
    if (!res.ok) return { configured: false, model: null };
    const body = await res.json();
    return { configured: Boolean(body.configured), model: body.model ?? null };
  } catch {
    return { configured: false, model: null };
  }
}

/**
 * Turns a proposal into a real quote. The rate is fetched at this moment, not
 * when the assistant made the proposal, so the 90 second window starts with a
 * human looking at it.
 */
export async function quoteProposal(proposalId: string): Promise<Quote> {
  const { data, error } = await supabase.rpc("quote_proposal", { p_proposal: proposalId });
  if (error || !data) fail(error, "Could not get a rate for that request.");
  return toQuote(data);
}

export async function resolveProposal(
  proposalId: string,
  status: "confirmed" | "rejected",
): Promise<void> {
  const { error } = await supabase.rpc("resolve_proposal", {
    p_proposal: proposalId,
    p_status: status,
  });
  if (error) fail(error, "Could not update that request.");
}

export type AgentAction = {
  id: string;
  tool: string;
  authorizedBy: string;
  error: string | null;
  createdAt: number;
};

/** The audit log, read-only, for the viewer in Profile. */
export async function listAgentActions(userId: string, limit = 50): Promise<AgentAction[]> {
  const { data: sessions } = await supabase
    .from("agent_sessions")
    .select("id")
    .eq("user_id", userId);
  const ids = (sessions ?? []).map((s: any) => s.id);
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from("agent_actions")
    .select("id, tool_name, authorized_by, error, created_at")
    .in("session_id", ids)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id,
    tool: r.tool_name,
    authorizedBy: r.authorized_by,
    error: r.error,
    createdAt: new Date(r.created_at).getTime(),
  }));
}

/** Display name for any user record, falling back sensibly. */
export function nameOf(user: Pick<Me, "business_name" | "display_name" | "email">): string {
  return user.business_name?.trim() || user.display_name?.trim() || user.email.split("@")[0];
}

/**
 * The person, never the business they run. Profile and anywhere the account
 * holder is being identified rather than the shop they trade as.
 */
export function personName(user: Pick<Me, "display_name" | "email">): string {
  return user.display_name?.trim() || user.email.split("@")[0];
}
