import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Ad Choices — Hampton Roads History" };

export default function AdChoicesPage() {
  return (
    <>
      <h1 className="font-display font-black text-3xl mb-6">Ad Choices</h1>

      <div className="text-ink-2 leading-relaxed space-y-5">
        <p>
          Hampton Roads History works with third-party ad networks and
          real-time bidding partners to select and serve many of the ads you
          see, alongside ads we sell directly. These partners may use cookies
          and similar identifiers to deliver, personalize, and measure
          advertising.
        </p>

        <h2 className="font-display font-bold text-lg text-ink pt-2">How ads are selected</h2>
        <p>
          Some ads are chosen from our own pool of direct-sold creatives for
          the slot you&rsquo;re viewing. Others are filled programmatically through
          our advertising partners, who may use context about the page and
          limited device or cookie identifiers to match an ad. You can control
          personalization through our consent manager and industry opt-outs
          (NAI / DAA / Your Privacy Choices).
        </p>

        <h2 className="font-display font-bold text-lg text-ink pt-2">Sponsored content</h2>
        <p>
          Every ad is clearly labeled &ldquo;Advertisement,&rdquo; &ldquo;Sponsored,&rdquo; or
          &ldquo;Community&rdquo; (for house ads promoting our own partners). We never
          disguise sponsored content as editorial coverage.
        </p>

        <h2 className="font-display font-bold text-lg text-ink pt-2">Quality control</h2>
        <p>
          Creatives run sandboxed, and we monitor click-through patterns
          automatically and pause any creative showing anomalous activity, to
          keep the ad experience trustworthy for readers and fair for
          advertisers.
        </p>

        <h2 className="font-display font-bold text-lg text-ink pt-2">Questions</h2>
        <p>
          For advertiser inquiries, visit our{" "}
          <Link href="/advertise" className="text-accent hover:underline">
            advertise page
          </Link>
          . For anything else, email{" "}
          <a href="mailto:hello@hamptonroadshistory.com" className="text-accent hover:underline">
            hello@hamptonroadshistory.com
          </a>
          .
        </p>
      </div>
    </>
  );
}
