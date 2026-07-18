import type { ReactNode } from "react";
import { AdChoices } from "@/components/ads/AdChoices";

export type AdFrameVariant =
  | "ad-leader"
  | "native-ad"
  | "rail-ad"
  | "extra-ad"
  | "section-ad"
  | "article-inline-ad"
  | "article-extra";

// Shared ad chrome — the prototype's .ad-frame + .ad-meta, verbatim classes
// from vapornet.css. The "Advertisement"/"Sponsored" label and disclosure
// trigger live outside the creative markup, and the frame reserves its
// final geometry up front so no requested slot collapses/reflows content
// around it (Better Ads / CLS requirement — design-blueprint.html §05).
export function AdFrame({
  label = "Advertisement",
  disclosureLabel = "Ad choices",
  variant,
  minHeight,
  className = "",
  children,
}: {
  label?: string;
  disclosureLabel?: string;
  variant?: AdFrameVariant;
  minHeight?: number;
  className?: string;
  children: ReactNode;
}) {
  const classes = ["ad-frame", variant, className].filter(Boolean).join(" ");
  return (
    <section aria-label={label} style={minHeight ? { minHeight } : undefined} className={classes}>
      <div className="ad-meta">
        <span>{label}</span>
        <AdChoices label={disclosureLabel} />
      </div>
      {children}
    </section>
  );
}
