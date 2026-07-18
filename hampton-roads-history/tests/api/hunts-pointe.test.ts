import { createHash, createHmac, randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  editorialChecksumInput,
  type EditorialPackage,
} from "@/lib/integrations/editorial-package";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  find: vi.fn(),
  getPayload: vi.fn(),
  logger: { error: vi.fn() },
  update: vi.fn(),
}));

vi.mock("payload", () => ({ getPayload: mocks.getPayload }));
vi.mock("@payload-config", () => ({ default: {} }));

type Receipt = {
  id: string;
  article?: string;
  idempotency_key: string;
  payload_hash: string;
  status: "processing" | "completed" | "failed";
  [key: string]: unknown;
};

type Article = {
  id: string;
  ingest_key: string;
  source_version?: number;
  workflow_stage?: string;
  _status?: string;
  [key: string]: unknown;
};

let receipts: Map<string, Receipt>;
let article: Article | undefined;
let receiptSeq = 0;

function makeRequest(body: unknown, key = "seed-refiner:test-document:1", signed = true) {
  const raw = JSON.stringify(body);
  const headers: Record<string, string> = { "idempotency-key": key };
  if (signed) {
    headers["x-webhook-signature"] = createHmac("sha256", process.env.WEBHOOK_SECRET || "")
      .update(raw)
      .digest("base64");
  }
  return new Request("http://localhost/api/integrations/hunts-pointe", {
    method: "POST",
    headers,
    body: raw,
  });
}

const validBody = {
  source_document_id: "document-17",
  source_version: 3,
  title: "A working waterfront prepares for the next century",
  dek: "A test article staged from Seed Refiner.",
  byline: ["Jordan Ellis"],
  section: "Unreviewed external section",
  story_tags: ["ports", "resilience"],
  content_text: "First paragraph.\n\nSecond paragraph.",
  provenance: {
    model: "writer-model",
    prompt_version: "v4",
    sources: [{ url: "https://example.com/source" }],
  },
};

/** A valid EditorialPackage v1 envelope with a correctly computed checksum. */
function makeEnvelope(opts: { revision?: number; title?: string; docId?: string } = {}) {
  const revision = opts.revision ?? 1;
  const docId = opts.docId ?? "document-17";
  const editorial: EditorialPackage["editorial"] = {
    title: opts.title ?? "A working waterfront prepares for the next century",
    dek: "A test article staged from Seed Refiner.",
    excerpt: null,
    body: { format: "text", value: "First paragraph.\n\nSecond paragraph." },
    authors: [{ name: "Jordan Ellis" }],
    notes: null,
  };
  const taxonomy: EditorialPackage["taxonomy"] = {
    section: "Unreviewed external section",
    tags: ["ports", "resilience"],
    audience: null,
    intent: null,
  };
  const checksum = createHash("sha256")
    .update(editorialChecksumInput({ editorial, taxonomy }))
    .digest("hex");

  return {
    contract: "editorial-package",
    contract_version: 1,
    package: {
      identity: {
        package_id: randomUUID(),
        source_document_id: docId,
        publication_id: "hampton-roads",
        article_id: null,
        source_card_id: null,
      },
      revision: {
        revision,
        parent_revision: revision > 1 ? revision - 1 : null,
        checksum,
        created_at: "2026-07-18T00:00:00.000Z",
        actor: { id: "user-9", role: "hunts_pointe_editor" },
      },
      editorial,
      taxonomy,
      seo: { slug: null, keywords: [], meta_description: "A test article staged from Seed Refiner." },
      assets: [],
      provenance: { sources: [], model: "hunt-s-pointe", human_editor_id: "user-9", ai_assisted: true },
      validation: { word_count: 4, ready: false, checks: [{ check: "title", ok: true }] },
      publishing: { proposed_publish_at: null },
      sync: {
        source: "hunts-pointe",
        destination: "signaldesk",
        idempotency_key: `hp:${docId}:${revision}`,
      },
    },
  };
}

function envelopeKey(envelope: ReturnType<typeof makeEnvelope>): string {
  return envelope.package.sync.idempotency_key;
}

