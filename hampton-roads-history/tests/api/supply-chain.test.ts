import { afterEach, describe, expect, it } from "vitest";

const originalAdsTxt = process.env.ADS_TXT_CONTENT;
const originalSellersJson = process.env.SELLERS_JSON_CONTENT;

afterEach(() => {
  if (originalAdsTxt === undefined) delete process.env.ADS_TXT_CONTENT;
  else process.env.ADS_TXT_CONTENT = originalAdsTxt;
  if (originalSellersJson === undefined) delete process.env.SELLERS_JSON_CONTENT;
  else process.env.SELLERS_JSON_CONTENT = originalSellersJson;
});

describe("advertising supply-chain declarations", () => {
  it("fails visibly when ads.txt has not been configured", async () => {
    delete process.env.ADS_TXT_CONTENT;
    const { GET } = await import("@/app/ads.txt/route");
    const response = GET();
    expect(response.status).toBe(503);
    expect(await response.text()).toContain("not configured");
  });

  it("serves the exact configured ads.txt declaration as text", async () => {
    process.env.ADS_TXT_CONTENT = "exchange.example, seller-17, DIRECT, authority-42";
    const { GET } = await import("@/app/ads.txt/route");
    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(await response.text()).toBe(
      "exchange.example, seller-17, DIRECT, authority-42\n",
    );
  });

  it("serves valid sellers.json and rejects invalid declarations", async () => {
    const { GET } = await import("@/app/sellers.json/route");
    process.env.SELLERS_JSON_CONTENT = JSON.stringify({
      contact_email: "ads@example.com",
      sellers: [],
      version: "1.0",
    });
    const valid = GET();
    expect(valid.status).toBe(200);
    expect(await valid.json()).toMatchObject({ version: "1.0", sellers: [] });

    process.env.SELLERS_JSON_CONTENT = "not-json";
    const invalid = GET();
    expect(invalid.status).toBe(503);
  });
});
