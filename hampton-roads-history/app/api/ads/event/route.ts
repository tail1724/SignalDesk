import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdToken } from "@/lib/ads";
import { buildEnvelope } from "@/lib/ads/envelope";
import { createServerSupabase } from "@/lib/supabase/server";

// Two event families share this endpoint:
//
//   Legacy token-bound counts  → hr_ad_impressions
//     impression, click. Require a valid HMAC token for the exact
//     (creative, slot, session) tuple — the anti-forgery guard that predates
//     Epic Y. `click` stays here (plan §07.3: "ad_click, token-bound, already
//     exists"). The new client no longer fires the naive `impression`; ad_render
//     is its viewability-aware replacement.
//
//   Epic Y serving-chain events → hr_ad_events
//     ad_opportunity, ad_render, ad_viewable (MRC), page_engagement. Carry the
//     shared envelope so the chain joins on opportunity_id. Render/viewable of a
//     *paid* creative (non-null creative_id) are token-bound too; house and
//     content-level events (opportunity, page_engagement) are not.

const legacySchema = z.object({
  event_type: z.enum(["impression", "click"]),
  creative_id: z.string().uuid(),
  slot_id: z.string(),
  session_id: z.string(),
  hmac_token: z.string(),
  article_id: z.string().uuid().optional(),
});

const chainSchema = z.object({
  event_type: z.enum(["ad_opportunity", "ad_render", "ad_viewable", "page_engagement"]),
  content_id: z.string().uuid().optional().nullable(),
  placement_id: z.string(),
  opportunity_id: z.string().uuid(),
  decision_id: z.string().uuid().optional().nullable(),
  creative_id: z.string().uuid().optional().nullable(),
  campaign_id: z.string().uuid().optional().nullable(),
  session_id: z.string().min(1),
  consent_state: z.enum(["personalized", "measurement", "essential", "unresolved"]),
  experiment: z.enum(["standard", "revenue"]),
  device_class: z.enum(["mobile", "tablet", "desktop"]),
  route_type: z.enum(["home", "section", "article"]),
  cwv_context: z.record(z.string(), z.unknown()).optional().nullable(),
  hmac_token: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  if (!json || typeof json !== "object") {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  // --- Legacy token-bound counts -------------------------------------------
  const legacy = legacySchema.safeParse(json);
  if (legacy.success) {
    const { creative_id, slot_id, session_id, hmac_token, event_type, article_id } = legacy.data;
    if (!verifyAdToken(creative_id, slot_id, session_id, hmac_token)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    const { error } = await supabase.from("hr_ad_impressions").insert({
      creative_id,
      slot_id,
      article_id: article_id ?? null,
      session_id,
      hmac_token,
      event_type,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return new NextResponse(null, { status: 204 });
  }

  // --- Epic Y serving-chain events -----------------------------------------
  const chain = chainSchema.safeParse(json);
  if (!chain.success) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }
  const e = chain.data;

  // Consent gate (defence in depth). The client withholds the session id and
  // never beacons pre-consent; a request that says unresolved is dropped.
  if (e.consent_state === "unresolved") {
    return new NextResponse(null, { status: 204 });
  }

  // A paid creative's render/viewable must present the same token the decision
  // service issued — otherwise viewability could be forged for a creative that
  // was never served. House/content events carry no creative and no token.
  if ((e.event_type === "ad_render" || e.event_type === "ad_viewable") && e.creative_id) {
    if (!e.hmac_token || !verifyAdToken(e.creative_id, e.placement_id, e.session_id, e.hmac_token)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  }

  const envelope = buildEnvelope({
    content_id: e.content_id ?? null,
    placement_id: e.placement_id,
    opportunity_id: e.opportunity_id,
    decision_id: e.decision_id ?? null,
    creative_id: e.creative_id ?? null,
    campaign_id: e.campaign_id ?? null,
    session_id: e.session_id,
    consent_state: e.consent_state,
    experiment: e.experiment,
    device_class: e.device_class,
    route_type: e.route_type,
    cwv_context: e.cwv_context ?? null,
  });

  const { error } = await supabase.from("hr_ad_events").insert({
    ...envelope,
    event_type: e.event_type,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
