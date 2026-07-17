import { describe, expect, it } from "vitest";
import { parseAdsTxt, parseSellersJson, reconcile } from "@/lib/supplyChain";

describe("ads.txt parsing", () => {
  it("parses a valid DIRECT and RESELLER entry", () => {
    const { entries, issues } = parseAdsTxt(
      "exchange.example, pub-1, DIRECT, f08c47fec0942fa0\nreseller.example, pub-1, RESELLER"
    );
    expect(issues).toEqual([]);
    expect(entries).toEqual([
      { domain: "exchange.example", publisherAccountId: "pub-1", relationship: "DIRECT", certificationId: "f08c47fec0942fa0", line: 1 },
      { domain: "reseller.example", publisherAccountId: "pub-1", relationship: "RESELLER", certificationId: undefined, line: 2 },
    ]);
  });

  it("ignores comments and blank lines", () => {
    const { entries, issues } = parseAdsTxt("# a comment\n\nexchange.example, pub-1, DIRECT # inline comment too");
    expect(issues).toEqual([]);
    expect(entries).toHaveLength(1);
  });

  it("flags a line with too few fields", () => {
    const { issues } = parseAdsTxt("exchange.example, pub-1");
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toMatch(/at least 3 fields/);
  });

  it("flags an invalid relationship value", () => {
    const { issues } = parseAdsTxt("exchange.example, pub-1, MAYBE");
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toMatch(/DIRECT or RESELLER/);
  });
});

describe("sellers.json parsing", () => {
  it("parses a valid document", () => {
    const { doc, issues } = parseSellersJson(
      JSON.stringify({ version: "1.0", sellers: [{ seller_id: "pub-1", seller_type: "PUBLISHER" }] })
    );
    expect(issues).toEqual([]);
    expect(doc?.sellers).toHaveLength(1);
  });

  it("rejects invalid JSON", () => {
    const { doc, issues } = parseSellersJson("not json");
    expect(doc).toBeNull();
    expect(issues[0].message).toMatch(/Invalid JSON/);
  });

  it("rejects a missing sellers array", () => {
    const { issues } = parseSellersJson(JSON.stringify({ version: "1.0" }));
    expect(issues.some((i) => i.message.includes("sellers"))).toBe(true);
  });

  it("rejects an invalid seller_type", () => {
    const { issues } = parseSellersJson(
      JSON.stringify({ version: "1.0", sellers: [{ seller_id: "pub-1", seller_type: "NOT_REAL" }] })
    );
    expect(issues[0].message).toMatch(/seller_type must be one of/);
  });
});

describe("ads.txt <-> sellers.json reconciliation", () => {
  it("passes when every DIRECT account id has a matching seller", () => {
    const { entries } = parseAdsTxt("exchange.example, pub-1, DIRECT");
    const issues = reconcile(entries, [{ seller_id: "pub-1", seller_type: "PUBLISHER" }]);
    expect(issues).toEqual([]);
  });

  it("flags a DIRECT account id with no matching seller", () => {
    const { entries } = parseAdsTxt("exchange.example, pub-orphan, DIRECT");
    const issues = reconcile(entries, [{ seller_id: "pub-1", seller_type: "PUBLISHER" }]);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toMatch(/pub-orphan/);
  });

  it("does not require RESELLER entries to appear in sellers.json", () => {
    const { entries } = parseAdsTxt("reseller.example, pub-not-us, RESELLER");
    const issues = reconcile(entries, []);
    expect(issues).toEqual([]);
  });
});
