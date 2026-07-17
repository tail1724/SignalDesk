import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_hr_articles_rights_status" AS ENUM('none', 'clear', 'pending_review');
  CREATE TYPE "public"."enum__hr_articles_v_version_rights_status" AS ENUM('none', 'clear', 'pending_review');
  CREATE TYPE "public"."enum_hr_campaigns_status" AS ENUM('draft', 'active', 'paused', 'completed');
  CREATE TYPE "public"."enum_hr_placements_route_type" AS ENUM('home', 'section', 'article');
  ALTER TYPE "public"."enum_hr_cms_users_role" ADD VALUE 'sales' BEFORE 'analyst';
  ALTER TYPE "public"."enum_hr_audit_events_actor_role" ADD VALUE 'sales' BEFORE 'analyst';
  CREATE TABLE "hr_advertisers" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar NOT NULL,
  	"contact_name" varchar,
  	"contact_email" varchar,
  	"sales_rep_id" uuid,
  	"blocked_categories" jsonb,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "hr_campaigns" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar NOT NULL,
  	"advertiser_id" uuid NOT NULL,
  	"sales_rep_id" uuid,
  	"flight_start" timestamp(3) with time zone,
  	"flight_end" timestamp(3) with time zone,
  	"status" "enum_hr_campaigns_status" DEFAULT 'draft' NOT NULL,
  	"budget_note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "hr_placements" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"placement_id" varchar NOT NULL,
  	"label" varchar,
  	"desktop_width" numeric,
  	"desktop_height" numeric,
  	"mobile_width" numeric,
  	"mobile_height" numeric,
  	"eligibility_rule" varchar,
  	"demand_tier_order" jsonb,
  	"refresh_allowed" boolean DEFAULT false,
  	"route_type" "enum_hr_placements_route_type" NOT NULL,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "hr_articles" ADD COLUMN "rights_status" "enum_hr_articles_rights_status" DEFAULT 'none';
  ALTER TABLE "_hr_articles_v" ADD COLUMN "version_rights_status" "enum__hr_articles_v_version_rights_status" DEFAULT 'none';
  ALTER TABLE "hr_ad_creatives" ADD COLUMN "campaign_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "hr_advertisers_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "hr_campaigns_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "hr_placements_id" uuid;
  ALTER TABLE "hr_advertisers" ADD CONSTRAINT "hr_advertisers_sales_rep_id_hr_cms_users_id_fk" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."hr_cms_users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hr_campaigns" ADD CONSTRAINT "hr_campaigns_advertiser_id_hr_advertisers_id_fk" FOREIGN KEY ("advertiser_id") REFERENCES "public"."hr_advertisers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hr_campaigns" ADD CONSTRAINT "hr_campaigns_sales_rep_id_hr_cms_users_id_fk" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."hr_cms_users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "hr_advertisers_name_idx" ON "hr_advertisers" USING btree ("name");
  CREATE INDEX "hr_advertisers_sales_rep_idx" ON "hr_advertisers" USING btree ("sales_rep_id");
  CREATE INDEX "hr_advertisers_updated_at_idx" ON "hr_advertisers" USING btree ("updated_at");
  CREATE INDEX "hr_advertisers_created_at_idx" ON "hr_advertisers" USING btree ("created_at");
  CREATE INDEX "hr_campaigns_name_idx" ON "hr_campaigns" USING btree ("name");
  CREATE INDEX "hr_campaigns_advertiser_idx" ON "hr_campaigns" USING btree ("advertiser_id");
  CREATE INDEX "hr_campaigns_sales_rep_idx" ON "hr_campaigns" USING btree ("sales_rep_id");
  CREATE INDEX "hr_campaigns_status_idx" ON "hr_campaigns" USING btree ("status");
  CREATE INDEX "hr_campaigns_updated_at_idx" ON "hr_campaigns" USING btree ("updated_at");
  CREATE INDEX "hr_campaigns_created_at_idx" ON "hr_campaigns" USING btree ("created_at");
  CREATE UNIQUE INDEX "hr_placements_placement_id_idx" ON "hr_placements" USING btree ("placement_id");
  CREATE INDEX "hr_placements_route_type_idx" ON "hr_placements" USING btree ("route_type");
  CREATE INDEX "hr_placements_active_idx" ON "hr_placements" USING btree ("active");
  CREATE INDEX "hr_placements_updated_at_idx" ON "hr_placements" USING btree ("updated_at");
  CREATE INDEX "hr_placements_created_at_idx" ON "hr_placements" USING btree ("created_at");
  ALTER TABLE "hr_ad_creatives" ADD CONSTRAINT "hr_ad_creatives_campaign_id_hr_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."hr_campaigns"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hr_advertisers_fk" FOREIGN KEY ("hr_advertisers_id") REFERENCES "public"."hr_advertisers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hr_campaigns_fk" FOREIGN KEY ("hr_campaigns_id") REFERENCES "public"."hr_campaigns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hr_placements_fk" FOREIGN KEY ("hr_placements_id") REFERENCES "public"."hr_placements"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "hr_articles_rights_status_idx" ON "hr_articles" USING btree ("rights_status");
  CREATE INDEX "_hr_articles_v_version_version_rights_status_idx" ON "_hr_articles_v" USING btree ("version_rights_status");
  CREATE INDEX "hr_ad_creatives_campaign_idx" ON "hr_ad_creatives" USING btree ("campaign_id");
  CREATE INDEX "payload_locked_documents_rels_hr_advertisers_id_idx" ON "payload_locked_documents_rels" USING btree ("hr_advertisers_id");
  CREATE INDEX "payload_locked_documents_rels_hr_campaigns_id_idx" ON "payload_locked_documents_rels" USING btree ("hr_campaigns_id");
  CREATE INDEX "payload_locked_documents_rels_hr_placements_id_idx" ON "payload_locked_documents_rels" USING btree ("hr_placements_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hr_advertisers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hr_campaigns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hr_placements" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "hr_advertisers" CASCADE;
  DROP TABLE "hr_campaigns" CASCADE;
  DROP TABLE "hr_placements" CASCADE;
  ALTER TABLE "hr_ad_creatives" DROP CONSTRAINT "hr_ad_creatives_campaign_id_hr_campaigns_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_hr_advertisers_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_hr_campaigns_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_hr_placements_fk";
  
  ALTER TABLE "hr_cms_users" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "hr_cms_users" ALTER COLUMN "role" SET DEFAULT 'reporter'::text;
  DROP TYPE "public"."enum_hr_cms_users_role";
  CREATE TYPE "public"."enum_hr_cms_users_role" AS ENUM('super_admin', 'managing_editor', 'copy_editor', 'reporter', 'ad_ops', 'analyst', 'ai_service');
  ALTER TABLE "hr_cms_users" ALTER COLUMN "role" SET DEFAULT 'reporter'::"public"."enum_hr_cms_users_role";
  ALTER TABLE "hr_cms_users" ALTER COLUMN "role" SET DATA TYPE "public"."enum_hr_cms_users_role" USING "role"::"public"."enum_hr_cms_users_role";
  ALTER TABLE "hr_audit_events" ALTER COLUMN "actor_role" SET DATA TYPE text;
  DROP TYPE "public"."enum_hr_audit_events_actor_role";
  CREATE TYPE "public"."enum_hr_audit_events_actor_role" AS ENUM('system', 'super_admin', 'managing_editor', 'copy_editor', 'reporter', 'ad_ops', 'analyst', 'ai_service');
  ALTER TABLE "hr_audit_events" ALTER COLUMN "actor_role" SET DATA TYPE "public"."enum_hr_audit_events_actor_role" USING "actor_role"::"public"."enum_hr_audit_events_actor_role";
  DROP INDEX "hr_articles_rights_status_idx";
  DROP INDEX "_hr_articles_v_version_version_rights_status_idx";
  DROP INDEX "hr_ad_creatives_campaign_idx";
  DROP INDEX "payload_locked_documents_rels_hr_advertisers_id_idx";
  DROP INDEX "payload_locked_documents_rels_hr_campaigns_id_idx";
  DROP INDEX "payload_locked_documents_rels_hr_placements_id_idx";
  ALTER TABLE "hr_articles" DROP COLUMN "rights_status";
  ALTER TABLE "_hr_articles_v" DROP COLUMN "version_rights_status";
  ALTER TABLE "hr_ad_creatives" DROP COLUMN "campaign_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "hr_advertisers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "hr_campaigns_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "hr_placements_id";
  DROP TYPE "public"."enum_hr_articles_rights_status";
  DROP TYPE "public"."enum__hr_articles_v_version_rights_status";
  DROP TYPE "public"."enum_hr_campaigns_status";
  DROP TYPE "public"."enum_hr_placements_route_type";`)
}
