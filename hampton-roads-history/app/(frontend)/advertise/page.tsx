import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Advertise — Hampton Roads History" };

export default function AdvertisePage() {
  return (
    <main className="reading py-16">
      <h1 className="font-display font-black text-3xl mb-4">Advertise with us</h1>
      <p className="text-ink-2 leading-relaxed mb-4">
        Hampton Roads History is funded by advertising. We offer direct-sold
        sponsorships and native sponsored content in the feed, alongside
        programmatic placements served through third-party ad networks and
        real-time bidding partners.
      </p>
      <p className="text-ink-2 leading-relaxed">
        Reach readers who care deeply about this region — every unit is
        clearly labeled and held to our{" "}
        <Link href="/ad-choices" className="text-accent hover:underline">
          Ad Choices
        </Link>{" "}
        standards. Get in touch at{" "}
        <a href="mailto:advertising@hamptonroadshistory.com" className="text-accent hover:underline">
          advertising@hamptonroadshistory.com
        </a>{" "}
        for the rate card.
      </p>
    </main>
  );
}
