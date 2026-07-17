"use client";

import { openConsentCenter } from "@/lib/consent";

// Trigger for the reader-facing ad-transparency surface — opens the consent
// center (Epic G). The label sits outside the creative markup wherever
// this is used (see AdFrame).
export function AdChoices({ label = "Ad choices" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={openConsentCenter}
      className="border-0 border-b border-current bg-transparent pb-px text-inherit no-underline hover:text-ink"
    >
      {label}
    </button>
  );
}
