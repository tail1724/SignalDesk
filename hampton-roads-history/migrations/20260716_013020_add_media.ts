import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "hr_media" (
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
  
  ALTER TABLE "hr_articles" ADD COLUMN "hero_media_id" uuid;
  ALTER TABLE "_hr_articles_v" ADD COLUMN "version_hero_media_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "hr_media_id" uuid;
  CREATE INDEX "hr_media_updated_at_idx" ON "hr_media" USING btree ("updated_at");
  CREATE INDEX "hr_media_created_at_idx" ON "hr_media" USING btree ("created_at");
  CREATE UNIQUE INDEX "hr_media_filename_idx" ON "hr_media" USING btree ("filename");
  ALTER TABLE "hr_articles" ADD CONSTRAINT "hr_articles_hero_media_id_hr_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "public"."hr_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hr_articles_v" ADD CONSTRAINT "_hr_articles_v_version_hero_media_id_hr_media_id_fk" FOREIGN KEY ("version_hero_media_id") REFERENCES "public"."hr_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hr_media_fk" FOREIGN KEY ("hr_media_id") REFERENCES "public"."hr_media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "hr_articles_hero_media_idx" ON "hr_articles" USING btree ("hero_media_id");
  CREATE INDEX "_hr_articles_v_version_version_hero_media_idx" ON "_hr_articles_v" USING btree ("version_hero_media_id");
  CREATE INDEX "payload_locked_documents_rels_hr_media_id_idx" ON "payload_locked_documents_rels" USING btree ("hr_media_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hr_media" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "hr_media" CASCADE;
  ALTER TABLE "hr_articles" DROP CONSTRAINT "hr_articles_hero_media_id_hr_media_id_fk";
  
  ALTER TABLE "_hr_articles_v" DROP CONSTRAINT "_hr_articles_v_version_hero_media_id_hr_media_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_hr_media_fk";
  
  DROP INDEX "hr_articles_hero_media_idx";
  DROP INDEX "_hr_articles_v_version_version_hero_media_idx";
  DROP INDEX "payload_locked_documents_rels_hr_media_id_idx";
  ALTER TABLE "hr_articles" DROP COLUMN "hero_media_id";
  ALTER TABLE "_hr_articles_v" DROP COLUMN "version_hero_media_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "hr_media_id";`)
}
