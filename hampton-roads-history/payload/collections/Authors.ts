import type { CollectionConfig } from "payload";

export const Authors: CollectionConfig = {
  slug: "hr_authors",
  admin: { useAsTitle: "name" },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true },
    { name: "bio", type: "textarea" },
    { name: "avatar_url", type: "text" },
  ],
};
