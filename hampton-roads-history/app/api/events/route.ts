import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const bodySchema = z.object({
  event_type: z.string(),
  city_slug: z.string().optional(),
  article_short_id: z.string().optional(),
  article_id: z.string().uuid().optional(),
  session_id: z.string().optional(),
});

export async function POST(req: Request) {
  // Primary enforcement is Traefik (coolify/traefik-middleware.yml, 100/min);
  // this is a defense-in-depth fallback for single-instance deployments.
  const clientIp = getClientIp(req.headers);
  if (!checkRateLimit(`events:${clientIp}`, 100)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  await supabase.from("hr_page_events").insert({
    event_type: parsed.data.event_type,
    city_slug: parsed.data.city_slug ?? null,
    article_short_id: parsed.data.article_short_id ?? null,
    article_id: parsed.data.article_id ?? null,
    session_id: parsed.data.session_id ?? null,
    referrer: req.headers.get("referer") ?? null,
  });

  return new NextResponse(null, { status: 204 });
}
