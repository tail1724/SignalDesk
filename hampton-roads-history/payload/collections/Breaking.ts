import type { CollectionConfig } from "payload";
import { fireRevalidate } from "@/payload/hooks/revalidate";

export const Breaking: CollectionConfig = {
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

        await fireRevalidate(req.payload, "breaking.updated", { id: doc.id }, "Breaking");
      },
    ],
  },
};
