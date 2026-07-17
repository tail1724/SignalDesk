import type { ReactNode } from "react";
import { AdChoices } from "@/components/ads/AdChoices";

// Shared ad chrome: the "Advertisement"/"Sponsored" label and disclosure
// trigger live outside the creative markup, and the frame reserves its
// final geometry up front so no requested slot collapses/reflows content
// around it (Better Ads / CLS requirement — see design-blueprint.html §05).
export function AdFrame({
  label = "Advertisement",
  disclosureLabel = "Ad choices",
  minHeight,
  tone = "light",
  className = "",
  children,
}: {
  label?: string;
  disclosureLabel?: string;
  minHeight?: number;
  tone?: "light" | "dark";
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={label}
      style={minHeight ? { minHeight } : undefined}
      className={`relative overflow-hidden rounded-[var(--r-card)] border ${
        tone === "dark" ? "border-federal bg-federal" : "border-line-strong bg-surface-2"
      } ${className}`}
    >
      <div
        className={`flex h-[25px] items-center justify-between gap-2.5 border-b px-3 font-mono text-[7px] uppercase tracking-[.1em] ${
          tone === "dark" ? "border-white/15 text-white/60" : "border-line text-ink-3"
        }`}
      >
        <span>{label}</span>
        <AdChoices label={disclosureLabel} />
      </div>
      {children}
    </section>
  );
}
