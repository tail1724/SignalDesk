import { describe, expect, it, vi } from "vitest";
import { decide, RefreshNotAllowedError, type DecisionCreative } from "@/lib/ads/decision";

const house: DecisionCreative = {
  creative_id: null,
  campaign_id: null,
  advertiser: "Hampton Roads Heritage Foundation",
  dest_url: "/advertise",
};
const paid: DecisionCreative = {
  creative_id: "11111111-1111-1111-1111-111111111111",
  campaign_id: "22222222-2222-2222-2222-222222222222",
  advertiser: "Acme",
  dest_url: "https://acme.example",
};

describe("decide (demand-tier waterfall)", () => {
  it("returns direct when it fills, without consulting later tiers", async () => {
    const pmp = vi.fn().mockResolvedValue(null);
    const r = await decide({
      demandTierOrder: ["direct", "pmp", "backfill", "house"],
      resolvers: { direct: async () => paid, pmp, backfill: async () => null, house: async () => house },
    });
    expect(r.tier).toBe("direct");
    expect(r.filled).toBe(true);
    expect(r.creative?.creative_id).toBe(paid.creative_id);
    expect(pmp).not.toHaveBeenCalled();
    expect(r.decision_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-/);
  });

  it("falls through direct → pmp → backfill → house", async () => {
    const r = await decide({
      demandTierOrder: ["direct", "pmp", "backfill", "house"],
      resolvers: {
        direct: async () => null,
        pmp: async () => null,
        backfill: async () => null,
        house: async () => house,
      },
    });
    expect(r.tier).toBe("house");
    expect(r.creative?.creative_id).toBeNull();
    expect(r.reason).toContain("direct:no-fill");
    expect(r.reason).toContain("house:filled");
  });

  it("collapses when nothing fills and there is no house tier", async () => {
    const r = await decide({
      demandTierOrder: ["direct", "pmp", "backfill"],
      resolvers: { direct: async () => null, pmp: async () => null, backfill: async () => null },
    });
    expect(r.tier).toBeNull();
    expect(r.filled).toBe(false);
    expect(r.creative).toBeNull();
    expect(r.reason).toContain("collapse:no-demand");
  });

  it("rejects a refresh request (no timed refresh in v1)", async () => {
    await expect(
      decide({ demandTierOrder: ["house"], refresh: true, resolvers: { house: async () => house } })
    ).rejects.toBeInstanceOf(RefreshNotAllowedError);
  });

  it("reports decision latency", async () => {
    let clock = 100;
    const r = await decide({
      demandTierOrder: ["house"],
      resolvers: { house: async () => house },
      now: () => (clock += 5), // start 105, end 110
    });
    expect(r.latency_ms).toBe(5);
  });
});
