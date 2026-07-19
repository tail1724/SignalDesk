import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/StaticPage";
import { CrossLinkBento } from "@/components/reactbits/CrossLinkBento";

export const metadata: Metadata = {
  title: "About — Hampton Roads History",
  description: "Who runs Hampton Roads History, how we're funded, and how to reach us.",
};

export default function AboutPage() {
  return (
    <StaticPage
      kicker="The publication"
      title="About Hampton Roads History"
      lede="Four centuries of life across seven cities — reported for the people who live, work and build here."
    >
      <section>
        <h2>What this is</h2>
        <p>
          Hampton Roads History is a local publication covering four centuries
          of life across Hampton, Newport News, Norfolk, Virginia Beach,
          Chesapeake, Portsmouth, and Suffolk. We report deeply researched
          stories about the people, places, and events that shaped this region
          — not just what happened, but why it still matters.
        </p>
        <p>
          We&apos;re an independent publication, owned and operated by
          Mid-Atlantic Labs. Our journalism is funded by advertising, including
          third-party ad partners — see our <Link href="/ad-choices">Ad Choices</Link>{" "}
          and <Link href="/privacy">privacy policy</Link> pages for how that works.
        </p>
      </section>

      <section>
        <h2>How we hold ourselves accountable</h2>
        <p>
          Our reporting rules — sourcing, sponsorship labeling, and how we
          handle mistakes — live on their own pages:
        </p>
        <CrossLinkBento
          links={[
            {
              href: "/editorial-standards",
              label: "How we report",
              title: "Editorial standards",
              description:
                "How stories are researched, fact-checked, and kept independent of advertisers.",
            },
            {
              href: "/corrections",
              label: "Accountability",
              title: "Corrections",
              description:
                "How to report an error and what we do when we get something wrong.",
            },
          ]}
        />
      </section>

      <section>
        <h2>Contact</h2>
        <address>
          <p>
            General inquiries:{" "}
            <a href="mailto:hello@hamptonroadshistory.com">hello@hamptonroadshistory.com</a>
            <br />
            Story tips:{" "}
            <a href="mailto:tips@hamptonroadshistory.com">tips@hamptonroadshistory.com</a>
            <br />
            Advertising: <Link href="/advertise">hamptonroadshistory.com/advertise</Link>
          </p>
        </address>
      </section>
    </StaticPage>
  );
}
