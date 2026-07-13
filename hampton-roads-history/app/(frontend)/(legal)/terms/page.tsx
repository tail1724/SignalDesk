import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms of Service — Hampton Roads History" };

export default function TermsPage() {
  return (
    <>
      <h1 className="font-display font-black text-3xl mb-6">Terms of Service</h1>
      <p className="text-ink-3 text-sm mb-8">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

      <div className="text-ink-2 leading-relaxed space-y-5">
        <p>
          By using Hampton Roads History (the &ldquo;Site&rdquo;), you agree to these
          terms. If you don&apos;t agree, please don&apos;t use the Site.
        </p>

        <h2 className="font-display font-bold text-lg text-ink pt-2">Content</h2>
        <p>
          All articles, images, and other content on this Site are owned by
          Hampton Roads History or used under license, unless otherwise
          noted. You may share links to our stories freely. Reproducing
          full articles elsewhere requires our written permission — email{" "}
          <a href="mailto:hello@hamptonroadshistory.com" className="text-accent hover:underline">
            hello@hamptonroadshistory.com
          </a>
          .
        </p>

        <h2 className="font-display font-bold text-lg text-ink pt-2">Accounts</h2>
        <p>
          Creating an account requires a valid email address. You&apos;re
          responsible for keeping your account credentials secure. We may
          suspend accounts used to abuse the Site (spam, scraping, or
          attempts to circumvent access controls).
        </p>

        <h2 className="font-display font-bold text-lg text-ink pt-2">Advertising</h2>
        <p>
          The Site displays advertising, including third-party advertisements
          and sponsored content served through our advertising partners.
          Advertisers, not Hampton Roads History, are responsible for the
          products and services they promote. See our{" "}
          <Link href="/ad-choices" className="text-accent hover:underline">
            Ad Choices
          </Link>{" "}
          page for how advertising works and how to manage your choices.
        </p>

        <h2 className="font-display font-bold text-lg text-ink pt-2">No warranty</h2>
        <p>
          The Site is provided &ldquo;as is.&rdquo; We work to keep information
          accurate but make no guarantee of completeness or accuracy.
          Historical accounts in particular may be subject to updated
          research — see our corrections policy on the{" "}
          <Link href="/about" className="text-accent hover:underline">
            About page
          </Link>
          .
        </p>

        <h2 className="font-display font-bold text-lg text-ink pt-2">Changes</h2>
        <p>
          We may update these terms from time to time. Continued use of the
          Site after changes constitutes acceptance of the updated terms.
        </p>
      </div>
    </>
  );
}
