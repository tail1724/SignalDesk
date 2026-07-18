import Link from "next/link";
import { SmartBrief } from "@/components/editorial/SmartBrief";
import { ContextRail } from "@/components/editorial/ContextRail";
import { AdFixture } from "../AdFixture";
import { assertFixturesEnabled } from "../guard";
import {
  AD_ARTICLE_RAIL, AD_EXTRA, AD_INLINE_757, ARTICLE, HOME_ROWS,
} from "@/lib/fixtures/prototype";

export const dynamic = "force-dynamic";

// Visual-regression fixture: the real article modules with the prototype's
// exact copy (pixel-perfect plan §6.1). The body/quote/funding-chart render
// the prototype's static markup directly (production body is CMS-driven
// Lexical), so the reading rhythm below the header matches the reference.
export default function ArticleFixture() {
  assertFixturesEnabled();
  return (
    <main className="article-wrap">
      <header className="article-header">
        <div className="eyebrow">
          <span>Prototype article</span>
          <span>Civic life</span>
          <span>Norfolk</span>
        </div>
        <h1>{ARTICLE.title}</h1>
        <p className="dek">{ARTICLE.dek}</p>
        <div className="article-meta">
          <div className="author-avatar">MC</div>
          <div>
            <strong>Maya Carter</strong>
            <span>Regional affairs editor · Updated July 16 at 7:48 PM · 8 min read</span>
          </div>
          <div className="article-actions">
            <button type="button">Save</button>
            <button type="button">Share</button>
            <button type="button">Listen</button>
          </div>
        </div>
      </header>

      <figure className="article-hero">
        <div className="article-hero-art" />
        <figcaption>
          <span>Art-direction prototype based on the supplied reference image.</span>
          <span>Illustration · Prototype credit</span>
        </figcaption>
      </figure>

      <div className="article-grid">
        <article className="article-body">
          <SmartBrief
            heading="What you need to know"
            items={[
              { term: "Why it matters", description: "The region’s transportation network affects household costs, economic growth and access to opportunity." },
              { term: "The decision", description: "Local leaders must choose which projects move first and how to divide the bill." },
              { term: "What’s next", description: "Public hearings begin this fall before the final funding vote." },
            ]}
          />

          <div className="article-flow">
            <p className="dropcap">
              Hampton Roads has spent decades discussing how seven cities should move as one region. The
              next round of decisions will test whether that idea can survive contact with budgets,
              construction schedules and competing local priorities.
            </p>
            <p>
              This prototype demonstrates the intended reading rhythm: short paragraphs, clear subheads,
              source-aware summaries and ad opportunities that appear only after the reader receives
              meaningful value.
            </p>
            <h2>The big picture</h2>
            <p>
              The design gives each section a specific job. The headline establishes the decision. The
              brief explains the stakes. The body supplies evidence, context and the people affected by
              the outcome.
            </p>
          </div>

          <aside className="quote-card">
            <span>“The region only works when the connections between cities work.”</span>
            <small>Prototype quotation for layout only</small>
          </aside>

          <div className="article-flow">
            <p>
              On mobile, the text remains the primary surface. Commercial modules reserve their dimensions
              before loading, stay below the Better Ads density ceiling and never interrupt the first
              screen of useful content.
            </p>
          </div>

          <AdFixture
            label="Advertisement"
            disclosureLabel="Why this ad?"
            frameVariant="article-inline-ad"
            creativeVariant="leader"
            minHeight={116}
            data={AD_INLINE_757}
          />

          <div className="article-flow">
            <h2>Follow the money</h2>
            <p>
              The engineering plan connects every ad opportunity to a stable placement ID, every story to a
              stable content ID and every decision to consent, experiment and performance context. That
              makes net yield measurable without turning editorial pages into tracking products.
            </p>
          </div>

          <div className="data-viz" role="img" aria-label="Prototype bar chart comparing three transportation funding categories">
            <div className="data-title">
              <span>Prototype funding mix</span>
              <small>Illustrative only</small>
            </div>
            <div className="bar-row">
              <span>State</span>
              <i style={{ ["--bar" as string]: "78%" }} />
              <strong>48%</strong>
            </div>
            <div className="bar-row">
              <span>Federal</span>
              <i style={{ ["--bar" as string]: "52%" }} />
              <strong>32%</strong>
            </div>
            <div className="bar-row">
              <span>Local</span>
              <i style={{ ["--bar" as string]: "33%" }} />
              <strong>20%</strong>
            </div>
          </div>

          <div className="article-flow">
            <p>
              Readers can see what is known, what is estimated and where the information came from. That
              transparency is an editorial feature and an advertising asset: trustworthy pages retain
              audiences and support premium demand.
            </p>
          </div>

          <AdFixture
            label="Advertisement"
            frameVariant="article-extra"
            creativeVariant="minimal"
            minHeight={97}
            data={AD_EXTRA}
          />

          <section className="source-notes" aria-label="Sources & methodology">
            <span className="section-kicker">Sources &amp; methodology</span>
            <h2>How we reported this</h2>
            <ul>
              <li>Public meeting materials and budget documents</li>
              <li>Interviews with regional officials and residents</li>
              <li>Transportation and demographic data</li>
            </ul>
            <p>
              <strong>Correction?</strong> Tell the standards desk. Every verified correction appears with
              the article.
            </p>
          </section>

          <ContextRail articles={HOME_ROWS.concat(ARTICLE)} heading="Three stories that add context" />
        </article>

        <aside className="article-rail">
          <div className="rail-sticky">
            <section className="key-people">
              <span className="section-kicker">Track this story</span>
              <h3>Transportation plan</h3>
              <p>Get an alert when votes, costs or timelines change.</p>
              <button type="button">Follow updates</button>
            </section>
            <AdFixture
              label="Advertisement"
              frameVariant="rail-ad"
              creativeVariant="rail"
              minHeight={440}
              data={AD_ARTICLE_RAIL}
            />
          </div>
        </aside>
      </div>

      <Link href="#" className="sr-only">
        End of fixture
      </Link>
    </main>
  );
}
