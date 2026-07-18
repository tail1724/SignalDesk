import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { verifyWebhookSignature } from "@/lib/webhook";
import { relationshipId } from "@/lib/payload/relationships";

// Read-only downstream-status check for Hunt's Pointe (Epic F, VaporNet
// Americana plan). Service identity is scoped to its own receipts only: the
// query is bounded to source: "hunts_pointe" and an exact source_document_id
// match, so this can never be used to enumerate or probe other integrations'
// or other partners' documents.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sourceDocumentId = req.nextUrl.searchParams.get("source_document_id");
  const signature = req.headers.get("x-webhook-signature");

  if (!sourceDocumentId || !signature || !verifyWebhookSignature(sourceDocumentId, signature)) {
    return NextResponse.json({ error: "Invalid or missing signature" }, { status: 401 });
  }

  const payload = await getPayload({ config });

  const result = await payload.find({
    collection: "hr_integration_receipts",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    sort: "-received_at",
    where: {
      and: [
        { source: { equals: "hunts_pointe" } },
        { source_document_id: { equals: sourceDocumentId } },
      ],
    },
  });

  const receipt = result.docs[0];
  if (!receipt) {
    return NextResponse.json(
      { error: "No receipt found for this source_document_id" },
      { status: 404 },
    );
  }

  const articleId = relationshipId(receipt.article);

  // The receipt only tells us whether *ingestion* succeeded, which never
  // changes again after that one event — the reader wants to know the
  // article's current *editorial* state (still a review draft, or now
  // published), so once ingestion completed, look the article up directly.
  if (receipt.status !== "completed" || !articleId) {
    return NextResponse.json({
      status: receipt.status,
      error_code: receipt.error_code ?? null,
      draft_id: articleId ?? null,
      admin_path: articleId ? `/admin/collections/hr_articles/${articleId}` : null,
      updatedAt: receipt.last_seen_at,
    });
  }

  const article = await payload.findByID({
    collection: "hr_articles",
    id: articleId,
    depth: 0,
    overrideAccess: true,
  });

  return NextResponse.json({
    status: article?._status === "published" ? "published" : "draft",
    draft_id: articleId,
    admin_path: `/admin/collections/hr_articles/${articleId}`,
    // Reconcile the revision + editorial stage back to Hunt's Pointe
    // (integration PRD §4 step 11) so the writer sees the live state.
    revision: typeof article?.source_version === "number" ? article.source_version : null,
    workflow_stage: article?.workflow_stage ?? null,
    updatedAt: article?.updatedAt ?? receipt.last_seen_at,
  });
}
