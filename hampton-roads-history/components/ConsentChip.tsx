"use client";

import { openConsentCenter } from "@/lib/consent";

// Persistent, unobtrusive entry point into the consent center — the
// prototype's .consent-chip, verbatim classes from vapornet.css.
// Deliberately not a blocking first-visit banner: ad requests and event
// beacons already stay off until consent resolves (see lib/consent.ts,
// AdSlot, PageViewTracker), so this chip's job is discoverability.
export function ConsentChip() {
  return (
    <button type="button" onClick={openConsentCenter} className="consent-chip">
      <span aria-hidden>✓</span> Contextual ads · choices
    </button>
  );
}
