import { createClient } from "@supabase/supabase-js";

// Server-side anon client. RLS enforces published-only reads for
// hr_articles, so it's safe to use the anon key here — no service
// role key is ever needed for public content fetches.
export function createServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
