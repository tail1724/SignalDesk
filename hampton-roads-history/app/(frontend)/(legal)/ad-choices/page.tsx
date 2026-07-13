import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ad Choices — Hampton Roads History" };

export default function AdChoicesPage() {
  return (
    <>
      <h1 className="font-display font-black text-3xl mb-6">Ad Choices</h1>

      <div className="text-ink-2 leading-relaxed space-y-5">
        <p>
          Hampton Roads History runs a first-party ad system — there's no
          third-party ad network, no real-time bidding, and no cross-site
          tracking involved. Every ad you see on this site was selected and
          served directly by us.
        </p>

        <h2 className="font-display font-bold text-lg text-ink pt-2">How ads are selected</h2>
        <p>
          Ads are chosen from a pool of active, approved creatives for the
          slot you're viewing, weighted by the flight the advertiser
          purchased. We don't build a profile of your browsing history or
          buy data about you to target ads — placement is based on where
          you are on the site (which slot), not who you are.
        </p>

        <h2 className="font-display font-bold text-lg text-ink pt-2">Sponsored content</h2>
        <p>
          Every ad is clearly labeled "Advertisement" or "Community" (for
          house ads promoting our own partners). We never disguise
          sponsored content as editorial coverage.
        </p>

        <h2 className="font-display font-bold text-lg text-ink pt-2">Quality control</h2>
        <p>
          We monitor click-through patterns automatically and pause any
          creative showing anomalous activity, to keep the ad experience
          trustworthy for readers and fair for advertisers.
        </p>

        <h2 className="font-display font-bold text-lg text-ink pt-2">Questions</h2>
        <p>
          For advertiser inquiries, visit our{" "}
          <a href="/advertise" className="text-accent hover:underline">
            advertise page
          </a>
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
