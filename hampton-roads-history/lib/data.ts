import { createServerSupabase } from "@/lib/supabase/server";
import type { Article, City } from "@/lib/supabase/types";

const ARTICLE_SELECT =
  "id, short_id, title, dek, slug, kicker, section_id, author_id, hero_image_url, hero_image_alt, status, publish_at, published_at, read_time_min, is_pro, hr_categories:section_id(id, name, slug, order, accent_hex), hr_authors:author_id(id, name, slug, bio, avatar_url)";

export async function getCategories(): Promise<City[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("hr_categories")
    .select("id, name, slug, order, accent_hex")
    .order("order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getFeedArticles(citySlug?: string, limit = 20): Promise<Article[]> {
  const supabase = await createServerSupabase();
  let query = supabase
    .from("hr_articles")
    .select(ARTICLE_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (citySlug) {
    const { data: cat } = await supabase
      .from("hr_categories")
      .select("id")
      .eq("slug", citySlug)
      .single();
    if (cat) query = query.eq("section_id", cat.id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Article[];
}

export async function getArticleByShortId(shortId: string): Promise<Article | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("hr_articles")
    .select(ARTICLE_SELECT)
    .eq("short_id", shortId)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data as unknown as Article | null;
}

export async function getRelatedArticles(citySlug: string, excludeId: string, limit = 3): Promise<Article[]> {
  const articles = await getFeedArticles(citySlug, limit + 1);
  return articles.filter((a) => a.id !== excludeId).slice(0, limit);
}
