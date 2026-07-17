// Regenerates payload-types.ts. Why not `payload generate:types`? See
// scripts/create-migration.mts — same CLI-bin limitation (ERR_REQUIRE_ASYNC_MODULE
// from richtext-lexical's top-level await, loaded via tsx's CJS require()
// path). This script uses dynamic `import()` throughout instead, calling
// generateTypes() directly (what the CLI calls internally) against a real
// Payload instance's already-sanitized config.
//
// Usage: `npm run generate:types`
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env") as typeof import("@next/env");

loadEnvConfig(process.cwd(), true);

const { getPayload } = await import("payload");
const { generateTypes } = await import("payload/node");
const { default: config } = await import("@payload-config");

const payload = await getPayload({ config, disableOnInit: true });
await generateTypes(payload.config);

// eslint-disable-next-line no-console
console.log("Types generated.");
process.exit(0);
