import { createServerSupabase } from "@/lib/supabase/server";

// Feature-placement lookups for images assigned in the media library
// (hr_media.homepage_hero / hr_media.section_hero_slug). hr_media.url is a
// ready-to-use image URL — the same field article heroes render.

export interface FeaturedMedia {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
}

function toFeatured(row: { url: string | null; alt: string | null; width: number | null; height: number | null } | null): FeaturedMedia | null {
  if (!row?.url) return null;
  return { url: row.url, alt: row.alt ?? "", width: row.width, height: row.height };
}

/** The image an editor marked as the homepage hero (most recent wins), or null. */
export async function getHomepageHeroMedia(): Promise<FeaturedMedia | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("hr_media")
    .select("url, alt, width, height")
    .eq("homepage_hero", true)
    .not("url", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return toFeatured(data);
}

/** The image assigned as the hero for a section/city slug, or null. */
export async function getSectionHeroMedia(slug: string): Promise<FeaturedMedia | null> {
  if (!slug) return null;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("hr_media")
    .select("url, alt, width, height")
    .eq("section_hero_slug", slug)
    .not("url", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return toFeatured(data);
}
