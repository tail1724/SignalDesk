import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

type Article = { id: string; ingest_key: string; [key: string]: unknown };

let receipt: Receipt | undefined;
let article: Article | undefined;

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

describe("POST /api/integrations/hunts-pointe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    receipt = undefined;
    article = undefined;
    process.env.WEBHOOK_SECRET = "test-webhook-secret";

    mocks.getPayload.mockResolvedValue({
      create: mocks.create,
      find: mocks.find,
      logger: mocks.logger,
      update: mocks.update,
    });

    mocks.find.mockImplementation(async (args: { collection: string }) => {
      if (args.collection === "hr_integration_receipts") {
        return { docs: receipt ? [receipt] : [] };
      }
      if (args.collection === "hr_articles") {
        return { docs: article ? [article] : [] };
      }
      // Unknown external taxonomy is deliberately not auto-created.
      return { docs: [] };
    });

    mocks.create.mockImplementation(async (args: { collection: string; data: Record<string, unknown> }) => {
      if (args.collection === "hr_integration_receipts") {
        receipt = { id: "receipt-1", ...args.data } as Receipt;
        return receipt;
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
    });

    mocks.update.mockImplementation(async (args: { collection: string; data: Record<string, unknown> }) => {
      if (args.collection !== "hr_integration_receipts" || !receipt) {
        throw new Error(`Unexpected update for ${args.collection}`);
      }
      receipt = { ...receipt, ...args.data } as Receipt;
      return receipt;
    });
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
});
