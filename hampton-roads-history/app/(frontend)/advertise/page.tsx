import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = { title: "Advertise — Hampton Roads History" };

export default function AdvertisePage() {
  return (
    <StaticPage
      kicker="Partner with us"
      title="Advertise with us"
      lede="Reach readers who care deeply about this region — across seven cities and four centuries of stories."
    >
      <section>
        <h2>What we offer</h2>
        <p>
          Hampton Roads History is funded by advertising. We offer direct-sold
          sponsorships and native sponsored content in the feed, alongside
          programmatic placements served through third-party ad networks and
          real-time bidding partners.
        </p>
      </section>

      <section>
        <h2>Our standards</h2>
        <p>
          Every unit is clearly labeled and held to our{" "}
          <Link href="/ad-choices">Ad Choices</Link> standards — sponsored
          content never masquerades as editorial coverage, and creatives run
          sandboxed with automatic quality monitoring.
        </p>
      </section>

      <section>
        <h2>Get the rate card</h2>
        <p>
          Email{" "}
          <a href="mailto:advertising@hamptonroadshistory.com">
            advertising@hamptonroadshistory.com
          </a>{" "}
          and we&apos;ll send current availability and pricing.
        </p>
      </section>
    </StaticPage>
  );
}
