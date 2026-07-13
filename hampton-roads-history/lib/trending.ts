import { createServerSupabase } from "@/lib/supabase/server";
import type { Article } from "@/lib/supabase/types";

const ARTICLE_SELECT =
  "id, short_id, title, dek, slug, kicker, section_id, author_id, hero_image_url, hero_image_alt, status, publish_at, published_at, event_date, read_time_min, is_pro, hr_categories:section_id(id, name, slug, order, accent_hex), hr_authors:author_id(id, name, slug, bio, avatar_url)";

// Trending articles: ranked by the gold-tier trend score computed by the
// HR_aggregate_gold_trending() pg_cron job (runs every 30 min against the
// silver-tier session rollups). Falls back to recent articles if the gold
// table has no rows yet (e.g. cron hasn't run, or events haven't accrued).
export async function getTrendingArticles(limit = 5): Promise<Article[]> {
  const supabase = await createServerSupabase();

  const { data: trending, error: trendingError } = await supabase
    .from("hr_gold_trending")
    .select("article_id, trend_score")
    .order("trend_score", { ascending: false })
    .limit(limit);

  if (trendingError) throw trendingError;

  if (!trending || trending.length === 0) {
    return getRecentArticlesFallback(limit);
  }

  const articleIds = trending.map((t) => t.article_id);

  const { data: articles, error: articlesError } = await supabase
    .from("hr_articles")
    .select(ARTICLE_SELECT)
    .in("id", articleIds)
    .eq("status", "published");

  if (articlesError) throw articlesError;

  // Re-sort to match trend_score order (the `in` query doesn't preserve it)
  const byId = new Map((articles ?? []).map((a: { id: string }) => [a.id, a]));
  return trending
    .map((t) => byId.get(t.article_id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a)) as unknown as Article[];
}

async function getRecentArticlesFallback(limit: number): Promise<Article[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("hr_articles")
    .select(ARTICLE_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as Article[];
}

// Trending by city: same gold scores, filtered to a section
export async function getTrendingByCity(citySlug: string, limit = 5): Promise<Article[]> {
  const supabase = await createServerSupabase();

  const { data: category } = await supabase
    .from("hr_categories")
    .select("id")
    .eq("slug", citySlug)
    .single();

  if (!category) return [];

  const { data: trending, error: trendingError } = await supabase
    .from("hr_gold_trending")
    .select("article_id, trend_score")
    .order("trend_score", { ascending: false })
    .limit(limit * 4); // overfetch since we filter by section after

  if (trendingError) throw trendingError;
  if (!trending || trending.length === 0) return [];

  const { data: articles, error: articlesError } = await supabase
    .from("hr_articles")
    .select(ARTICLE_SELECT)
    .in(
      "id",
      trending.map((t) => t.article_id)
    )
    .eq("section_id", category.id)
    .eq("status", "published");

  if (articlesError) throw articlesError;

  const byId = new Map((articles ?? []).map((a: { id: string }) => [a.id, a]));
  return trending
    .map((t) => byId.get(t.article_id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a))
    .slice(0, limit) as unknown as Article[];
}
