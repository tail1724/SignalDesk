import { NextRequest, NextResponse } from "next/server";
import { pickCreativeForSlot, signAdToken } from "@/lib/ads";

// House ad fallback: served when no matching creative exists for this slot
// (e.g. hr_ad_creatives has no rows yet — semantic targeting depends on the
// HR_semantic_tagger Edge Function, not deployed in this environment).
const HOUSE_AD = {
  advertiser: "Hampton Roads Heritage Foundation",
  creative_headline: "Hampton Roads Heritage Foundation",
  creative_body:
    "Support the preservation of regional archives, oral histories, and at-risk historic structures across all seven cities.",
  dest_url: "/advertise",
  layout_variant: "native-inline",
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: slotId } = await params;
  const sessionId = req.headers.get("x-session-id") ?? req.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }

  const creative = await pickCreativeForSlot(slotId);

  if (!creative) {
    return NextResponse.json({
      slot_id: slotId,
      creative_id: null,
      ...HOUSE_AD,
    });
  }

  const hmac_token = signAdToken(creative.id, slotId, sessionId);

  return NextResponse.json({
    slot_id: slotId,
    creative_id: creative.id,
    advertiser: creative.advertiser,
    creative_url: creative.creative_url,
    dest_url: creative.dest_url,
    hmac_token,
  });
}
