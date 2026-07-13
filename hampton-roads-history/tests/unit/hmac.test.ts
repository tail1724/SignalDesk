import { afterEach, beforeEach, describe, expect, it } from "vitest";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.AD_HMAC_SECRET = "test-ad-secret";
  process.env.WEBHOOK_SECRET = "test-webhook-secret";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("lib/ads: signAdToken / verifyAdToken", () => {
  it("produces a token that verifies for the exact same tuple", async () => {
    const { signAdToken, verifyAdToken } = await import("@/lib/ads");
    const token = signAdToken("creative-1", "article-inline", "session-abc");
    expect(verifyAdToken("creative-1", "article-inline", "session-abc", token)).toBe(true);
  });

  it("rejects a token if any part of the tuple differs (creative, slot, or session)", async () => {
    const { signAdToken, verifyAdToken } = await import("@/lib/ads");
    const token = signAdToken("creative-1", "article-inline", "session-abc");

    expect(verifyAdToken("creative-2", "article-inline", "session-abc", token)).toBe(false);
    expect(verifyAdToken("creative-1", "sidebar", "session-abc", token)).toBe(false);
    expect(verifyAdToken("creative-1", "article-inline", "session-xyz", token)).toBe(false);
  });

  it("rejects a garbage token without throwing", async () => {
    const { verifyAdToken } = await import("@/lib/ads");
    expect(verifyAdToken("creative-1", "article-inline", "session-abc", "not-hex")).toBe(false);
  });

  it("cannot be forged without the secret: a different secret produces a different token", async () => {
    const { signAdToken } = await import("@/lib/ads");
    const tokenA = signAdToken("creative-1", "article-inline", "session-abc");

    process.env.AD_HMAC_SECRET = "a-different-secret";
    const tokenB = signAdToken("creative-1", "article-inline", "session-abc");

    expect(tokenA).not.toBe(tokenB);
  });
});

describe("lib/webhook: signWebhookPayload / verifyWebhookSignature", () => {
  it("verifies a signature it produced for the same body", async () => {
    const { signWebhookPayload, verifyWebhookSignature } = await import("@/lib/webhook");
    const body = JSON.stringify({ type: "article.published", data: { id: "1" } });
    const signature = signWebhookPayload(body);
    expect(verifyWebhookSignature(body, signature)).toBe(true);
  });

  it("rejects a signature if the body is tampered with after signing", async () => {
    const { signWebhookPayload, verifyWebhookSignature } = await import("@/lib/webhook");
    const original = JSON.stringify({ type: "article.published", data: { id: "1" } });
    const tampered = JSON.stringify({ type: "article.published", data: { id: "2" } });

    const signature = signWebhookPayload(original);
    expect(verifyWebhookSignature(tampered, signature)).toBe(false);
  });

  it("rejects a signature computed with a different secret", async () => {
    const { signWebhookPayload, verifyWebhookSignature } = await import("@/lib/webhook");
    const body = JSON.stringify({ type: "breaking.updated", data: { id: "1" } });
    const signature = signWebhookPayload(body);

    process.env.WEBHOOK_SECRET = "a-different-secret";
    expect(verifyWebhookSignature(body, signature)).toBe(false);
  });
});
