import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { sendConfirmationEmail } from "@/lib/resend";

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

  const supabase = await createServerSupabase();

  // Generate the token here rather than relying on the column default and
  // reading it back: anon has no SELECT policy on this table (by design,
  // to prevent enumerating subscriber emails), so insert().select() would
  // come back empty even though the row was written successfully.
  const confirmToken = crypto.randomUUID();

  // Plain insert, not upsert: RLS only allows anon to UPDATE a row it can
  // prove ownership of via confirm_token (see the double opt-in policies),
  // so a same-email upsert would fail its UPDATE branch on conflict.
  const { error } = await supabase.from("hr_newsletter_subscribers").insert({
    email: parsed.data.email,
    source: parsed.data.source,
    confirm_token: confirmToken,
  });

  if (error) {
    // Unique violation: this email already has a row. Treat re-submission
    // as a no-op success — the original confirmation email is still valid,
    // and we have no way to read the existing token back under RLS.
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, alreadySubscribed: true });
    }
    return NextResponse.json({ error: "Could not subscribe" }, { status: 500 });
  }

  try {
    await sendConfirmationEmail(parsed.data.email, confirmToken);
  } catch (err) {
    console.error("Failed to send newsletter confirmation email:", err);
    // The subscription row exists either way; the user can be re-sent a
    // confirmation later. Don't fail the request over an ESP hiccup.
  }

  return NextResponse.json({ ok: true });
}
