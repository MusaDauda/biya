// Proves the provider seam.
//
// Runs the same tool-calling task through every combination named in
// LLM_TEST_MATRIX and checks each one produces the SAME normalised result. If a
// provider only differs in latency and cost, the abstraction is doing its job.
//
//   npm run verify:llm
//
// Test another vendor by adding its key and extending the matrix:
//   LLM_TEST_MATRIX="groq:llama-3.3-70b-versatile,openrouter:meta-llama/llama-3.3-70b-instruct"

import "dotenv/config";
import { resetLLM, getLLM } from "../services/llm/client.ts";
import { PRESETS } from "../services/llm/providers.ts";

const TOOLS = [
  {
    name: "ai_propose_payment",
    description:
      "Propose a payment to another Biya account. This does NOT move money; a human must confirm it with a PIN.",
    parameters: {
      type: "object",
      properties: {
        payee: { type: "string", description: "Name of the person or business to pay" },
        ngn_minor: {
          type: "integer",
          description: "Amount in NGN kobo. 1 naira is 100 kobo, so 1200 naira is 120000.",
        },
        reason: { type: "string", description: "Short reason for the payment" },
      },
      required: ["payee", "ngn_minor"],
    },
  },
  {
    name: "ai_get_balances",
    description: "Read the signed-in user's balances. Takes no arguments.",
    parameters: { type: "object", properties: {}, required: [] },
  },
];

const CASES = [
  {
    label: "picks the write tool and converts naira to kobo",
    prompt: "Send Hauwa 1,200 naira for lunch",
    expectTool: "ai_propose_payment",
    check: (a) => a.ngn_minor === 120000 && /hauwa/i.test(String(a.payee ?? "")),
    describe: (a) => `payee=${a.payee} ngn_minor=${a.ngn_minor}`,
  },
  {
    label: "picks the read tool for a question",
    prompt: "How much money do I have?",
    expectTool: "ai_get_balances",
    check: () => true,
    describe: () => "no arguments",
  },
];

const matrix = (process.env.LLM_TEST_MATRIX ??
  "groq:llama-3.3-70b-versatile,groq:openai/gpt-oss-120b")
  .split(",").map((s) => s.trim()).filter(Boolean);

let failures = 0;
const ok = (label, pass, detail = "") => {
  if (!pass) failures++;
  console.log(`    ${pass ? "PASS" : "FAIL"}  ${label}${detail ? `  ${detail}` : ""}`);
};

console.log("\nProvider presets available:", Object.keys(PRESETS).join(", "), "\n");

for (const entry of matrix) {
  const idx = entry.indexOf(":");
  const provider = entry.slice(0, idx);
  const model = entry.slice(idx + 1);

  // Swap provider purely through the environment, exactly as production does.
  process.env.LLM_PROVIDER = provider;
  process.env.LLM_MODEL = model;
  resetLLM();

  const llm = getLLM();
  console.log(`\n  ${provider} / ${model}`);
  if (!llm) { ok("configured", false, "no key found for this provider"); continue; }

  for (const c of CASES) {
    try {
      const res = await llm.chat({
        messages: [
          {
            role: "system",
            content:
              "You are Biya's assistant. Money is always in minor units: NGN kobo and USD cents. " +
              "Use a tool for every request. Never invent balances.",
          },
          { role: "user", content: c.prompt },
        ],
        tools: TOOLS,
      });

      const call = res.toolCalls[0];
      const right = call?.name === c.expectTool && c.check(call.arguments);
      ok(c.label, right,
         `${res.latencyMs}ms  ${call ? `${call.name}(${c.describe(call.arguments)})` : `no tool call: ${String(res.text).slice(0, 60)}`}`);
    } catch (err) {
      ok(c.label, false, err.message.slice(0, 80));
    }
  }
}

console.log(failures === 0
  ? "\nEvery provider produced the same normalised result.\n"
  : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
