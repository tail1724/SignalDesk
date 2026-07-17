import { AdFrame } from "@/components/ads/AdFrame";
import { AdSlot } from "@/components/AdSlot";

// Desktop-only rail unit: home-rail-01 / article-rail-01. Sticky within its
// own rail column bounds only — never past the footer or article end (the
// wrapping <aside> in each page controls the sticky offset/bounds).
export function RailPlacement({ slotId, className = "" }: { slotId: string; className?: string }) {
  return (
    <AdFrame label="Advertisement" minHeight={440} className={`hidden lg:block ${className}`}>
      <AdSlot slotId={slotId} variant="rail" />
    </AdFrame>
  );
}
