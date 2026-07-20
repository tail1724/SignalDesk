import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Media feature-placement slots. Lets an editor mark an uploaded image in the
// media library as the homepage hero, or as the hero for a given section/city
// (matched by slug). Article heroes keep using hr_articles.hero_media_id.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "hr_media" ADD COLUMN IF NOT EXISTS "homepage_hero" boolean DEFAULT false;
  ALTER TABLE "hr_media" ADD COLUMN IF NOT EXISTS "section_hero_slug" varchar;
  CREATE INDEX IF NOT EXISTS "hr_media_homepage_hero_idx" ON "hr_media" USING btree ("homepage_hero");
  CREATE INDEX IF NOT EXISTS "hr_media_section_hero_slug_idx" ON "hr_media" USING btree ("section_hero_slug");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX IF EXISTS "hr_media_homepage_hero_idx";
  DROP INDEX IF EXISTS "hr_media_section_hero_slug_idx";
  ALTER TABLE "hr_media" DROP COLUMN IF EXISTS "homepage_hero";
  ALTER TABLE "hr_media" DROP COLUMN IF EXISTS "section_hero_slug";`)
}
