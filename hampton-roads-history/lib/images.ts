// Supabase image CDN transform pipeline
// Images are stored at: [bucket]/[year]/[month]/[uuid].[ext]
// Transform URLs apply on-the-fly via query params

import type { Article } from "@/lib/supabase/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const IMAGE_BUCKET = "hr-images";

interface ImageTransform {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png";
}

export function getSupabaseImageUrl(path: string, transform?: ImageTransform): string {
  const baseUrl = `${SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}/${path}`;

  if (!transform) {
    return baseUrl;
  }

  const params = new URLSearchParams();
  if (transform.width) params.set("width", transform.width.toString());
  if (transform.height) params.set("height", transform.height.toString());
  if (transform.quality) params.set("quality", transform.quality.toString());
  if (transform.format) params.set("format", transform.format);

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

// Hero image (1200x630, optimized for og:image)
export function getHeroImageUrl(path: string): string {
  return getSupabaseImageUrl(path, {
    width: 1200,
    height: 630,
    quality: 85,
    format: "webp",
  });
}

// Featured card image (600x400, 2x for retina)
export function getCardImageUrl(path: string, retina = false): string {
  return getSupabaseImageUrl(path, {
    width: retina ? 1200 : 600,
    height: retina ? 800 : 400,
    quality: 80,
    format: "webp",
  });
}

// Thumbnail (300x200)
export function getThumbnailUrl(path: string): string {
  return getSupabaseImageUrl(path, {
    width: 300,
    height: 200,
    quality: 75,
    format: "webp",
  });
}

// Avatar (100x100)
export function getAvatarUrl(path: string): string {
  return getSupabaseImageUrl(path, {
    width: 100,
    height: 100,
    quality: 80,
    format: "webp",
  });
}

// Generate storage path from UUID (distributes files across year/month dirs)
export function generateImagePath(uuid: string, ext: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}/${month}/${uuid}.${ext}`;
}

// Preferred hero image for an article: the uploaded hr_media (a ready-to-use
// URL) when present, otherwise the legacy hero_image_url storage path run
// through the transform pipeline. `variant` selects the transform for the
// legacy path.
export function articleHeroSrc(
  article: Pick<Article, "hero_image_url" | "hero_media">,
  variant: "hero" | "card" = "hero"
): string | null {
  if (article.hero_media?.url) return article.hero_media.url;
  if (!article.hero_image_url) return null;
  return variant === "card"
    ? getCardImageUrl(article.hero_image_url)
    : getHeroImageUrl(article.hero_image_url);
}

export function articleHeroAlt(
  article: Pick<Article, "hero_image_url" | "hero_image_alt" | "hero_media" | "title">
): string {
  return article.hero_media?.alt || article.hero_image_alt || article.title;
}
