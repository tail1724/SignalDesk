import type { CollectionConfig } from "payload";
import { fireRevalidate } from "@/payload/hooks/revalidate";

export const Corrections: CollectionConfig = {
  slug: "hr_corrections",
  admin: {
    useAsTitle: "description",
    description:
      "Public corrections log (WS-20). Reports from readers arrive by email via /api/corrections → corrections@ — after review, add the correction here to publish it at the bottom of the affected article. Never write directly from a public form; this collection is staff-authored only.",
  },
  fields: [
    {
      name: "article_id",
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
            id: doc.article_id,
          });
          if (!article?.short_id) return;

          await fireRevalidate(
            req.payload,
            "article.updated",
            { id: article.id, short_id: article.short_id },
            "Correction",
          );
        } catch (err) {
          req.payload.logger.error({ err }, "Correction revalidation lookup failed");
        }
      },
    ],
  },
};
