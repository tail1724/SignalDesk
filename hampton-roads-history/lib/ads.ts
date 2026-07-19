import crypto from "node:crypto";
import { createServerSupabase } from "@/lib/supabase/server";

export interface AdCreative {
  id: string;
  advertiser: string;
  slot_targets: string[] | null;
  creative_url: string;
  dest_url: string;
  weight: number;
  campaign_id: string | null;
}

// Shared house fallback (Epic Y). Served when a placement's demand tiers all
// fail to fill AND the placement's demand_tier_order includes "house". A house
// creative has a null creative_id, so it is never token-bound and never counts
// a paid impression/click.
export const HOUSE_CREATIVE = {
  advertiser: "Hampton Roads Heritage Foundation",
  creative_headline: "Hampton Roads Heritage Foundation",
  creative_body:
    "Support the preservation of regional archives, oral histories, and at-risk historic structures across all seven cities.",
  dest_url: "/advertise",
  layout_variant: "native-inline",
} as const;

function getAdSecret(): string {
  const secret = process.env.AD_HMAC_SECRET;
  if (!secret) {
    throw new Error("AD_HMAC_SECRET is not configured");
  }
  return secret;
}

// Weighted-random selection among active, trusted creatives targeting this slot
export async function pickCreativeForSlot(slotId: string): Promise<AdCreative | null> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("hr_ad_creatives")
    .select("id, advertiser, slot_targets, creative_url, dest_url, weight, campaign_id")
    .eq("is_trusted", true)
    .contains("slot_targets", [slotId]);

  if (error) throw error;
  if (!data || data.length === 0) return null;

  const totalWeight = data.reduce((sum, c) => sum + (c.weight || 1), 0);
  let roll = Math.random() * totalWeight;

  for (const creative of data) {
    roll -= creative.weight || 1;
    if (roll <= 0) return creative as AdCreative;
  }

  return data[data.length - 1] as AdCreative;
}

// Sign a (creative_id, slot_id, session_id) tuple so the impression/click
// endpoints can verify the client isn't forging events for creatives it was
// never actually served.
export function signAdToken(creativeId: string, slotId: string, sessionId: string): string {
  const secret = getAdSecret();
  const payload = `${creativeId}:${slotId}:${sessionId}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyAdToken(
  creativeId: string,
  slotId: string,
  sessionId: string,
  token: string
): boolean {
  const expected = signAdToken(creativeId, slotId, sessionId);
  // Constant-time comparison to avoid timing side-channels
  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(token, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
