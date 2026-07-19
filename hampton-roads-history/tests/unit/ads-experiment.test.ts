import { describe, expect, it } from "vitest";
import { assignArm } from "@/lib/ads/experiment";

// Plan §07.4: standard-vs-revenue assignment — sticky per session, and inert
// (always standard) until the launch flag enables it.
describe("assignArm", () => {
  it("is always standard when the experiment is disabled", () => {
    expect(assignArm("any-session-id", false)).toBe("standard");
    expect(assignArm("another-session-id", false)).toBe("standard");
  });

  it("is deterministic (sticky) for a given session id", () => {
    const a = assignArm("session-123", true);
    const b = assignArm("session-123", true);
    expect(a).toBe(b);
    expect(["standard", "revenue"]).toContain(a);
  });

  it("splits the population across both arms", () => {
    const arms = new Set<string>();
    for (let i = 0; i < 500; i++) arms.add(assignArm(`session-${i}`, true));
    expect(arms.has("standard")).toBe(true);
    expect(arms.has("revenue")).toBe(true);
  });
});
