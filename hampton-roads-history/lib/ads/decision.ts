// Epic Y (plan §07.2): the decision service. Walks a placement's demand-tier
// order — guaranteed/direct → PMP → programmatic backfill → house — and returns
// the first tier that fills, tagging the result with a decision_id, the winning
// tier, a human-readable reason, and the decision latency.
//
// PMP and programmatic backfill are deferred to real integrations (plan §13:
// "stubs only"); they are wired as resolvers that return null, so the tier
// order is exercised end-to-end and turning them on later is a resolver swap,
// not a control-flow change.
//
// The walk itself is pure (resolvers, clock, and id factory are injected), so
// tier ordering, fill/collapse, and the no-refresh invariant are unit-testable
// without a database. The route (app/api/ads/decision) supplies the real
// resolvers.

import crypto from "node:crypto";

export type DemandTier = "direct" | "pmp" | "backfill" | "house";

export interface DecisionCreative {
  /** null marks a house creative (no paid demand filled). */
  creative_id: string | null;
  campaign_id: string | null;
  advertiser: string;
  creative_url?: string;
  creative_headline?: string;
  creative_body?: string;
  dest_url: string;
}

export interface DecisionResult {
  decision_id: string;
  /** The winning tier, or null when nothing filled (collapse pre-paint). */
  tier: DemandTier | null;
  reason: string;
  latency_ms: number;
  filled: boolean;
  creative: DecisionCreative | null;
}

export type TierResolver = () => Promise<DecisionCreative | null>;

export interface DecideOptions {
  demandTierOrder: DemandTier[];
  /** v1 invariant (plan §07.5): timed refresh is not served. */
  refresh?: boolean;
  resolvers: Partial<Record<DemandTier, TierResolver>>;
  now?: () => number;
  newId?: () => string;
}

// No timed refresh in v1. A caller asking to refill an already-served slot is a
// programming/abuse signal, not a normal path — surfaced as a typed error the
// route turns into a 400.
export class RefreshNotAllowedError extends Error {
  constructor() {
    super("Ad refresh is not supported in v1 (plan §07.5).");
    this.name = "RefreshNotAllowedError";
  }
}

function defaultNow(): number {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

export async function decide(opts: DecideOptions): Promise<DecisionResult> {
  if (opts.refresh) throw new RefreshNotAllowedError();

  const now = opts.now ?? defaultNow;
  const newId = opts.newId ?? (() => crypto.randomUUID());
  const start = now();
  const decision_id = newId();
  const reasons: string[] = [];

  for (const tier of opts.demandTierOrder) {
    const resolver = opts.resolvers[tier];
    if (!resolver) {
      reasons.push(`${tier}:unconfigured`);
      continue;
    }
    const creative = await resolver();
    if (creative) {
      reasons.push(`${tier}:filled`);
      return {
        decision_id,
        tier,
        reason: reasons.join("; "),
        latency_ms: Math.round(now() - start),
        filled: true,
        creative,
      };
    }
    // Stubbed demand (pmp/backfill) reads as no-demand; a live tier that simply
    // had no eligible creative reads as no-fill.
    reasons.push(`${tier}:no-fill`);
  }

  // Nothing filled and no house tier in the order → the slot collapses
  // pre-paint (plan §07.1: never collapse a *requested* slot, but an
  // unfilled opportunity may collapse before it paints).
  return {
    decision_id,
    tier: null,
    reason: [...reasons, "collapse:no-demand"].join("; "),
    latency_ms: Math.round(now() - start),
    filled: false,
    creative: null,
  };
}
