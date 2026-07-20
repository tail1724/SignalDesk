import { Fragment } from "react";
import Link from "next/link";
import { CivicHero } from "@/components/editorial/CivicHero";
import { StoryCard } from "@/components/editorial/StoryCard";
import { NewsletterBand } from "@/components/NewsletterBand";
import { CatchUpCard } from "@/components/CatchUpCard";
import { CityBento } from "@/components/reactbits/CityBento";
import { AdFixture } from "../AdFixture";
import { assertFixturesEnabled } from "../guard";
import {
  AD_EXTRA, AD_LEADER, AD_NATIVE, AD_RAIL, CATCH_UP, CITIES,
  HOME_FEATURE, HOME_HERO, HOME_ROWS, HOME_TWO_UP,
} from "@/lib/fixtures/prototype";

export const dynamic = "force-dynamic";

// Visual-regression fixture: the real home modules with the prototype's exact
// copy (pixel-perfect plan §6.1). Mirrors app/(frontend)/page.tsx composition.
export default function HomeFixture() {
  assertFixturesEnabled();
  return (
    <main className="home-main">
      <CivicHero
        article={HOME_HERO}
        brief={[
          { term: "Why it matters", description: "Transportation touches every city, every employer and every family budget in the region." },
          { term: "What to watch", description: "Funding votes, construction timing and the neighborhoods first in line for change." },
        ]}
        caption="Art-direction prototype · replace with commissioned, region-accurate Hampton Roads scene"
      />

      <NewsletterBand
        title="Five things Hampton Roads needs to know."
        copy="Local reporting, useful context and one delightful detour. Weekdays at 6:30."
        source="fixture"
      />

      <AdFixture
        label="Advertisement"
        frameVariant="ad-leader"
        creativeVariant="leader"
        minHeight={116}
        data={AD_LEADER}
      />

      <section className="editorial-grid" aria-label="Latest reporting">
        <div className="story-stack">
          <header className="section-heading">
            <div>
              <span className="section-kicker">The region now</span>
              <h2>Reported for where you live</h2>
            </div>
            <Link href="#">View the live desk</Link>
          </header>

          <StoryCard article={HOME_FEATURE} variant="feature" index={2} />

          <div className="two-up">
            {HOME_TWO_UP.map((a) => (
              <StoryCard key={a.id} article={a} variant="compact" />
            ))}
          </div>

          <AdFixture
            label="Sponsored · Partner studio"
            disclosureLabel="Why this ad?"
            frameVariant="native-ad"
            creativeVariant="native"
            minHeight={210}
            data={AD_NATIVE}
          />

          {HOME_ROWS.map((a, i) => (
            <Fragment key={a.id}>
              <StoryCard article={a} variant="row" index={i + 3} />
            </Fragment>
          ))}

          <AdFixture
            label="Advertisement"
            frameVariant="extra-ad"
            creativeVariant="minimal"
            minHeight={97}
            data={AD_EXTRA}
          />
        </div>

        <aside className="home-rail">
          <CatchUpCard articles={CATCH_UP} />
          <AdFixture
            label="Advertisement"
            frameVariant="rail-ad"
            creativeVariant="rail"
            minHeight={440}
            data={AD_RAIL}
          />
          <section className="trust-card">
            <span className="section-kicker">How we report</span>
            <p>Named authors. Visible sources. Clear corrections. Advertising never controls coverage.</p>
            <Link href="#">Read our standards</Link>
          </section>
        </aside>
      </section>

      <section className="cities-band" aria-labelledby="cities-title">
        <div>
          <span className="section-kicker">Seven cities, one region</span>
          <h2 id="cities-title">Choose your home view</h2>
        </div>
        <CityBento cities={CITIES} />
      </section>
    </main>
  );
}
