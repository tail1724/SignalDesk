import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/lib/supabase/types";
import { articleHref } from "@/components/ArticleCard";
import { timeAgo, thumbGradient } from "@/lib/format";
import { articleHeroSrc, articleHeroAlt } from "@/lib/images";

// Editorial grid primitives from design-blueprint.html §04 component
// inventory: a large feature card, a compact 2-up card, and a numbered
// story row. All three read the same Article shape as ArticleCard.
export function StoryCard({
  article,
  variant,
  index,
}: {
  article: Article;
  variant: "feature" | "compact" | "row";
  index?: number;
}) {
  const href = articleHref(article);
  const city = article.hr_categories?.name;

  if (variant === "feature") {
    const image = articleHeroSrc(article, "card");
    return (
      <article className="grid grid-cols-1 gap-5 border-b border-line pb-6 sm:grid-cols-[0.9fr_1.1fr] sm:gap-6">
        <Link
          href={href}
          className={`relative block min-h-[245px] overflow-hidden rounded-[2px_18px_2px_18px] text-white sm:min-h-[305px] ${
            image ? "" : `bg-gradient-to-br ${thumbGradient(article.id)}`
          }`}
        >
          {image && (
            <Image
              src={image}
              alt={articleHeroAlt(article)}
              fill
              sizes="(min-width: 640px) 45vw, 100vw"
              className="object-cover"
            />
          )}
          {index != null && (
            <span className="absolute left-4 top-3.5 font-mono text-[9px]">
              {String(index).padStart(2, "0")}
            </span>
          )}
          {city && (
            <span className="absolute bottom-3.5 right-3.5 border border-white/45 px-2 py-1.5 font-mono text-[8px] uppercase tracking-[.1em]">
              {city}
            </span>
          )}
        </Link>
        <div className="self-center">
          <div className="mb-2 flex flex-wrap items-center gap-x-2.5 font-mono text-[9px] uppercase tracking-[.08em] text-accent-soft">
            <span>{article.hr_categories?.name ?? "Hampton Roads"}</span>
            {article.read_time_min && <span>{article.read_time_min} min</span>}
          </div>
          <h3 className="font-display text-[28px] font-black leading-[1.02] tracking-[-0.025em] text-ink">
            <Link href={href} className="hover:text-accent">
              {article.title}
            </Link>
          </h3>
          {article.dek && <p className="mt-2 text-[13px] leading-[1.55] text-ink-2">{article.dek}</p>}
          <div className="mt-3 font-mono text-[8px] leading-[1.5] text-ink-3">
            By {article.hr_authors?.name ?? "Staff"} · {timeAgo(article.published_at)}
          </div>
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="py-6 first:pt-0 sm:border-l sm:border-line sm:py-0 sm:pl-6 sm:first:border-l-0 sm:first:pl-0">
        <div className="mb-2 font-mono text-[9px] uppercase tracking-[.08em] text-accent-soft">
          {article.hr_categories?.name ?? "Hampton Roads"}
        </div>
        <h3 className="font-display text-[22px] font-black leading-[1.02] tracking-[-0.025em] text-ink">
          <Link href={href} className="hover:text-accent">
            {article.title}
          </Link>
        </h3>
        {article.dek && <p className="mt-1 text-[13px] leading-[1.55] text-ink-2">{article.dek}</p>}
      </article>
    );
  }

  // row
  return (
    <article className="grid grid-cols-[44px_1fr_auto] items-start gap-3 border-b border-line py-6">
      <span className="grid h-[34px] w-[34px] place-items-center rounded-full border border-line-strong font-mono text-[8px] text-accent-soft">
        {index != null ? String(index).padStart(2, "0") : ""}
      </span>
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap gap-x-2.5 font-mono text-[9px] uppercase tracking-[.08em] text-accent-soft">
          <span>{article.hr_categories?.name ?? "Hampton Roads"}</span>
        </div>
        <h3 className="font-display text-[22px] font-black leading-[1.05] text-ink">
          <Link href={href} className="hover:text-accent">
            {article.title}
          </Link>
        </h3>
        {article.dek && <p className="mt-1.5 text-[12px] leading-[1.45] text-ink-2">{article.dek}</p>}
      </div>
      <span className="shrink-0 font-mono text-[8px] text-ink-3">
        {article.read_time_min ? `${article.read_time_min} min` : timeAgo(article.published_at)}
      </span>
    </article>
  );
}
