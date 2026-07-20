import { Fragment } from "react";
import Link from "next/link";
import { getFeedArticles } from "@/lib/data";
import { getHomepageHeroMedia } from "@/lib/featured";
import { CivicHero } from "@/components/editorial/CivicHero";
import { StoryCard } from "@/components/editorial/StoryCard";
import { NewsletterBand } from "@/components/NewsletterBand";
import { CatchUpCard } from "@/components/CatchUpCard";
import { DirectSponsor } from "@/components/ads/DirectSponsor";
import { PartnerStudioCard } from "@/components/ads/PartnerStudioCard";
import { RailPlacement } from "@/components/ads/RailPlacement";
import { AdFrame } from "@/components/ads/AdFrame";
import { AdSlot } from "@/components/AdSlot";
import { PageEngagement } from "@/components/ads/PageEngagement";
import { PageViewTracker } from "@/components/PageViewTracker";
import { NonCriticalBoundary } from "@/components/NonCriticalBoundary";

// Homepage — DOM mirrors redesign/vapornet/index.html's home screen:
// .home-main > cinematic hero, morning-line, leader ad, editorial grid
// (story stack + home rail), cities band. Continuation stories render as
// additional numbered .story-row items inside the story stack, with the
// prototype's .extra-ad frame injected periodically.
const EXTRA_AD_EVERY = 5;

// force-dynamic keeps the build from needing Supabase access at build time
// (this sandbox's egress policy blocks the project host); Coolify's build
// environment should have real network access, at which point this can
// revert to `export const revalidate = 300` for ISR per the PRD.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [articlesResult, heroMediaResult] = await Promise.allSettled([
    getFeedArticles(undefined, 24),
    getHomepageHeroMedia(),
  ]);

  if (articlesResult.status === "rejected") {
    console.error("HomePage: failed to load feed articles", articlesResult.reason);
  }
  if (heroMediaResult.status === "rejected") {
    console.error("HomePage: failed to load homepage hero media", heroMediaResult.reason);
  }

  const articles = articlesResult.status === "fulfilled" ? articlesResult.value : [];
  const heroMedia = heroMediaResult.status === "fulfilled" ? heroMediaResult.value : null;

  const hero = articles[0];
  const feature = articles[1];
  const twoUp = articles.slice(2, 4);
  const rows = articles.slice(4);
  const catchUp = articles.slice(6, 10);

  if (!hero) {
    return (
      <main className="section-page text-center" style={{ color: "var(--ink-3)" }}>
        No stories are published yet — check back soon.
      </main>
    );
  }

  return (
    <main className="home-main">
      <NonCriticalBoundary label="PageViewTracker">
        <PageViewTracker />
      </NonCriticalBoundary>
      <CivicHero article={hero} heroImageUrl={heroMedia?.url} />

      <NewsletterBand
        title="Five things Hampton Roads needs to know."
        copy="Local reporting, useful context and one delightful detour. Weekdays at 6:30."
        source="home-band-top"
      />

      <NonCriticalBoundary label="Home leader ad">
        <DirectSponsor slotId="home-leader-01" />
      </NonCriticalBoundary>

      <section className="editorial-grid" aria-label="Latest reporting">
        <div className="story-stack">
          <header className="section-heading">
            <div>
              <span className="section-kicker">The region now</span>
              <h2>Reported for where you live</h2>
            </div>
            <Link href="/watch">View the live desk</Link>
          </header>

          {feature && <StoryCard article={feature} variant="feature" index={2} />}

          {twoUp.length > 0 && (
            <div className="two-up">
              {twoUp.map((a) => (
                <StoryCard key={a.id} article={a} variant="compact" />
              ))}
            </div>
          )}

          <NonCriticalBoundary label="Home native ad">
            <PartnerStudioCard slotId="home-native-01" />
          </NonCriticalBoundary>

          {rows.map((a, i) => (
            <Fragment key={a.id}>
              <StoryCard article={a} variant="row" index={i + 3} />
              {(i + 1) % EXTRA_AD_EVERY === 0 && (
                <NonCriticalBoundary label="Home feed ad">
                  <AdFrame variant="extra-ad" minHeight={97}>
                    <AdSlot slotId="home-feed" variant="minimal" />
                  </AdFrame>
                </NonCriticalBoundary>
              )}
            </Fragment>
          ))}
        </div>

        <aside className="home-rail">
          <CatchUpCard articles={catchUp} />
          <NonCriticalBoundary label="Home rail ad">
            <RailPlacement slotId="home-rail-01" />
          </NonCriticalBoundary>
          <section className="trust-card">
            <span className="section-kicker">How we report</span>
            <p>Named authors. Visible sources. Clear corrections. Advertising never controls coverage.</p>
            <Link href="/editorial-standards">Read our standards</Link>
          </section>
        </aside>
      </section>

      <NonCriticalBoundary label="PageEngagement">
        <PageEngagement routeType="home" />
      </NonCriticalBoundary>
    </main>
  );
}
