import { createClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS entirely, same trust tier as
// DATABASE_URI. Distinct from lib/supabase/server.ts's createServerSupabase
// (anon-key, cookie-scoped, RSC/route-handler only) — this one has no
// next/headers dependency, so it's safe to call from standalone scripts
// (scripts/retention.mts) as well as privileged server-only route handlers.
// Never import this into anything that could run in — or be bundled for —
// the browser.
export function createServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
