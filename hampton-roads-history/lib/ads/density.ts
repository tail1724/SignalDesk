// Epic Y (plan §04 Article + §07 accept): inline-ad density rules, extracted as
// a pure function so the 599/600/1399/1400 word-count boundaries are unit-
// testable and there is exactly one source of truth for them (the article page
// imports these instead of hard-coding 600). Framework-agnostic.
//
// Rules (design-blueprint.html §05):
//   - article-inline-01: only at >= 600 words AND >= 35% reading depth.
//   - article-inline-02: revenue experiment ONLY, AND >= 1400 words, AND at
//     least 450 words of copy since the previous inline ad (never two units
//     stacked close together).
// The word thresholds are inclusive lower bounds — 600 qualifies, 599 does not.

import type { ExperimentArm } from "@/lib/ads/envelope";

export const INLINE_AD_MIN_WORDS = 600;
export const INLINE_AD_MIN_DEPTH = 0.35;
export const SECOND_INLINE_MIN_WORDS = 1400;
export const MIN_WORDS_SINCE_PRIOR_AD = 450;

// Whether the article is long enough to carry a first inline unit at all.
// Depth (0..1) is the runtime scroll gate the client applies before it
// actually requests; passing 1 checks the length rule alone.
export function canShowFirstInline(wordCount: number, depth = 1): boolean {
  return wordCount >= INLINE_AD_MIN_WORDS && depth >= INLINE_AD_MIN_DEPTH;
}

export interface SecondInlineInput {
  wordCount: number;
  experiment: ExperimentArm;
  wordsSincePriorAd: number;
}

// The second inline unit is the only density *increase* in the system, so it is
// fenced three ways: it exists only in the revenue arm, only on long pieces,
// and only with real editorial distance from the prior ad.
export function canShowSecondInline({
  wordCount,
  experiment,
  wordsSincePriorAd,
}: SecondInlineInput): boolean {
  return (
    experiment === "revenue" &&
    wordCount >= SECOND_INLINE_MIN_WORDS &&
    wordsSincePriorAd >= MIN_WORDS_SINCE_PRIOR_AD
  );
}
