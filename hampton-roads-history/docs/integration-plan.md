# SignalDesk × Hunt's Pointe — Integration & Launch Plan

_Last updated: 2026-07-15. Every claim below was verified against both repos
(`tail1724/SignalDesk` and `tail1724/hunt-s-pointe`) — see "Corrections" at the end._

## Decision

**No third application.** SignalDesk is the news site *and* the CMS (Next.js +
Payload Admin in one Node process). Hunt's Pointe stays a separate upstream
drafting tool that submits **drafts only**, through an authenticated endpoint —
never touching the SignalDesk database directly.

## What already exists (the vertical slice)

In SignalDesk (`hampton-roads-history/`):

- Next.js frontend + Payload Admin (`/admin`) in one process (`payload.config.ts`)
- Payload collections: articles, authors, categories, editors
- Lexical rich-text editing + frontend rendering (`components/ArticleBody.tsx`)
- Supabase-backed queries (`lib/data.ts`)
- Article / city / homepage routes
- API routes: ads, auth, breaking, corrections, events, health, images,
  newsletter, og, revalidate, search, watchlist, weather

In Hunt's Pointe (Vite + React SPA with a Supabase Edge Function suite):

- `export-cms` Edge Function: produces a structured article payload
  (title, slug, dek, byline, section, status, tags, publishAt, body, seo)
  in JSON or Markdown, with a `field_mapping` key-rename hook
- `DistributePanel.tsx` already calls `export-cms` from the writing UI

**What does NOT exist** (previous drafts of this plan claimed otherwise):

- SignalDesk has **no article-ingest/receiving endpoint** — there is no
  `codex/hunts-pointe-integration` branch and no commit `684e82b`
- Hunt's Pointe has **no `push-signaldesk` Edge Function**

The work is hardening SignalDesk's seams first, then **building** (not
deploying) the sender/receiver pair.

---

## The critical path

The first real milestone is one sentence: *a fresh staging DB is built entirely
from committed migrations, an editor uploads an image + article in `/admin`,
drafts stay private, and clicking **Publish** makes the story appear on the
homepage and canonical route.* Everything below is sequenced to reach that,
then extend it.

### 1 — Reproducible migrations (biggest gap)

The live Supabase project has tables and RLS, but the repo has **no complete
migration history**. Nothing else is trustworthy until a database can be
rebuilt from source.

- Generate + commit an initial Payload migration from `payload.config.ts`,
  run it against an empty staging DB.
- Add a companion Supabase SQL migration for everything Payload doesn't own:
  - `anon` / `authenticated` grants
  - RLS enablement + policies
  - **Public-read for *published* articles only**; public-read for categories,
    authors, media
  - Storage bucket creation
  - Existing search / newsletter RPC functions (reverse-engineer from the live
    project so staging matches prod)
- Commit seed data: one category, one author, one article.

> Payload's model: generate migrations in development, commit them, run them
> before deploy.

### 2 — Fix the Postgres connection string

`.env.example` currently recommends the **transaction pooler (6543)** and
explicitly warns against `:5432`. This is backwards for a persistent Node
server: the transaction pooler doesn't support prepared statements, which
Payload/Drizzle rely on.

- **Persistent server (App Platform, Droplet):** direct connection
  (`db.<ref>.supabase.co:5432`) where IPv6 is available, otherwise the
  **session pooler on 5432**.
- Reserve the **6543 transaction pooler** for serverless/transient
  connections only.
- Correct `.env.example` and its comment block accordingly.

### 3 — Make Payload's Publish button authoritative

Publication state is currently only the custom `status` field
(`payload.config.ts:67`); the frontend filters `.eq("status", "published")`
(`lib/data.ts`) and a revalidation hook keys off `doc.status`. Payload
versions/drafts (`_status`) are **not enabled** in the config.

- Enable Payload drafts (`versions: { drafts: true }`) on the articles
  collection so `_status` exists.
- Make `_status` canonical: derive the legacy `status` from it, or remove
  `status` once nothing reads it.
- On the `draft → published` transition: set `published_at` automatically;
  define unpublish behavior (clear vs. retain) explicitly.
- Both frontend queries **and** RLS must gate on `_status = 'published'`.
- Revalidate **only** on an actual publish transition, not every save.
- **Acceptance test:** drafts return **zero rows** through the anonymous
  Supabase API.

### 4 — Real media uploads

`hero_image_url` is a bare text field (`payload.config.ts:64`) — an editor
can't upload/select an image inside `/admin`.

- Add an upload-enabled `hr_media` collection.
- Install `@payloadcms/storage-s3`, point it at Supabase Storage's
  S3-compatible endpoint.
- Store alt text, caption, photographer, credit.
- Add a relationship from articles to `hr_media`; **keep `hero_image_url`
  temporarily** for existing articles and Hunt's Pointe compatibility.
- Update frontend queries to populate the relationship.
- Replace the hardcoded Supabase hostname in `next.config.ts` with one derived
  from `NEXT_PUBLIC_SUPABASE_URL`.

