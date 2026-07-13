import { createServerSupabase } from "@/lib/supabase/server";
import type { Article } from "@/lib/supabase/types";

const ARTICLE_SELECT =
  "id, short_id, title, dek, slug, kicker, section_id, author_id, hero_image_url, hero_image_alt, status, publish_at, published_at, read_time_min, is_pro, hr_categories:section_id(id, name, slug, order, accent_hex), hr_authors:author_id(id, name, slug, bio, avatar_url)";

// Trigram similarity search via the hr_search_articles() RPC (typo-tolerant,
// ranked by relevance rather than scan order). The RPC returns flat columns
// only, so we re-fetch matching IDs with the full join for city/author
// context, then re-sort to preserve the RPC's rank ordering.
export async function searchArticles(query: string, limit = 20): Promise<Article[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const supabase = await createServerSupabase();

  const { data: ranked, error: rankError } = await supabase.rpc("hr_search_articles", {
    p_query: trimmed,
    p_limit: limit,
  });

  if (rankError) throw rankError;
  if (!ranked || ranked.length === 0) return [];

  const ids = ranked.map((r: { id: string }) => r.id);

  const { data: articles, error } = await supabase
    .from("hr_articles")
    .select(ARTICLE_SELECT)
    .in("id", ids);

  if (error) throw error;

  const byId = new Map((articles ?? []).map((a: { id: string }) => [a.id, a]));
  return ranked
    .map((r: { id: string }) => byId.get(r.id))
    .filter((a: unknown): a is NonNullable<typeof a> => Boolean(a)) as unknown as Article[];
}
