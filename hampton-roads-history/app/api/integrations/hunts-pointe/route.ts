import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { z } from "zod";
import { verifyWebhookSignature } from "@/lib/webhook";
import {
  EditorialPackageEnvelopeSchema,
  editorialChecksumInput,
  type EditorialPackage,
  type PackageAsset,
  type PackageAuthor,
} from "@/lib/integrations/editorial-package";
import { computeRightsStatus, copyRemoteMediaToHrMedia } from "@/lib/payload/media";
import { relationshipId } from "@/lib/payload/relationships";

// Seed Refiner / Hunt's Pointe draft-ingest endpoint.
//
// This boundary is intentionally asymmetric: a connected writing tool may
// stage a reviewable draft, but it cannot publish, create production taxonomy,
// approve rights, or satisfy the editorial quality gate. Every accepted request
// receives an idempotency receipt and stores its source/provenance metadata.
//
// Quantum Newsroom handoff upgrade (integration PRD §6-§7): the endpoint now
// accepts the canonical EditorialPackage v1 envelope alongside the legacy
// flat body, and delivers *exactly one linked article per source document* —
// a first package creates the draft, later revisions update it in place.
// Field authority is enforced server-side: Payload-authoritative fields
// (workflow stage, publish state, section assignment, slug/live URL) are
// never mutated by an update. Revision preconditions apply: a package whose
// revision does not advance the stored one is rejected as stale, and once a
// human editor has moved the story beyond intake/reporting/draft, incoming
// updates are rejected as editorially locked — never silently merged.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EDITABLE_STAGES = new Set(["intake", "reporting", "draft"]);

const NamedAuthorSchema = z.object({
  name: z.string().trim().min(1).max(120),
  external_id: z.string().trim().min(1).max(200).optional(),
});

