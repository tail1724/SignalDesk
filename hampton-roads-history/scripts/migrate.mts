// Runs pending Payload migrations against DATABASE_URI.
//
// Why not `payload migrate`? Payload 3.86's CLI bin trips over Node 22 ESM
// loading (top-level await in richtext-lexical + a default-import of @next/env).
// This script drives the same adapter API directly, loading the config as ESM
// so both issues are avoided. The @next/env default-import is separately fixed
// by patches/payload+3.86.0.patch (applied via the postinstall hook).
//
// Usage: `npm run migrate` (locally uses .env.local; in deploy the platform
// injects DATABASE_URI / PAYLOAD_SECRET as real env vars).
import { createRequire } from "node:module";

// @next/env is a CJS bundle whose named exports aren't statically detectable
// under an ESM loader, so pull it in via require.
const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env") as typeof import("@next/env");

loadEnvConfig(process.cwd(), true);

const { getPayload } = await import("payload");
const { default: config } = await import("@payload-config");

const payload = await getPayload({ config, disableOnInit: true });
await payload.db.migrate();

// eslint-disable-next-line no-console
console.log("Payload migrations complete.");
process.exit(0);
