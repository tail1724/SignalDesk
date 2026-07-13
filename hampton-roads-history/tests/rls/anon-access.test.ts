import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";

// Codifies docs/rls-audit.md's manual `SET LOCAL ROLE anon` audit as a
// runnable regression test, driven over the real anon REST API (the actual
// path a browser uses, complementing the stronger at-database proof already
// on record in docs/rls-audit.md).
//
// Needs a reachable Supabase project, so it's skipped unless the anon
// credentials are present in the environment (e.g. in CI, not in this
// sandbox, whose egress policy blocks the Supabase host).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const describeIfConfigured = url && anonKey ? describe : describe.skip;

describeIfConfigured("RLS: anon key access (docs/rls-audit.md)", () => {
  // Only constructed when url/anonKey are both present (describe.skip still
  // evaluates this body to collect the skipped test list, just not run them).
  const supabase = url && anonKey ? createClient(url, anonKey) : null!;

  it.each([
    "hr_profiles",
    "hr_watchlists",
    "hr_ad_impressions",
    "hr_silver_article_sessions",
  ])("returns 0 rows from %s for the anon role", async (table) => {
    const { data, error } = await supabase.from(table).select("*").limit(1);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("cannot confirm a newsletter subscription without the token (RPC only, no direct UPDATE)", async () => {
    const { error } = await supabase
      .from("hr_newsletter_subscribers")
      .update({ status: "confirmed" })
      .eq("status", "pending");
    // Blocked either by RLS (no UPDATE policy) or by PostgREST schema cache;
    // the guarantee under test is that this direct-table path is not how
    // confirmation happens — only hr_confirm_newsletter_subscription(token) is.
    expect(error).not.toBeNull();
  });

  it("allows public read of published articles (control: RLS is not blocking everything)", async () => {
    const { error } = await supabase.from("hr_articles").select("id").limit(1);
    expect(error).toBeNull();
  });
});
