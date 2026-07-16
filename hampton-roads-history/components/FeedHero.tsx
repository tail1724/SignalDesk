import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/lib/supabase/types";
import { articleHref } from "@/components/ArticleCard";
import { timeAgo, thumbGradient } from "@/lib/format";
import { articleHeroSrc, articleHeroAlt } from "@/lib/images";

// Top-story hero: headline + lede on the left, a 4:3 lead image on the right.
// Fills the wide feed shell; stacks (image first) on small screens.
export function FeedHero({ article }: { article: Article }) {
  if (!article) return null;

  return (
    <article className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6 lg:gap-9 items-center mb-2">
      <div className="order-2 lg:order-1">
        <div className="text-[12px] font-semibold uppercase tracking-wider text-accent mb-2">
          {article.hr_categories?.name ?? "Hampton Roads"}
          <span className="text-ink-3"> · {article.kicker ?? "Feature"}</span>
        </div>
        <h1 className="font-display font-black text-[clamp(28px,3.4vw,40px)] leading-[1.1] tracking-[-0.02em] mb-3">
          <Link href={articleHref(article)} className="hover:text-accent">
            {article.title}
          </Link>
        </h1>
        {article.dek && (
          <p className="text-ink-2 text-[19px] leading-relaxed mb-3 max-w-[52ch]">
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

      <Link
        href={articleHref(article)}
        className={`order-1 lg:order-2 block aspect-[4/3] rounded-xl overflow-hidden ${
          articleHeroSrc(article) ? "bg-surface-3" : `bg-gradient-to-br ${thumbGradient(article.id)}`
        }`}
      >
        {articleHeroSrc(article) && (
          <Image
            src={articleHeroSrc(article)!}
            alt={articleHeroAlt(article)}
            width={900}
            height={675}
            priority
            className="w-full h-full object-cover"
          />
        )}
      </Link>
    </article>
  );
}
