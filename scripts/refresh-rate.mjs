// One-shot rate fetch. Use when you want a fresh rate in the database without
// keeping the services process running.
//
//   npm run fx

import "dotenv/config";
import { refreshRate } from "../services/fx.ts";

const reading = await refreshRate();
process.exit(reading ? 0 : 1);
