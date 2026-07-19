"use client";

import { useConsent } from "@/lib/consent";
import { getPlacementPolicy } from "@/lib/ads/experiment";
import { canShowSecondInline, INLINE_AD_MIN_WORDS } from "@/lib/ads/density";
import { DirectSponsor } from "@/components/ads/DirectSponsor";

// Epic Y (plan §04 Article, §07.4): the second inline unit — the only ad
// *density increase* in the system. It exists ONLY for revenue-arm readers, so
// it is injected client-side rather than server-rendered: baking it into the
// SSR HTML would leak the experiment arm into the CDN cache ("no personalized
// ad state in cache"). Standard-arm readers (the default, and everyone until
// the launch flag flips) render nothing here and see no shift.
//
// `show` is derived during render from useConsent(), whose server snapshot is
// null — so SSR and the first hydration render both produce nothing (no
// hydration mismatch), and the unit only appears once consent has resolved on
// the client. The gate itself is the pure density rule: revenue arm AND
// >= 1400 words AND >= 450 words past the first inline unit (which became
// eligible at 600, so a 1400-word piece clears the 450 separation by construction).
export function RevenueInlineAd({
  placementId,
  articleId,
  wordCount,
}: {
  placementId: string;
  articleId: string;
  wordCount: number;
}) {
  const consent = useConsent();
  const show =
    !!consent &&
    canShowSecondInline({
      wordCount,
      experiment: getPlacementPolicy(),
      wordsSincePriorAd: wordCount - INLINE_AD_MIN_WORDS,
    });

  if (!show) return null;
  return <DirectSponsor slotId={placementId} articleId={articleId} variant="article-inline-ad" />;
}
