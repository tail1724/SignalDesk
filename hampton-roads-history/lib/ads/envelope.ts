// Epic Y (plan §07.3): the shared event envelope carried by every event in the
// serving chain, so ad_opportunity → ad_decision → ad_render → ad_viewable for
// one impression all join on opportunity_id. Framework-agnostic on purpose —
// imported by the client beacon, the decision route, and the unit tests alike.
// No React, no `document`, no `window` at module scope.

export type AdEventType =
  | "ad_opportunity"
  | "ad_decision"
  | "ad_render"
  | "ad_viewable"
  | "page_engagement";

// The reader's consent captured on the two axes the consent center exposes
// (lib/consent.ts: measurement + personalizedAds):
//   personalized — measurement AND personalized ads allowed
//   measurement  — measurement allowed, personalized ads declined
//   essential    — neither (ads still serve contextually; nothing is measured)
//   unresolved   — no choice yet (nothing serves, nothing beacons)
export type ConsentState = "personalized" | "measurement" | "essential" | "unresolved";
export type DeviceClass = "mobile" | "tablet" | "desktop";
export type RouteType = "home" | "section" | "article";
export type ExperimentArm = "standard" | "revenue";

// This deployment is the Hampton Roads publication. A constant for now; the
// envelope carries it so the same event schema serves multiple publications
// later without a migration.
export const PUBLICATION_ID = "hampton-roads";

export interface AdEventEnvelope {
  publication_id: string;
  content_id: string | null;
  placement_id: string;
  opportunity_id: string;
  decision_id: string | null;
  creative_id: string | null;
  campaign_id: string | null;
  session_id: string;
  consent_state: ConsentState;
  experiment: ExperimentArm;
  device_class: DeviceClass;
  route_type: RouteType;
  cwv_context: Record<string, unknown> | null;
}

// Placement ids are route-prefixed (home-*, section-*, article-*, and the
// article-only mobile-anchor-*). The page's route_type is derivable from the
// id, so wrappers don't have to thread it through.
export function routeTypeForPlacement(placementId: string): RouteType {
  if (placementId.startsWith("home-")) return "home";
  if (placementId.startsWith("section-")) return "section";
  return "article"; // article-*, mobile-anchor-*
}

// Tablet boundary at 768, desktop at 1024 — matches the mobile-first
// breakpoints the VaporNet CSS uses (styles.css). Called with innerWidth.
export function classifyDevice(viewportWidth: number): DeviceClass {
  if (viewportWidth < 768) return "mobile";
  if (viewportWidth < 1024) return "tablet";
  return "desktop";
}

// Maps a resolved consent choice to the envelope's consent_state. Null (no
// resolution yet) can only be reached by code paths that shouldn't beacon at
// all — getOrCreateSessionId returns null pre-consent — but the envelope stays
// honest if it ever is called.
export function consentStateFrom(
  choice: { measurement: boolean; personalizedAds: boolean } | null
): ConsentState {
  if (!choice) return "unresolved";
  if (choice.personalizedAds) return "personalized";
  if (choice.measurement) return "measurement";
  return "essential";
}

// Whether this consent state permits logging measurement events. Essential-only
// readers get contextual ads but no event chain (plan §06.2). Unresolved never
// reaches serving at all.
export function isMeasurementConsent(state: ConsentState): boolean {
  return state === "personalized" || state === "measurement";
}

// The set of keys a caller must supply to build a complete envelope. Kept as a
// runtime list so a test can assert none is silently dropped.
export const ENVELOPE_KEYS: (keyof AdEventEnvelope)[] = [
  "publication_id",
  "content_id",
  "placement_id",
  "opportunity_id",
  "decision_id",
  "creative_id",
  "campaign_id",
  "session_id",
  "consent_state",
  "experiment",
  "device_class",
  "route_type",
  "cwv_context",
];

export interface BuildEnvelopeInput {
  content_id?: string | null;
  placement_id: string;
  opportunity_id: string;
  decision_id?: string | null;
  creative_id?: string | null;
  campaign_id?: string | null;
  session_id: string;
  consent_state: ConsentState;
  experiment: ExperimentArm;
  device_class: DeviceClass;
  route_type: RouteType;
  cwv_context?: Record<string, unknown> | null;
}

export function buildEnvelope(input: BuildEnvelopeInput): AdEventEnvelope {
  return {
    publication_id: PUBLICATION_ID,
    content_id: input.content_id ?? null,
    placement_id: input.placement_id,
    opportunity_id: input.opportunity_id,
    decision_id: input.decision_id ?? null,
    creative_id: input.creative_id ?? null,
    campaign_id: input.campaign_id ?? null,
    session_id: input.session_id,
    consent_state: input.consent_state,
    experiment: input.experiment,
    device_class: input.device_class,
    route_type: input.route_type,
    cwv_context: input.cwv_context ?? null,
  };
}
