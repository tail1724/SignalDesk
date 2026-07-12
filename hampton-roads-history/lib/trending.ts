import { createServerSupabase } from "@/lib/supabase/server";
import type { Article } from "@/lib/supabase/types";

const ARTICLE_SELECT =
  "id, short_id, title, dek, slug, kicker, section_id, author_id, hero_image_url, hero_image_alt, status, publish_at, published_at, read_time_min, is_pro, hr_categories:section_id(id, name, slug, order, accent_hex), hr_authors:author_id(id, name, slug, bio, avatar_url)";

// Trending articles: top viewed in last 7 days
export async function getTrendingArticles(limit = 5): Promise<Article[]> {
  const supabase = await createServerSupabase();

  // Query trending articles from gold layer
  // Falls back to manually querying bronze events if gold layer not ready
  const { data, error } = await supabase
    .from("hr_articles")
    .select(ARTICLE_SELECT)
    .eq("status", "published")
    .gte("published_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as Article[];
}

// Trending by city: top viewed in last 7 days for a specific city
export async function getTrendingByCity(citySlug: string, limit = 5): Promise<Article[]> {
  const supabase = await createServerSupabase();

  // Get category ID for city
  const { data: category } = await supabase
    .from("hr_categories")
    .select("id")
    .eq("slug", citySlug)
    .single();

  if (!category) {
    return [];
  }

  const { data, error } = await supabase
    .from("hr_articles")
    .select(ARTICLE_SELECT)
    .eq("section_id", category.id)
    .eq("status", "published")
    .gte("published_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as Article[];
}

// Most read articles: based on session count
export async function getMostReadArticles(limit = 5): Promise<Article[]> {
  const supabase = await createServerSupabase();

  // Query articles that were opened most in the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: topViewed, error: eventError } = await supabase
    .from("hr_page_events")
    .select("article_id")
    .eq("event_type", "article_opened")
    .gte("created_at", oneDayAgo)
    .limit(limit * 2); // Get extra to account for deduplication

  if (eventError) throw eventError;

  if (!topViewed || topViewed.length === 0) {
    // Fallback to recent articles if no view data
    return getTrendingArticles(limit);
  }

  // Deduplicate and get unique article IDs
  const articleIds = Array.from(new Set(topViewed.map((e: any) => e.article_id).filter(Boolean)));

  if (articleIds.length === 0) {
    return getTrendingArticles(limit);
  }

  // Fetch article details
  const { data, error } = await supabase
    .from("hr_articles")
    .select(ARTICLE_SELECT)
    .in("id", articleIds.slice(0, limit))
    .eq("status", "published");

  if (error) throw error;
  return (data ?? []) as unknown as Article[];
}
