"use client";

// Epic Y (plan §07.4): standard-vs-revenue placement-policy assignment.
// Sticky per anonymous session, decided client-side from the session id so it
// is NEVER baked into the server-rendered (and CDN-cached) editorial HTML —
// "no personalized ad state in cache". Consent-gated: an unresolved reader is
// always `standard` and nothing is stored.
//
// Invariant (plan §02, §13): the revenue arm is the only density *increase* in
// the system and must not ship live before the Epic L launch experiment, so it
// is fenced behind an env flag that defaults OFF. With the flag off, every
// session is `standard` and this module is inert. The assignment machinery is
// built now; flipping it on is a launch decision, not a code change.

import { hasResolvedConsent } from "@/lib/consent";
import type { ExperimentArm } from "@/lib/ads/envelope";

const STORAGE_KEY = "hr_ad_experiment";

export function isRevenueExperimentEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ADS_REVENUE_EXPERIMENT === "1";
}

// Deterministic, stable 50/50 split by session id (FNV-1a → low bit). Pure and
// framework-free so the split is unit-testable. When disabled, always standard.
export function assignArm(sessionId: string, enabled: boolean): ExperimentArm {
  if (!enabled) return "standard";
  let hash = 0x811c9dc5;
  for (let i = 0; i < sessionId.length; i++) {
    hash ^= sessionId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % 2 === 0 ? "standard" : "revenue";
}

// Client read: the reader's sticky arm for this visit. Returns `standard` (and
// stores nothing) until consent is resolved. Once resolved, the first call
// computes and persists the arm for the tab so every placement agrees.
export function getPlacementPolicy(): ExperimentArm {
  if (typeof window === "undefined") return "standard";
  if (!hasResolvedConsent()) return "standard";
  if (!isRevenueExperimentEnabled()) return "standard";

  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored === "standard" || stored === "revenue") return stored;

  let sessionId = sessionStorage.getItem("hr_session_id");
  if (!sessionId) {
    // Fall back to a throwaway id purely for the split; getOrCreateSessionId
    // owns the real one and will have set it before any ad request.
    sessionId = crypto.randomUUID();
  }
  const arm = assignArm(sessionId, true);
  sessionStorage.setItem(STORAGE_KEY, arm);
  return arm;
}
