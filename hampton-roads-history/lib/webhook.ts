import crypto from "node:crypto";

function getWebhookSecret(): string {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) throw new Error("WEBHOOK_SECRET is not configured");
  return secret;
}

export function signWebhookPayload(body: string): string {
  return crypto.createHmac("sha256", getWebhookSecret()).update(body).digest("base64");
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const expected = signWebhookPayload(body);
  const expectedBuf = Buffer.from(expected, "base64");
  const actualBuf = Buffer.from(signature, "base64");
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
