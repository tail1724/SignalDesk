import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/StaticPage";
import { CrossLinkBento } from "@/components/reactbits/CrossLinkBento";

export const metadata: Metadata = {
  title: "Corrections — Hampton Roads History",
  description: "How to report an error in a Hampton Roads History story, and what we do about it.",
};

export default function CorrectionsPage() {
  return (
    <StaticPage
      kicker="Accountability"
      title="Corrections"
      lede="When we get something wrong, we correct it publicly rather than quietly editing it away."
    >
      <section>
        <h2>Found an error? We want to know.</h2>
        <p>
          Email{" "}
          <a href="mailto:corrections@hamptonroadshistory.com">
            corrections@hamptonroadshistory.com
          </a>{" "}
          with the article title and what&apos;s wrong. We review every report.
        </p>
      </section>

      <section>
        <h2>What happens next</h2>
        <ul>
          <li>We re-check the disputed fact against the primary sources used in the story.</li>
          <li>
            If the story was wrong, we fix the text and post a correction at
            the bottom of the affected story describing what changed and when.
          </li>
          <li>
            If the record is genuinely contested, we update the story to
            reflect the disagreement rather than picking a side silently.
          </li>
        </ul>
        <p>
          This policy is part of our{" "}
          <Link href="/editorial-standards">editorial standards</Link>.
        </p>
      </section>

      <section>
        <h2>Related</h2>
        <CrossLinkBento
          links={[
            {
              href: "/editorial-standards",
              label: "How we report",
              title: "Editorial standards",
              description: "Sourcing, fact-checking, and independence from advertisers.",
            },
            {
              href: "/about",
              label: "The publication",
              title: "About us",
              description: "Who runs Hampton Roads History and how to reach us.",
            },
          ]}
        />
      </section>
    </StaticPage>
  );
}
