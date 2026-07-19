-- Epic Y (VaporNet Americana gap-remediation plan §07): the viewability event
-- chain and its nightly reporting rollup.
--
-- Adds the two Supabase-owned analytics tables the ad money-path needs:
--
--   hr_ad_events  append-only log for the full serving chain — ad_opportunity,
--                 ad_decision, ad_render, ad_viewable (MRC 50%/1s), and
--                 page_engagement. Carries the shared envelope so any two
--                 events in one impression can be joined on opportunity_id.
--                 (ad_click stays in hr_ad_impressions — token-bound, already
--                 shipped — but may now carry opportunity_id/decision_id there.)
--
--   hr_ad_daily   per-(day, placement, experiment) rollup produced nightly by
--                 scripts/aggregate-ads.mts. The reporting surface the admin
--                 YieldHealth panel and the launch gate (§12) read.
--
-- RLS mirrors hr_ad_impressions / hr_page_events exactly (docs/rls-audit.md):
-- anon may INSERT event rows (client beacons) but SELECT is USING (false) —
-- write-only, un-enumerable. The rollup table is service-role only.
--
-- Apply via the Supabase SQL editor / API after 0001 + 0002, same as the other
-- hand-built-layer migrations (the app has no direct :5432 egress in CI).
-- Idempotent where practical.

BEGIN;

-- 1. hr_ad_events — the serving-chain log ------------------------------------
CREATE TABLE IF NOT EXISTS public.hr_ad_events (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  -- ad_click is intentionally NOT in this list — it lives in hr_ad_impressions
  -- (token-bound) and predates this table.
  "event_type" text NOT NULL,
  -- Shared envelope (plan §07.3). session_id is the anonymous per-visit id;
  -- there is no durable/device identity here.
  "publication_id" text,
  "content_id" uuid,
  "placement_id" text,
  "opportunity_id" uuid NOT NULL,
  "decision_id" uuid,
  "creative_id" uuid,
  "campaign_id" uuid,
  "session_id" text NOT NULL,
  "consent_state" text,
  "experiment" text,
  "device_class" text,
  "route_type" text,
  "cwv_context" jsonb,
  -- Decision-event detail: which demand tier won, why, and how long the
  -- decision took. Null on non-decision events.
  "tier" text,
  "reason" text,
  "latency_ms" integer,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "hr_ad_events_event_type_check" CHECK ("event_type" IN
    ('ad_opportunity','ad_decision','ad_render','ad_viewable','page_engagement'))
);

CREATE INDEX IF NOT EXISTS "hr_ad_events_opportunity_idx"
  ON public.hr_ad_events USING btree ("opportunity_id");
CREATE INDEX IF NOT EXISTS "hr_ad_events_created_at_idx"
  ON public.hr_ad_events USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "hr_ad_events_type_created_idx"
  ON public.hr_ad_events USING btree ("event_type", "created_at");
CREATE INDEX IF NOT EXISTS "hr_ad_events_placement_idx"
  ON public.hr_ad_events USING btree ("placement_id");

-- Write-only for the anon client: it may log events but may never read them
-- back (no impression/behaviour enumeration). Same posture as
-- hr_ad_impressions. Service role bypasses RLS for the aggregation job.
ALTER TABLE public.hr_ad_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "HR: block reads of ad events" ON public.hr_ad_events;
CREATE POLICY "HR: block reads of ad events"
  ON public.hr_ad_events FOR SELECT TO public USING (false);
DROP POLICY IF EXISTS "HR: anon may log ad events" ON public.hr_ad_events;
CREATE POLICY "HR: anon may log ad events"
  ON public.hr_ad_events FOR INSERT TO anon, authenticated WITH CHECK (true);
GRANT INSERT ON public.hr_ad_events TO anon, authenticated;

-- 2. hr_ad_daily — nightly reporting rollup ----------------------------------
CREATE TABLE IF NOT EXISTS public.hr_ad_daily (
  "day" date NOT NULL,
  "placement_id" text NOT NULL,
  "experiment" text NOT NULL DEFAULT 'standard',
  "route_type" text,
  "opportunities" bigint NOT NULL DEFAULT 0,
  "decisions" bigint NOT NULL DEFAULT 0,
  "renders" bigint NOT NULL DEFAULT 0,
  "viewables" bigint NOT NULL DEFAULT 0,
  "clicks" bigint NOT NULL DEFAULT 0,
  -- viewables / renders, materialised so the launch gate (§12: "viewability
  -- >=70% overall, no placement <55%") is a single cheap read.
  "viewability_rate" numeric,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY ("day", "placement_id", "experiment")
);

CREATE INDEX IF NOT EXISTS "hr_ad_daily_day_idx"
  ON public.hr_ad_daily USING btree ("day");

-- Service-role only: the aggregation job writes it, server-side admin panels
-- read it through the service role (bypasses RLS). No anon/authenticated grant.
ALTER TABLE public.hr_ad_daily ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "HR: block public access to ad rollups" ON public.hr_ad_daily;
CREATE POLICY "HR: block public access to ad rollups"
  ON public.hr_ad_daily FOR SELECT TO public USING (false);

COMMIT;
