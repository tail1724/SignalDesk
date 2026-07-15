import type { CollectionConfig } from "payload";

export const Categories: CollectionConfig = {
  slug: "hr_categories",
  admin: { useAsTitle: "name" },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true },
    { name: "order", type: "number", defaultValue: 0 },
    { name: "accent_hex", type: "text" },
  ],
};