> S3 credentials **bypass RLS** and are server-only — they must never enter
> the browser bundle.

### 5 — Staging environment file

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Session pooler on 5432 for a persistent server (NOT 6543)
DATABASE_URI=postgresql://postgres.YOUR_PROJECT:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
PAYLOAD_SECRET=

NEXT_PUBLIC_SITE_URL=http://localhost:3000

SUPABASE_S3_ENDPOINT=
SUPABASE_S3_REGION=
SUPABASE_S3_ACCESS_KEY_ID=
SUPABASE_S3_SECRET_ACCESS_KEY=

AD_HMAC_SECRET=
WEBHOOK_SECRET=

RESEND_API_KEY=
NEWSLETTER_FROM_EMAIL=onboarding@resend.dev
CORRECTIONS_EMAIL=your-address@example.com
```

Generate **a distinct** secret per field: `openssl rand -hex 32`.
One Supabase project per environment: `signalsdesk-staging`,
`signalsdesk-production`.

### 6 — First local editorial test

```bash
git clone https://github.com/tail1724/SignalDesk.git
cd SignalDesk/hampton-roads-history
npm ci
cp .env.example .env.local     # fill in staging Supabase creds first
npx payload migrate
npm run dev
```

Then in `/admin`: create the first admin → category (Norfolk / norfolk) →
author → upload a hero image → article (headline, dek, author, category,
body) → save as draft and **confirm it's not public** → click **Publish** →
confirm it appears on `/` and at `/norfolk/<short-id>-<slug>`.

`short_id`, `slug`, read time, and `published_at` must be **auto-generated** —
editors never type them.

### 7 — Deploy to DigitalOcean App Platform

Chosen for the first production cut: GitHub deploys, health checks, and
pre-deploy jobs, with no Droplet patching / TLS / process management.

| Setting | Value |
|---|---|
| Source directory | `hampton-roads-history` |
| Node version | 22 |
| Build | `npm ci && npm run build` |
| Run | `npm run start -- -p $PORT` (Next must bind App Platform's injected `PORT`) |
| Pre-deploy job | `npx payload migrate` |
| Health check | `/api/health` |
| Persistent files | None — media lives in Supabase Storage |

> Prefer a Droplet? Keep the existing Coolify direction but add a production
> Dockerfile, health checks, automatic OS updates, firewall rules, and DB
> backups — and **never** store uploads on the Droplet filesystem.

### 8 — Connect Hunt's Pointe (build the seam; only after manual publishing works)

Both halves of this seam are **new work**:

**SignalDesk side (receiver):**

- Add an authenticated draft-ingest endpoint (e.g.
  `POST /api/integrations/hunts-pointe`) that creates a Payload **draft**
  article via the Local API — never `_status: published`.
- Authenticate with a Payload service account + API key (or HMAC via the
  existing `WEBHOOK_SECRET` pattern already used elsewhere in the app).
- Accept the `export-cms` JSON shape; map `section` → category,
  `byline` → author(s), `body` → Lexical (or store as a plain-text/markdown
  field pending conversion).
- Add a media-upload companion endpoint (or accept an image URL and pull it
  into `hr_media` server-side).

**Hunt's Pointe side (sender):**

- Add a `push-signaldesk` Supabase Edge Function that calls the ingest
  endpoint. Reuse `export-cms`'s payload builder — its `field_mapping`
  hook can rename keys to SignalDesk's schema without new mapping code.
- Store the SignalDesk API key **only** as an Edge Function secret.
- Add "Stage in SignalDesk" to `DistributePanel.tsx`: upload media first,
  then submit the article as a draft.

**Invariant:** Hunt's Pointe always creates drafts; a human editor publishes
through Payload.

---

## Build order

1. Payload + Supabase initial migrations
2. Seed / bootstrap command
3. Canonical publication-state hook (enable drafts) + RLS update
4. Payload media collection on Supabase Storage
5. End-to-end editorial test
6. App Platform spec
7. Hunt's Pointe seam: SignalDesk ingest endpoint, then `push-signaldesk`
   sender + DistributePanel button
8. Later: preview mode, scheduled publishing, editorial roles

## Corrections vs. earlier drafts (verified 2026-07-15)

- ~~"Push/deploy commit `684e82b` from `codex/hunts-pointe-integration`"~~ —
  that branch and commit **do not exist** in the SignalDesk repo, and no
  receiving endpoints exist in `app/api/`. The receiver must be built.
- ~~"Add the `push-signaldesk` Edge Function to Hunt's Pointe"~~ (as if it
  existed) — it doesn't; but `export-cms` + `DistributePanel.tsx` provide
  most of the sender logic already.
- Payload `_status` is **not yet enabled** — step 3 starts by turning on
  drafts, not just re-pointing queries.
- `.env.example`'s 6543 pooler recommendation is confirmed wrong for a
  persistent server (step 2).
- `next.config.ts` hardcoded hostname `odogjtrpcpqicgqaraih.supabase.co`
  confirmed (step 4).
