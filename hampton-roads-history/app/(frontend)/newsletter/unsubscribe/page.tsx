import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function UnsubscribeNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let unsubscribed = false;

  if (token) {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.rpc("hr_unsubscribe_newsletter", {
      p_token: token,
    });

    if (!error && data === true) {
      unsubscribed = true;
    }
  }

  return (
    <main className="wrap py-24 max-w-lg text-center">
      {unsubscribed ? (
        <>
          <div className="font-mono text-xs tracking-wide uppercase text-accent-soft mb-3">
            Unsubscribed
          </div>
          <h1 className="font-display font-black text-3xl mb-4">
            You&apos;ve been removed from the list.
          </h1>
          <p className="text-ink-2 mb-8">
            You won&apos;t receive the morning dispatch anymore. You can
            resubscribe anytime from the homepage.
          </p>
        </>
      ) : (
        <>
          <div className="font-mono text-xs tracking-wide uppercase text-accent-soft mb-3">
            Link expired
          </div>
          <h1 className="font-display font-black text-3xl mb-4">
            This unsubscribe link isn&apos;t valid.
          </h1>
          <p className="text-ink-2 mb-8">
            It may have already been used, or it&apos;s expired.
          </p>
        </>
      )}
      <Link
        href="/"
        className="inline-block bg-accent text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-accent-dim transition-colors"
      >
        Back to homepage
      </Link>
    </main>
  );
}
