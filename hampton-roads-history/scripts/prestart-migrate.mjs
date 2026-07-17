// Safety net: run pending Payload migrations before `next start` boots.
//
// This is the repo-only half of the deploy-time migration story. The primary
// mechanism is the PRE_DEPLOY job in .do/app.yaml (runs once per deploy, aborts
// the deploy cleanly on failure). This prestart hook guarantees migrations also
// run if that job is ever missing from the live app's spec — which is exactly
// how prod drifted two migrations behind the code (see git history).
//
// It is deliberately gated so it only fires on the real server, never during
// local `npm start` or the Playwright E2E webServer (`npm run build && npm run
// start`), which would otherwise migrate whatever DATABASE_URI happened to be
// set:
//   - runs only when NODE_ENV=production (the DO web service sets this; local
//     and CI E2E do not at prestart time)
//   - set SKIP_START_MIGRATIONS=true to opt out (e.g. once the PRE_DEPLOY job
//     is confirmed on the live app and you'd rather not run migrate twice)
//
// migrate is idempotent (tracked in payload_migrations), so a no-op run when
// there's nothing pending is fast and harmless. A genuine migration failure
// exits non-zero, so the container fails its health check and DO keeps the
// previous healthy deployment serving instead of shifting traffic to a broken
// build.
import { spawnSync } from "node:child_process";

if (process.env.NODE_ENV !== "production") {
  console.log("prestart: NODE_ENV is not 'production' — skipping migrations.");
  process.exit(0);
}

if (process.env.SKIP_START_MIGRATIONS === "true") {
  console.log("prestart: SKIP_START_MIGRATIONS=true — skipping migrations.");
  process.exit(0);
}

console.log("prestart: running pending Payload migrations…");
const result = spawnSync("npm", ["run", "migrate"], { stdio: "inherit" });

if (result.error) {
  console.error("prestart: failed to launch migrate —", result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