describe("POST /api/integrations/hunts-pointe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    receipts = new Map();
    article = undefined;
    receiptSeq = 0;
    process.env.WEBHOOK_SECRET = "test-webhook-secret";

    mocks.getPayload.mockResolvedValue({
      create: mocks.create,
      find: mocks.find,
      logger: mocks.logger,
      update: mocks.update,
    });

    mocks.find.mockImplementation(
      async (args: { collection: string; where?: Record<string, unknown> }) => {
        if (args.collection === "hr_integration_receipts") {
          const key = (args.where as { idempotency_key?: { equals?: string } } | undefined)
            ?.idempotency_key?.equals;
          const match = key ? receipts.get(key) : undefined;
          return { docs: match ? [match] : [] };
        }
        if (args.collection === "hr_articles") {
          if (!article) return { docs: [] };
          const where = args.where ?? {};
          if ("ingest_key" in where) {
            const expected = (where as { ingest_key: { equals: string } }).ingest_key.equals;
            return { docs: article.ingest_key === expected ? [article] : [] };
          }
          // Linked-article lookup by source_origin + source_document_id.
          return { docs: [article] };
        }
        // Unknown external taxonomy is deliberately not auto-created.
        return { docs: [] };
      },
    );

    mocks.create.mockImplementation(
      async (args: { collection: string; data: Record<string, unknown> }) => {
        if (args.collection === "hr_integration_receipts") {
          receiptSeq += 1;
          const created = { id: `receipt-${receiptSeq}`, ...args.data } as Receipt;
          receipts.set(created.idempotency_key, created);
          return created;
        }
        if (args.collection === "hr_articles") {
          article = {
            id: "article-1",
            ingest_key: String(args.data.ingest_key),
            ...args.data,
          };
          return article;
        }
        throw new Error(`Unexpected create for ${args.collection}`);
      },
    );

    mocks.update.mockImplementation(
      async (args: { collection: string; id?: string | number; data: Record<string, unknown> }) => {
        if (args.collection === "hr_integration_receipts") {
          const match = [...receipts.values()].find((r) => r.id === String(args.id));
          if (!match) throw new Error(`No receipt ${args.id}`);
          const updated = { ...match, ...args.data } as Receipt;
          receipts.set(updated.idempotency_key, updated);
          return updated;
        }
        if (args.collection === "hr_articles") {
          if (!article || String(args.id) !== article.id) throw new Error(`No article ${args.id}`);
          article = { ...article, ...args.data } as Article;
          return article;
        }
        throw new Error(`Unexpected update for ${args.collection}`);
      },
    );
  });

  it("rejects requests that are not signed", async () => {
    const { POST } = await import("@/app/api/integrations/hunts-pointe/route");
    const response = await POST(makeRequest(validBody, undefined, false) as never);

    expect(response.status).toBe(401);
    expect(mocks.getPayload).not.toHaveBeenCalled();
  });

  it("stages a provenance-rich draft without publishing or creating taxonomy", async () => {
    const { POST } = await import("@/app/api/integrations/hunts-pointe/route");
    const response = await POST(makeRequest(validBody) as never);
    const result = await response.json();

    expect(response.status).toBe(201);
    expect(result).toMatchObject({ id: "article-1", status: "draft", replayed: false });

    const articleCreate = mocks.create.mock.calls.find(
      ([args]) => args.collection === "hr_articles",
    )?.[0];
    expect(articleCreate).toBeDefined();
    expect(articleCreate.draft).toBe(true);
    expect(articleCreate.data).toMatchObject({
      _status: "draft",
      workflow_stage: "intake",
      source_origin: "hunts_pointe",
      suggested_section: "Unreviewed external section",
      fact_checked: false,
      sources_checked: false,
      rights_checked: false,
      disclosure_checked: false,
    });
    expect(articleCreate.data.section).toBeUndefined();
    expect(articleCreate.data.author).toBeUndefined();
    expect(mocks.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ collection: "hr_categories" }),
    );
    expect(mocks.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ collection: "hr_authors" }),
    );
  });

  it("replays a completed idempotent request without creating a duplicate article", async () => {
    const { POST } = await import("@/app/api/integrations/hunts-pointe/route");
    const first = await POST(makeRequest(validBody) as never);
    const second = await POST(makeRequest(validBody) as never);
    const result = await second.json();

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(result).toMatchObject({ id: "article-1", status: "draft", replayed: true });
    const articleCreates = mocks.create.mock.calls.filter(
      ([args]) => args.collection === "hr_articles",
    );
    expect(articleCreates).toHaveLength(1);
  });

  it("rejects reuse of an idempotency key for changed content", async () => {
    const { POST } = await import("@/app/api/integrations/hunts-pointe/route");
    await POST(makeRequest(validBody) as never);
    const response = await POST(
      makeRequest({ ...validBody, title: "A different article" }) as never,
    );

    expect(response.status).toBe(409);
    const articleCreates = mocks.create.mock.calls.filter(
      ([args]) => args.collection === "hr_articles",
    );
    expect(articleCreates).toHaveLength(1);
  });

  it("accepts an EditorialPackage v1 envelope and stores package lineage", async () => {
    const { POST } = await import("@/app/api/integrations/hunts-pointe/route");
    const envelope = makeEnvelope({ revision: 1 });
    const response = await POST(makeRequest(envelope, envelopeKey(envelope)) as never);
    const result = await response.json();

    expect(response.status).toBe(201);
    expect(result).toMatchObject({
      id: "article-1",
      status: "draft",
      action: "created",
      revision: 1,
      replayed: false,
    });

    const articleCreate = mocks.create.mock.calls.find(
      ([args]) => args.collection === "hr_articles",
    )?.[0];
    expect(articleCreate.data).toMatchObject({
      _status: "draft",
      workflow_stage: "intake",
      source_origin: "hunts_pointe",
      source_version: 1,
    });
    expect(articleCreate.data.ai_provenance.package).toMatchObject({
      contract_version: 1,
      package_id: envelope.package.identity.package_id,
    });

    const receiptCreate = mocks.create.mock.calls.find(
      ([args]) => args.collection === "hr_integration_receipts",
    )?.[0];
    expect(receiptCreate.data.metadata).toMatchObject({
      contract_version: 1,
      package_id: envelope.package.identity.package_id,
    });
  });

  it("rejects an envelope whose checksum does not match the editorial content", async () => {
    const { POST } = await import("@/app/api/integrations/hunts-pointe/route");
    const envelope = makeEnvelope({ revision: 1 });
    envelope.package.editorial.title = "Tampered after checksum";
    const response = await POST(makeRequest(envelope, envelopeKey(envelope)) as never);
    const result = await response.json();

    expect(response.status).toBe(422);
    expect(result.code).toBe("checksum_mismatch");
    expect(mocks.getPayload).not.toHaveBeenCalled();
  });

  it("updates the one linked article in place when a newer revision arrives", async () => {
    const { POST } = await import("@/app/api/integrations/hunts-pointe/route");
    const first = makeEnvelope({ revision: 1 });
    const second = makeEnvelope({ revision: 2, title: "A sharper waterfront headline" });

    const createResponse = await POST(makeRequest(first, envelopeKey(first)) as never);
    const updateResponse = await POST(makeRequest(second, envelopeKey(second)) as never);
    const result = await updateResponse.json();

    expect(createResponse.status).toBe(201);
    expect(updateResponse.status).toBe(200);
    expect(result).toMatchObject({ id: "article-1", action: "updated", revision: 2 });

    // Exactly one article — the second revision updated it, no duplicate.
    const articleCreates = mocks.create.mock.calls.filter(
      ([args]) => args.collection === "hr_articles",
    );
    expect(articleCreates).toHaveLength(1);

    const articleUpdate = mocks.update.mock.calls.find(
      ([args]) => args.collection === "hr_articles",
    )?.[0];
    expect(articleUpdate).toBeDefined();
    expect(articleUpdate.data.title).toBe("A sharper waterfront headline");
    expect(articleUpdate.data.source_version).toBe(2);
    // Payload-authoritative fields are never touched by an update.
    expect(articleUpdate.data).not.toHaveProperty("workflow_stage");
    expect(articleUpdate.data).not.toHaveProperty("_status");
    expect(articleUpdate.data).not.toHaveProperty("slug");
    expect(articleUpdate.data).not.toHaveProperty("publish_at");
    expect(articleUpdate.data).not.toHaveProperty("section");
  });

  it("rejects a stale revision instead of overwriting newer content", async () => {
    const { POST } = await import("@/app/api/integrations/hunts-pointe/route");
    const first = makeEnvelope({ revision: 2 });
    await POST(makeRequest(first, envelopeKey(first)) as never);

    // Same revision number, different key + content — a stale writer.
    const stale = makeEnvelope({ revision: 2, title: "An out-of-date rewrite" });
    stale.package.sync.idempotency_key = "hp:document-17:2-retry";
    const response = await POST(makeRequest(stale, envelopeKey(stale)) as never);
    const result = await response.json();

    expect(response.status).toBe(409);
    expect(result.code).toBe("stale_revision");
    expect(result.current_revision).toBe(2);
    expect(article?.title).toBe("A working waterfront prepares for the next century");
    expect(mocks.update.mock.calls.filter(([args]) => args.collection === "hr_articles")).toHaveLength(0);
  });

  it("refuses to overwrite a story a human editor has moved into review", async () => {
    const { POST } = await import("@/app/api/integrations/hunts-pointe/route");
    const first = makeEnvelope({ revision: 1 });
    await POST(makeRequest(first, envelopeKey(first)) as never);

    // An editor advances the story in Payload.
    article = { ...article!, workflow_stage: "copy_edit" };

    const second = makeEnvelope({ revision: 2, title: "A rewrite after review began" });
    const response = await POST(makeRequest(second, envelopeKey(second)) as never);
    const result = await response.json();

    expect(response.status).toBe(409);
    expect(result.code).toBe("editorial_locked");
    expect(result.workflow_stage).toBe("copy_edit");
    expect(article?.title).toBe("A working waterfront prepares for the next century");
    expect(mocks.update.mock.calls.filter(([args]) => args.collection === "hr_articles")).toHaveLength(0);
  });
});
