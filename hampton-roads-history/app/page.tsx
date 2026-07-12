import { getCategories, getFeedArticles } from "@/lib/data";
import { HeroBentoGrid } from "@/components/HeroBentoGrid";
import { SectionPills } from "@/components/SectionPills";
import { ArticleCard } from "@/components/ArticleCard";
import { ConversionBand } from "@/components/ConversionBand";
import { TrendingArticles } from "@/components/TrendingArticles";
import { WatchlistWidget } from "@/components/rail/WatchlistWidget";
import { WeatherCard } from "@/components/rail/WeatherCard";
import { CityDirectory } from "@/components/rail/CityDirectory";
import { NewsletterWidget } from "@/components/rail/NewsletterWidget";

// force-dynamic keeps the build from needing Supabase access at build time
// (this sandbox's egress policy blocks the project host); Coolify's build
// environment should have real network access, at which point this can
// revert to `export const revalidate = 300` for ISR per the PRD.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [cities, articles] = await Promise.all([getCategories(), getFeedArticles(undefined, 20)]);
  const bentoArticles = articles.slice(0, 9);
  const feedArticles = articles.slice(1);

  return (
    <main className="wrap py-8">
      <div className="mb-6">
        <SectionPills cities={cities} />
      </div>

      <HeroBentoGrid articles={bentoArticles} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start mt-10">
        <section aria-label="Latest stories" className="flex flex-col gap-3.5">
          {feedArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </section>

        <aside className="lg:sticky lg:top-20 flex flex-col gap-3.5">
          <WatchlistWidget />
          <TrendingArticles limit={5} />
          <WeatherCard />
          <CityDirectory cities={cities} />
          <div className="bg-surface-1 border border-line rounded-[var(--r-card)] p-5">
            <h4 className="font-mono text-[11px] tracking-wide uppercase text-ink-3 mb-2">
              The morning dispatch
            </h4>
            <p className="text-[13px] text-ink-2 mb-3">
              One flagship story, a few quick reads — Hampton Roads history, weekday mornings.
            </p>
            <NewsletterWidget />
          </div>
        </aside>
      </div>

      <ConversionBand />
    </main>
  );
}
