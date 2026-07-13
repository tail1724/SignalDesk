# RLS Audit — Hampton Roads History

Last run: 2026-07-13, against project `odogjtrpcpqicgqaraih`.

## Method

Row-level security in Postgres is enforced by the database based on the
connecting role, independent of network path — so this audit runs queries
as the `anon` role directly at the database (`SET LOCAL ROLE anon`) rather
than over HTTP. This is equivalent to, and more rigorous than, testing via
the anon key over the REST API: it proves the policy's logical guarantee
rather than a single empirical result against whatever data happens to be
in the table right now.

Launch-blocking check (per the original PRD): **`hr_profiles`,
`hr_watchlists`, and `hr_ad_impressions` must return 0 rows to the anon
key on SELECT.**

## Result: PASS

| Table | Policy (SELECT) | Why it's safe for anon |
|---|---|---|
| `hr_profiles` | `USING (auth.uid() = id)` | Anon has no session, so `auth.uid()` is `NULL`. `NULL = id` is never true — 0 rows guaranteed regardless of table contents. |
| `hr_watchlists` | `ALL USING (auth.uid() = user_id)` | Same guarantee — covers SELECT/INSERT/UPDATE/DELETE together. |
| `hr_ad_impressions` | `USING (false)` (separate INSERT-only policy exists) | Unconditionally blocks all reads for every non-bypassing role. Insert is intentionally anon-writable (impression logging) but write-only — no read-back policy exists, so impressions can't be enumerated. |

## Full policy inventory (all `hr_*` tables)

Public-read tables (intentional, no PII exposed):
`hr_categories`, `hr_authors`, `hr_media`, `hr_article_semantics`,
`hr_gold_trending`, `hr_ad_creatives` (flight-window scoped),
`hr_articles` (published only), `hr_breaking` (active only),
`hr_corrections` (unconditional — see WS-20 note below).

Write-restricted / owner-scoped tables:
- `hr_page_events`: anon INSERT only; SELECT policy is `USING (false)` —
  reads only happen via `service_role`, which bypasses RLS entirely rather
  than going through this policy (the policy name "service read" is a
  label, not a role grant — worth flagging as a naming footgun for future
  readers, but not a security issue since `roles: {public}` + `qual: false`
  blocks every non-bypassing role identically).
- `hr_silver_article_sessions`: `USING (false)` — no public read at all.
  Aggregation only via `HR_aggregate_gold_trending()` (SECURITY DEFINER).
- `hr_newsletter_subscribers`: anon INSERT only. SELECT policy is
  `(user_id = auth.uid()) OR (user_id IS NULL AND false)` — blocks
  anonymous reads (most subscribers have no `user_id`), preventing email
  enumeration. UPDATE is scoped to `user_id = auth.uid()` for
  authenticated users unsubscribing their own linked account.

## Issue found and fixed during this build

The double opt-in confirm/unsubscribe flow (WS-06) initially used RLS
UPDATE policies of the shape `USING (status = 'pending') WITH CHECK (status
= 'confirmed')`. This does **not** actually require the caller to know the
row's `confirm_token` — RLS has no mechanism to enforce that a client
supplied a particular `WHERE` filter, so any anon caller could have
confirmed (or unsubscribed) *every* pending/confirmed row at once by
omitting the token filter from their query.

Fixed by replacing those policies with two `SECURITY DEFINER` RPC functions
(`hr_confirm_newsletter_subscription`, `hr_unsubscribe_newsletter`) that
check the token match inside the function body, where it isn't optional.
This matches the existing pattern in this schema (`HR_aggregate_silver`,
`HR_aggregate_gold_trending`, `HR_flag_ad_anomalies` are all `SECURITY
DEFINER`).

## WS-20: corrections log

`hr_corrections` is public-read with `USING (true)` — deliberately
unconditional, since corrections are editorial content with no PII and
being publicly visible is the entire point (matches the About page's
editorial-standards promise: "we correct it publicly rather than quietly
editing it away"). There is no anon INSERT policy — entries are added only
by editorial staff via Payload (which connects via `DATABASE_URI` and
bypasses RLS, same as `hr_articles`/`hr_breaking`).

The public-facing "report a correction" flow (`POST /api/corrections`)
deliberately does not write to this table or any other — it emails
`CORRECTIONS_EMAIL` via Resend and nothing is persisted. This avoids
building a moderation queue for the report itself while still publishing
the reviewed outcome. It also avoids trusting client-supplied
title/URL in the notification email: the route looks up the article
server-side by `article_id` and only proceeds if it's a real, published row.

## Write paths that bypass RLS entirely (by design)

`hr_articles`, `hr_breaking`, `hr_ad_creatives`, and `hr_cms_users` are
authored via Payload CMS, which connects with `DATABASE_URI` — a direct
Postgres connection, not the anon/authenticated REST roles. RLS does not
apply to that connection. This is intentional (editorial writes shouldn't
go through the public API surface at all) but means the Postgres role
behind `DATABASE_URI` should be rotated/scoped like any other privileged
credential, not treated as equivalent to the anon key.

## Re-running this audit

Re-run after any schema or policy change:

```sql
SET LOCAL ROLE anon;
SELECT 'table_name' as tbl, count(*) as row_count FROM public.table_name;
```

For a full policy inventory:

```sql
SELECT tablename, policyname, cmd, roles, qual::text, with_check::text
FROM pg_policies
WHERE schemaname = 'public' AND tablename LIKE 'hr_%'
ORDER BY tablename, cmd;
```
