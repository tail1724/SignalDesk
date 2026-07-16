-- Payload reconciliation for the EXISTING SignalDesk database (project "mcp 6.1.5").
--
-- Context: the hr_* tables were built by hand and Payload had never run against
-- them. This brings the live schema up to what Payload's initial migration
-- (migrations/2026*_initial_baseline.ts) expects, WITHOUT recreating the
-- existing collection tables or disturbing the ~80 unrelated tables that share
-- this project. It is idempotent where practical.
--
-- Apply via the Supabase SQL editor / API (the app has no direct :5432 egress
-- in CI). Validated on a Supabase branch: after this runs, drafts return zero
-- rows through the anon API and Payload's `_status` drives everything.
--
-- The parallel "fresh database" path (a brand-new project) instead runs the
-- Payload initial migration to CREATE all tables, then a companion Supabase
-- migration for the hand-built layer (RLS, RPCs, buckets) -- see supabase/README.md.

BEGIN;

-- 1. Enums Payload expects -----------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.enum_hr_articles_status AS ENUM ('draft','published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.enum__hr_articles_v_version_status AS ENUM ('draft','published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.enum_hr_ad_creatives_slot_targets AS ENUM ('article-inline','sidebar','home-feed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Canonical publish state on hr_articles, backfilled from legacy `status` ---
ALTER TABLE public.hr_articles
  ADD COLUMN IF NOT EXISTS _status public.enum_hr_articles_status DEFAULT 'draft';
UPDATE public.hr_articles
  SET _status = (CASE WHEN status = 'published' THEN 'published' ELSE 'draft' END)::public.enum_hr_articles_status
  WHERE _status IS DISTINCT FROM (CASE WHEN status = 'published' THEN 'published' ELSE 'draft' END)::public.enum_hr_articles_status;
CREATE INDEX IF NOT EXISTS hr_articles__status_idx ON public.hr_articles USING btree (_status);

-- 3. Linchpin trigger: `_status` (Payload canonical) drives the legacy `status`
--    text column that data.ts / RLS / the RPCs read, and stamps published_at on
--    transition into published (retained on unpublish). Works for every writer:
--    Payload, the future Hunt's Pointe ingest, or raw SQL.
CREATE OR REPLACE FUNCTION public.hr_articles_sync_status() RETURNS trigger AS $$
BEGIN
  IF NEW._status IS NOT NULL THEN
    NEW.status := NEW._status::text;
  END IF;
  IF NEW._status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS hr_articles_sync_status ON public.hr_articles;
CREATE TRIGGER hr_articles_sync_status BEFORE INSERT OR UPDATE ON public.hr_articles
  FOR EACH ROW EXECUTE FUNCTION public.hr_articles_sync_status();

-- 4. Payload drafts version table ---------------------------------------------
CREATE TABLE IF NOT EXISTS public."_hr_articles_v" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "parent_id" uuid REFERENCES public.hr_articles(id) ON DELETE set null,
  "version_short_id" varchar,
  "version_title" varchar,
  "version_dek" varchar,
  "version_slug" varchar,
  "version_kicker" varchar,
  "version_section_id" uuid REFERENCES public.hr_categories(id) ON DELETE set null,
  "version_author_id" uuid REFERENCES public.hr_authors(id) ON DELETE set null,
  "version_hero_image_url" varchar,
  "version_hero_image_alt" varchar,
  "version_body_lexical" jsonb,
  "version_publish_at" timestamp(3) with time zone,
  "version_published_at" timestamp(3) with time zone,
  "version_event_date" timestamp(3) with time zone,
  "version_read_time_min" numeric,
  "version_is_pro" boolean DEFAULT false,
  "version_updated_at" timestamp(3) with time zone,
  "version_created_at" timestamp(3) with time zone,
  "version__status" public.enum__hr_articles_v_version_status DEFAULT 'draft',
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "latest" boolean
);
CREATE INDEX IF NOT EXISTS "_hr_articles_v_parent_idx" ON public."_hr_articles_v" ("parent_id");
CREATE INDEX IF NOT EXISTS "_hr_articles_v_version_version__status_idx" ON public."_hr_articles_v" ("version__status");
CREATE INDEX IF NOT EXISTS "_hr_articles_v_latest_idx" ON public."_hr_articles_v" ("latest");

-- 5. hr_ad_creatives multi-select -> Payload join table (existing slot_targets
--    text[] column is left in place; migrate any values into the join table).
CREATE TABLE IF NOT EXISTS public.hr_ad_creatives_slot_targets (
  "order" integer NOT NULL,
  "parent_id" uuid NOT NULL REFERENCES public.hr_ad_creatives(id) ON DELETE cascade,
  "value" public.enum_hr_ad_creatives_slot_targets,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
);
INSERT INTO public.hr_ad_creatives_slot_targets ("order", parent_id, value, id)
SELECT ord, c.id, t::public.enum_hr_ad_creatives_slot_targets, gen_random_uuid()
FROM public.hr_ad_creatives c
CROSS JOIN LATERAL unnest(c.slot_targets) WITH ORDINALITY AS u(t, ord)
WHERE c.slot_targets IS NOT NULL
ON CONFLICT DO NOTHING;

-- 6. Payload auth + system tables ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.hr_cms_users (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "email" varchar NOT NULL,
  "reset_password_token" varchar,
  "reset_password_expiration" timestamp(3) with time zone,
  "salt" varchar,
  "hash" varchar,
  "login_attempts" numeric DEFAULT 0,
  "lock_until" timestamp(3) with time zone
);
CREATE UNIQUE INDEX IF NOT EXISTS "hr_cms_users_email_idx" ON public.hr_cms_users ("email");
CREATE TABLE IF NOT EXISTS public.hr_cms_users_sessions (
  "_order" integer NOT NULL,
  "_parent_id" uuid NOT NULL REFERENCES public.hr_cms_users(id) ON DELETE cascade,
  "id" varchar PRIMARY KEY NOT NULL,
  "created_at" timestamp(3) with time zone,
  "expires_at" timestamp(3) with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payload_kv (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "key" varchar NOT NULL,
  "data" jsonb NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "payload_kv_key_idx" ON public.payload_kv ("key");

CREATE TABLE IF NOT EXISTS public.payload_locked_documents (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "global_slug" varchar,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.payload_locked_documents_rels (
  "id" serial PRIMARY KEY NOT NULL,
  "order" integer,
  "parent_id" uuid NOT NULL REFERENCES public.payload_locked_documents(id) ON DELETE cascade,
  "path" varchar NOT NULL,
  "hr_cms_users_id" uuid REFERENCES public.hr_cms_users(id) ON DELETE cascade,
  "hr_categories_id" uuid REFERENCES public.hr_categories(id) ON DELETE cascade,
  "hr_authors_id" uuid REFERENCES public.hr_authors(id) ON DELETE cascade,
  "hr_articles_id" uuid REFERENCES public.hr_articles(id) ON DELETE cascade,
  "hr_breaking_id" uuid REFERENCES public.hr_breaking(id) ON DELETE cascade,
  "hr_ad_creatives_id" uuid REFERENCES public.hr_ad_creatives(id) ON DELETE cascade,
  "hr_corrections_id" uuid REFERENCES public.hr_corrections(id) ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS public.payload_preferences (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "key" varchar,
  "value" jsonb,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.payload_preferences_rels (
  "id" serial PRIMARY KEY NOT NULL,
  "order" integer,
  "parent_id" uuid NOT NULL REFERENCES public.payload_preferences(id) ON DELETE cascade,
  "path" varchar NOT NULL,
  "hr_cms_users_id" uuid REFERENCES public.hr_cms_users(id) ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS public.payload_migrations (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar,
  "batch" numeric,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

-- 7. Baseline the Payload migration so `payload migrate` treats the initial
--    migration as already applied (this SQL did its work). Keep the name in
--    sync with the file in migrations/. Future migrations (0002+) run normally.
INSERT INTO public.payload_migrations (name, batch)
SELECT '20260716_010821_initial_baseline', 1
WHERE NOT EXISTS (
  SELECT 1 FROM public.payload_migrations WHERE name = '20260716_010821_initial_baseline'
);

COMMIT;
