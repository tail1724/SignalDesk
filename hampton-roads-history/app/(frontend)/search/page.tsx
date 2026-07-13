import { searchArticles } from "@/lib/search";
import { ArticleCard } from "@/components/ArticleCard";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const results = q ? await searchArticles(q, 20) : [];

  return (
    <main className="reading py-10">
      <h1 className="font-display font-black text-2xl mb-6">
        {q ? `Results for "${q}"` : "Search Hampton Roads history"}
      </h1>
      {q && results.length === 0 && (
        <p className="text-ink-3">No stories matched — try another search.</p>
      )}
      <div className="flex flex-col gap-3.5">
        {results.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>
    </main>
  );
}
