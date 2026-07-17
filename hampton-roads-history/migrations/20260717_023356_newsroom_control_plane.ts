import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_hr_cms_users_role" AS ENUM('super_admin', 'managing_editor', 'copy_editor', 'reporter', 'ad_ops', 'analyst', 'ai_service');
  CREATE TYPE "public"."enum_hr_cms_users_desk" AS ENUM('Audience', 'Business', 'Civic', 'Culture', 'Defense & port', 'History', 'Service');
  CREATE TYPE "public"."enum_hr_articles_workflow_stage" AS ENUM('intake', 'reporting', 'draft', 'changes_requested', 'copy_edit', 'legal_review', 'ready', 'scheduled', 'published');
  CREATE TYPE "public"."enum_hr_articles_priority" AS ENUM('standard', 'urgent', 'breaking');
  CREATE TYPE "public"."enum_hr_articles_desk" AS ENUM('audience', 'business', 'civic', 'culture', 'defense_port', 'history', 'service');
  CREATE TYPE "public"."enum_hr_articles_source_origin" AS ENUM('payload', 'hunts_pointe', 'api', 'import');
  CREATE TYPE "public"."enum__hr_articles_v_version_workflow_stage" AS ENUM('intake', 'reporting', 'draft', 'changes_requested', 'copy_edit', 'legal_review', 'ready', 'scheduled', 'published');
  CREATE TYPE "public"."enum__hr_articles_v_version_priority" AS ENUM('standard', 'urgent', 'breaking');
  CREATE TYPE "public"."enum__hr_articles_v_version_desk" AS ENUM('audience', 'business', 'civic', 'culture', 'defense_port', 'history', 'service');
  CREATE TYPE "public"."enum__hr_articles_v_version_source_origin" AS ENUM('payload', 'hunts_pointe', 'api', 'import');
  CREATE TYPE "public"."enum_hr_ad_creatives_scan_status" AS ENUM('pending', 'scanning', 'passed', 'failed', 'quarantined');
  CREATE TYPE "public"."enum_hr_integration_receipts_source" AS ENUM('hunts_pointe', 'api', 'import');
  CREATE TYPE "public"."enum_hr_integration_receipts_status" AS ENUM('processing', 'completed', 'failed');
  CREATE TYPE "public"."enum_hr_audit_events_actor_role" AS ENUM('system', 'super_admin', 'managing_editor', 'copy_editor', 'reporter', 'ad_ops', 'analyst', 'ai_service');
  CREATE TABLE "hr_integration_receipts" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"idempotency_key" varchar NOT NULL,
  	"source" "enum_hr_integration_receipts_source" NOT NULL,
  	"source_document_id" varchar,
  	"source_version" numeric,
  	"payload_hash" varchar NOT NULL,
  	"status" "enum_hr_integration_receipts_status" DEFAULT 'processing' NOT NULL,
  	"article_id" uuid,
  	"error_code" varchar,
  	"received_at" timestamp(3) with time zone NOT NULL,
  	"last_seen_at" timestamp(3) with time zone NOT NULL,
  	"metadata" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "hr_audit_events" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"action" varchar NOT NULL,
  	"actor_email" varchar NOT NULL,
  	"actor_id" varchar,
  	"actor_role" "enum_hr_audit_events_actor_role" NOT NULL,
  	"object_type" varchar NOT NULL,
  	"object_id" varchar,
  	"before_hash" varchar,
  	"after_hash" varchar,
  	"reason" varchar,
  	"metadata" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "hr_cms_users" ADD COLUMN "display_name" varchar;
  ALTER TABLE "hr_cms_users" ADD COLUMN "role" "enum_hr_cms_users_role" DEFAULT 'reporter' NOT NULL;
  UPDATE "hr_cms_users" SET "role" = 'super_admin';
  ALTER TABLE "hr_cms_users" ADD COLUMN "desk" "enum_hr_cms_users_desk";
  ALTER TABLE "hr_cms_users" ADD COLUMN "active" boolean DEFAULT true;
  ALTER TABLE "hr_articles" ADD COLUMN "media_provenance" jsonb;
  ALTER TABLE "hr_articles" ADD COLUMN "workflow_stage" "enum_hr_articles_workflow_stage" DEFAULT 'draft';
  ALTER TABLE "hr_articles" ADD COLUMN "priority" "enum_hr_articles_priority" DEFAULT 'standard';
  ALTER TABLE "hr_articles" ADD COLUMN "desk" "enum_hr_articles_desk";
  ALTER TABLE "hr_articles" ADD COLUMN "assignee_id" uuid;
  ALTER TABLE "hr_articles" ADD COLUMN "fact_checked" boolean DEFAULT false;
  ALTER TABLE "hr_articles" ADD COLUMN "sources_checked" boolean DEFAULT false;
  ALTER TABLE "hr_articles" ADD COLUMN "rights_checked" boolean DEFAULT false;
  ALTER TABLE "hr_articles" ADD COLUMN "disclosure_checked" boolean DEFAULT false;
  ALTER TABLE "hr_articles" ADD COLUMN "story_tags" jsonb;
  ALTER TABLE "hr_articles" ADD COLUMN "bylines" jsonb;
  ALTER TABLE "hr_articles" ADD COLUMN "ai_provenance" jsonb;
  ALTER TABLE "hr_articles" ADD COLUMN "source_origin" "enum_hr_articles_source_origin" DEFAULT 'payload';
  ALTER TABLE "hr_articles" ADD COLUMN "source_document_id" varchar;
  ALTER TABLE "hr_articles" ADD COLUMN "source_version" numeric;
  ALTER TABLE "hr_articles" ADD COLUMN "ingest_key" varchar;
  ALTER TABLE "hr_articles" ADD COLUMN "suggested_section" varchar;
  ALTER TABLE "hr_articles" ADD COLUMN "last_ingested_at" timestamp(3) with time zone;
  ALTER TABLE "_hr_articles_v" ADD COLUMN "version_media_provenance" jsonb;
  ALTER TABLE "_hr_articles_v" ADD COLUMN "version_workflow_stage" "enum__hr_articles_v_version_workflow_stage" DEFAULT 'draft';
  ALTER TABLE "_hr_articles_v" ADD COLUMN "version_priority" "enum__hr_articles_v_version_priority" DEFAULT 'standard';
  ALTER TABLE "_hr_articles_v" ADD COLUMN "version_desk" "enum__hr_articles_v_version_desk";
  ALTER TABLE "_hr_articles_v" ADD COLUMN "version_assignee_id" uuid;
  ALTER TABLE "_hr_articles_v" ADD COLUMN "version_fact_checked" boolean DEFAULT false;
  ALTER TABLE "_hr_articles_v" ADD COLUMN "version_sources_checked" boolean DEFAULT false;
  ALTER TABLE "_hr_articles_v" ADD COLUMN "version_rights_checked" boolean DEFAULT false;
  ALTER TABLE "_hr_articles_v" ADD COLUMN "version_disclosure_checked" boolean DEFAULT false;
  ALTER TABLE "_hr_articles_v" ADD COLUMN "version_story_tags" jsonb;
  ALTER TABLE "_hr_articles_v" ADD COLUMN "version_bylines" jsonb;
  ALTER TABLE "_hr_articles_v" ADD COLUMN "version_ai_provenance" jsonb;
  ALTER TABLE "_hr_articles_v" ADD COLUMN "version_source_origin" "enum__hr_articles_v_version_source_origin" DEFAULT 'payload';
  ALTER TABLE "_hr_articles_v" ADD COLUMN "version_source_document_id" varchar;
  ALTER TABLE "_hr_articles_v" ADD COLUMN "version_source_version" numeric;
  ALTER TABLE "_hr_articles_v" ADD COLUMN "version_ingest_key" varchar;
  ALTER TABLE "_hr_articles_v" ADD COLUMN "version_suggested_section" varchar;
  ALTER TABLE "_hr_articles_v" ADD COLUMN "version_last_ingested_at" timestamp(3) with time zone;
  ALTER TABLE "hr_ad_creatives" ADD COLUMN "scan_status" "enum_hr_ad_creatives_scan_status" DEFAULT 'pending' NOT NULL;
  ALTER TABLE "hr_ad_creatives" ADD COLUMN "human_approved" boolean DEFAULT false;
  ALTER TABLE "hr_ad_creatives" ADD COLUMN "scan_details" jsonb;
  ALTER TABLE "hr_ad_creatives" ADD COLUMN "reviewed_by_id" uuid;
  ALTER TABLE "hr_ad_creatives" ADD COLUMN "reviewed_at" timestamp(3) with time zone;
  UPDATE "hr_ad_creatives" SET "is_trusted" = false;
  ALTER TABLE "hr_ad_creatives" ADD CONSTRAINT "hr_ad_creatives_trust_gate" CHECK (NOT "is_trusted" OR ("scan_status" = 'passed' AND "human_approved" IS TRUE));
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "hr_integration_receipts_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "hr_audit_events_id" uuid;
  ALTER TABLE "hr_integration_receipts" ADD CONSTRAINT "hr_integration_receipts_article_id_hr_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."hr_articles"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "hr_integration_receipts_idempotency_key_idx" ON "hr_integration_receipts" USING btree ("idempotency_key");
  CREATE INDEX "hr_integration_receipts_source_idx" ON "hr_integration_receipts" USING btree ("source");
  CREATE INDEX "hr_integration_receipts_source_document_id_idx" ON "hr_integration_receipts" USING btree ("source_document_id");
  CREATE INDEX "hr_integration_receipts_payload_hash_idx" ON "hr_integration_receipts" USING btree ("payload_hash");
  CREATE INDEX "hr_integration_receipts_status_idx" ON "hr_integration_receipts" USING btree ("status");
  CREATE INDEX "hr_integration_receipts_article_idx" ON "hr_integration_receipts" USING btree ("article_id");
  CREATE INDEX "hr_integration_receipts_received_at_idx" ON "hr_integration_receipts" USING btree ("received_at");
  CREATE INDEX "hr_integration_receipts_updated_at_idx" ON "hr_integration_receipts" USING btree ("updated_at");
  CREATE INDEX "hr_integration_receipts_created_at_idx" ON "hr_integration_receipts" USING btree ("created_at");
  CREATE INDEX "hr_audit_events_action_idx" ON "hr_audit_events" USING btree ("action");
  CREATE INDEX "hr_audit_events_actor_email_idx" ON "hr_audit_events" USING btree ("actor_email");
  CREATE INDEX "hr_audit_events_actor_id_idx" ON "hr_audit_events" USING btree ("actor_id");
  CREATE INDEX "hr_audit_events_actor_role_idx" ON "hr_audit_events" USING btree ("actor_role");
  CREATE INDEX "hr_audit_events_object_type_idx" ON "hr_audit_events" USING btree ("object_type");
  CREATE INDEX "hr_audit_events_object_id_idx" ON "hr_audit_events" USING btree ("object_id");
  CREATE INDEX "hr_audit_events_updated_at_idx" ON "hr_audit_events" USING btree ("updated_at");
  CREATE INDEX "hr_audit_events_created_at_idx" ON "hr_audit_events" USING btree ("created_at");
  ALTER TABLE "hr_articles" ADD CONSTRAINT "hr_articles_assignee_id_hr_cms_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."hr_cms_users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hr_articles_v" ADD CONSTRAINT "_hr_articles_v_version_assignee_id_hr_cms_users_id_fk" FOREIGN KEY ("version_assignee_id") REFERENCES "public"."hr_cms_users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hr_ad_creatives" ADD CONSTRAINT "hr_ad_creatives_reviewed_by_id_hr_cms_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."hr_cms_users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hr_integration_receipts_fk" FOREIGN KEY ("hr_integration_receipts_id") REFERENCES "public"."hr_integration_receipts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hr_audit_events_fk" FOREIGN KEY ("hr_audit_events_id") REFERENCES "public"."hr_audit_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "hr_cms_users_display_name_idx" ON "hr_cms_users" USING btree ("display_name");
  CREATE INDEX "hr_cms_users_role_idx" ON "hr_cms_users" USING btree ("role");
  CREATE INDEX "hr_cms_users_active_idx" ON "hr_cms_users" USING btree ("active");
  CREATE INDEX "hr_articles_slug_idx" ON "hr_articles" USING btree ("slug");
  CREATE INDEX "hr_articles_title_idx" ON "hr_articles" USING btree ("title");
  CREATE INDEX "hr_articles_workflow_stage_idx" ON "hr_articles" USING btree ("workflow_stage");
  CREATE INDEX "hr_articles_priority_idx" ON "hr_articles" USING btree ("priority");
  CREATE INDEX "hr_articles_desk_idx" ON "hr_articles" USING btree ("desk");
  CREATE INDEX "hr_articles_assignee_idx" ON "hr_articles" USING btree ("assignee_id");
  CREATE INDEX "hr_articles_publish_at_idx" ON "hr_articles" USING btree ("publish_at");
  CREATE INDEX "hr_articles_published_at_idx" ON "hr_articles" USING btree ("published_at");
  CREATE INDEX "hr_articles_source_origin_idx" ON "hr_articles" USING btree ("source_origin");
  CREATE INDEX "hr_articles_source_document_id_idx" ON "hr_articles" USING btree ("source_document_id");
  CREATE UNIQUE INDEX "hr_articles_ingest_key_idx" ON "hr_articles" USING btree ("ingest_key");
  CREATE INDEX "hr_articles_last_ingested_at_idx" ON "hr_articles" USING btree ("last_ingested_at");
  CREATE INDEX "workflow_stage_priority_updatedAt_idx" ON "hr_articles" USING btree ("workflow_stage","priority","updated_at");
  CREATE INDEX "source_origin_source_document_id_idx" ON "hr_articles" USING btree ("source_origin","source_document_id");
  CREATE INDEX "_hr_articles_v_version_version_slug_idx" ON "_hr_articles_v" USING btree ("version_slug");
  CREATE INDEX "_hr_articles_v_version_version_title_idx" ON "_hr_articles_v" USING btree ("version_title");
  CREATE INDEX "_hr_articles_v_version_version_workflow_stage_idx" ON "_hr_articles_v" USING btree ("version_workflow_stage");
  CREATE INDEX "_hr_articles_v_version_version_priority_idx" ON "_hr_articles_v" USING btree ("version_priority");
  CREATE INDEX "_hr_articles_v_version_version_desk_idx" ON "_hr_articles_v" USING btree ("version_desk");
  CREATE INDEX "_hr_articles_v_version_version_assignee_idx" ON "_hr_articles_v" USING btree ("version_assignee_id");
  CREATE INDEX "_hr_articles_v_version_version_publish_at_idx" ON "_hr_articles_v" USING btree ("version_publish_at");
  CREATE INDEX "_hr_articles_v_version_version_published_at_idx" ON "_hr_articles_v" USING btree ("version_published_at");
  CREATE INDEX "_hr_articles_v_version_version_source_origin_idx" ON "_hr_articles_v" USING btree ("version_source_origin");
  CREATE INDEX "_hr_articles_v_version_version_source_document_id_idx" ON "_hr_articles_v" USING btree ("version_source_document_id");
  CREATE INDEX "_hr_articles_v_version_version_ingest_key_idx" ON "_hr_articles_v" USING btree ("version_ingest_key");
  CREATE INDEX "_hr_articles_v_version_version_last_ingested_at_idx" ON "_hr_articles_v" USING btree ("version_last_ingested_at");
  CREATE INDEX "version_workflow_stage_version_priority_version_updatedA_idx" ON "_hr_articles_v" USING btree ("version_workflow_stage","version_priority","version_updated_at");
  CREATE INDEX "version_source_origin_version_source_document_id_idx" ON "_hr_articles_v" USING btree ("version_source_origin","version_source_document_id");
  CREATE INDEX "hr_ad_creatives_scan_status_idx" ON "hr_ad_creatives" USING btree ("scan_status");
  CREATE INDEX "hr_ad_creatives_human_approved_idx" ON "hr_ad_creatives" USING btree ("human_approved");
  CREATE INDEX "hr_ad_creatives_reviewed_by_idx" ON "hr_ad_creatives" USING btree ("reviewed_by_id");
  CREATE INDEX "payload_locked_documents_rels_hr_integration_receipts_id_idx" ON "payload_locked_documents_rels" USING btree ("hr_integration_receipts_id");
  CREATE INDEX "payload_locked_documents_rels_hr_audit_events_id_idx" ON "payload_locked_documents_rels" USING btree ("hr_audit_events_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hr_integration_receipts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hr_audit_events" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "hr_integration_receipts" CASCADE;
  DROP TABLE "hr_audit_events" CASCADE;
  ALTER TABLE "hr_articles" DROP CONSTRAINT "hr_articles_assignee_id_hr_cms_users_id_fk";
  
  ALTER TABLE "_hr_articles_v" DROP CONSTRAINT "_hr_articles_v_version_assignee_id_hr_cms_users_id_fk";
  
  ALTER TABLE "hr_ad_creatives" DROP CONSTRAINT "hr_ad_creatives_reviewed_by_id_hr_cms_users_id_fk";
  ALTER TABLE "hr_ad_creatives" DROP CONSTRAINT "hr_ad_creatives_trust_gate";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_hr_integration_receipts_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_hr_audit_events_fk";
  
  DROP INDEX "hr_cms_users_display_name_idx";
  DROP INDEX "hr_cms_users_role_idx";
  DROP INDEX "hr_cms_users_active_idx";
  DROP INDEX "hr_articles_slug_idx";
  DROP INDEX "hr_articles_title_idx";
  DROP INDEX "hr_articles_workflow_stage_idx";
  DROP INDEX "hr_articles_priority_idx";
  DROP INDEX "hr_articles_desk_idx";
  DROP INDEX "hr_articles_assignee_idx";
  DROP INDEX "hr_articles_publish_at_idx";
  DROP INDEX "hr_articles_published_at_idx";
  DROP INDEX "hr_articles_source_origin_idx";
  DROP INDEX "hr_articles_source_document_id_idx";
  DROP INDEX "hr_articles_ingest_key_idx";
  DROP INDEX "hr_articles_last_ingested_at_idx";
  DROP INDEX "workflow_stage_priority_updatedAt_idx";
  DROP INDEX "source_origin_source_document_id_idx";
  DROP INDEX "_hr_articles_v_version_version_slug_idx";
  DROP INDEX "_hr_articles_v_version_version_title_idx";
  DROP INDEX "_hr_articles_v_version_version_workflow_stage_idx";
  DROP INDEX "_hr_articles_v_version_version_priority_idx";
  DROP INDEX "_hr_articles_v_version_version_desk_idx";
  DROP INDEX "_hr_articles_v_version_version_assignee_idx";
  DROP INDEX "_hr_articles_v_version_version_publish_at_idx";
  DROP INDEX "_hr_articles_v_version_version_published_at_idx";
  DROP INDEX "_hr_articles_v_version_version_source_origin_idx";
  DROP INDEX "_hr_articles_v_version_version_source_document_id_idx";
  DROP INDEX "_hr_articles_v_version_version_ingest_key_idx";
  DROP INDEX "_hr_articles_v_version_version_last_ingested_at_idx";
  DROP INDEX "version_workflow_stage_version_priority_version_updatedA_idx";
  DROP INDEX "version_source_origin_version_source_document_id_idx";
  DROP INDEX "hr_ad_creatives_scan_status_idx";
  DROP INDEX "hr_ad_creatives_human_approved_idx";
  DROP INDEX "hr_ad_creatives_reviewed_by_idx";
  DROP INDEX "payload_locked_documents_rels_hr_integration_receipts_id_idx";
  DROP INDEX "payload_locked_documents_rels_hr_audit_events_id_idx";
  ALTER TABLE "hr_cms_users" DROP COLUMN "display_name";
  ALTER TABLE "hr_cms_users" DROP COLUMN "role";
  ALTER TABLE "hr_cms_users" DROP COLUMN "desk";
  ALTER TABLE "hr_cms_users" DROP COLUMN "active";
  ALTER TABLE "hr_articles" DROP COLUMN "media_provenance";
  ALTER TABLE "hr_articles" DROP COLUMN "workflow_stage";
  ALTER TABLE "hr_articles" DROP COLUMN "priority";
  ALTER TABLE "hr_articles" DROP COLUMN "desk";
  ALTER TABLE "hr_articles" DROP COLUMN "assignee_id";
  ALTER TABLE "hr_articles" DROP COLUMN "fact_checked";
  ALTER TABLE "hr_articles" DROP COLUMN "sources_checked";
  ALTER TABLE "hr_articles" DROP COLUMN "rights_checked";
  ALTER TABLE "hr_articles" DROP COLUMN "disclosure_checked";
  ALTER TABLE "hr_articles" DROP COLUMN "story_tags";
  ALTER TABLE "hr_articles" DROP COLUMN "bylines";
  ALTER TABLE "hr_articles" DROP COLUMN "ai_provenance";
  ALTER TABLE "hr_articles" DROP COLUMN "source_origin";
  ALTER TABLE "hr_articles" DROP COLUMN "source_document_id";
  ALTER TABLE "hr_articles" DROP COLUMN "source_version";
  ALTER TABLE "hr_articles" DROP COLUMN "ingest_key";
  ALTER TABLE "hr_articles" DROP COLUMN "suggested_section";
  ALTER TABLE "hr_articles" DROP COLUMN "last_ingested_at";
  ALTER TABLE "_hr_articles_v" DROP COLUMN "version_media_provenance";
  ALTER TABLE "_hr_articles_v" DROP COLUMN "version_workflow_stage";
  ALTER TABLE "_hr_articles_v" DROP COLUMN "version_priority";
  ALTER TABLE "_hr_articles_v" DROP COLUMN "version_desk";
  ALTER TABLE "_hr_articles_v" DROP COLUMN "version_assignee_id";
  ALTER TABLE "_hr_articles_v" DROP COLUMN "version_fact_checked";
  ALTER TABLE "_hr_articles_v" DROP COLUMN "version_sources_checked";
  ALTER TABLE "_hr_articles_v" DROP COLUMN "version_rights_checked";
  ALTER TABLE "_hr_articles_v" DROP COLUMN "version_disclosure_checked";
  ALTER TABLE "_hr_articles_v" DROP COLUMN "version_story_tags";
  ALTER TABLE "_hr_articles_v" DROP COLUMN "version_bylines";
  ALTER TABLE "_hr_articles_v" DROP COLUMN "version_ai_provenance";
  ALTER TABLE "_hr_articles_v" DROP COLUMN "version_source_origin";
  ALTER TABLE "_hr_articles_v" DROP COLUMN "version_source_document_id";
  ALTER TABLE "_hr_articles_v" DROP COLUMN "version_source_version";
  ALTER TABLE "_hr_articles_v" DROP COLUMN "version_ingest_key";
  ALTER TABLE "_hr_articles_v" DROP COLUMN "version_suggested_section";
  ALTER TABLE "_hr_articles_v" DROP COLUMN "version_last_ingested_at";
  ALTER TABLE "hr_ad_creatives" DROP COLUMN "scan_status";
  ALTER TABLE "hr_ad_creatives" DROP COLUMN "human_approved";
  ALTER TABLE "hr_ad_creatives" DROP COLUMN "scan_details";
  ALTER TABLE "hr_ad_creatives" DROP COLUMN "reviewed_by_id";
  ALTER TABLE "hr_ad_creatives" DROP COLUMN "reviewed_at";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "hr_integration_receipts_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "hr_audit_events_id";
  DROP TYPE "public"."enum_hr_cms_users_role";
  DROP TYPE "public"."enum_hr_cms_users_desk";
  DROP TYPE "public"."enum_hr_articles_workflow_stage";
  DROP TYPE "public"."enum_hr_articles_priority";
  DROP TYPE "public"."enum_hr_articles_desk";
  DROP TYPE "public"."enum_hr_articles_source_origin";
  DROP TYPE "public"."enum__hr_articles_v_version_workflow_stage";
  DROP TYPE "public"."enum__hr_articles_v_version_priority";
  DROP TYPE "public"."enum__hr_articles_v_version_desk";
  DROP TYPE "public"."enum__hr_articles_v_version_source_origin";
  DROP TYPE "public"."enum_hr_ad_creatives_scan_status";
  DROP TYPE "public"."enum_hr_integration_receipts_source";
  DROP TYPE "public"."enum_hr_integration_receipts_status";
  DROP TYPE "public"."enum_hr_audit_events_actor_role";`)
}
