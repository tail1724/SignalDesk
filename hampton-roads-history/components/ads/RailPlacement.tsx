import { AdFrame } from "@/components/ads/AdFrame";
import { AdSlot } from "@/components/AdSlot";

// Desktop-only rail unit: home-rail-01 / article-rail-01 — the prototype's
// .ad-frame.rail-ad. Sticky within its own rail column bounds only (the
// wrapping <aside> in each page controls the sticky offset/bounds).
export function RailPlacement({ slotId, className = "" }: { slotId: string; className?: string }) {
  return (
    <AdFrame label="Advertisement" variant="rail-ad" minHeight={440} className={`max-lg:hidden ${className}`}>
      <AdSlot slotId={slotId} variant="rail" />
    </AdFrame>
  );
}
