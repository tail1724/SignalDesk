"use client";

import { openConsentCenter } from "@/lib/consent";

// Persistent, unobtrusive entry point into the consent center — matches
// redesign/vapornet/styles.css's .consent-chip. Deliberately not a blocking
// first-visit banner: ad requests and event beacons already stay off until
// consent resolves (see lib/consent.ts, AdSlot, PageViewTracker), so this
// chip's job is discoverability, not gatekeeping a modal on load.
export function ConsentChip() {
  return (
    <button
      type="button"
      onClick={openConsentCenter}
      className="fixed bottom-4 right-4 z-40 flex min-h-[31px] items-center gap-1.5 rounded-full border border-white/20 bg-[rgba(8,26,45,.93)] px-3 text-[8px] font-black text-white shadow-[0_8px_30px_rgba(0,0,0,.28)]"
    >
      <span className="text-[#79d1a6]">✓</span> Contextual ads · choices
    </button>
  );
}