const MediaSchema = z.object({
  url: z.string().url().max(2_000),
  alt: z.string().trim().max(500),
  credit: z.string().trim().max(300).optional(),
  caption: z.string().trim().max(500).optional(),
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

// Legacy flat contract (pre-EditorialPackage senders). Kept accepted so a
// staggered deploy of the two systems can never break staging.
const LegacyBodySchema = z.object({
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

/** Both contracts normalized to one internal shape. */
interface NormalizedIngest {
  contractVersion: 0 | 1;
  packageId: string | null;
  sourceDocumentId?: string;
  revision: number;
  parentRevision: number | null;
  suppliedIdempotencyKey?: string;
  title: string;
  dek?: string | null;
  excerpt?: string | null;
  notes?: string | null;
  contentText: string;
  authors: PackageAuthor[];
  section?: string | null;
  tags: string[];
  slug?: string | null;
  publishAt?: string | null;
  media: PackageAsset[];
  provenance: Record<string, unknown>;
  packageExtras: Record<string, unknown> | null;
}

function normalizeLegacy(body: z.infer<typeof LegacyBodySchema>): NormalizedIngest {
  const authors = [
    ...(body.authors || []).map((author) => ({ name: author.name, external_id: author.external_id })),
    ...(body.byline || []).map((name) => ({ name })),
  ].filter(
    (author, index, all) =>
      all.findIndex((candidate) => candidate.name.toLowerCase() === author.name.toLowerCase()) === index,
  );
  return {
    contractVersion: 0,
    packageId: null,
    sourceDocumentId: body.source_document_id,
    revision: body.source_version ?? 0,
    parentRevision: null,
    suppliedIdempotencyKey: body.idempotency_key,
    title: body.title,
    dek: body.dek,
    contentText: body.content_text,
    authors,
    section: body.section,
    tags: [...new Set([...(body.story_tags || []), ...(body.tags || [])])],
    slug: body.slug,
    publishAt: body.publish_at,
    media: body.media || [],
    provenance: (body.provenance || {}) as Record<string, unknown>,
    packageExtras: null,
  };
}

function normalizePackage(pkg: EditorialPackage): NormalizedIngest {
  return {
    contractVersion: 1,
    packageId: pkg.identity.package_id,
    sourceDocumentId: pkg.identity.source_document_id,
    revision: pkg.revision.revision,
    parentRevision: pkg.revision.parent_revision,
    suppliedIdempotencyKey: pkg.sync.idempotency_key,
    title: pkg.editorial.title,
    dek: pkg.editorial.dek,
    excerpt: pkg.editorial.excerpt,
    notes: pkg.editorial.notes,
    contentText: pkg.editorial.body.value,
    authors: pkg.editorial.authors,
    section: pkg.taxonomy.section,
    tags: pkg.taxonomy.tags,
    slug: pkg.seo?.slug,
    publishAt: pkg.publishing?.proposed_publish_at,
    media: pkg.assets,
    provenance: pkg.provenance as Record<string, unknown>,
    packageExtras: {
      contract_version: 1,
      package_id: pkg.identity.package_id,
      publication_id: pkg.identity.publication_id,
      source_card_id: pkg.identity.source_card_id ?? null,
      revision: pkg.revision,
      validation: pkg.validation,
      seo: pkg.seo ?? null,
      taxonomy: { audience: pkg.taxonomy.audience ?? null, intent: pkg.taxonomy.intent ?? null },
      excerpt: pkg.editorial.excerpt ?? null,
      notes: pkg.editorial.notes ?? null,
    },
  };
}

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

  // Envelope first (self-identifying via `contract`), legacy flat otherwise.
  let ingest: NormalizedIngest;
  const looksLikeEnvelope =
    typeof json === "object" && json !== null && "contract" in (json as Record<string, unknown>);
  if (looksLikeEnvelope) {
    const parsed = EditorialPackageEnvelopeSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "EditorialPackage validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const pkg = parsed.data.package;
    // Integrity: the revision checksum must match the editorial content that
    // actually arrived. A mismatch means alteration in transit or a sender bug.
    const expected = sha256(editorialChecksumInput(pkg));
    if (expected !== pkg.revision.checksum) {
      return NextResponse.json(
        { error: "Package checksum does not match editorial content", code: "checksum_mismatch" },
        { status: 422 },
      );
    }
    ingest = normalizePackage(pkg);
  } else {
    const parsed = LegacyBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    ingest = normalizeLegacy(parsed.data);
  }

  const payloadHash = sha256(raw);
  const suppliedKey = req.headers.get("idempotency-key")?.trim() || ingest.suppliedIdempotencyKey;
  const idempotencyKey =
    suppliedKey || `hunts-pointe:${ingest.sourceDocumentId || payloadHash}:${ingest.revision}`;
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

  /** The one linked article for this source document (PRD §14: exactly one). */
  async function findLinkedArticle() {
    if (!ingest.sourceDocumentId) return undefined;
    const result = await payload.find({
      collection: "hr_articles",
      depth: 0,
      draft: true,
      limit: 1,
      overrideAccess: true,
      sort: "-last_ingested_at",
      where: {
        and: [
          { source_origin: { equals: "hunts_pointe" } },
          { source_document_id: { equals: ingest.sourceDocumentId } },
        ],
      },
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

  async function failReceipt(receiptId: string, errorCode: string) {
    await payload.update({
      collection: "hr_integration_receipts",
      id: receiptId,
      overrideAccess: true,
      data: { error_code: errorCode, last_seen_at: receivedAt, status: "failed" },
    });
  }

  function accepted(articleId: string, action: "created" | "updated", status = 201, replayed = false) {
    return NextResponse.json(
      {
        ok: true,
        id: articleId,
        status: "draft",
        action,
        revision: ingest.revision,
        replayed,
        admin_path: `/admin/collections/hr_articles/${articleId}`,
      },
      { status },
    );
  }

  function conflict(
    code: "stale_revision" | "editorial_locked",
    existing: { id: string | number; source_version?: number | null; workflow_stage?: string | null },
  ) {
    return NextResponse.json(
      {
        error:
          code === "stale_revision"
            ? "A newer revision of this document already exists in SignalDesk"
            : "The story has moved into editorial review and can no longer be overwritten from Hunt's Pointe",
        code,
        current_revision: existing.source_version ?? null,
        workflow_stage: existing.workflow_stage ?? null,
        admin_path: `/admin/collections/hr_articles/${existing.id}`,
      },
      { status: 409 },
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
      return accepted(existingArticleId, "created", 200, true);
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
          source_document_id: ingest.sourceDocumentId,
          source_version: ingest.revision,
          payload_hash: payloadHash,
          status: "processing",
          received_at: receivedAt,
          last_seen_at: receivedAt,
          metadata: {
            source_product: "Seed Refiner",
            source_url: process.env.SEED_REFINER_ORIGIN || "https://seed-refiner.lovable.app/",
            contract_version: ingest.contractVersion,
            package_id: ingest.packageId,
            package: ingest.packageExtras,
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

    const bylines = ingest.authors;
    const sectionId = ingest.section ? await findKnown("hr_categories", ingest.section) : undefined;
    const tags = ingest.tags;

    // Only rights-cleared media gets copied server-side; rights:"review"
    // items stay quarantined in media_provenance for a human editor to
    // resolve, never served or attached as hero_media.
    const approvedMedia = ingest.media.filter((item) => item.rights !== "review");
    const rightsStatus = computeRightsStatus(ingest.media);

    const aiProvenance = {
      ...ingest.provenance,
      received_from: "Seed Refiner",
      received_at: receivedAt,
      ...(ingest.packageExtras ? { package: ingest.packageExtras } : {}),
    };

    const linked = await findLinkedArticle();

    if (linked) {
      const storedRevision = typeof linked.source_version === "number" ? linked.source_version : 0;

      // PRD §7.2 revision precondition: never regress, never silently
      // overwrite. (An exact replay of an applied revision is caught above
      // by the idempotency receipt, so equality here means a *different*
      // payload reusing an old revision number.)
      if (ingest.revision <= storedRevision) {
        await failReceipt(receiptId, "stale_revision");
        return conflict("stale_revision", linked);
      }

      // Field authority: once a human moved the story past intake/reporting/
      // draft (or published it), Hunt's Pointe may no longer overwrite the
      // shared editorial fields. Request changes through the editor instead.
      const stage = typeof linked.workflow_stage === "string" ? linked.workflow_stage : "intake";
      if (!EDITABLE_STAGES.has(stage) || linked._status === "published") {
        await failReceipt(receiptId, "editorial_locked");
        return conflict("editorial_locked", linked);
      }

      const heroMediaId =
        !linked.hero_media && approvedMedia[0]
          ? (await copyRemoteMediaToHrMedia(payload, approvedMedia[0])) ?? undefined
          : undefined;

      // Shared editorial fields only. Payload-authoritative fields — slug,
      // section assignment, workflow_stage, publish dates, _status, layout —
      // are deliberately absent from this update.
      const updated = await payload.update({
        collection: "hr_articles",
        id: linked.id,
        draft: true,
        overrideAccess: true,
        data: {
          title: ingest.title,
          dek: ingest.dek ?? undefined,
          body_lexical: textToLexical(ingest.contentText),
          read_time_min: estimateReadTime(ingest.contentText),
          story_tags: tags,
          bylines,
          suggested_section: ingest.section && !sectionId ? ingest.section : undefined,
          media_provenance: ingest.media,
          rights_status: rightsStatus,
          ...(heroMediaId ? { hero_media: heroMediaId } : {}),
          ai_provenance: aiProvenance,
          source_version: ingest.revision,
          ingest_key: idempotencyKey,
          last_ingested_at: receivedAt,
        },
      });

      const articleId = String(updated.id);
      await completeReceipt(receiptId, articleId);
      return accepted(articleId, "updated", 200);
    }

    const authorId = bylines[0]?.name ? await findKnown("hr_authors", bylines[0].name) : undefined;
    const shortId = makeShortId();
    const heroMediaId = approvedMedia[0]
      ? (await copyRemoteMediaToHrMedia(payload, approvedMedia[0])) ?? undefined
      : undefined;

    const created = await payload.create({
      collection: "hr_articles",
      draft: true,
      overrideAccess: true,
      data: {
        short_id: shortId,
        title: ingest.title,
        dek: ingest.dek ?? undefined,
        slug: slugify(ingest.slug || ingest.title) || `draft-${shortId}`,
        section: sectionId,
        suggested_section: ingest.section && !sectionId ? ingest.section : undefined,
        author: authorId,
        bylines,
        body_lexical: textToLexical(ingest.contentText),
        read_time_min: estimateReadTime(ingest.contentText),
        publish_at: ingest.publishAt ?? undefined,
        workflow_stage: "intake",
        priority: "standard",
        story_tags: tags,
        hero_media: heroMediaId,
        media_provenance: ingest.media,
        rights_status: rightsStatus,
        ai_provenance: aiProvenance,
        source_origin: "hunts_pointe",
        source_document_id: ingest.sourceDocumentId,
        source_version: ingest.revision,
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
    return accepted(articleId, "created");
  } catch (error) {
    payload.logger.error({ error, receiptId }, "Seed Refiner draft ingestion failed");
    try {
      await failReceipt(receiptId, "draft_ingestion_failed");
    } catch (receiptError) {
      payload.logger.error({ error: receiptError, receiptId }, "Unable to mark ingestion receipt failed");
    }
    return NextResponse.json({ error: "Unable to stage draft" }, { status: 500 });
  }
}
