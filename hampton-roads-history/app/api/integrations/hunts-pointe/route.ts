import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { z } from "zod";
import { verifyWebhookSignature } from "@/lib/webhook";

// Seed Refiner / Hunt's Pointe draft-ingest endpoint.
//
// This boundary is intentionally asymmetric: a connected writing tool may
// stage a reviewable draft, but it cannot publish, create production taxonomy,
// approve rights, or satisfy the editorial quality gate. Every accepted request
// receives an idempotency receipt and stores its source/provenance metadata.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NamedAuthorSchema = z.object({
  name: z.string().trim().min(1).max(120),
  external_id: z.string().trim().min(1).max(200).optional(),
});

const MediaSchema = z.object({
  url: z.string().url().max(2_000),
  alt: z.string().trim().max(500),
  credit: z.string().trim().max(300).optional(),
  rights: z.enum(["owned", "licensed", "review"]),
});

const ProvenanceSchema = z
  .object({
    sources: z.array(z.unknown()).max(100).optional(),
    model: z.string().trim().max(120).optional(),
    prompt_version: z.string().trim().max(120).optional(),
    safety_results: z.unknown().optional(),
    human_editor_id: z.string().trim().max(200).optional(),
  })
  .passthrough();

const BodySchema = z.object({
  source_document_id: z.string().trim().min(1).max(200).optional(),
  source_version: z.number().int().nonnegative().optional(),
  idempotency_key: z.string().trim().min(8).max(500).optional(),
  title: z.string().trim().min(1).max(300),
  dek: z.string().trim().max(500).nullish(),
  byline: z.array(z.string().trim().min(1).max(120)).max(20).nullish(),
  authors: z.array(NamedAuthorSchema).max(20).nullish(),
  section: z.string().trim().max(100).nullish(),
  story_tags: z.array(z.string().trim().min(1).max(100)).max(100).nullish(),
  tags: z.array(z.string().trim().min(1).max(100)).max(100).nullish(),
  publish_at: z.string().trim().max(100).nullish(),
  content_text: z.string().trim().min(1).max(200_000),
  slug: z.string().trim().max(120).nullish(),
  media: z.array(MediaSchema).max(50).nullish(),
  provenance: ProvenanceSchema.nullish(),
});

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function makeShortId(): string {
  return randomBytes(6).toString("base64url").toLowerCase().slice(0, 8);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function relationshipId(value: unknown): string | undefined {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === "string" || typeof id === "number") return String(id);
  }
  return undefined;
}

function estimateReadTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Minimal Lexical editorState from plain text (paragraph per blank-line block).
function textToLexical(text: string) {
  const blocks = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return {
    root: {
      type: "root",
      format: "" as const,
      indent: 0,
      version: 1,
      direction: "ltr" as const,
      children: (blocks.length ? blocks : [""]).map((paragraph) => ({
        type: "paragraph",
        format: "" as const,
        indent: 0,
        version: 1,
        direction: "ltr" as const,
        textFormat: 0,
        children: [
          {
            type: "text",
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: paragraph,
            version: 1,
          },
        ],
      })),
    },
  };
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-webhook-signature");
  if (!signature || !verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid or missing signature" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const payloadHash = sha256(raw);
  const suppliedKey = req.headers.get("idempotency-key")?.trim() || body.idempotency_key;
  const idempotencyKey = suppliedKey || `hunts-pointe:${body.source_document_id || payloadHash}:${body.source_version ?? 0}`;
  const receivedAt = new Date().toISOString();
  const payload = await getPayload({ config });

  async function findReceipt() {
    const result = await payload.find({
      collection: "hr_integration_receipts",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { idempotency_key: { equals: idempotencyKey } },
    });
    return result.docs[0];
  }

  async function findIngestedArticle() {
    const result = await payload.find({
      collection: "hr_articles",
      depth: 0,
      draft: true,
      limit: 1,
      overrideAccess: true,
      where: { ingest_key: { equals: idempotencyKey } },
    });
    return result.docs[0];
  }

  async function completeReceipt(receiptId: string, articleId: string) {
    await payload.update({
      collection: "hr_integration_receipts",
      id: receiptId,
      overrideAccess: true,
      data: {
        article: articleId,
        error_code: null,
        last_seen_at: receivedAt,
        status: "completed",
      },
    });
  }

  function accepted(articleId: string, status = 201, replayed = false) {
    return NextResponse.json(
      {
        ok: true,
        id: articleId,
        status: "draft",
        replayed,
        admin_path: `/admin/collections/hr_articles/${articleId}`,
      },
      { status },
    );
  }

  let receipt = await findReceipt();
  if (receipt && receipt.payload_hash !== payloadHash) {
    return NextResponse.json(
      { error: "Idempotency key was already used for a different payload" },
      { status: 409 },
    );
  }

  if (receipt) {
    const recoveredArticle = await findIngestedArticle();
    const existingArticleId = relationshipId(receipt.article) || relationshipId(recoveredArticle);
    if (existingArticleId) {
      await completeReceipt(String(receipt.id), existingArticleId);
      return accepted(existingArticleId, 200, true);
    }
    if (receipt.status === "processing") {
      await payload.update({
        collection: "hr_integration_receipts",
        id: receipt.id,
        overrideAccess: true,
        data: { last_seen_at: receivedAt },
      });
      return NextResponse.json(
        { ok: true, status: "processing", replayed: true },
        { status: 202 },
      );
    }

    receipt = await payload.update({
      collection: "hr_integration_receipts",
      id: receipt.id,
      overrideAccess: true,
      data: { error_code: null, last_seen_at: receivedAt, status: "processing" },
    });
  } else {
    try {
      receipt = await payload.create({
        collection: "hr_integration_receipts",
        overrideAccess: true,
        data: {
          idempotency_key: idempotencyKey,
          source: "hunts_pointe",
          source_document_id: body.source_document_id,
          source_version: body.source_version,
          payload_hash: payloadHash,
          status: "processing",
          received_at: receivedAt,
          last_seen_at: receivedAt,
          metadata: {
            source_product: "Seed Refiner",
            source_url: process.env.SEED_REFINER_ORIGIN || "https://seed-refiner.lovable.app/",
          },
        },
      });
    } catch (error) {
      const racedReceipt = await findReceipt();
      if (racedReceipt?.payload_hash === payloadHash) {
        return NextResponse.json(
          { ok: true, status: "processing", replayed: true },
          { status: 202 },
        );
      }
      payload.logger.error({ error }, "Unable to create ingestion receipt");
      return NextResponse.json({ error: "Unable to accept draft" }, { status: 500 });
    }
  }

  const receiptId = String(receipt.id);

  try {
    async function findKnown(
      collection: "hr_categories" | "hr_authors",
      name: string,
    ): Promise<string | undefined> {
      const slug = slugify(name);
      if (!slug) return undefined;
      const result = await payload.find({
        collection,
        depth: 0,
        limit: 1,
        overrideAccess: true,
        where: { slug: { equals: slug } },
      });
      return result.docs[0] ? String(result.docs[0].id) : undefined;
    }

    const bylines = [
      ...(body.authors || []).map((author) => ({
        name: author.name,
        external_id: author.external_id,
      })),
      ...(body.byline || []).map((name) => ({ name })),
    ].filter(
      (author, index, all) =>
        all.findIndex((candidate) => candidate.name.toLowerCase() === author.name.toLowerCase()) === index,
    );
    const sectionId = body.section ? await findKnown("hr_categories", body.section) : undefined;
    const authorId = bylines[0]?.name ? await findKnown("hr_authors", bylines[0].name) : undefined;
    const shortId = makeShortId();
    const tags = [...new Set([...(body.story_tags || []), ...(body.tags || [])])];

    const created = await payload.create({
      collection: "hr_articles",
      draft: true,
      overrideAccess: true,
      data: {
        short_id: shortId,
        title: body.title,
        dek: body.dek ?? undefined,
        slug: slugify(body.slug || body.title) || `draft-${shortId}`,
        section: sectionId,
        suggested_section: body.section && !sectionId ? body.section : undefined,
        author: authorId,
        bylines,
        body_lexical: textToLexical(body.content_text),
        read_time_min: estimateReadTime(body.content_text),
        publish_at: body.publish_at ?? undefined,
        workflow_stage: "intake",
        priority: "standard",
        story_tags: tags,
        media_provenance: body.media || [],
        ai_provenance: {
          ...(body.provenance || {}),
          received_from: "Seed Refiner",
          received_at: receivedAt,
        },
        source_origin: "hunts_pointe",
        source_document_id: body.source_document_id,
        source_version: body.source_version,
        ingest_key: idempotencyKey,
        last_ingested_at: receivedAt,
        fact_checked: false,
        sources_checked: false,
        rights_checked: false,
        disclosure_checked: false,
        _status: "draft",
      },
    });

    const articleId = String(created.id);
    await completeReceipt(receiptId, articleId);
    return accepted(articleId);
  } catch (error) {
    payload.logger.error({ error, receiptId }, "Seed Refiner draft ingestion failed");
    try {
      await payload.update({
        collection: "hr_integration_receipts",
        id: receiptId,
        overrideAccess: true,
        data: {
          error_code: "draft_ingestion_failed",
          last_seen_at: new Date().toISOString(),
          status: "failed",
        },
      });
    } catch (receiptError) {
      payload.logger.error({ error: receiptError, receiptId }, "Unable to mark ingestion receipt failed");
    }
    return NextResponse.json({ error: "Unable to stage draft" }, { status: 500 });
  }
}
