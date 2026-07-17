import { AdFrame } from "@/components/ads/AdFrame";
import { AdSlot } from "@/components/AdSlot";

// Native/partner-studio unit: home-native-01. Carries an explicit "Sponsored"
// label and partner byline so it never reads as a newsroom card.
export function PartnerStudioCard({ slotId, className = "" }: { slotId: string; className?: string }) {
  return (
    <AdFrame label="Sponsored · Partner studio" disclosureLabel="Why this ad?" minHeight={210} className={className}>
      <AdSlot slotId={slotId} variant="native" />
    </AdFrame>
  );
}
