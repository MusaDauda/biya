// Proves the onboarding, tag and context migration landed and behaves.
//
// Runs against the linked project with the service key, then repeats the client
// facing calls with the publishable key so a grant that was forgotten shows up
// here rather than in the browser on stage.
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const publishable = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !secret || !publishable) {
  console.error("Missing SUPABASE_URL, SUPABASE_SECRET_KEY or VITE_SUPABASE_PUBLISHABLE_KEY");
  process.exit(1);
}

const admin = createClient(url, secret, { auth: { persistSession: false } });
const anon = createClient(url, publishable, { auth: { persistSession: false } });

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = "") => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? `  ${detail}` : ""}`); }
};

const stamp = Date.now();
const email = `kyc.${stamp}@biya.test`;
const hash = "a".repeat(64);

console.log("\nOnboarding, tags and contexts\n");

// --- schema ---------------------------------------------------------------
const { data: tiers } = await admin.from("tier_limits").select("*").order("tier");
ok("tier_limits seeded with three bands", (tiers?.length ?? 0) === 3);
ok("Tier 2 has no hold ceiling", tiers?.find((t) => t.tier === 2)?.hold_max_minor === null);

const { data: bankRows } = await admin.from("banks").select("code").limit(50);
ok("banks reference data seeded", (bankRows?.length ?? 0) >= 20);

// --- signup ---------------------------------------------------------------
const { data: user, error: signupErr } = await anon.rpc("signup_with_password", {
  p_email: email, p_password_hash: hash,
});
ok("signup_with_password reachable from the client key", !signupErr, signupErr?.message ?? "");
if (!user) { console.log("\nCannot continue without a user.\n"); process.exit(1); }
const uid = user.id;

ok("new account starts unverified", user.email_verified === false);
ok("new account starts at tier 0", user.kyc_tier === 0);
ok("new account has a receive code", /^\d{10}$/.test(user.receive_code ?? ""));

const { error: dupErr } = await anon.rpc("signup_with_password", { p_email: email, p_password_hash: hash });
ok("duplicate email refused", !!dupErr);

// --- email verification ---------------------------------------------------
const { data: badVerify } = await anon.rpc("verify_email_code", { p_user: uid, p_code: "000000" })
  .then((r) => ({ data: r.error ? null : r.data }));
ok("wrong email code refused", badVerify === null);

const { data: code } = await anon.rpc("request_email_code", { p_user: uid });
ok("request_email_code returns six digits", /^\d{6}$/.test(code ?? ""));

const { data: verified, error: verifyErr } = await anon.rpc("verify_email_code", { p_user: uid, p_code: code });
ok("right email code verifies", !verifyErr && verified?.email_verified === true, verifyErr?.message ?? "");

const { data: codeRows } = await anon.from("email_codes").select("*");
ok("email_codes is not readable by the client key", (codeRows?.length ?? 0) === 0);

// --- legal name -----------------------------------------------------------
const { error: youngErr } = await anon.rpc("save_legal_name", {
  p_user: uid, p_first: "Hauwa", p_last: "Abdullahi", p_dob: "2020-01-01",
});
ok("under age refused", !!youngErr);

const { data: named } = await anon.rpc("save_legal_name", {
  p_user: uid, p_first: "Hauwa", p_last: "Abdullahi", p_dob: "2001-03-14",
});
ok("legal name sets the display name", named?.display_name === "Hauwa Abdullahi");

// --- tag ------------------------------------------------------------------
const tag = `hauwa${stamp}`;
const { data: tagged, error: tagErr } = await anon.rpc("claim_tag", {
  p_user: uid, p_phone: "0803 412 7788", p_tag: tag,
});
ok("tag claimed with the phone number", !tagErr && tagged?.tag === tag.toLowerCase(), tagErr?.message ?? "");
ok("phone stored as digits only", tagged?.phone === "08034127788");

const { data: other } = await anon.rpc("signup_with_password", {
  p_email: `other.${stamp}@biya.test`, p_password_hash: hash,
});
const { error: takenErr } = await anon.rpc("claim_tag", {
  p_user: other.id, p_phone: "0801 111 2222", p_tag: tag,
});
ok("a taken tag is refused", !!takenErr);

// --- identity -------------------------------------------------------------
const { error: shortErr } = await anon.rpc("submit_identity", { p_user: uid, p_kind: "nin", p_number: "123" });
ok("an 11 digit check is enforced", !!shortErr);

const { data: tier1 } = await anon.rpc("submit_identity", { p_user: uid, p_kind: "nin", p_number: "12345678901" });
ok("identity moves the account to tier 1", tier1?.kyc_tier === 1);
ok("only the last four digits are kept", tier1?.nin_last4 === "8901");

// --- address and selfie ---------------------------------------------------
const { data: addressed } = await anon.rpc("save_address", {
  p_user: uid, p_street: "12 Ahmadu Bello Way", p_city: "Kaduna", p_state: "Kaduna",
});
ok("address saved without changing the tier", addressed?.kyc_tier === 1);

const { data: tier2 } = await anon.rpc("complete_selfie", { p_user: uid });
ok("address plus selfie unlocks tier 2", tier2?.kyc_tier === 2);

// --- PIN ------------------------------------------------------------------
const { data: pinned } = await anon.rpc("set_transaction_pin", { p_user: uid, p_pin_hash: "b".repeat(64) });
ok("transaction PIN set", !!pinned?.id);

// --- login ----------------------------------------------------------------
const { data: loggedIn, error: loginErr } = await anon.rpc("login_with_password", {
  p_email: email, p_password_hash: hash,
});
ok("login with the right password", !loginErr && loggedIn?.id === uid);
const { error: wrongPw } = await anon.rpc("login_with_password", { p_email: email, p_password_hash: "c".repeat(64) });
ok("login with the wrong password refused", !!wrongPw);

// --- business context -----------------------------------------------------
const { data: biz, error: bizErr } = await anon.rpc("create_business_account", {
  p_owner: uid, p_name: "Sabon Gari Stores", p_tag: null,
});
ok("business account created", !bizErr && !!biz?.id, bizErr?.message ?? "");
ok("business gets its own receive code", /^\d{10}$/.test(biz?.receive_code ?? ""));
ok("business receive code differs from the personal one", biz?.receive_code !== user.receive_code);

const { data: afterBiz } = await admin.from("app_users").select("is_business").eq("id", uid).single();
ok("owner flips to business", afterBiz?.is_business === true);

// --- lookups --------------------------------------------------------------
const { data: resolved } = await anon.rpc("resolve_account", { p_number: user.receive_code });
ok("resolve_account finds a Biya number", resolved?.found === true && resolved?.name === "HAUWA ABDULLAHI");

const { data: unknown } = await anon.rpc("resolve_account", { p_number: "9999999999" });
ok("an unknown number returns not found, never a made up name", unknown?.found === false);

const { data: shortNum } = await anon.rpc("resolve_account", { p_number: "12345" });
ok("a short number is rejected", shortNum?.found === false);

const { data: byTag } = await anon.rpc("find_by_tag", { p_tag: tag });
ok("find_by_tag resolves the personal tag", byTag?.found === true && byTag?.user_id === uid);

const { data: bizTag } = await anon.rpc("find_by_tag", { p_tag: biz.tag });
ok("find_by_tag resolves a business tag to its owner", bizTag?.found === true && bizTag?.user_id === uid);

const { data: noTag } = await anon.rpc("find_by_tag", { p_tag: "nobodyhasthis" });
ok("an unused tag returns not found", noTag?.found === false);

// --- the ledger is still sealed ------------------------------------------
const { error: postErr } = await anon.rpc("post_transaction", {
  p_kind: "payment", p_external_ref: null, p_memo: "x", p_metadata: {}, p_legs: [],
});
ok("post_transaction still denied to the client key", !!postErr);

// --- cleanup --------------------------------------------------------------
await admin.from("app_users").delete().in("id", [uid, other.id]);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
