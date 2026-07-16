import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_hr_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__hr_articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_hr_ad_creatives_slot_targets" AS ENUM('article-inline', 'sidebar', 'home-feed');
  CREATE TABLE "hr_cms_users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "hr_cms_users" (
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
  
  CREATE TABLE "hr_categories" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"order" numeric DEFAULT 0,
  	"accent_hex" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "hr_authors" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"bio" varchar,
  	"avatar_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "hr_articles" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"short_id" varchar,
  	"title" varchar,
  	"dek" varchar,
  	"slug" varchar,
  	"kicker" varchar,
  	"section_id" uuid,
  	"author_id" uuid,
  	"hero_image_url" varchar,
  	"hero_image_alt" varchar,
  	"body_lexical" jsonb,
  	"publish_at" timestamp(3) with time zone,
  	"published_at" timestamp(3) with time zone,
  	"event_date" timestamp(3) with time zone,
  	"read_time_min" numeric,
  	"is_pro" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_hr_articles_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_hr_articles_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_short_id" varchar,
  	"version_title" varchar,
  	"version_dek" varchar,
  	"version_slug" varchar,
  	"version_kicker" varchar,
  	"version_section_id" uuid,
  	"version_author_id" uuid,
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
  	"version__status" "enum__hr_articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "hr_breaking" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"headline" varchar NOT NULL,
  	"description" varchar,
  	"image_url" varchar,
  	"article_id" uuid,
  	"is_active" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "hr_ad_creatives_slot_targets" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_hr_ad_creatives_slot_targets",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "hr_ad_creatives" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"advertiser" varchar NOT NULL,
  	"creative_url" varchar NOT NULL,
  	"dest_url" varchar NOT NULL,
  	"weight" numeric DEFAULT 1,
  	"flight_start" timestamp(3) with time zone,
  	"flight_end" timestamp(3) with time zone,
  	"is_trusted" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "hr_corrections" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"article_id" uuid NOT NULL,
  	"description" varchar NOT NULL,
  	"corrected_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"hr_cms_users_id" uuid,
  	"hr_categories_id" uuid,
  	"hr_authors_id" uuid,
  	"hr_articles_id" uuid,
  	"hr_breaking_id" uuid,
  	"hr_ad_creatives_id" uuid,
  	"hr_corrections_id" uuid
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"hr_cms_users_id" uuid
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "hr_cms_users_sessions" ADD CONSTRAINT "hr_cms_users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hr_cms_users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hr_articles" ADD CONSTRAINT "hr_articles_section_id_hr_categories_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."hr_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hr_articles" ADD CONSTRAINT "hr_articles_author_id_hr_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."hr_authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hr_articles_v" ADD CONSTRAINT "_hr_articles_v_parent_id_hr_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."hr_articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hr_articles_v" ADD CONSTRAINT "_hr_articles_v_version_section_id_hr_categories_id_fk" FOREIGN KEY ("version_section_id") REFERENCES "public"."hr_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hr_articles_v" ADD CONSTRAINT "_hr_articles_v_version_author_id_hr_authors_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."hr_authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hr_breaking" ADD CONSTRAINT "hr_breaking_article_id_hr_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."hr_articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hr_ad_creatives_slot_targets" ADD CONSTRAINT "hr_ad_creatives_slot_targets_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."hr_ad_creatives"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hr_corrections" ADD CONSTRAINT "hr_corrections_article_id_hr_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."hr_articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hr_cms_users_fk" FOREIGN KEY ("hr_cms_users_id") REFERENCES "public"."hr_cms_users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hr_categories_fk" FOREIGN KEY ("hr_categories_id") REFERENCES "public"."hr_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hr_authors_fk" FOREIGN KEY ("hr_authors_id") REFERENCES "public"."hr_authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hr_articles_fk" FOREIGN KEY ("hr_articles_id") REFERENCES "public"."hr_articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hr_breaking_fk" FOREIGN KEY ("hr_breaking_id") REFERENCES "public"."hr_breaking"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hr_ad_creatives_fk" FOREIGN KEY ("hr_ad_creatives_id") REFERENCES "public"."hr_ad_creatives"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hr_corrections_fk" FOREIGN KEY ("hr_corrections_id") REFERENCES "public"."hr_corrections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_hr_cms_users_fk" FOREIGN KEY ("hr_cms_users_id") REFERENCES "public"."hr_cms_users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "hr_cms_users_sessions_order_idx" ON "hr_cms_users_sessions" USING btree ("_order");
  CREATE INDEX "hr_cms_users_sessions_parent_id_idx" ON "hr_cms_users_sessions" USING btree ("_parent_id");
  CREATE INDEX "hr_cms_users_updated_at_idx" ON "hr_cms_users" USING btree ("updated_at");
  CREATE INDEX "hr_cms_users_created_at_idx" ON "hr_cms_users" USING btree ("created_at");
  CREATE UNIQUE INDEX "hr_cms_users_email_idx" ON "hr_cms_users" USING btree ("email");
  CREATE UNIQUE INDEX "hr_categories_slug_idx" ON "hr_categories" USING btree ("slug");
  CREATE INDEX "hr_categories_updated_at_idx" ON "hr_categories" USING btree ("updated_at");
  CREATE INDEX "hr_categories_created_at_idx" ON "hr_categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "hr_authors_slug_idx" ON "hr_authors" USING btree ("slug");
  CREATE INDEX "hr_authors_updated_at_idx" ON "hr_authors" USING btree ("updated_at");
  CREATE INDEX "hr_authors_created_at_idx" ON "hr_authors" USING btree ("created_at");
  CREATE UNIQUE INDEX "hr_articles_short_id_idx" ON "hr_articles" USING btree ("short_id");
  CREATE INDEX "hr_articles_section_idx" ON "hr_articles" USING btree ("section_id");
  CREATE INDEX "hr_articles_author_idx" ON "hr_articles" USING btree ("author_id");
  CREATE INDEX "hr_articles_updated_at_idx" ON "hr_articles" USING btree ("updated_at");
  CREATE INDEX "hr_articles_created_at_idx" ON "hr_articles" USING btree ("created_at");
  CREATE INDEX "hr_articles__status_idx" ON "hr_articles" USING btree ("_status");
  CREATE INDEX "_hr_articles_v_parent_idx" ON "_hr_articles_v" USING btree ("parent_id");
  CREATE INDEX "_hr_articles_v_version_version_short_id_idx" ON "_hr_articles_v" USING btree ("version_short_id");
  CREATE INDEX "_hr_articles_v_version_version_section_idx" ON "_hr_articles_v" USING btree ("version_section_id");
  CREATE INDEX "_hr_articles_v_version_version_author_idx" ON "_hr_articles_v" USING btree ("version_author_id");
  CREATE INDEX "_hr_articles_v_version_version_updated_at_idx" ON "_hr_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_hr_articles_v_version_version_created_at_idx" ON "_hr_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_hr_articles_v_version_version__status_idx" ON "_hr_articles_v" USING btree ("version__status");
  CREATE INDEX "_hr_articles_v_created_at_idx" ON "_hr_articles_v" USING btree ("created_at");
  CREATE INDEX "_hr_articles_v_updated_at_idx" ON "_hr_articles_v" USING btree ("updated_at");
  CREATE INDEX "_hr_articles_v_latest_idx" ON "_hr_articles_v" USING btree ("latest");
  CREATE INDEX "hr_breaking_article_idx" ON "hr_breaking" USING btree ("article_id");
  CREATE INDEX "hr_breaking_updated_at_idx" ON "hr_breaking" USING btree ("updated_at");
  CREATE INDEX "hr_breaking_created_at_idx" ON "hr_breaking" USING btree ("created_at");
  CREATE INDEX "hr_ad_creatives_slot_targets_order_idx" ON "hr_ad_creatives_slot_targets" USING btree ("order");
  CREATE INDEX "hr_ad_creatives_slot_targets_parent_idx" ON "hr_ad_creatives_slot_targets" USING btree ("parent_id");
  CREATE INDEX "hr_ad_creatives_updated_at_idx" ON "hr_ad_creatives" USING btree ("updated_at");
  CREATE INDEX "hr_ad_creatives_created_at_idx" ON "hr_ad_creatives" USING btree ("created_at");
  CREATE INDEX "hr_corrections_article_idx" ON "hr_corrections" USING btree ("article_id");
  CREATE INDEX "hr_corrections_updated_at_idx" ON "hr_corrections" USING btree ("updated_at");
  CREATE INDEX "hr_corrections_created_at_idx" ON "hr_corrections" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_hr_cms_users_id_idx" ON "payload_locked_documents_rels" USING btree ("hr_cms_users_id");
  CREATE INDEX "payload_locked_documents_rels_hr_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("hr_categories_id");
  CREATE INDEX "payload_locked_documents_rels_hr_authors_id_idx" ON "payload_locked_documents_rels" USING btree ("hr_authors_id");
  CREATE INDEX "payload_locked_documents_rels_hr_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("hr_articles_id");
  CREATE INDEX "payload_locked_documents_rels_hr_breaking_id_idx" ON "payload_locked_documents_rels" USING btree ("hr_breaking_id");
  CREATE INDEX "payload_locked_documents_rels_hr_ad_creatives_id_idx" ON "payload_locked_documents_rels" USING btree ("hr_ad_creatives_id");
  CREATE INDEX "payload_locked_documents_rels_hr_corrections_id_idx" ON "payload_locked_documents_rels" USING btree ("hr_corrections_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_hr_cms_users_id_idx" ON "payload_preferences_rels" USING btree ("hr_cms_users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "hr_cms_users_sessions" CASCADE;
  DROP TABLE "hr_cms_users" CASCADE;
  DROP TABLE "hr_categories" CASCADE;
  DROP TABLE "hr_authors" CASCADE;
  DROP TABLE "hr_articles" CASCADE;
  DROP TABLE "_hr_articles_v" CASCADE;
  DROP TABLE "hr_breaking" CASCADE;
  DROP TABLE "hr_ad_creatives_slot_targets" CASCADE;
  DROP TABLE "hr_ad_creatives" CASCADE;
  DROP TABLE "hr_corrections" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_hr_articles_status";
  DROP TYPE "public"."enum__hr_articles_v_version_status";
  DROP TYPE "public"."enum_hr_ad_creatives_slot_targets";`)
}
