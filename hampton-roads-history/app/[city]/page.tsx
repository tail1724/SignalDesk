import { notFound } from "next/navigation";
import { getCategories, getFeedArticles } from "@/lib/data";
import { SectionPills } from "@/components/SectionPills";
import { ArticleCard } from "@/components/ArticleCard";

// Rendered dynamically per-request rather than pre-built with
// generateStaticParams, so the build itself never needs Supabase access
// (useful in sandboxed CI where outbound egress is restricted).
export const dynamic = "force-dynamic";

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const cities = await getCategories();
  const current = cities.find((c) => c.slug === city);
  if (!current) notFound();

  const articles = await getFeedArticles(city, 20);

  return (
    <main className="wrap py-8">
      <div className="mb-6">
        <SectionPills cities={cities} active={city} />
      </div>
      <h1 className="font-display font-black text-3xl tracking-tight mb-1">{current.name}</h1>
      <p className="text-ink-2 mb-8">Stories from {current.name}, Virginia.</p>

      {articles.length === 0 ? (
        <p className="text-ink-3">No stories here yet — check back soon.</p>
      ) : (
        <div className="flex flex-col gap-3.5 max-w-3xl">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </main>
  );
}
