import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// Breaking banner content is authored via Payload admin (/admin), whose
// hooks handle exclusivity (only one active banner) and revalidation.
// This route is read-only, matching the RLS policy (public SELECT only).
export async function GET() {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("hr_breaking")
    .select("id, headline, description, image_url, article_id, is_active, updated_at")
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ breaking: data });
}
