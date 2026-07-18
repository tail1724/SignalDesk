import { AdFrame, type AdFrameVariant } from "@/components/ads/AdFrame";
import { AdCreative, type AdCreativeData } from "@/components/ads/AdCreative";
import type { AdSlotVariant } from "@/components/AdSlot";

// Renders a filled ad creative through the real AdFrame chrome with fixed
// copy — the visual fixtures can't hit the live /api/ads endpoint, so this
// stands in with the production markup and the prototype's exact creative
// text (pixel-perfect plan §6.1). Fixtures only; never imported by pages.
export function AdFixture({
  label,
  disclosureLabel,
  frameVariant,
  creativeVariant,
  minHeight,
  data,
}: {
  label: string;
  disclosureLabel?: string;
  frameVariant?: AdFrameVariant;
  creativeVariant: AdSlotVariant;
  minHeight?: number;
  data: AdCreativeData;
}) {
  return (
    <AdFrame label={label} disclosureLabel={disclosureLabel} variant={frameVariant} minHeight={minHeight}>
      <AdCreative variant={creativeVariant} data={data} />
    </AdFrame>
  );
}
