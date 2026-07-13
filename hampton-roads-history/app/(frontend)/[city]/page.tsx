import { notFound } from "next/navigation";
import { getCategories, getFeedArticles } from "@/lib/data";
import { getTrendingByCity } from "@/lib/trending";
import { SectionPills } from "@/components/SectionPills";
import { ArticleCard } from "@/components/ArticleCard";
import { WeatherCard } from "@/components/rail/WeatherCard";
import { NewsletterWidget } from "@/components/rail/NewsletterWidget";
import type { Metadata } from "next";

// Rendered dynamically per-request rather than pre-built with
// generateStaticParams, so the build itself never needs Supabase access
// (useful in sandboxed CI where outbound egress is restricted).
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const cities = await getCategories();
  const current = cities.find((c) => c.slug === city);
  if (!current) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hamptonroadshistory.com";
  const title = `${current.name} — Hampton Roads History`;
  const description = `Deeply reported local history from ${current.name}, Virginia — part of Hampton Roads History's coverage of the seven cities.`;

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/${city}` },
    openGraph: { title, description, url: `${siteUrl}/${city}` },
    twitter: { card: "summary", title, description },
  };
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const cities = await getCategories();
  const current = cities.find((c) => c.slug === city);
  if (!current) notFound();

  const [articles, trending] = await Promise.all([
    getFeedArticles(city, 20),
    getTrendingByCity(city, 5),
  ]);

  return (
    <main className="wrap py-8">
      <div className="mb-6">
        <SectionPills cities={cities} active={city} />
      </div>
      <h1 className="font-display font-black text-3xl tracking-tight mb-1">{current.name}</h1>
      <p className="text-ink-2 mb-8">Stories from {current.name}, Virginia.</p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        <section aria-label={`Latest from ${current.name}`}>
          {articles.length === 0 ? (
            <p className="text-ink-3">No stories here yet — check back soon.</p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </section>

        <aside className="lg:sticky lg:top-20 flex flex-col gap-3.5">
          {trending.length > 0 && (
            <section className="bg-surface-1 border border-line rounded-[var(--r-card)] p-5">
              <h4 className="font-display font-bold text-sm mb-4">
                Trending in {current.name}
              </h4>
              <div className="space-y-3">
                {trending.map((article, i) => (
                  <a
                    key={article.id}
                    href={`/${city}/${article.short_id}-${article.slug}`}
                    className="flex gap-3 group"
                  >
                    <span className="text-ink-3 font-mono text-xs font-bold min-w-4">{i + 1}</span>
                    <span className="text-sm font-semibold text-ink group-hover:text-accent line-clamp-2 transition-colors">
                      {article.title}
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}
          <WeatherCard />
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
    </main>
  );
}
