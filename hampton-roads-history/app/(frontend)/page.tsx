import { Fragment } from "react";
import Link from "next/link";
import { getFeedArticles, getCategories } from "@/lib/data";
import { CivicHero } from "@/components/editorial/CivicHero";
import { StoryCard } from "@/components/editorial/StoryCard";
import { ArticleCard } from "@/components/ArticleCard";
import { NewsletterBand } from "@/components/NewsletterBand";
import { CatchUpCard } from "@/components/CatchUpCard";
import { ConversionBand } from "@/components/ConversionBand";
import { DirectSponsor } from "@/components/ads/DirectSponsor";
import { PartnerStudioCard } from "@/components/ads/PartnerStudioCard";
import { RailPlacement } from "@/components/ads/RailPlacement";
import { AdFrame } from "@/components/ads/AdFrame";
import { AdSlot } from "@/components/AdSlot";
import { PageViewTracker } from "@/components/PageViewTracker";

// After which feed positions (in the "More reporting" continuation list) to
// inject an inline sponsored unit.
const AD_AFTER_POSITIONS = new Set([3, 8]);

// force-dynamic keeps the build from needing Supabase access at build time
// (this sandbox's egress policy blocks the project host); Coolify's build
// environment should have real network access, at which point this can
// revert to `export const revalidate = 300` for ISR per the PRD.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [articles, cities] = await Promise.all([getFeedArticles(undefined, 24), getCategories()]);

  const hero = articles[0];
  const feature = articles[1];
  const twoUp = articles.slice(2, 4);
  const rows = articles.slice(4, 6);
  const catchUp = articles.slice(6, 10);
  const more = articles.slice(10);

  if (!hero) {
    return (
      <main className="shell py-16 text-center text-ink-3">
        No stories are published yet — check back soon.
      </main>
    );
  }

  return (
    <main>
      <PageViewTracker />
      <CivicHero article={hero} />

      <div className="shell mt-7">
        <NewsletterBand
          title="The Morning Dispatch"
          copy="One flagship story, a few quick reads — Hampton Roads history in your inbox, weekday mornings. Free."
          source="home-band-top"
        />
      </div>

      <div className="shell mt-8">
        <DirectSponsor slotId="home-leader-01" className="mx-auto max-w-[970px]" />
      </div>

      <div className="shell mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_310px]">
        <div className="flex flex-col gap-6">
          {feature && <StoryCard article={feature} variant="feature" index={2} />}

          {twoUp.length > 0 && (
            <div className="grid grid-cols-1 divide-y divide-line border-y border-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              {twoUp.map((a) => (
                <StoryCard key={a.id} article={a} variant="compact" />
              ))}
            </div>
          )}

          <PartnerStudioCard slotId="home-native-01" />

          {rows.map((a, i) => (
            <StoryCard key={a.id} article={a} variant="row" index={i + 3} />
          ))}
        </div>

        <aside className="flex flex-col gap-6">
          <CatchUpCard articles={catchUp} />
          <RailPlacement slotId="home-rail-01" />
          <section className="rounded-[2px_16px_2px_16px] bg-surface-2 p-6">
            <span className="mb-1 block font-mono text-[8px] uppercase tracking-[.14em] text-accent-soft">
              How we report
            </span>
            <p className="font-display text-[15px] leading-[1.4] text-ink-2">
              Named authors. Visible sources. Clear corrections. Advertising never controls
              coverage.
            </p>
            <Link href="/about" className="text-[9px] font-black text-accent-soft">
              Read our standards
            </Link>
          </section>
        </aside>
      </div>

      {more.length > 0 && (
        <div className="shell mt-12 flex flex-col gap-7">
          <header className="flex items-end justify-between gap-5 border-b-2 border-federal pb-3">
            <h2 className="font-display text-[26px] font-black tracking-[-0.02em] text-ink">
              More reporting
            </h2>
          </header>
          {more.map((article, i) => {
            const position = i + 1;
            return (
              <Fragment key={article.id}>
                <ArticleCard article={article} />
                {AD_AFTER_POSITIONS.has(position) && (
                  <AdFrame label="Advertisement" minHeight={72}>
                    <AdSlot slotId="home-feed" variant="minimal" />
                  </AdFrame>
                )}
              </Fragment>
            );
          })}
        </div>
      )}

      <section
        id="cities"
        aria-labelledby="cities-title"
        className="mt-14 scroll-mt-20 bg-federal px-6 py-12 text-white sm:px-0"
      >
        <div className="shell grid grid-cols-1 items-center gap-8 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <span className="mb-1.5 block font-mono text-[8px] uppercase tracking-[.14em] text-[#e8c778]">
              Seven cities, one region
            </span>
            <h2 id="cities-title" className="font-display text-[32px] font-black leading-none sm:text-[37px]">
              Choose your home view
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {cities.map((c) => (
              <Link
                key={c.id}
                href={`/${c.slug}`}
                className="rounded-full border border-white/20 bg-white/[.06] px-3.5 py-2.5 text-[10px] text-[#dbe5ed] hover:bg-white hover:text-federal"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="shell mt-10 mb-4">
        <ConversionBand />
      </div>
    </main>
  );
}
