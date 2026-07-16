import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig } from "payload";
import { signWebhookPayload } from "@/lib/webhook";

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
  },
  collections: [
    {
      slug: "hr_cms_users",
      auth: true,
      admin: { useAsTitle: "email" },
      fields: [],
    },
    {
      // Upload-enabled media library. Files are stored in Supabase Storage's
      // "hr-media" bucket via the s3Storage plugin (see `plugins` below).
      slug: "hr_media",
      admin: { useAsTitle: "filename" },
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
      admin: { useAsTitle: "name" },
      fields: [
        { name: "name", type: "text", required: true },
        { name: "slug", type: "text", required: true, unique: true },
        { name: "order", type: "number", defaultValue: 0 },
        { name: "accent_hex", type: "text" },
      ],
    },
    {
      slug: "hr_authors",
      admin: { useAsTitle: "name" },
      fields: [
        { name: "name", type: "text", required: true },
        { name: "slug", type: "text", required: true, unique: true },
        { name: "bio", type: "textarea" },
        { name: "avatar_url", type: "text" },
      ],
    },
    {
      slug: "hr_articles",
      admin: { useAsTitle: "title" },
      versions: { drafts: true },
      fields: [
        { name: "short_id", type: "text", required: true, unique: true },
        { name: "title", type: "text", required: true },
        { name: "dek", type: "textarea" },
        { name: "slug", type: "text", required: true },
        { name: "kicker", type: "text" },
        {
          // Field is named `section` so Payload's relationship column is
          // `section_id` (name + _id), matching the existing DB column that
          // data.ts / RPCs / RLS all reference. Renaming to `section_id` here
          // would make Payload generate `section_id_id` and break them.
          name: "section",
          type: "relationship",
          relationTo: "hr_categories",
        },
        {
          name: "author",
          type: "relationship",
          relationTo: "hr_authors",
        },
        { name: "hero_image_url", type: "text" },
        { name: "hero_image_alt", type: "text" },
        {
          // Editors pick/upload the hero here (column: hero_media_id).
          // hero_image_url is kept for existing articles + Hunt's Pointe
          // compatibility; frontend prefers hero_media when set.
          name: "hero_media",
          type: "upload",
          relationTo: "hr_media",
        },
        // Publication state is Payload's built-in `_status` (versions.drafts).
        // The legacy `status` text column that data.ts / RLS / the RPCs read is
        // NOT a Payload field — it is derived from `_status` by a DB trigger
        // (see the Supabase migration), so it stays in sync no matter who
        // writes the row (Payload, the Hunt's Pointe ingest, or raw SQL).
        { name: "body_lexical", type: "richText", editor: lexicalEditor({}) },
        { name: "publish_at", type: "date" },
        { name: "published_at", type: "date" },
        {
          name: "event_date",
          type: "date",
          admin: {
            description:
              "The calendar date of the historical event this piece is about (not when the article was published). Powers the \"On this day\" widget — leave blank if the piece doesn't cover a single dated event.",
          },
        },
        { name: "read_time_min", type: "number" },
        { name: "is_pro", type: "checkbox", defaultValue: false },
      ],
      hooks: {
        afterChange: [
          async ({ doc, req }) => {
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
      admin: { useAsTitle: "headline" },
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
      admin: { useAsTitle: "advertiser" },
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
          name: "is_trusted",
          type: "checkbox",
          defaultValue: false,
          admin: {
            description:
              "Only trusted creatives are served. HR_flag_ad_anomalies() (pg_cron, hourly) auto-expires flight_end for creatives whose click-through rate deviates >3 std dev from the hourly mean.",
          },
        },
      ],
    },
    {
      slug: "hr_corrections",
      admin: {
        useAsTitle: "description",
        description:
          "Public corrections log (WS-20). Reports from readers arrive by email via /api/corrections → corrections@ — after review, add the correction here to publish it at the bottom of the affected article. Never write directly from a public form; this collection is staff-authored only.",
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
