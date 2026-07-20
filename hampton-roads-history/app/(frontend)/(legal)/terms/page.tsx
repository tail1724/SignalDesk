import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = { title: "Terms of Service — Hampton Roads History" };

export default function TermsPage() {
  return (
    <StaticPage
      kicker="Legal"
      title="Terms of Service"
      lede="The ground rules for using Hampton Roads History."
      updated={new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
    >
      <section>
        <p>
          By using Hampton Roads History (the &ldquo;Site&rdquo;), you agree to these
          terms. If you don&apos;t agree, please don&apos;t use the Site.
        </p>
      </section>

      <section>
        <h2>Content</h2>
        <p>
          All articles, images, and other content on this Site are owned by
          Hampton Roads History or used under license, unless otherwise
          noted. You may share links to our stories freely. Reproducing
          full articles elsewhere requires our written permission — email{" "}
          <a href="mailto:hello@hamptonroadshistory.com">hello@hamptonroadshistory.com</a>.
        </p>
      </section>

      <section>
        <h2>Accounts</h2>
        <p>
          Creating an account requires a valid email address. You&apos;re
          responsible for keeping your account credentials secure. We may
          suspend accounts used to abuse the Site (spam, scraping, or
          attempts to circumvent access controls).
        </p>
      </section>

      <section>
        <h2>Advertising</h2>
        <p>
          The Site displays advertising, including third-party advertisements
          and sponsored content served through our advertising partners.
          Advertisers, not Hampton Roads History, are responsible for the
          products and services they promote. See our{" "}
          <Link href="/ad-choices">Ad Choices</Link> page for how advertising
          works and how to manage your choices.
        </p>
      </section>

      <section>
        <h2>No warranty</h2>
        <p>
          The Site is provided &ldquo;as is.&rdquo; We work to keep information
          accurate but make no guarantee of completeness or accuracy.
          Historical accounts in particular may be subject to updated
          research — see our <Link href="/corrections">corrections policy</Link>.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may update these terms from time to time. Continued use of the
          Site after changes constitutes acceptance of the updated terms.
        </p>
      </section>
    </StaticPage>
  );
}
