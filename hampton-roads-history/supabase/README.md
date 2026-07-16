# Database migrations

Two layers own the schema:

- **Payload** owns the CMS tables (`hr_articles`, `hr_categories`, `hr_authors`,
  `hr_breaking`, `hr_ad_creatives`, `hr_corrections`, `hr_cms_users`) and its
  system/version tables. Source of truth: `../migrations/*_initial_baseline.ts`,
  generated from `payload.config.ts`. Adapter uses `idType: 'uuid'`.
- **Supabase SQL** (`migrations/*.sql`) owns everything Payload doesn't: RLS
  policies, grants, the RPC functions (`hr_search_articles`, newsletter, etc.),
  storage buckets, analytics tables, and the `status`/`published_at` trigger.

## Publication state

Payload's built-in `_status` (`versions.drafts`) is canonical. The legacy
`status` text column that `lib/data.ts`, the RLS policies, and the RPCs read is
**derived from `_status` by a DB trigger** (`hr_articles_sync_status`), so it
can never drift. `published_at` is stamped on the transition into published and
**retained** on unpublish. Result: a draft returns zero rows through the anon
Supabase API. Verified on a Supabase branch (publish / unpublish / fresh-draft
lifecycle, read as the `anon` role).

## Applying — existing database ("mcp 6.1.5", where SignalDesk lives today)

The `hr_*` tables already exist. Do **not** run the Payload initial migration
against it (it would try to CREATE existing tables). Instead:

1. Apply `migrations/0001_payload_reconcile.sql` (Supabase SQL editor/API). It
   adds only the missing Payload infrastructure (`_status`, `_hr_articles_v`,
   `payload_*`, `hr_cms_users*`), the sync trigger, and baselines the Payload
   migration row so `payload migrate` treats the initial migration as applied.
2. Deploy the app. Future Payload migrations (0002+) run normally via
   `payload migrate`.

## Applying — fresh database (e.g. a future dedicated project)

1. `payload migrate` — creates all Payload-owned tables from the committed
   initial migration.
2. Apply the companion Supabase SQL (RLS, grants, RPCs, buckets, analytics
   tables, the sync trigger). NOTE: this companion file for a from-scratch build
   is not yet committed — only the reconciliation for the existing DB is. Track
   as follow-up if a greenfield project is ever needed.

## Known divergences (accepted)

Payload models some columns as `varchar`/`numeric`/`timestamp` where the
hand-built schema uses `text`/`smallint`/`date` (e.g. `read_time_min`,
`event_date`). Payload reads/writes these fine; because the initial migration is
baselined rather than run, Payload never tries to ALTER them. `hr_ad_creatives`
keeps its `slot_targets text[]` column alongside Payload's new join table.
