// Bundles each Vercel function from functions-src/ into a single
// self-contained CommonJS file under api/.
//
// Vercel's own per-file TypeScript compile step for api/*.ts left relative
// imports unresolved at runtime: it does not bundle, and on this project it
// ran the compiled output through Node's native ESM loader, which requires an
// exact, existing file extension for every relative specifier. Extensionless
// or .ts-suffixed imports both failed there for different reasons, and get
// this project's mixed graph is deep enough (api -> services -> services/llm,
// services/agent) that keeping every extension in sync with whatever Vercel's
// loader wants on a given day is not a fight worth refighting.
//
// Bundling here removes the question entirely: esbuild resolves the whole
// graph itself at build time, in this repo, with this project's real
// module resolution, and hands Vercel one flat file per route with nothing
// left to resolve at runtime.

import { build } from "esbuild";
import { fileURLToPath } from "url";
import path from "path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const entries = [
  { in: "functions-src/ai/status.ts", out: "api/ai/status.js" },
  { in: "functions-src/ai/chat.ts", out: "api/ai/chat.js" },
  { in: "functions-src/fx/refresh.ts", out: "api/fx/refresh.js" },
];

for (const entry of entries) {
  await build({
    entryPoints: [path.join(root, entry.in)],
    outfile: path.join(root, entry.out),
    bundle: true,
    platform: "node",
    target: "node20",
    // ESM, not CJS: the project's package.json says "type": "module", and a
    // CJS bundle written as .js under that setting hit Node's module-type
    // detection choosing ESM anyway, which then saw no import/export syntax
    // it recognised and loaded the file as an empty namespace, silently
    // dropping the handler. Emitting real ESM matches what the package
    // actually declares instead of fighting it.
    format: "esm",
    logLevel: "info",
  });
}

console.log(`[bundle-api] wrote ${entries.length} function(s)`);
