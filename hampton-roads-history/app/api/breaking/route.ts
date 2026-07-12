import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { revalidateBreaking } from "@/lib/revalidate";

export async function GET(request: NextRequest) {
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

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { headline, description, imageUrl, articleId } = await request.json();

  if (!headline) {
    return NextResponse.json(
      { error: "Headline is required" },
      { status: 400 }
    );
  }

  // Deactivate any existing breaking banners
  await supabase
    .from("hr_breaking")
    .update({ is_active: false })
    .eq("is_active", true);

  // Create new breaking banner
  const { data, error } = await supabase
    .from("hr_breaking")
    .insert({
      headline,
      description: description || null,
      image_url: imageUrl || null,
      article_id: articleId || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Revalidate home page and city pages
  await revalidateBreaking();

  return NextResponse.json({ breaking: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from("hr_breaking")
    .update({ is_active: false })
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await revalidateBreaking();

  return NextResponse.json({ success: true });
}
