import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPayload } from "payload";
import config from "@payload-config";
import { pickCreativeForSlot, signAdToken, HOUSE_CREATIVE } from "@/lib/ads";
import {
  decide,
  RefreshNotAllowedError,
  type DemandTier,
  type TierResolver,
} from "@/lib/ads/decision";
import { buildEnvelope, isMeasurementConsent } from "@/lib/ads/envelope";
import { createServerSupabase } from "@/lib/supabase/server";

// Epic Y (plan §07.1–07.2): the decision service. Placements come from
// hr_placements (Payload), never hardcoded IDs. Given a near-viewable
// opportunity, it walks that placement's demand-tier order and returns the
// winning creative plus a decision_id/tier/reason/latency, logging one
// ad_decision event. PMP and programmatic backfill are deferred stubs (§13):
// their resolvers return null so the tier order is exercised but no paid demand
// is invented.

const KNOWN_TIERS: DemandTier[] = ["direct", "pmp", "backfill", "house"];

const bodySchema = z.object({
  placement_id: z.string().min(1),
  session_id: z.string().min(1),
  opportunity_id: z.string().uuid(),
  route_type: z.enum(["home", "section", "article"]),
  content_id: z.string().uuid().optional().nullable(),
  experiment: z.enum(["standard", "revenue"]).default("standard"),
  consent_state: z.enum(["personalized", "measurement", "essential", "unresolved"]),
  device_class: z.enum(["mobile", "tablet", "desktop"]),
  cwv_context: z.record(z.string(), z.unknown()).optional().nullable(),
  // v1 serves no timed refresh (plan §07.5). The field exists only so an
  // attempt is rejected loudly rather than silently served.
  refresh: z.boolean().optional(),
});

type Placement = {
  placement_id: string;
  demand_tier_order?: unknown;
  desktop_width?: number | null;
  desktop_height?: number | null;
  mobile_width?: number | null;
  mobile_height?: number | null;
  active?: boolean | null;
};

function reserveFrom(p: Placement) {
  return {
    desktop_width: p.desktop_width ?? null,
    desktop_height: p.desktop_height ?? null,
    mobile_width: p.mobile_width ?? null,
    mobile_height: p.mobile_height ?? null,
  };
}

function tierOrderFrom(p: Placement): DemandTier[] {
  const raw = Array.isArray(p.demand_tier_order) ? p.demand_tier_order : [];
  return raw.filter((t): t is DemandTier => KNOWN_TIERS.includes(t as DemandTier));
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid decision request" }, { status: 400 });
  }
  const body = parsed.data;

  // Defence in depth for the consent gate — the client (getOrCreateSessionId)
  // already withholds the session id and never reaches here pre-consent, but a
  // request that says it is unresolved is not served.
  if (body.consent_state === "unresolved") {
    return NextResponse.json({ filled: false, reason: "consent-unresolved" });
  }

  const payload = await getPayload({ config });
  const found = await payload.find({
    collection: "hr_placements",
    where: { placement_id: { equals: body.placement_id }, active: { equals: true } },
    limit: 1,
    depth: 0,
  });
  const placement = found.docs[0] as Placement | undefined;

  if (!placement) {
    // Unknown or inactive placement → collapse (no serve). Reserved geometry is
    // unknown, so the client keeps the slot collapsed.
    return NextResponse.json({ filled: false, reason: "unknown-placement" });
  }

  const resolvers: Partial<Record<DemandTier, TierResolver>> = {
    direct: async () => {
      const c = await pickCreativeForSlot(body.placement_id);
      if (!c) return null;
      return {
        creative_id: c.id,
        campaign_id: c.campaign_id ?? null,
        advertiser: c.advertiser,
        creative_url: c.creative_url,
        dest_url: c.dest_url,
      };
    },
    // Deferred to real integrations (plan §13). Present so the tier order runs
    // through them and turning them on later is a resolver swap.
    pmp: async () => null,
    backfill: async () => null,
    house: async () => ({
      creative_id: null,
      campaign_id: null,
      advertiser: HOUSE_CREATIVE.advertiser,
      creative_headline: HOUSE_CREATIVE.creative_headline,
      creative_body: HOUSE_CREATIVE.creative_body,
      dest_url: HOUSE_CREATIVE.dest_url,
    }),
  };

  let decision;
  try {
    decision = await decide({
      demandTierOrder: tierOrderFrom(placement),
      refresh: body.refresh,
      resolvers,
    });
  } catch (err) {
    if (err instanceof RefreshNotAllowedError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  const creative = decision.creative;
  // Paid creatives (non-null id) are token-bound for the click endpoint; house
  // creatives are not.
  const hmac_token =
    creative && creative.creative_id
      ? signAdToken(creative.creative_id, body.placement_id, body.session_id)
      : undefined;

  // Log the (server-authoritative) ad_decision — but only when the reader has
  // granted measurement. Essential-only readers still get a contextual/house
  // serve; they are just not measured (plan §06.2). Best-effort: a logging
  // failure must never break ad serving.
  if (isMeasurementConsent(body.consent_state)) {
    const supabase = await createServerSupabase();
    const envelope = buildEnvelope({
      content_id: body.content_id ?? null,
      placement_id: body.placement_id,
      opportunity_id: body.opportunity_id,
      decision_id: decision.decision_id,
      creative_id: creative?.creative_id ?? null,
      campaign_id: creative?.campaign_id ?? null,
      session_id: body.session_id,
      consent_state: body.consent_state,
      experiment: body.experiment,
      device_class: body.device_class,
      route_type: body.route_type,
      cwv_context: body.cwv_context ?? null,
    });
    await supabase
      .from("hr_ad_events")
      .insert({
        ...envelope,
        event_type: "ad_decision",
        tier: decision.tier,
        reason: decision.reason,
        latency_ms: decision.latency_ms,
      })
      .then(() => undefined, () => undefined);
  }

  return NextResponse.json({
    decision_id: decision.decision_id,
    opportunity_id: body.opportunity_id,
    placement_id: body.placement_id,
    tier: decision.tier,
    reason: decision.reason,
    latency_ms: decision.latency_ms,
    filled: decision.filled,
    reserve: reserveFrom(placement),
    creative: creative
      ? {
          creative_id: creative.creative_id,
          campaign_id: creative.campaign_id,
          advertiser: creative.advertiser,
          creative_url: creative.creative_url,
          creative_headline: creative.creative_headline,
          creative_body: creative.creative_body,
          dest_url: creative.dest_url,
        }
      : null,
    hmac_token,
  });
}
