// Regenerates app/(payload)/admin/importMap.js so it always matches the
// current config. Payload's admin UI resolves plugin-contributed components
// (e.g. @payloadcms/storage-s3's upload handler) through this generated file;
// if it goes stale after adding/removing a plugin or field, the admin UI
// renders blank with a "PayloadComponent not found in importMap" warning.
//
// Runs as `prebuild` so it's always fresh in CI/deploy. Doesn't touch the
// database — generateImportMap only reads the resolved config.
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env") as typeof import("@next/env");
loadEnvConfig(process.cwd(), true);

const { generateImportMap } = await import("payload");
const { default: configPromise } = await import("@payload-config");
const config = await configPromise;

await generateImportMap(config);
process.exit(0);
