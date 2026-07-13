import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/lib/supabase/types";
import { timeAgo } from "@/lib/format";
import { getCardImageUrl } from "@/lib/images";

export function articleHref(article: Article): string {
  const city = article.hr_categories?.slug ?? "hampton";
  return `/${city}/${article.short_id}-${article.slug}`;
}

// Horizontal feed card: 4:3 thumbnail left, text right. Stories with no real
// photograph collapse to a clean single text column (no empty placeholder).
export function ArticleCard({ article }: { article: Article }) {
  const hasImage = !!article.hero_image_url;

  return (
    <article
      className={`border-t border-line pt-6 ${
        hasImage ? "grid grid-cols-1 sm:grid-cols-[240px_1fr] gap-5" : ""
      }`}
    >
      {hasImage && (
        <Link
          href={articleHref(article)}
          className="block aspect-[4/3] rounded-lg overflow-hidden bg-surface-3"
        >
          <Image
            src={getCardImageUrl(article.hero_image_url!)}
            alt={article.hero_image_alt || article.title}
            width={600}
            height={450}
            className="w-full h-full object-cover"
          />
        </Link>
      )}
      <div className="min-w-0">
        <div className="text-[12px] font-semibold uppercase tracking-wider text-accent mb-1.5">
          {article.hr_categories?.name ?? "Hampton Roads"}
          {article.kicker ? <span className="text-ink-3"> · {article.kicker}</span> : ""}
        </div>
        <h3 className="font-display font-bold text-[22px] leading-tight tracking-[-0.01em] mb-1.5">
          <Link href={articleHref(article)} className="hover:text-accent">
            {article.title}
          </Link>
        </h3>
        {article.dek && (
          <p className="text-ink-2 text-[16px] leading-relaxed line-clamp-2 mb-2.5 max-w-[66ch]">
            {article.dek}
          </p>
        )}
        <div className="text-[13px] text-ink-3">
          <span className="text-ink-2 font-medium">{article.hr_authors?.name ?? "Staff"}</span>
          {" · "}
          {timeAgo(article.published_at)}
          {article.read_time_min ? ` · ${article.read_time_min} min read` : ""}
        </div>
      </div>
    </article>
  );
}
