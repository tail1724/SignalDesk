import { describe, expect, it, vi } from "vitest";
import { ViewabilityTimer } from "@/lib/ads/viewability";

// Plan §07.3: MRC display viewability — >= 50% pixels for >= 1 continuous
// second, the 1s timer pausing (not resetting) on tab hide.
describe("ViewabilityTimer", () => {
  it("fires after 1 continuous second at >= 50% coverage", () => {
    const onViewable = vi.fn();
    const t = new ViewabilityTimer(onViewable);
    t.update({ visibleFraction: 0.6, tabHidden: false, now: 0 });
    t.update({ visibleFraction: 0.6, tabHidden: false, now: 500 });
    expect(onViewable).not.toHaveBeenCalled();
    t.update({ visibleFraction: 0.6, tabHidden: false, now: 1000 });
    expect(onViewable).toHaveBeenCalledTimes(1);
    expect(t.isViewable).toBe(true);
  });

  it("fires exactly once (no duplicate viewable)", () => {
    const onViewable = vi.fn();
    const t = new ViewabilityTimer(onViewable);
    t.update({ visibleFraction: 1, tabHidden: false, now: 0 });
    t.update({ visibleFraction: 1, tabHidden: false, now: 1500 });
    t.update({ visibleFraction: 1, tabHidden: false, now: 3000 });
    expect(onViewable).toHaveBeenCalledTimes(1);
  });

  it("does not fire below 50% coverage", () => {
    const onViewable = vi.fn();
    const t = new ViewabilityTimer(onViewable);
    t.update({ visibleFraction: 0.49, tabHidden: false, now: 0 });
    t.update({ visibleFraction: 0.49, tabHidden: false, now: 5000 });
    expect(onViewable).not.toHaveBeenCalled();
  });

  it("resets accrual when coverage drops below 50% (continuity broken)", () => {
    const onViewable = vi.fn();
    const t = new ViewabilityTimer(onViewable);
    t.update({ visibleFraction: 0.6, tabHidden: false, now: 0 });
    t.update({ visibleFraction: 0.6, tabHidden: false, now: 900 });
    t.update({ visibleFraction: 0.2, tabHidden: false, now: 950 }); // drop → reset
    expect(t.elapsedMs).toBe(0);
    t.update({ visibleFraction: 0.6, tabHidden: false, now: 1000 });
    t.update({ visibleFraction: 0.6, tabHidden: false, now: 1900 }); // only 900ms
    expect(onViewable).not.toHaveBeenCalled();
  });

  it("pauses (does not reset) while the tab is hidden", () => {
    const onViewable = vi.fn();
    const t = new ViewabilityTimer(onViewable);
    t.update({ visibleFraction: 0.6, tabHidden: false, now: 0 });
    t.update({ visibleFraction: 0.6, tabHidden: false, now: 500 }); // 500ms visible
    t.update({ visibleFraction: 0.6, tabHidden: true, now: 500 }); // hide → pause
    t.update({ visibleFraction: 0.6, tabHidden: true, now: 5000 }); // 4.5s hidden accrues nothing
    expect(onViewable).not.toHaveBeenCalled();
    t.update({ visibleFraction: 0.6, tabHidden: false, now: 5000 }); // resume
    t.update({ visibleFraction: 0.6, tabHidden: false, now: 5500 }); // +500 = 1000ms total
    expect(onViewable).toHaveBeenCalledTimes(1);
  });
});
