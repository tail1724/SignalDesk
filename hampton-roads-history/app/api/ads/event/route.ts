import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdToken } from "@/lib/ads";
import { createServerSupabase } from "@/lib/supabase/server";

const bodySchema = z.object({
  creative_id: z.string().uuid(),
  slot_id: z.string(),
  session_id: z.string(),
  hmac_token: z.string(),
  event_type: z.enum(["impression", "click"]),
  article_id: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const { creative_id, slot_id, session_id, hmac_token, event_type, article_id } = parsed.data;

  // Reject forged events: the token must match one this server actually
  // issued for this exact (creative, slot, session) tuple.
  if (!verifyAdToken(creative_id, slot_id, session_id, hmac_token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("hr_ad_impressions").insert({
    creative_id,
    slot_id,
    article_id: article_id ?? null,
    session_id,
    hmac_token,
    event_type,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
