import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/lib/supabase/types";
import { timeAgo, thumbGradient } from "@/lib/format";
import { getCardImageUrl } from "@/lib/images";

export function articleHref(article: Article): string {
  const city = article.hr_categories?.slug ?? "hampton";
  return `/${city}/${article.short_id}-${article.slug}`;
}

export function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4 bg-surface-1 border border-line rounded-[var(--r-card)] p-4 hover:border-line-strong transition-colors">
      <div className={`aspect-[16/10] rounded-2xl overflow-hidden bg-gradient-to-br ${thumbGradient(article.id)}`}>
        {article.hero_image_url ? (
          <Image
            src={getCardImageUrl(article.hero_image_url)}
            alt={article.hero_image_alt || article.title}
            width={600}
            height={400}
            className="w-full h-full object-cover"
          />
        ) : (
          <div aria-hidden />
        )}
      </div>
      <div>
        <div className="font-mono text-[11px] tracking-wide uppercase text-accent-soft mb-1.5">
          {article.hr_categories?.name ?? "Hampton Roads"}
          {article.kicker ? ` · ${article.kicker}` : ""}
        </div>
        <h3 className="font-display font-extrabold text-lg leading-tight mb-2">
          <Link href={articleHref(article)} className="hover:text-accent-soft">
            {article.title}
          </Link>
        </h3>
        {article.dek && (
          <p className="text-ink-2 text-[13.5px] leading-relaxed line-clamp-2 mb-2.5">{article.dek}</p>
        )}
        <div className="flex items-center gap-2 font-mono text-[11px] text-ink-3">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-blue" />
          {article.hr_authors?.name ?? "Staff"} · {timeAgo(article.published_at)}
          {article.read_time_min ? ` · ${article.read_time_min} min read` : ""}
        </div>
      </div>
    </article>
  );
}
