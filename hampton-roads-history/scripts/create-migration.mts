// Generates a new Payload migration file. Why not `payload migrate:create`?
// patches/payload+3.86.0.patch now fixes bin/loadEnv.js's @next/env import,
// but the CLI bin itself still loads payload.config.ts via a CJS require()
// path (through tsx's register hook) that can't handle the top-level await
// inside @payloadcms/richtext-lexical — ERR_REQUIRE_ASYNC_MODULE. This
// script sidesteps that entirely by using dynamic `import()` throughout
// (same approach as scripts/migrate.mts), and calls
// payload.db.createMigration() directly — what the CLI calls internally.
//
// Usage: `npm run migrate:create -- some_migration_name`
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env") as typeof import("@next/env");

loadEnvConfig(process.cwd(), true);

const { getPayload } = await import("payload");
const { default: config } = await import("@payload-config");

const payload = await getPayload({ config, disableOnInit: true });
const migrationName = process.argv[2] || "migration";
await payload.db.createMigration({ migrationName, payload });

// eslint-disable-next-line no-console
console.log("Migration file generated.");
process.exit(0);
