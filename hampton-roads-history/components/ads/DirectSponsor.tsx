import { AdFrame } from "@/components/ads/AdFrame";
import { AdSlot } from "@/components/AdSlot";

// Premium leader unit: home-leader-01 / article-inline-01 in the placement
// table (design-blueprint.html §05). Reserves 91px+ so it never shifts
// layout while the creative loads.
export function DirectSponsor({
  slotId,
  articleId,
  className = "",
}: {
  slotId: string;
  articleId?: string;
  className?: string;
}) {
  return (
    <AdFrame label="Advertisement" minHeight={118} className={className}>
      <AdSlot slotId={slotId} articleId={articleId} variant="leader" />
    </AdFrame>
  );
}
