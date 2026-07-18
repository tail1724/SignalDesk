import { AdFrame } from "@/components/ads/AdFrame";
import { AdSlot } from "@/components/AdSlot";

// Premium leader unit: home-leader-01 / article-inline-01 in the placement
// table (design-blueprint.html §05). The prototype's .ad-frame.ad-leader /
// .article-inline-ad chrome; reserves its geometry so the creative never
// shifts layout while loading.
export function DirectSponsor({
  slotId,
  articleId,
  variant = "ad-leader",
  className = "",
}: {
  slotId: string;
  articleId?: string;
  variant?: "ad-leader" | "article-inline-ad";
  className?: string;
}) {
  return (
    <AdFrame
      label="Advertisement"
      disclosureLabel={variant === "article-inline-ad" ? "Why this ad?" : "Ad choices"}
      variant={variant}
      minHeight={116}
      className={className}
    >
      <AdSlot slotId={slotId} articleId={articleId} variant="leader" />
    </AdFrame>
  );
}
