import { createServerSupabase } from "@/lib/supabase/server";
import type { Article, City, Correction } from "@/lib/supabase/types";

const ARTICLE_SELECT =
  "id, short_id, title, dek, slug, kicker, section_id, author_id, hero_image_url, hero_image_alt, status, publish_at, published_at, event_date, read_time_min, is_pro, hr_categories:section_id(id, name, slug, order, accent_hex), hr_authors:author_id(id, name, slug, bio, avatar_url), hero_media:hero_media_id(id, filename, url, alt, width, height)";

// Detail view additionally needs the full rich-text body (Payload Lexical JSON)
const ARTICLE_DETAIL_SELECT = `${ARTICLE_SELECT}, body_lexical`;

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

export async function getCorrectionsForArticle(articleId: string): Promise<Correction[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("hr_corrections")
    .select("id, article_id, description, corrected_at")
    .eq("article_id", articleId)
    .order("corrected_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getArticleByShortId(shortId: string): Promise<Article | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("hr_articles")
    .select(ARTICLE_DETAIL_SELECT)
    .eq("short_id", shortId)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data as unknown as Article | null;
}

// Related articles: same-city first (strongest signal without real semantic
// search — see WS-14, blocked on an embeddings key), then backfilled with
// cross-city pieces sharing the same kicker so a reader isn't stuck with
// "no more related stories" on a thin city/kicker combination.
export async function getRelatedArticles(
  citySlug: string,
  excludeId: string,
  limit = 3,
  kicker?: string | null
): Promise<Article[]> {
  const sameCity = await getFeedArticles(citySlug, limit + 1);
  const picked = sameCity.filter((a) => a.id !== excludeId).slice(0, limit);
  if (picked.length >= limit || !kicker) return picked;

  const supabase = await createServerSupabase();
  const excludeIds = [excludeId, ...picked.map((a) => a.id)];
  const { data, error } = await supabase
    .from("hr_articles")
    .select(ARTICLE_SELECT)
    .eq("status", "published")
    .eq("kicker", kicker)
    .not("id", "in", `(${excludeIds.join(",")})`)
    .order("published_at", { ascending: false })
    .limit(limit - picked.length);
  if (error) throw error;

  return [...picked, ...((data ?? []) as unknown as Article[])];
}

// "On this day in history" resurfacing (WS-19): historical anniversaries via
// hr_on_this_day_articles(), matched on event_date's month/day against the
// current date. Returns [] on most days — most seeded articles don't have
// event_date set yet, and any given day of the year is unlikely to match.
export async function getOnThisDayArticles(limit = 5): Promise<Article[]> {
  const supabase = await createServerSupabase();

  const { data: matches, error: matchError } = await supabase.rpc("hr_on_this_day_articles", {
    p_limit: limit,
  });
  if (matchError) throw matchError;
  if (!matches || matches.length === 0) return [];

  const ids = matches.map((m: { id: string }) => m.id);
  const { data: articles, error } = await supabase
    .from("hr_articles")
    .select(ARTICLE_SELECT)
    .in("id", ids);
  if (error) throw error;

  const byId = new Map((articles ?? []).map((a: { id: string }) => [a.id, a]));
  return matches
    .map((m: { id: string }) => byId.get(m.id))
    .filter((a: unknown): a is NonNullable<typeof a> => Boolean(a)) as unknown as Article[];
}
