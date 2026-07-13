import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy — Hampton Roads History" };

export default function PrivacyPage() {
  return (
    <>
      <h1 className="font-display font-black text-3xl mb-6">Privacy Policy</h1>
      <p className="text-ink-3 text-sm mb-8">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

      <div className="text-ink-2 leading-relaxed space-y-5">
        <p>
          We don't run third-party ad networks, third-party analytics
          scripts, or trackers of any kind. Everything described below is
          first-party — collected directly by us, stored in our own
          database, and never sold or shared with data brokers.
        </p>

        <h2 className="font-display font-bold text-lg text-ink pt-2">What we collect</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Account information:</strong> if you create an account,
            we store your email address and an encrypted password (we never
            see or store your plaintext password — that's handled by our
            authentication provider, Supabase).
          </li>
          <li>
            <strong>Reading list:</strong> articles you save are linked to
            your account so they sync across devices.
          </li>
          <li>
            <strong>Newsletter:</strong> if you subscribe, we store your
            email address and subscription status. We use Resend to
            deliver emails — see their{" "}
            <a
              href="https://resend.com/legal/privacy-policy"
              className="text-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              privacy policy
            </a>{" "}
            for how they handle delivery.
          </li>
          <li>
            <strong>Basic analytics:</strong> page views, scroll depth, and
            which city/article you're reading, tied to an anonymous
            session ID (not your identity, unless you're signed in). This
            helps us understand what's resonating and surface trending
            stories.
          </li>
          <li>
            <strong>Ad impressions:</strong> if you see an ad slot, we log
            that impression (which creative, which slot, an anonymous
            session ID) to measure performance and to detect anomalous
            click patterns automatically. We don't track you across other
            websites.
          </li>
        </ul>

        <h2 className="font-display font-bold text-lg text-ink pt-2">Cookies</h2>
        <p>
          We use cookies to keep you signed in and to remember your theme
          preference. We do not use cookies for cross-site tracking or
          advertising.
        </p>

        <h2 className="font-display font-bold text-lg text-ink pt-2">Your rights</h2>
        <p>
          You can delete your account and associated data at any time from
          your account page, or by emailing{" "}
          <a href="mailto:hello@hamptonroadshistory.com" className="text-accent hover:underline">
            hello@hamptonroadshistory.com
          </a>
          . You can unsubscribe from the newsletter with one click from any
          email we send.
        </p>

        <h2 className="font-display font-bold text-lg text-ink pt-2">Contact</h2>
        <p>
          Questions about this policy? Email{" "}
          <a href="mailto:hello@hamptonroadshistory.com" className="text-accent hover:underline">
            hello@hamptonroadshistory.com
          </a>
          .
        </p>
      </div>
    </>
  );
}
