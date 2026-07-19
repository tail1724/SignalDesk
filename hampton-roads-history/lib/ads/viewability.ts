// Epic Y (plan §07.3): MRC display-viewability — >= 50% of the creative's
// pixels in view for >= 1 continuous second, where the timer PAUSES while the
// tab is hidden (does not reset) and RESETS if coverage drops below 50%.
//
// The timing logic is a pure state machine with `now` injected, so the unit
// test drives it deterministically without a DOM or fake timers. The React
// component (components/AdSlot.tsx) feeds it IntersectionObserver ratios,
// document.hidden, and a low-frequency poll while counting.

export const MRC_MIN_VISIBLE_FRACTION = 0.5;
export const MRC_MIN_CONTINUOUS_MS = 1000;

export interface ViewabilitySample {
  /** Fraction of the creative currently in the viewport, 0..1. */
  visibleFraction: number;
  /** document.hidden — a hidden tab pauses accrual (MRC), it does not reset. */
  tabHidden: boolean;
  /** Monotonic timestamp in ms (performance.now() in the browser). */
  now: number;
}

export class ViewabilityTimer {
  private accumulatedMs = 0;
  private wasCounting = false;
  private lastTickAt: number | null = null;
  private fired = false;

  constructor(private readonly onViewable: () => void) {}

  /** True once the MRC threshold has been met and onViewable has fired. */
  get isViewable(): boolean {
    return this.fired;
  }

  /** Continuous in-view time accrued so far, in ms (exposed for tests). */
  get elapsedMs(): number {
    return this.accumulatedMs;
  }

  update(sample: ViewabilitySample): void {
    if (this.fired) return;

    const counting =
      sample.visibleFraction >= MRC_MIN_VISIBLE_FRACTION && !sample.tabHidden;

    // Accrue the interval that just ended if we were actively counting through
    // it. A paused (tab-hidden) or below-threshold interval accrues nothing.
    if (this.wasCounting && this.lastTickAt !== null) {
      this.accumulatedMs += Math.max(0, sample.now - this.lastTickAt);
    }

    // Coverage below 50% breaks continuity — the second must be *continuous*.
    // A hidden tab does not reset (it only pauses).
    if (sample.visibleFraction < MRC_MIN_VISIBLE_FRACTION) {
      this.accumulatedMs = 0;
    }

    if (this.accumulatedMs >= MRC_MIN_CONTINUOUS_MS) {
      this.fired = true;
      this.onViewable();
    }

    this.wasCounting = counting;
    this.lastTickAt = counting ? sample.now : null;
  }
}
