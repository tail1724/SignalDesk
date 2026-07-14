import { Fragment } from "react";
import { getFeedArticles } from "@/lib/data";
import { FeedHero } from "@/components/FeedHero";
import { ArticleCard } from "@/components/ArticleCard";
import { NewsletterBand } from "@/components/NewsletterBand";
import { CatchUpCard } from "@/components/CatchUpCard";
import { ConversionBand } from "@/components/ConversionBand";
import { AdSlot } from "@/components/AdSlot";
import { WeatherChip } from "@/components/WeatherChip";
import { PageViewTracker } from "@/components/PageViewTracker";

// After which feed positions to inject an inline sponsored unit.
const AD_AFTER_POSITIONS = new Set([3, 9]);
// Where the "Catch up fast" card lands in the feed.
const CATCHUP_AFTER_POSITION = 5;

// force-dynamic keeps the build from needing Supabase access at build time
// (this sandbox's egress policy blocks the project host); Coolify's build
// environment should have real network access, at which point this can
// revert to `export const revalidate = 300` for ISR per the PRD.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const articles = await getFeedArticles(undefined, 20);
  const hero = articles[0];
  const feedArticles = articles.slice(1);
  const catchUp = articles.slice(1, 5);

  return (
    <main className="shell py-8">
      <PageViewTracker />
      <WeatherChip />

      {hero && <FeedHero article={hero} />}

      <div className="mt-8 flex flex-col gap-7">
        <NewsletterBand
          title="The Morning Dispatch"
          copy="One flagship story, a few quick reads — Hampton Roads history in your inbox, weekday mornings. Free."
          source="home-band-top"
        />

        {feedArticles.map((article, i) => {
          const position = i + 1;
          return (
            <Fragment key={article.id}>
              <ArticleCard article={article} />
              {AD_AFTER_POSITIONS.has(position) && <AdSlot slotId="home-feed" />}
              {position === CATCHUP_AFTER_POSITION && <CatchUpCard articles={catchUp} />}
            </Fragment>
          );
        })}
      </div>

      <div className="mt-10">
        <ConversionBand />
      </div>
    </main>
  );
}
