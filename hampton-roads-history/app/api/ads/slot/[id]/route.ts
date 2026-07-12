import { NextResponse } from "next/server";
import crypto from "node:crypto";

// TODO: hr_ad_creatives has no rows yet, and semantic targeting depends on
// the HR_semantic_tagger Edge Function (not deployed — no embedding API key
// in this environment). Returns a static "house ad" so the AdInsertionSlot
// component has something real to render against.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const secret = process.env.AD_HMAC_SECRET ?? "dev-only";
  const payload = {
    slot_id: id,
    creative_headline: "Hampton Roads Heritage Foundation",
    creative_body:
      "Support the preservation of regional archives, oral histories, and at-risk historic structures across all seven cities.",
    dest_url: "/advertise",
    layout_variant: "native-inline",
  };
  const hmac_token = crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");

  return NextResponse.json({ ...payload, hmac_token });
}
