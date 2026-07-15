# CMS Architecture Upgrade — Sequenced Plan

Incremental upgrade of Hampton Roads History from handwritten Supabase reads to
a **Payload-authoritative, block-based editorial model**, with Supabase staying
as the Postgres platform, asset store, reader-auth system, and analytics
warehouse. This is an **incremental architecture upgrade, not a rebuild** — the
app already has Next.js + Payload 3 + Postgres, Supabase integration, the
Axios-style frontend (PR #8), trigram search, signed revalidation hooks, and an
RLS-audited analytics layer.

> Estimated total: **6–8 engineer-weeks** (~4–5 calendar weeks with two
> engineers + a dedicated staging environment). Ship staged behind a feature
> flag; do **not** land it as one change.

## Target architecture

Payload becomes the authoritative editorial model (articles, pages, blocks,
media, drafts/publish state). Public editorial reads move from handwritten
Supabase queries to Payload's Local API. Reader accounts, watchlists, analytics,
and specialized RPCs stay in the Supabase client layer.

## Non-negotiable ordering (critical path)

```
P0-1 migrations ──┬─▶ P0-2 status consolidation ──▶ P1 blocks ──▶ P2 renderer+migration+caching
                  ├─▶ P0-3 typed contract ─────────▶ (feeds P2)
                  ├─▶ P0-4 media/upload authz ──────▶ P3 integration bridge
                  ├─▶ P0-5 RBAC roles ─────────────▶ P3 integration bridge
                  └─▶ P0-6 job runner ─────────────▶ P4 scheduled publishing/search/AI
                                                        P5 analytics/ads/ops (after baseline)
```

Nothing in P1+ starts before **P0-1 (reproducible migrations)** exists —
every later phase adds tables/columns and must be migratable and reversible.

---

## Phase 0 — Production safety & schema control  ·  3–5 days

The six **blocking** foundations. Each has a GitHub issue.

### P0-1 — Reproducible Payload/Supabase migrations + deploy-time step  🔴 blocker
- **Depends on:** none (first).
- **Do:** stop relying on Payload dev auto-push; add a checked-in `migrations/`
  directory, a `payload migrate` deploy step, and a rollback runbook. Resolve
  the connection strategy: **migrations use a direct or session-pooled (`:5432`
  / session pooler) connection** — Supabase's transaction pooler (`:6543`)
  doesn't support prepared statements. Take a DB backup and rehearse a rollback
  before any block tables land.
- **Accept:** `payload migrate` runs clean on a fresh clone against staging;
  rollback rehearsed; CI runs `migrate:status`; no auto-push in any environment.

### P0-2 — Consolidate `status` / `_status`  🔴 blocker
- **Depends on:** P0-1.
- **Do:** make Payload `versions.drafts` `_status` the sole draft/published
  authority. Backfill `_status` from the custom `status` field, repoint reads
  (`lib/data.ts` filters `status = 'published'`), then retire the custom
  `status` column via migration.
- **Accept:** one source of truth; drift impossible; feed/detail reads use
  `_status`; migration + backfill reversible; article rows verified pre/post.

### P0-3 — Typed CMS contract  🔴 blocker
- **Depends on:** none (parallel with P0-1).
- **Do:** fix `generate:types` tooling (currently fails with
  `ERR_REQUIRE_ASYNC_MODULE` under Node 22 — needs the ESM invocation sorted),
  generate and **commit `payload-types.ts`**, add a CI drift gate
  (`generate:types` + `git diff --exit-code`). Replace handwritten frontend
  models with generated types incrementally.
- **Accept:** `payload-types.ts` committed; CI fails on drift; `lib/supabase/types.ts`
  article/page shapes derive from generated types.

### P0-4 — Secure media upload + Payload Media collection  🔴 blocker
- **Depends on:** P0-1 (Media table), P0-5 (role check).
- **Do:** add a Payload `Media` upload collection; convert `hero_image_url`
  strings to Media upload relationships (migration); tighten `/api/images/upload`
  from "any authenticated session" (done in this branch) to **editor/role-scoped**.
- **Accept:** uploads require an editor role; hero images are Media relations;
  arbitrary URL strings removed; alt text required.

### P0-5 — RBAC roles  🔴 blocker
- **Depends on:** P0-1 (roles column).
- **Do:** add a `roles` field to `hr_cms_users` (`admin` / `publisher` /
  `editor` / `integration`) + reusable access policies under `payload/access/`;
  wire `access` on every collection (default-deny for unauthenticated, explicit
  per-role for write/publish/delete). Test against a real Payload instance so no
  one is locked out.
- **Accept:** each role's create/read/update/delete/publish verified; admin
  never lockable; integration role can't publish or read subscriber/analytics.

### P0-6 — Real job runner (Payload Jobs)  🔴 blocker
- **Depends on:** P0-1.
- **Do:** stand up Payload's Postgres-backed Jobs queue + a dedicated worker
  process in Coolify. **Do not add Redis/BullMQ** until a measured workload
  needs a separate broker.
- **Accept:** worker runs as a separate process; a no-op scheduled job executes;
  health/queue-depth surfaced.

---

## Phase 1 — Block-based editorial model  ·  5–7 days
- **Depends on:** P0-1, P0-2, P0-5.
- **Collections:** `Pages`, `Articles`, `Media`.
- **Blocks:** `SmartBrevity`, `RichText`, `Hero`, `ArticleGrid`, `Media`,
  `Newsletter`, `AdUnit`, `RelatedContent`. `Pages.layout` controls
  home/city/campaign/static; `Articles.contentBlocks` controls story structure.
- **Also:** slug hooks + uniqueness; SEO metadata groups; required alt text +
  optional credit/caption; block-level validation + max-row limits;
  `schemaVersion` for externally-authored data; preview URLs + Next Draft Mode.
- **Accept:** an editor builds a page and an article entirely from blocks;
  preview renders drafts; block tables migratable.

## Phase 2 — Typed renderer + content migration + caching  ·  5–7 days
- **Depends on:** P1, P0-3.
- **Do:** typed `RenderBlocks` registry (exhaustive over generated block
  unions); replace the monolithic `ArticleBody` path with block rendering;
  dynamic `Pages` resolution that doesn't collide with `/[city]/[idSlug]`;
  versioned migration of existing `body_lexical` → a `richText` block; **dual-read
  verification** before cutover; preserve URLs, canonical, JSON-LD, RSS.
  Introduce Next 16 cacheable data functions with tags (`page:home`,
  `article:{id}`, `city:{slug}`, `feed`); invalidate from Payload hooks; remove
  `force-dynamic` where no longer needed.
- **Accept:** dual-read parity; ISR/tag caching live; `force-dynamic` removed
  from routes that no longer require it; no SEO/RSS regressions.

## Phase 3 — Secure drafting & multimodal bridge  ·  5–7 days
- **Depends on:** P0-4, P0-5, P1.
- **Do:** API-key-enabled auth collection for integrations, least-privilege
  (upload approved media; create/update **its own** drafts; read its own
  results; never publish/delete/admin/read subscriber/analytics). Two-step
  media-then-draft upload; Media relationships (not URL strings); Zod validation
  of the incoming draft contract; idempotency keys; correlation IDs + timeouts +
  retry + dead-letter; audit records (account, source draft id, media ids,
  resulting article id, schema version); contract tests (text-only + multimodal);
  quarterly key rotation with overlap + revocation runbook.
- **Note:** AI generates **suggestions that stay unpublished until an editor
  accepts**; store model, prompt version, provenance, approval. No "undetectable"
  claims — not a valid requirement.
- **Accept:** integration account provably cannot publish or read restricted
  data; duplicate retries are idempotent; every draft has an audit trail.

## Phase 4 — Publishing workflow, automation, discovery  ·  5–8 days
- **Depends on:** P0-6, P1.
- **Do:** enable `versions.drafts.schedulePublish` (requires the P0-6 worker —
  config alone won't publish); jobs for scheduled publish, revalidation, search
  indexing, AI enrichment, newsletter webhooks, cleanup; hooks **enqueue** small
  jobs rather than doing external calls synchronously. Keep Postgres trigram
  search; add **Meilisearch only if** measured archive size / p95 latency / typo
  quality / facets exceed Postgres, synced via a retryable job/outbox with full
  reindex.
- **Accept:** a scheduled article publishes via the worker; hooks are async;
  search SLA measured before any Meilisearch decision.

## Phase 5 — Analytics, advertising, operations  ·  5–8 days
- **Depends on:** baseline stabilized (P2–P4).
- **Do:** versioned allowlist of analytics event names (retire free-form);
  batched beacons + bot filtering + retention + consent + deletion; per-block
  impression/completion (not just page depth); fixed/responsive **ad
  reservations** (kill CLS); `AdUnit` block for editor-placed ads; publish
  `ads.txt`; introduce **GPT/Prebid only after** a CMP + vendor allowlist + CSP
  changes + SafeFrame policy + SPA slot-lifecycle tests — keep the current
  direct-sold path as fallback. Ops: worker health, queue depth, publish
  latency, failed-job/webhook/auth-failure monitoring; E2E in CI against
  protected staging; migration/preview/a11y/perf-budget/contract gates.
- **Accept:** zero-CLS ad slots; consent enforced; programmatic gated behind CMP;
  ops dashboards live.

---

## Infrastructure

Do **not** co-locate web + Payload admin/API + image processing + worker + Redis
+ proxy on a 512 MB box. Build in GitHub Actions; deploy immutable
artifacts/containers; run **web and worker as separate processes**; Supabase for
Postgres + Storage; start with Payload's DB queue; allocate **1–2 GB RAM** for
the app tier and size from observed memory/concurrency; add Redis only when a
measured workload demands a separate broker.

## Feature-flag release order

1. Migrations + RBAC → 2. CMS blocks + preview → 3. Dual-read rendering →
4. Drafting integration → 5. Scheduled jobs → 6. Traffic cutover →
7. Search / programmatic ads (only after baseline stabilization).

---

## Already landed on this branch (safe, no production-DB writes)

- **payload.config.ts modularized** into `payload/collections/*` + a shared
  `payload/hooks/revalidate.ts` (deduped the 3× revalidation webhook). Structural
  groundwork for P1's collections/blocks split. No schema change.
- **`/api/images/upload` hardened**: rejects anonymous callers and validates real
  file magic bytes (not just the declared Content-Type). Role-scoping is P0-4.
- **`typecheck` + `generate:types` npm scripts** added. (CI already runs
  typecheck/lint/test/build; the `generate:types` drift gate is P0-3, pending the
  tooling fix.)

Everything schema- or data-touching is intentionally deferred to the Phase-0
tickets above — it needs the migration foundation and a staging database first.
