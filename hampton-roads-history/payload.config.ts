import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || "",
  db: postgresAdapter({
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
          name: "section_id",
          type: "relationship",
          relationTo: "hr_categories",
        },
        {
          name: "author_id",
          type: "relationship",
          relationTo: "hr_authors",
        },
        { name: "hero_image_url", type: "text" },
        { name: "hero_image_alt", type: "text" },
        {
          name: "status",
          type: "select",
          options: ["draft", "published", "archived"],
          defaultValue: "draft",
        },
        { name: "body_lexical", type: "richText", editor: lexicalEditor({}) },
        { name: "publish_at", type: "date" },
        { name: "published_at", type: "date" },
        { name: "read_time_min", type: "number" },
        { name: "is_pro", type: "checkbox", defaultValue: false },
      ],
      hooks: {
        afterChange: [
          async ({ doc, req }) => {
            // Notify Next.js ISR to revalidate affected pages
            if (doc.status === "published") {
              try {
                await fetch(
                  `${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "x-webhook-signature": "TODO-hmac-sign",
                    },
                    body: JSON.stringify({
                      type: "article.published",
                      data: { id: doc.id, short_id: doc.short_id },
                    }),
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
          name: "article_id",
          type: "relationship",
          relationTo: "hr_articles",
        },
        { name: "is_active", type: "checkbox", defaultValue: false },
      ],
    },
  ],
  typescript: {
    outputFile: "./payload-types.ts",
  },
});
