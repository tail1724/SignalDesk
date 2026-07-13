import { describe, expect, it } from "vitest";
import { timeAgo, thumbGradient } from "@/lib/format";

describe("timeAgo", () => {
  it("returns an empty string for null", () => {
    expect(timeAgo(null)).toBe("");
  });

  it("formats minutes ago for recent timestamps", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(timeAgo(fiveMinAgo)).toBe("5m ago");
  });

  it("formats hours ago once past 60 minutes", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60_000).toISOString();
    expect(timeAgo(threeHoursAgo)).toBe("3h ago");
  });

  it("formats days ago once past 24 hours", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString();
    expect(timeAgo(twoDaysAgo)).toBe("2d ago");
  });
});

describe("thumbGradient", () => {
  it("is deterministic for the same seed", () => {
    const seed = "11111111-1111-1111-1111-111111111111";
    expect(thumbGradient(seed)).toBe(thumbGradient(seed));
  });

  it("always returns one of the defined gradient classes", () => {
    const result = thumbGradient("some-article-id");
    expect(result).toMatch(/^from-\[#[0-9a-f]{6}\] to-\[#[0-9a-f]{6}\]$/);
  });
});
