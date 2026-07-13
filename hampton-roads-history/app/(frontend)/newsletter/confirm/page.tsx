import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

export default async function ConfirmNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let confirmed = false;

  if (token) {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .rpc("hr_confirm_newsletter_subscription", { p_token: token })
      .single<{ confirmed: boolean; subscriber_email: string | null }>();

    if (!error && data?.confirmed) {
      confirmed = true;
      if (data.subscriber_email) {
        try {
          await sendWelcomeEmail(data.subscriber_email, token);
        } catch (err) {
          console.error("Failed to send newsletter welcome email:", err);
        }
      }
    }
  }

  return (
    <main className="wrap py-24 max-w-lg text-center">
      {confirmed ? (
        <>
          <div className="font-mono text-xs tracking-wide uppercase text-accent-soft mb-3">
            Confirmed
          </div>
          <h1 className="font-display font-black text-3xl mb-4">
            You&apos;re all set.
          </h1>
          <p className="text-ink-2 mb-8">
            Look for the morning dispatch in your inbox on weekdays — one
            flagship story and a few quick reads from across Hampton Roads.
          </p>
        </>
      ) : (
        <>
          <div className="font-mono text-xs tracking-wide uppercase text-accent-soft mb-3">
            Link expired
          </div>
          <h1 className="font-display font-black text-3xl mb-4">
            This confirmation link isn&apos;t valid.
          </h1>
          <p className="text-ink-2 mb-8">
            It may have already been used, or it&apos;s expired. Try
            subscribing again from the homepage.
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
