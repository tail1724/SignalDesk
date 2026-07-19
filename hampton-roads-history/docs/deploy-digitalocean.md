# Deploy runbook — SignalDesk + Hunt's Pointe on DigitalOcean

Epic D of the VaporNet Americana plan. This is the operator runbook; it does not
deploy anything by itself. Two hosting shapes are supported:

- **App Platform (primary, in-repo).** `.do/app.yaml` defines the SignalDesk web
  service and a `PRE_DEPLOY` migrate job. This is what the repo is wired for.
- **Coolify on a DO droplet (plan §10).** Same app image; adds the Traefik
  rate-limit layer in `coolify/traefik-middleware.yml`. Use this if you want the
  droplet/Traefik topology the plan describes.

Everything below (env, migrations, scheduled jobs, Hunt's Pointe, smoke tests)
applies to both; platform-specific steps are called out.

---

## 1. SignalDesk service

**App Platform:** create the app from `.do/app.yaml`, then fill every `SECRET`
value in the dashboard (they are blank in the spec on purpose). See the "Apply to
the live app" note at the bottom of that file — pull the live spec and merge,
never push `.do/app.yaml` directly (it would blank the live secrets).

**Coolify:** new app from the `hampton-roads-history/` subdir.
- Build: `npm ci && npm run build`
- Start: `npm run start`
- Health check: `/api/health`
- Node 22.

### Environment variables

| Var | Secret | Time | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | no | build+run | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | build+run | anon key (RLS-enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | run | retention + ad aggregation; bypasses RLS |
| `NEXT_PUBLIC_SITE_URL` | no | build+run | canonical origin |
| `DATABASE_URI` | yes | build+run | Payload Postgres (session pooler `:5432`, **not** `:6543`) |
| `PAYLOAD_SECRET` | yes | build+run | |
| `AD_HMAC_SECRET` | yes | run | signs ad tokens (`lib/ads.ts`) |
| `WEBHOOK_SECRET` | yes | run | **must equal** Hunt's Pointe `SIGNALDESK_WEBHOOK_SECRET` |
| `RESEND_API_KEY` | yes | run | transactional email |
| `NEWSLETTER_FROM_EMAIL` / `CORRECTIONS_EMAIL` | no | run | verified sender / review inbox |
| `SUPABASE_S3_ENDPOINT` | no | run | `https://<ref>.supabase.co/storage/v1/s3` |
| `SUPABASE_S3_REGION` | no | run | e.g. `us-east-1` |
| `SUPABASE_S3_ACCESS_KEY_ID` / `SUPABASE_S3_SECRET_ACCESS_KEY` | yes | run | Supabase Storage S3 keys (bucket `hr-media`) |
| `ADS_TXT_CONTENT` / `SELLERS_JSON_CONTENT` | no | run | supply-chain declarations; routes 503 until set |
| `NEXT_PUBLIC_ADS_REVENUE_EXPERIMENT` | no | build | Epic Y arm; **`0` until launch (Epic L)** |
| `CONSENT_ENFORCEMENT` / `RETENTION_JOBS_ENABLED` | no | run | dashboard status pills only |

> Media is stored in Supabase Storage (S3-compatible), not DO Spaces — no
> persistent disk is required on the app.

---

## 2. Migrations (run before the new version serves)

Two independent layers own the schema (see `supabase/README.md`):

1. **Payload-owned tables** — applied automatically on deploy:
   - App Platform: the `PRE_DEPLOY` **migrate** job runs `npm run migrate`.
   - Coolify: set a pre-deploy command `npm run migrate` (the `prestart` hook is
     a fallback when `NODE_ENV=production`).
2. **Hand-applied Supabase SQL** — the RLS/analytics layer the app has no
   `:5432` egress to create in CI. Apply **in order** via the Supabase SQL
   editor / API:
   - `supabase/migrations/0001_payload_reconcile.sql`
   - `supabase/migrations/0002_media_reconcile.sql`
   - `supabase/migrations/0003_ad_event_chain.sql` — **NEW (Epic Y).** Creates
     `hr_ad_events` + `hr_ad_daily`. **The ad decision/event chain and the admin
     YieldHealth panel do nothing until this is applied.**

Then seed the placement table once: `npm run seed:placements`.

---

## 3. Rate limiting (Coolify / Traefik)

Mount `coolify/traefik-middleware.yml` into Traefik's dynamic dir
(`/data/coolify/proxy/dynamic/`) and set `service:` to the Coolify-generated
service name (see the note in that file). It rate-limits `/api/revalidate`,
`/api/events`, `/api/integrations/hunts-pointe` (Epic F), and `/api/ads/*`
(Epic Y). On App Platform there is no Traefik; `lib/rate-limit.ts` provides the
in-process fallback.

---

## 4. Scheduled jobs (retention + ad aggregation)

Two recurring, idempotent jobs (plan §10.4):

- **Retention** — `npm run retention -- --execute` (daily). Purges expired
  event/rollup rows and writes an audit event.
- **Ad aggregation** — `npm run aggregate:ads -- --execute` (nightly, after
  00:00 UTC). Rolls the previous day of `hr_ad_events` into `hr_ad_daily`.

**App Platform** has no arbitrary cron, so `.github/workflows/scheduled-jobs.yml`
runs both on schedule. Add these repo secrets pointed at prod: `DATABASE_URI`,
`PAYLOAD_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
Both scripts default to a dry run; the workflow passes `--execute` on schedule.

**Coolify** has native Scheduled Tasks — configure the two commands with the
same crons instead, and disable the workflow.

---

## 5. Hunt's Pointe

**Static site** (Coolify static site or nginx):
`bun install --frozen-lockfile && bun run build`, serve `dist/`.

**Edge functions** — deploy the SignalDesk seam functions:
```
supabase functions deploy push-signaldesk
supabase functions deploy signaldesk-status
```
Set these function secrets (`supabase secrets set`):
- `SIGNALDESK_INGEST_URL` = `https://<prod-domain>/api/integrations/hunts-pointe`
- `SIGNALDESK_STATUS_URL` = `https://<prod-domain>/api/integrations/hunts-pointe/status`
- `SIGNALDESK_WEBHOOK_SECRET` = **the same value** as SignalDesk's `WEBHOOK_SECRET`

(`SUPABASE_URL` / `SUPABASE_ANON_KEY` are injected automatically.)

---

## 6. Production smoke tests (plan §10.6)

- `GET /api/health` → `200 {status:"ok"}`.
- `GET /ads.txt` and `GET /sellers.json` → `200` with valid content (503 means
  `ADS_TXT_CONTENT` / `SELLERS_JSON_CONTENT` are unset).
- Stage a draft from Hunt's Pointe → a **review draft** appears in Payload
  (`/admin/collections/hr_articles`), unpublished, with provenance; the transfer
  panel shows the draft id and a downstream-status chip.
- Consent gate: a fresh session issues **zero** `/api/ads/slot` and
  `/api/ads/decision` requests before consent is resolved (Network tab).
- After applying `0003` and seeding placements, load an article and confirm the
  chain in `hr_ad_events` (opportunity → decision → render → viewable) with no
  duplicate impressions.
- Lighthouse mobile: LCP ≤ 2.5s p75 on Home/Article (the poster image is LCP).
