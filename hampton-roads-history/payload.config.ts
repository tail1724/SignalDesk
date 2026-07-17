import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig } from "payload";
import { signWebhookPayload } from "@/lib/webhook";
import {
  canEditNewsroom,
  canManagePeople,
  canReadGovernance,
  canUseNewsroom,
  canUseRevenue,
  hasRole,
  hideGovernanceForUser,
  hideRevenueForUser,
  isAdminAuthenticated,
  isAuthenticated,
  isSuperAdmin,
  never,
  publishedOrNewsroom,
  selfOrPeopleManager,
} from "@/lib/payload/access";
import { recordAuditEvent } from "@/lib/payload/audit";
import { enforceArticlePublication } from "@/lib/payload/workflow";

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || "",
  db: postgresAdapter({
    // hr_* tables use uuid primary keys (uuid_generate_v4 / gen_random_uuid).
    // Without this, Payload defaults to serial/integer PKs and conflicts with
    // the existing schema on the very first migration.
    idType: "uuid",
    migrationDir: "./migrations",
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
  }),
  editor: lexicalEditor({}),
  admin: {
    user: "hr_cms_users",
    avatar: "gravatar",
    dateFormat: "MMM d, yyyy 'at' h:mm a",
    meta: {
      defaultOGImageType: "off",
      titleSuffix: " · Hampton Roads newsroom",
    },
    components: {
      actions: ["@/components/admin/AdminQuickActions"],
      beforeDashboard: ["@/components/admin/NewsroomDashboard"],
      beforeNavLinks: ["@/components/admin/NavStatus"],
      graphics: {
        Icon: "@/components/admin/BrandIcon",
        Logo: "@/components/admin/BrandLogo",
      },
    },
  },
  collections: [
    {
      slug: "hr_cms_users",
      auth: true,
      admin: {
        useAsTitle: "email",
        group: "People & access",
        defaultColumns: ["display_name", "email", "role", "active", "updatedAt"],
        enableListViewSelectAPI: true,
        pagination: { defaultLimit: 25, limits: [25, 50, 100] },
      },
      access: {
        admin: isAdminAuthenticated,
        create: isSuperAdmin,
        delete: isSuperAdmin,
        read: selfOrPeopleManager,
        update: selfOrPeopleManager,
      },
      fields: [
        { name: "display_name", type: "text", index: true },
        {
          name: "role",
          type: "select",
          required: true,
          defaultValue: "reporter",
          index: true,
          options: [
            { label: "Super administrator", value: "super_admin" },
            { label: "Managing editor", value: "managing_editor" },
            { label: "Copy editor", value: "copy_editor" },
            { label: "Reporter", value: "reporter" },
            { label: "Ad operations", value: "ad_ops" },
            { label: "Analyst", value: "analyst" },
            { label: "AI service", value: "ai_service" },
          ],
          admin: {
            description: "Deny-by-default newsroom role. AI service accounts cannot publish or operate advertising.",
          },
          access: {
            create: ({ req }) => !req.user || hasRole(req.user, ["super_admin"]),
            update: ({ req }) => hasRole(req.user, ["super_admin"]),
          },
        },
        {
          name: "desk",
          type: "select",
          options: ["Audience", "Business", "Civic", "Culture", "Defense & port", "History", "Service"],
          access: {
            create: ({ req }) => !req.user || hasRole(req.user, ["super_admin"]),
            update: ({ req }) => hasRole(req.user, ["super_admin", "managing_editor"]),
          },
        },
        {
          name: "active",
          type: "checkbox",
          defaultValue: true,
          index: true,
          access: {
            create: ({ req }) => !req.user || hasRole(req.user, ["super_admin"]),
            update: ({ req }) => hasRole(req.user, ["super_admin", "managing_editor"]),
          },
        },
      ],
      hooks: {
        beforeValidate: [
          async ({ data, operation, req }) => {
            if (operation !== "create" || req.user) return data;
            const existing = await req.payload.count({
              collection: "hr_cms_users",
              overrideAccess: true,
            });
            return existing.totalDocs === 0
              ? { ...data, active: true, role: "super_admin" }
              : data;
          },
        ],
        afterChange: [
          async ({ doc, operation, previousDoc, req }) => {
            await recordAuditEvent({
              action: `user.${operation}`,
              after: { active: doc.active, email: doc.email, role: doc.role },
              before: previousDoc
                ? { active: previousDoc.active, email: previousDoc.email, role: previousDoc.role }
                : undefined,
              objectId: doc.id,
              objectType: "hr_cms_users",
              req,
            });
          },
        ],
      },
    },
    {
      // Upload-enabled media library. Files are stored in Supabase Storage's
      // "hr-media" bucket via the s3Storage plugin (see `plugins` below).
      slug: "hr_media",
      admin: {
        useAsTitle: "filename",
        group: "Editorial",
        defaultColumns: ["filename", "alt", "credit", "updatedAt"],
        enableListViewSelectAPI: true,
        pagination: { defaultLimit: 50, limits: [25, 50, 100] },
      },
      access: {
        create: canEditNewsroom,
        delete: canManagePeople,
        read: isAuthenticated,
        update: canEditNewsroom,
      },
      upload: {
        mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"],
      },
      fields: [
        {
          name: "alt",
          type: "text",
          required: true,
          admin: { description: "Accessibility alt text — describe the image." },
        },
        { name: "caption", type: "text" },
        { name: "photographer", type: "text" },
        { name: "credit", type: "text" },
      ],
    },
    {
      slug: "hr_categories",
      admin: {
        useAsTitle: "name",
        group: "Editorial",
        defaultColumns: ["name", "slug", "order", "updatedAt"],
        enableListViewSelectAPI: true,
      },
      access: {
        create: canManagePeople,
        delete: canManagePeople,
        read: isAuthenticated,
        update: canManagePeople,
      },
      fields: [
        { name: "name", type: "text", required: true },
        { name: "slug", type: "text", required: true, unique: true },
        { name: "order", type: "number", defaultValue: 0 },
        { name: "accent_hex", type: "text" },
      ],
    },
    {
      slug: "hr_authors",
      admin: {
        useAsTitle: "name",
        group: "Editorial",
        defaultColumns: ["name", "slug", "updatedAt"],
        enableListViewSelectAPI: true,
      },
      access: {
        create: canEditNewsroom,
        delete: canManagePeople,
        read: isAuthenticated,
        update: canEditNewsroom,
      },
      fields: [
        { name: "name", type: "text", required: true },
        { name: "slug", type: "text", required: true, unique: true },
        { name: "bio", type: "textarea" },
        { name: "avatar_url", type: "text" },
      ],
    },
    {
      slug: "hr_articles",
      admin: {
        useAsTitle: "title",
        group: "Editorial",
        description: "High-throughput story desk with explicit ownership, quality, provenance, and publishing gates.",
        defaultColumns: ["title", "workflow_stage", "priority", "desk", "assignee", "_status", "updatedAt"],
        enableListViewSelectAPI: true,
        listSearchableFields: ["title", "dek", "short_id", "slug", "source_document_id"],
        pagination: { defaultLimit: 50, limits: [25, 50, 100, 250] },
      },
      access: {
        create: canUseNewsroom,
        delete: canManagePeople,
        read: publishedOrNewsroom,
        update: canEditNewsroom,
      },
      versions: { drafts: true },
      indexes: [
        { fields: ["workflow_stage", "priority", "updatedAt"] },
        { fields: ["source_origin", "source_document_id"] },
      ],
      fields: [
        {
          type: "tabs",
          tabs: [
            {
              label: "Story",
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "short_id", type: "text", required: true, unique: true, index: true, admin: { width: "33%" } },
                    { name: "slug", type: "text", required: true, index: true, admin: { width: "67%" } },
                  ],
                },
                { name: "title", type: "text", required: true, index: true },
                { name: "dek", type: "textarea", maxLength: 500 },
                {
                  type: "row",
                  fields: [
                    { name: "kicker", type: "text", admin: { width: "33%" } },
                    {
                      // Field is named `section` so Payload's relationship column
                      // remains section_id and matches the existing database/RLS.
                      name: "section",
                      type: "relationship",
                      relationTo: "hr_categories",
                      index: true,
                      admin: { width: "33%" },
                    },
                    { name: "author", type: "relationship", relationTo: "hr_authors", index: true, admin: { width: "34%" } },
                  ],
                },
                { name: "body_lexical", type: "richText", editor: lexicalEditor({}) },
                {
                  type: "collapsible",
                  label: "Media & presentation",
                  admin: { initCollapsed: true },
                  fields: [
                    { name: "hero_media", type: "upload", relationTo: "hr_media" },
                    { name: "hero_image_url", type: "text" },
                    { name: "hero_image_alt", type: "text" },
                    { name: "media_provenance", type: "json", admin: { description: "Rights, source, credit, and transfer metadata from connected systems." } },
                  ],
                },
              ],
            },
            {
              label: "Workflow",
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "workflow_stage",
                      type: "select",
                      required: true,
                      defaultValue: "draft",
                      index: true,
                      admin: { width: "34%" },
                      options: [
                        { label: "Intake", value: "intake" },
                        { label: "Reporting", value: "reporting" },
                        { label: "Draft", value: "draft" },
                        { label: "Changes requested", value: "changes_requested" },
                        { label: "Copy edit", value: "copy_edit" },
                        { label: "Legal review", value: "legal_review" },
                        { label: "Ready", value: "ready" },
                        { label: "Scheduled", value: "scheduled" },
                        { label: "Published", value: "published" },
                      ],
                    },
                    {
                      name: "priority",
                      type: "select",
                      required: true,
                      defaultValue: "standard",
                      index: true,
                      admin: { width: "33%" },
                      options: ["standard", "urgent", "breaking"],
                    },
                    {
                      name: "desk",
                      type: "select",
                      index: true,
                      admin: { width: "33%" },
                      options: ["audience", "business", "civic", "culture", "defense_port", "history", "service"],
                    },
                  ],
                },
                { name: "assignee", type: "relationship", relationTo: "hr_cms_users", index: true },
                {
                  type: "row",
                  fields: [
                    { name: "publish_at", type: "date", index: true, admin: { width: "50%" } },
                    { name: "published_at", type: "date", index: true, admin: { width: "50%", readOnly: true } },
                  ],
                },
                {
                  type: "row",
                  fields: [
                    { name: "event_date", type: "date", admin: { width: "40%", description: "Historical event date, when applicable." } },
                    { name: "read_time_min", type: "number", min: 1, admin: { width: "30%" } },
                    { name: "is_pro", type: "checkbox", defaultValue: false, admin: { width: "30%" } },
                  ],
                },
              ],
            },
            {
              label: "Quality gate",
              fields: [
                {
                  type: "collapsible",
                  label: "Required before first publication",
                  fields: [
                    { name: "fact_checked", type: "checkbox", defaultValue: false, admin: { description: "Names, figures, dates, quotations, and claims have been verified." } },
                    { name: "sources_checked", type: "checkbox", defaultValue: false, admin: { description: "Sources and methodology are attached or disclosed." } },
                    { name: "rights_checked", type: "checkbox", defaultValue: false, admin: { description: "Media ownership, license, credit, and alt text are verified." } },
                    { name: "disclosure_checked", type: "checkbox", defaultValue: false, admin: { description: "AI, sponsorship, conflicts, and material limitations are disclosed." } },
                  ],
                },
                { name: "story_tags", type: "json", admin: { description: "Normalized topic tags. Seed Refiner values land here for human review." } },
                { name: "bylines", type: "json", admin: { description: "All submitted bylines and external author identifiers." } },
                { name: "ai_provenance", type: "json", admin: { description: "Model, prompt version, source set, safety results, and human editor receipt." } },
              ],
            },
            {
              label: "Integration",
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "source_origin",
                      type: "select",
                      defaultValue: "payload",
                      index: true,
                      admin: { width: "33%", readOnly: true },
                      options: ["payload", "hunts_pointe", "api", "import"],
                    },
                    { name: "source_document_id", type: "text", index: true, admin: { width: "47%", readOnly: true } },
                    { name: "source_version", type: "number", admin: { width: "20%", readOnly: true } },
                  ],
                },
                { name: "ingest_key", type: "text", unique: true, index: true, admin: { readOnly: true } },
                { name: "suggested_section", type: "text", admin: { readOnly: true, description: "Unknown external taxonomy is held here instead of silently creating a production section." } },
                { name: "last_ingested_at", type: "date", index: true, admin: { readOnly: true } },
              ],
            },
          ],
        },
      ],
      hooks: {
        beforeChange: [enforceArticlePublication],
        afterChange: [
          async ({ doc, operation, previousDoc, req }) => {
            await recordAuditEvent({
              action: `article.${operation}`,
              after: { status: doc._status, stage: doc.workflow_stage, title: doc.title },
              before: previousDoc ? { status: previousDoc._status, stage: previousDoc.workflow_stage, title: previousDoc.title } : undefined,
              metadata: { source_origin: doc.source_origin },
              objectId: doc.id,
              objectType: "hr_articles",
              req,
            });

            // Notify Next.js ISR to revalidate affected pages. `_status` is
            // Payload's canonical publish state (versions.drafts).
            if (doc._status === "published") {
              try {
                const body = JSON.stringify({
                  type: "article.published",
                  data: { id: doc.id, short_id: doc.short_id },
                });
                await fetch(
                  `${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "x-webhook-signature": signWebhookPayload(body),
                    },
                    body,
                  }
                );
              } catch (err) {
                req.payload.logger.error({ err }, "Revalidation webhook failed");
              }
            }
          },
        ],
      },
    },
    {
      slug: "hr_breaking",
      admin: {
        useAsTitle: "headline",
        group: "Live desk",
        defaultColumns: ["headline", "is_active", "article", "updatedAt"],
        enableListViewSelectAPI: true,
      },
      access: {
        create: canEditNewsroom,
        delete: canManagePeople,
        read: isAuthenticated,
        update: canEditNewsroom,
      },
      fields: [
        { name: "headline", type: "text", required: true },
        { name: "description", type: "textarea" },
        { name: "image_url", type: "text" },
        {
          // → column `article_id` (matches existing hr_breaking.article_id)
          name: "article",
          type: "relationship",
          relationTo: "hr_articles",
        },
        { name: "is_active", type: "checkbox", defaultValue: false },
      ],
      hooks: {
        afterChange: [
          async ({ doc, previousDoc, req }) => {
            // Only one banner may be active at a time
            if (doc.is_active && !previousDoc?.is_active) {
              await req.payload.update({
                collection: "hr_breaking",
                where: { and: [{ id: { not_equals: doc.id } }, { is_active: { equals: true } }] },
                data: { is_active: false },
              });
            }

            try {
              const body = JSON.stringify({
                type: "breaking.updated",
                data: { id: doc.id },
              });
              await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-webhook-signature": signWebhookPayload(body),
                },
                body,
              });
            } catch (err) {
              req.payload.logger.error({ err }, "Breaking revalidation webhook failed");
            }
          },
        ],
      },
    },
    {
      slug: "hr_ad_creatives",
      admin: {
        useAsTitle: "advertiser",
        group: "Revenue",
        hidden: hideRevenueForUser,
        defaultColumns: ["advertiser", "scan_status", "human_approved", "is_trusted", "flight_end", "updatedAt"],
        enableListViewSelectAPI: true,
        pagination: { defaultLimit: 50, limits: [25, 50, 100] },
      },
      access: {
        create: canUseRevenue,
        delete: canUseRevenue,
        read: canUseRevenue,
        update: canUseRevenue,
      },
      fields: [
        { name: "advertiser", type: "text", required: true },
        {
          name: "slot_targets",
          type: "select",
          hasMany: true,
          options: ["article-inline", "sidebar", "home-feed"],
        },
        { name: "creative_url", type: "text", required: true },
        { name: "dest_url", type: "text", required: true },
        { name: "weight", type: "number", defaultValue: 1, min: 1, max: 100 },
        { name: "flight_start", type: "date" },
        { name: "flight_end", type: "date" },
        {
          name: "scan_status",
          type: "select",
          required: true,
          defaultValue: "pending",
          index: true,
          options: ["pending", "scanning", "passed", "failed", "quarantined"],
          admin: {
            readOnly: true,
            description: "Scanner-owned state. Only a passed scan plus human approval can set the serving trust flag.",
          },
          access: {
            create: ({ req }) => !req.user || hasRole(req.user, ["super_admin"]),
            update: ({ req }) => !req.user || hasRole(req.user, ["super_admin"]),
          },
        },
        { name: "human_approved", type: "checkbox", defaultValue: false, index: true },
        {
          name: "scan_details",
          type: "json",
          admin: { readOnly: true },
          access: {
            create: ({ req }) => !req.user,
            update: ({ req }) => !req.user,
          },
        },
        {
          name: "reviewed_by",
          type: "relationship",
          relationTo: "hr_cms_users",
          admin: { readOnly: true },
          access: {
            create: () => false,
            update: () => false,
          },
        },
        {
          name: "reviewed_at",
          type: "date",
          admin: { readOnly: true },
          access: {
            create: () => false,
            update: () => false,
          },
        },
        {
          name: "is_trusted",
          type: "checkbox",
          defaultValue: false,
          admin: {
            readOnly: true,
            description:
              "Derived trust flag. Requires scan_status=passed and human_approved=true. HR_flag_ad_anomalies() may still auto-expire anomalous creatives.",
          },
        },
      ],
      hooks: {
        beforeChange: [
          async ({ data, originalDoc, req }) => {
            const next = { ...originalDoc, ...data };
            const trusted = next.scan_status === "passed" && next.human_approved === true;
            return {
              ...data,
              is_trusted: trusted,
              reviewed_at: trusted && !originalDoc?.is_trusted
                ? new Date().toISOString()
                : originalDoc?.reviewed_at,
              reviewed_by: trusted && !originalDoc?.is_trusted
                ? req.user?.id
                : originalDoc?.reviewed_by,
            };
          },
        ],
        afterChange: [
          async ({ doc, operation, previousDoc, req }) => {
            await recordAuditEvent({
              action: `creative.${operation}`,
              after: { scan_status: doc.scan_status, trusted: doc.is_trusted },
              before: previousDoc ? { scan_status: previousDoc.scan_status, trusted: previousDoc.is_trusted } : undefined,
              objectId: doc.id,
              objectType: "hr_ad_creatives",
              req,
            });
          },
        ],
      },
    },
    {
      slug: "hr_integration_receipts",
      admin: {
        useAsTitle: "idempotency_key",
        group: "Governance",
        hidden: hideGovernanceForUser,
        description: "Immutable-ish receipt trail for Seed Refiner and other server-to-server draft ingestion.",
        defaultColumns: ["source", "source_document_id", "source_version", "status", "article", "updatedAt"],
        enableListViewSelectAPI: true,
        pagination: { defaultLimit: 50, limits: [25, 50, 100, 250] },
      },
      access: {
        create: never,
        delete: never,
        read: canReadGovernance,
        update: never,
      },
      fields: [
        { name: "idempotency_key", type: "text", required: true, unique: true, index: true },
        { name: "source", type: "select", required: true, index: true, options: ["hunts_pointe", "api", "import"] },
        { name: "source_document_id", type: "text", index: true },
        { name: "source_version", type: "number" },
        { name: "payload_hash", type: "text", required: true, index: true },
        { name: "status", type: "select", required: true, defaultValue: "processing", index: true, options: ["processing", "completed", "failed"] },
        { name: "article", type: "relationship", relationTo: "hr_articles", index: true },
        { name: "error_code", type: "text" },
        { name: "received_at", type: "date", required: true, defaultValue: () => new Date().toISOString(), index: true },
        { name: "last_seen_at", type: "date", required: true, defaultValue: () => new Date().toISOString() },
        { name: "metadata", type: "json" },
      ],
    },
    {
      slug: "hr_audit_events",
      timestamps: true,
      admin: {
        useAsTitle: "action",
        group: "Governance",
        hidden: hideGovernanceForUser,
        description: "Append-only operational history. Mutations are server-only and every record carries actor/object hashes.",
        defaultColumns: ["action", "actor_email", "actor_role", "object_type", "object_id", "createdAt"],
        enableListViewSelectAPI: true,
        pagination: { defaultLimit: 100, limits: [50, 100, 250] },
      },
      access: {
        create: never,
        delete: never,
        read: canReadGovernance,
        update: never,
      },
      fields: [
        { name: "action", type: "text", required: true, index: true },
        { name: "actor_email", type: "text", required: true, index: true },
        { name: "actor_id", type: "text", index: true },
        {
          name: "actor_role",
          type: "select",
          required: true,
          index: true,
          options: ["system", "super_admin", "managing_editor", "copy_editor", "reporter", "ad_ops", "analyst", "ai_service"],
        },
        { name: "object_type", type: "text", required: true, index: true },
        { name: "object_id", type: "text", index: true },
        { name: "before_hash", type: "text" },
        { name: "after_hash", type: "text" },
        { name: "reason", type: "textarea" },
        { name: "metadata", type: "json" },
      ],
    },
    {
      slug: "hr_corrections",
      admin: {
        useAsTitle: "description",
        group: "Standards",
        defaultColumns: ["article", "description", "corrected_at", "updatedAt"],
        enableListViewSelectAPI: true,
        description:
          "Public corrections log (WS-20). Reports from readers arrive by email via /api/corrections → corrections@ — after review, add the correction here to publish it at the bottom of the affected article. Never write directly from a public form; this collection is staff-authored only.",
      },
      access: {
        create: canEditNewsroom,
        delete: canManagePeople,
        read: isAuthenticated,
        update: canEditNewsroom,
      },
      fields: [
        {
          // → column `article_id` (matches existing hr_corrections.article_id)
          name: "article",
          type: "relationship",
          relationTo: "hr_articles",
          required: true,
        },
        { name: "description", type: "textarea", required: true },
        { name: "corrected_at", type: "date", defaultValue: () => new Date().toISOString() },
      ],
      hooks: {
        afterChange: [
          async ({ doc, req }) => {
            try {
              const article = await req.payload.findByID({
                collection: "hr_articles",
                id: doc.article,
              });
              if (!article?.short_id) return;

              const body = JSON.stringify({
                type: "article.updated",
                data: { id: article.id, short_id: article.short_id },
              });
              await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-webhook-signature": signWebhookPayload(body),
                },
                body,
              });
            } catch (err) {
              req.payload.logger.error({ err }, "Correction revalidation webhook failed");
            }
          },
        ],
      },
    },
  ],
  plugins: [
    s3Storage({
      collections: {
        hr_media: { prefix: "media" },
      },
      bucket: "hr-media",
      config: {
        endpoint: process.env.SUPABASE_S3_ENDPOINT,
        region: process.env.SUPABASE_S3_REGION || "us-east-1",
        credentials: {
          accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY || "",
        },
        // Supabase's S3-compatible endpoint requires path-style addressing.
        forcePathStyle: true,
      },
    }),
  ],
  typescript: {
    outputFile: "./payload-types.ts",
  },
});
