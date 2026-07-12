import { createServerSupabase } from "@/lib/supabase/server";
import { ArticleCard } from "@/components/ArticleCard";
import type { Article } from "@/lib/supabase/types";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  let results: Article[] = [];

  if (q) {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("hr_articles")
      .select(
        "id, short_id, title, dek, slug, kicker, section_id, author_id, hero_image_url, hero_image_alt, status, publish_at, published_at, read_time_min, is_pro, hr_categories:section_id(id, name, slug, order, accent_hex), hr_authors:author_id(id, name, slug, bio, avatar_url)"
      )
      .eq("status", "published")
      .or(`title.ilike.%${q}%,dek.ilike.%${q}%`)
      .limit(20);
    results = (data ?? []) as unknown as Article[];
  }

  return (
    <main className="wrap py-10 max-w-3xl">
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
