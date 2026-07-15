import type { CollectionConfig } from "payload";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { revalidateArticle } from "@/payload/hooks/revalidate";

export const Articles: CollectionConfig = {
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
    afterChange: [revalidateArticle],
  },
};
