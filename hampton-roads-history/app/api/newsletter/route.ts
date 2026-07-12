import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

const bodySchema = z.object({
  email: z.string().email(),
  source: z.string().default("unknown"),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("hr_newsletter_subscribers")
    .upsert({ email: parsed.data.email, source: parsed.data.source, status: "subscribed" }, { onConflict: "email" });

  if (error) {
    return NextResponse.json({ error: "Could not subscribe" }, { status: 500 });
  }

  // TODO: forward to ESP (Resend/Mailchimp) once RESEND_API_KEY is configured.
  // No email is actually sent yet — the row is written, but nothing dispatches.

  return NextResponse.json({ ok: true });
}
