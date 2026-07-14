import { notFound } from "next/navigation";
import { getCategories, getFeedArticles } from "@/lib/data";
import { SectionPills } from "@/components/SectionPills";
import { ArticleCard } from "@/components/ArticleCard";
import { NewsletterBand } from "@/components/NewsletterBand";
import { PageViewTracker } from "@/components/PageViewTracker";
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

  const articles = await getFeedArticles(city, 20);

  return (
    <main className="shell py-8">
      <PageViewTracker citySlug={city} />
      <div className="mb-6">
        <SectionPills cities={cities} active={city} />
      </div>
      <h1 className="font-display font-black text-3xl tracking-[-0.02em] mb-1">{current.name}</h1>
      <p className="text-ink-2 mb-8">Stories from {current.name}, Virginia.</p>

      {articles.length === 0 ? (
        <p className="text-ink-3">No stories here yet — check back soon.</p>
      ) : (
        <div className="flex flex-col gap-7">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
          <NewsletterBand
            title={`${current.name}, in your inbox`}
            copy="Follow the Morning Dispatch — pick the cities you care about at signup."
            source={`city-band-${city}`}
          />
        </div>
      )}
    </main>
  );
}
