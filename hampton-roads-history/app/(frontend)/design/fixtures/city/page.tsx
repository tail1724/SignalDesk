import Link from "next/link";
import { CityEdition } from "@/components/editorial/CityEdition";
import { StoryCard } from "@/components/editorial/StoryCard";
import { AdFixture } from "../AdFixture";
import { assertFixturesEnabled } from "../guard";
import { AD_CITY_RAIL, AD_SECTION, CITIES, HOME_ROWS, HOME_TWO_UP } from "@/lib/fixtures/prototype";

export const dynamic = "force-dynamic";

// Visual-regression fixture: the real city-edition modules with the
// prototype's exact copy (pixel-perfect plan §6.1). Mirrors
// app/(frontend)/[city]/page.tsx composition.
export default function CityFixture() {
  assertFixturesEnabled();
  const norfolk = CITIES[0];
  const desk = HOME_TWO_UP.concat(HOME_ROWS).slice(0, 3);

  return (
    <div className="section-page">
      <CityEdition city={norfolk} cities={CITIES} updatedAt="2026-07-16T20:42:00.000Z" />

      <div className="section-layout">
        <div>
          <article className="section-lead">
            <Link href="#" className="section-lead-art" aria-label="Lead story">
              <span className="map-lines" aria-hidden />
              <span className="city-coordinate">36°51′N<br />76°17′W</span>
            </Link>
            <div>
              <div className="eyebrow">
                <span>Prototype story</span>
                <span>Civic</span>
              </div>
              <h2 style={{ margin: "0 0 10px", font: "900 clamp(26px,3vw,36px)/1.02 var(--display)", letterSpacing: "-.03em" }}>
                <Link href="#">A neighborhood-first plan for downtown reaches its decisive vote</Link>
              </h2>
              <p style={{ margin: 0, color: "var(--ink-2)", fontSize: 14, lineHeight: 1.55 }}>
                What changes, what it costs and the four blocks at the center of the debate.
              </p>
              <div className="byline" style={{ marginTop: 12 }}>
                By Maya Carter · Updated 24 minutes ago
              </div>
              <Link href="#" className="text-link">
                Read the full briefing
              </Link>
            </div>
          </article>

          <AdFixture
            label="Advertisement"
            frameVariant="section-ad"
            creativeVariant="minimal"
            minHeight={90}
            data={AD_SECTION}
          />

          <header className="section-heading">
            <div>
              <span className="section-kicker">Latest from Norfolk</span>
              <h2>The city desk</h2>
            </div>
            <span>Newest first</span>
          </header>
          {desk.map((a, i) => (
            <StoryCard key={a.id} article={a} variant="row" index={i + 1} />
          ))}
        </div>

        <aside className="section-rail">
          <section className="data-card">
            <span className="section-kicker">Norfolk at a glance</span>
            <div className="stat">
              <strong>245K</strong>
              <span>residents</span>
            </div>
            <div className="stat">
              <strong>144</strong>
              <span>neighborhoods</span>
            </div>
            <div className="stat">
              <strong>1</strong>
              <span>regional story</span>
            </div>
            <small>Prototype data for layout demonstration.</small>
          </section>
          <AdFixture
            label="Advertisement"
            frameVariant="rail-ad"
            creativeVariant="rail"
            minHeight={440}
            data={AD_CITY_RAIL}
          />
        </aside>
      </div>
    </div>
  );
}
