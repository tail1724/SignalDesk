"use client";

import { openConsentCenter } from "@/lib/consent";

export function OpenConsentCenterButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={openConsentCenter}
      className="rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-white hover:bg-accent-dim"
    >
      {children}
    </button>
  );
}
