import { signWebhookPayload } from "@/lib/webhook";
import type { CollectionAfterChangeHook } from "payload";

/**
 * Fire a signed revalidation webhook at the Next.js /api/revalidate endpoint.
 *
 * Extracted from the per-collection afterChange hooks that previously
 * duplicated this fetch three times. Best-effort: a revalidation failure is
 * logged but never blocks the CMS write.
 */
export async function fireRevalidate(
  payload: { logger: { error: (obj: unknown, msg?: string) => void } },
  type: string,
  data: Record<string, unknown>,
  context: string,
): Promise<void> {
  try {
    const body = JSON.stringify({ type, data });
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": signWebhookPayload(body),
      },
      body,
    });
  } catch (err) {
    payload.logger.error({ err }, `${context} revalidation webhook failed`);
  }
}

/**
 * afterChange hook for hr_articles: revalidate only when the article is
 * (or becomes) published.
 */
export const revalidateArticle: CollectionAfterChangeHook = async ({ doc, req }) => {
  if (doc.status === "published") {
    await fireRevalidate(
      req.payload,
      "article.published",
      { id: doc.id, short_id: doc.short_id },
      "Article",
    );
  }
};
