import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.from("hr_categories").select("id").limit(1);

    if (error) {
      return NextResponse.json(
        { status: "error", db: false, message: error.message },
        { status: 503 }
      );
    }

    return NextResponse.json({ status: "ok", db: true, timestamp: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { status: "error", db: false, message: err instanceof Error ? err.message : "Unknown error" },
      { status: 503 }
    );
  }
}
