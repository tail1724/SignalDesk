-- Media reconciliation for the EXISTING SignalDesk database.
--
-- Turns hr_media into a Payload upload collection (matches the shape in
-- migrations/20260716_013020_add_media.ts) and adds the hero_media relationship
-- to articles. The old hr_media table (bucket/path shape) had 0 rows, is not
-- read by any app code, and has no inbound FKs, so it is dropped and recreated.
-- Files themselves live in the existing Supabase Storage "hr-media" bucket.
--
-- Apply AFTER 0001_payload_reconcile.sql. Idempotent where practical.

BEGIN;

-- 1. hr_media -> Payload upload shape ------------------------------------------
DROP TABLE IF EXISTS public.hr_media CASCADE;
CREATE TABLE public.hr_media (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "alt" varchar NOT NULL,
  "caption" varchar,
  "photographer" varchar,
  "credit" varchar,
  "prefix" varchar DEFAULT 'media',
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "url" varchar,
  "thumbnail_u_r_l" varchar,
  "filename" varchar,
  "mime_type" varchar,
  "filesize" numeric,
  "width" numeric,
  "height" numeric,
  "focal_x" numeric,
  "focal_y" numeric
);
CREATE UNIQUE INDEX "hr_media_filename_idx" ON public.hr_media USING btree ("filename");
CREATE INDEX "hr_media_updated_at_idx" ON public.hr_media USING btree ("updated_at");
CREATE INDEX "hr_media_created_at_idx" ON public.hr_media USING btree ("created_at");

-- Public read (media is public); writes go through Payload (service role).
ALTER TABLE public.hr_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HR: public read media" ON public.hr_media FOR SELECT TO public USING (true);
GRANT SELECT ON public.hr_media TO anon, authenticated;

-- 2. hero_media relationship on articles (+ version table + locked-docs rels) --
ALTER TABLE public.hr_articles ADD COLUMN IF NOT EXISTS hero_media_id uuid
  REFERENCES public.hr_media(id) ON DELETE set null;
ALTER TABLE public."_hr_articles_v" ADD COLUMN IF NOT EXISTS version_hero_media_id uuid
  REFERENCES public.hr_media(id) ON DELETE set null;
ALTER TABLE public.payload_locked_documents_rels ADD COLUMN IF NOT EXISTS hr_media_id uuid
  REFERENCES public.hr_media(id) ON DELETE cascade;
CREATE INDEX IF NOT EXISTS "hr_articles_hero_media_idx" ON public.hr_articles USING btree ("hero_media_id");
CREATE INDEX IF NOT EXISTS "_hr_articles_v_version_version_hero_media_idx" ON public."_hr_articles_v" USING btree ("version_hero_media_id");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_hr_media_id_idx" ON public.payload_locked_documents_rels USING btree ("hr_media_id");

-- 3. Baseline the Payload add_media migration
INSERT INTO public.payload_migrations (name, batch)
SELECT '20260716_013020_add_media', 2
WHERE NOT EXISTS (SELECT 1 FROM public.payload_migrations WHERE name = '20260716_013020_add_media');

COMMIT;
