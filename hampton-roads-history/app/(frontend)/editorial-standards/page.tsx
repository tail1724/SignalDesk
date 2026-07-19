import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/StaticPage";
import { CrossLinkBento } from "@/components/reactbits/CrossLinkBento";

export const metadata: Metadata = {
  title: "Editorial Standards — Hampton Roads History",
  description:
    "How Hampton Roads History researches, fact-checks, and labels its journalism — and how we keep advertising away from coverage decisions.",
};

export default function EditorialStandardsPage() {
  return (
    <StaticPage
      kicker="How we report"
      title="Editorial Standards"
      lede="Named authors. Visible sources. Clear corrections. Advertising never controls coverage."
    >
      <section>
        <h2>Sourcing and fact-checking</h2>
        <p>
          Every story is fact-checked against primary sources — archives,
          public records, and named interviews. Where the historical record is
          contested or incomplete, we say so in the story rather than smoothing
          it over. Major features carry a source-notes block listing the
          records and interviews the reporting rests on.
        </p>
      </section>

      <section>
        <h2>Independence from advertisers</h2>
        <p>
          Our journalism is funded by advertising, and the wall between the two
          is absolute. We clearly label sponsored content — every paid unit is
          marked &ldquo;Advertisement,&rdquo; &ldquo;Sponsored,&rdquo; or
          &ldquo;Community&rdquo; — and we never let advertisers influence
          editorial coverage, story selection, or framing. How ads are selected
          and labeled is documented on our <Link href="/ad-choices">Ad Choices</Link> page.
        </p>
      </section>

      <section>
        <h2>Bylines and accountability</h2>
        <p>
          Stories carry the names of the people who reported them. When we rely
          on outside experts — archaeologists, archivists, historians — we name
          them and describe their role.
        </p>
      </section>

      <section>
        <h2>When we get it wrong</h2>
        <p>
          When we get something wrong, we correct it publicly rather than
          quietly editing it away. Corrections are posted at the bottom of the
          affected story. See our <Link href="/corrections">corrections policy</Link>{" "}
          for how to report an error.
        </p>
      </section>

      <section>
        <h2>Questions</h2>
        <p>
          Questions about these standards? Email{" "}
          <a href="mailto:hello@hamptonroadshistory.com">hello@hamptonroadshistory.com</a>.
        </p>
      </section>

      <section>
        <h2>Related</h2>
        <CrossLinkBento
          links={[
            {
              href: "/corrections",
              label: "Accountability",
              title: "Corrections",
              description: "Report an error and see how we handle it publicly.",
            },
            {
              href: "/ad-choices",
              label: "Advertising",
              title: "Ad Choices",
              description: "How ads are selected, labeled, and kept separate from coverage.",
            },
            {
              href: "/about",
              label: "The publication",
              title: "About us",
              description: "Who runs Hampton Roads History and how we're funded.",
            },
          ]}
        />
      </section>
    </StaticPage>
  );
}
