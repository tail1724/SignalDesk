import { describe, expect, it } from "vitest";
import { canShowFirstInline, canShowSecondInline } from "@/lib/ads/density";

// Plan §07 accept: the density word-count boundaries (599/600, 1399/1400) are
// the explicit unit-test bar.
describe("canShowFirstInline (article-inline-01)", () => {
  it("599 words → no inline unit", () => {
    expect(canShowFirstInline(599)).toBe(false);
  });
  it("600 words → inline unit (at full depth)", () => {
    expect(canShowFirstInline(600)).toBe(true);
  });
  it("gates on >= 35% reading depth", () => {
    expect(canShowFirstInline(600, 0.34)).toBe(false);
    expect(canShowFirstInline(600, 0.35)).toBe(true);
  });
});

describe("canShowSecondInline (article-inline-02, revenue only)", () => {
  const revenue = { experiment: "revenue" as const, wordsSincePriorAd: 450 };

  it("1399 words → no second unit", () => {
    expect(canShowSecondInline({ ...revenue, wordCount: 1399 })).toBe(false);
  });
  it("1400 words → second unit", () => {
    expect(canShowSecondInline({ ...revenue, wordCount: 1400 })).toBe(true);
  });
  it("standard arm never gets the second unit", () => {
    expect(
      canShowSecondInline({ wordCount: 5000, experiment: "standard", wordsSincePriorAd: 5000 })
    ).toBe(false);
  });
  it("requires >= 450 words since the prior ad", () => {
    expect(canShowSecondInline({ wordCount: 1400, experiment: "revenue", wordsSincePriorAd: 449 })).toBe(false);
    expect(canShowSecondInline({ wordCount: 1400, experiment: "revenue", wordsSincePriorAd: 450 })).toBe(true);
  });
});
