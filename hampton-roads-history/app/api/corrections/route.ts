import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { sendCorrectionReport } from "@/lib/resend";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const bodySchema = z.object({
  article_id: z.string().uuid(),
  description: z.string().trim().min(1).max(2000),
  reporter_email: z.string().email().optional(),
});

export async function POST(req: Request) {
  const clientIp = getClientIp(req.headers);
  if (!checkRateLimit(`corrections:${clientIp}`, 10)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  // Look up the article server-side rather than trusting a client-supplied
  // title/URL, so the email an editor reads always reflects a real,
  // published story.
  const { data: article, error } = await supabase
    .from("hr_articles")
    .select("title, short_id, slug, hr_categories:section_id(slug)")
    .eq("id", parsed.data.article_id)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("Failed to look up article for correction report:", error);
    return NextResponse.json({ error: "Could not submit report" }, { status: 500 });
  }
  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hamptonroadshistory.com";
  const city = article.hr_categories?.[0]?.slug ?? "hampton";
  const articleUrl = `${siteUrl}/${city}/${article.short_id}-${article.slug}`;

  try {
    await sendCorrectionReport(
      article.title,
      articleUrl,
      parsed.data.description,
      parsed.data.reporter_email
    );
  } catch (err) {
    console.error("Failed to send correction report email:", err);
    return NextResponse.json({ error: "Could not submit report" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
