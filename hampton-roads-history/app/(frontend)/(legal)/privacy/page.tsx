import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = { title: "Privacy Policy — Hampton Roads History" };

export default function PrivacyPage() {
  return (
    <StaticPage
      kicker="Legal"
      title="Privacy Policy"
      lede="What we collect, what our advertising partners collect, and the choices you have."
      updated={new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
    >
      <section>
        <p>
          Hampton Roads History is funded by advertising, including
          third-party ad networks. Our own analytics are first-party, but our
          advertising partners may use cookies and similar identifiers to
          deliver and measure ads — see the &ldquo;Advertising&rdquo; section below and
          our <Link href="/ad-choices">Ad Choices</Link> page for details and
          your options.
        </p>
      </section>

      <section>
        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Account information:</strong> if you create an account,
            we store your email address and an encrypted password (we never
            see or store your plaintext password — that&apos;s handled by our
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
            <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
              privacy policy
            </a>{" "}
            for how they handle delivery.
          </li>
          <li>
            <strong>Basic analytics:</strong> page views, scroll depth, and
            which city/article you&apos;re reading, tied to an anonymous
            session ID (not your identity, unless you&apos;re signed in). This
            helps us understand what&apos;s resonating and surface trending
            stories.
          </li>
          <li>
            <strong>Ad impressions:</strong> when you see an ad slot, we log
            that impression (which creative, which slot, an anonymous
            session ID) to measure performance and detect anomalous click
            patterns.
          </li>
        </ul>
      </section>

      <section>
        <h2>Advertising</h2>
        <p>
          We use third-party advertising networks and real-time bidding
          partners to monetize the Site. To deliver and measure ads, these
          partners may set cookies and collect device identifiers, cookie
          IDs, and page-context data. You can review partners and adjust your
          choices at any time through our consent manager (available in the
          site footer) and industry opt-outs such as the{" "}
          <a href="https://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer">
            NAI
          </a>{" "}
          and{" "}
          <a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer">
            DAA
          </a>{" "}
          tools.
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          We use cookies to keep you signed in and to remember your theme
          preference. Our advertising partners also use cookies and similar
          technologies to deliver and measure advertising, subject to your
          consent choices.
        </p>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>
          You can delete your account and associated data at any time from
          your account page, or by emailing{" "}
          <a href="mailto:hello@hamptonroadshistory.com">hello@hamptonroadshistory.com</a>.
          You can unsubscribe from the newsletter with one click from any
          email we send.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about this policy? Email{" "}
          <a href="mailto:hello@hamptonroadshistory.com">hello@hamptonroadshistory.com</a>.
        </p>
      </section>
    </StaticPage>
  );
}
