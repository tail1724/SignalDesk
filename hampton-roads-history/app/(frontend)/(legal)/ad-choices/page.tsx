import type { Metadata } from "next";
import Link from "next/link";
import { OpenConsentCenterButton } from "@/components/OpenConsentCenterButton";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = { title: "Ad Choices — Hampton Roads History" };

export default function AdChoicesPage() {
  return (
    <StaticPage
      kicker="Legal"
      title="Ad Choices"
      lede="How advertising is selected, labeled, and controlled on Hampton Roads History."
    >
      <section>
        <OpenConsentCenterButton>Open privacy &amp; ad choices</OpenConsentCenterButton>
        <p>
          Hampton Roads History works with third-party ad networks and
          real-time bidding partners to select and serve many of the ads you
          see, alongside ads we sell directly. These partners may use cookies
          and similar identifiers to deliver, personalize, and measure
          advertising.
        </p>
      </section>

      <section>
        <h2>How ads are selected</h2>
        <p>
          Some ads are chosen from our own pool of direct-sold creatives for
          the slot you&rsquo;re viewing. Others are filled programmatically through
          our advertising partners, who may use context about the page and
          limited device or cookie identifiers to match an ad. You can control
          personalization through our consent manager above and industry
          opt-outs (NAI / DAA / Your Privacy Choices).
        </p>
      </section>

      <section>
        <h2>Sponsored content</h2>
        <p>
          Every ad is clearly labeled &ldquo;Advertisement,&rdquo; &ldquo;Sponsored,&rdquo; or
          &ldquo;Community&rdquo; (for house ads promoting our own partners). We never
          disguise sponsored content as editorial coverage.
        </p>
      </section>

      <section>
        <h2>Quality control</h2>
        <p>
          Creatives run sandboxed, and we monitor click-through patterns
          automatically and pause any creative showing anomalous activity, to
          keep the ad experience trustworthy for readers and fair for
          advertisers.
        </p>
      </section>

      <section>
        <h2>Questions</h2>
        <p>
          For advertiser inquiries, visit our{" "}
          <Link href="/advertise">advertise page</Link>. For anything else,
          email{" "}
          <a href="mailto:hello@hamptonroadshistory.com">hello@hamptonroadshistory.com</a>.
        </p>
      </section>
    </StaticPage>
  );
}
