import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/revalidate", () => ({
  revalidateArticle: vi.fn(),
  revalidateCategory: vi.fn(),
  revalidateFeed: vi.fn(),
  revalidateTrending: vi.fn(),
  revalidateBreaking: vi.fn(),
}));

function makeRequest(body: string, headers: Record<string, string> = {}, ip = "1.2.3.4") {
  return new Request("http://localhost/api/revalidate", {
    method: "POST",
    headers: { "x-forwarded-for": ip, ...headers },
    body,
  });
}

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.WEBHOOK_SECRET = "test-webhook-secret";
  });

  it("rejects a request with no signature header with 401", async () => {
    const { POST } = await import("@/app/api/revalidate/route");
    const body = JSON.stringify({ type: "feed.rebuild", data: {} });
    const res = await POST(makeRequest(body, {}, "20.0.0.1") as never);
    expect(res.status).toBe(401);
  });

  it("rejects a request with an invalid signature with 401", async () => {
    const { POST } = await import("@/app/api/revalidate/route");
    const body = JSON.stringify({ type: "feed.rebuild", data: {} });
    const res = await POST(
      makeRequest(body, { "x-webhook-signature": "deadbeef" }, "20.0.0.2") as never
    );
    expect(res.status).toBe(401);
  });

  it("accepts a correctly signed request and revalidates", async () => {
    const { signWebhookPayload } = await import("@/lib/webhook");
    const { revalidateFeed } = await import("@/lib/revalidate");
    const { POST } = await import("@/app/api/revalidate/route");

    const body = JSON.stringify({ type: "feed.rebuild", data: {} });
    const signature = signWebhookPayload(body);

    const res = await POST(
      makeRequest(body, { "x-webhook-signature": signature }, "20.0.0.3") as never
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.revalidated).toBe(true);
    expect(revalidateFeed).toHaveBeenCalledTimes(1);
  });

  it("returns 400 for an unknown event type even when correctly signed", async () => {
    const { signWebhookPayload } = await import("@/lib/webhook");
    const { POST } = await import("@/app/api/revalidate/route");

    const body = JSON.stringify({ type: "something.unknown", data: {} });
    const signature = signWebhookPayload(body);

    const res = await POST(
      makeRequest(body, { "x-webhook-signature": signature }, "20.0.0.4") as never
    );
    expect(res.status).toBe(400);
  });

  it("rate-limits after too many requests from the same IP", async () => {
    const { signWebhookPayload } = await import("@/lib/webhook");
    const { POST } = await import("@/app/api/revalidate/route");

    const body = JSON.stringify({ type: "feed.rebuild", data: {} });
    const signature = signWebhookPayload(body);
    const ip = "20.0.0.5";

    let lastStatus = 0;
    for (let i = 0; i < 11; i++) {
      const res = await POST(
        makeRequest(body, { "x-webhook-signature": signature }, ip) as never
      );
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});
