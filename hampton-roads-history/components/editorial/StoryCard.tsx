import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/lib/supabase/types";
import { articleHref } from "@/components/ArticleCard";
import { timeAgo } from "@/lib/format";
import { articleHeroSrc, articleHeroAlt } from "@/lib/images";

// Editorial grid primitives — DOM mirrors redesign/vapornet/index.html:
// .story-card.feature-card (art card + copy), .compact-card (two-up), and
// .story-row (numbered hairline row). Styling comes from vapornet.css.
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
  const num = index != null ? String(index).padStart(2, "0") : null;

  if (variant === "feature") {
    const image = articleHeroSrc(article, "card");
    return (
      <article className="story-card feature-card">
        <Link href={href} className="card-visual harbor-visual" aria-label={article.title}>
          {image && (
            <Image
              src={image}
              alt={articleHeroAlt(article)}
              fill
              sizes="(min-width: 640px) 45vw, 100vw"
              className="object-cover"
            />
          )}
          {num && <span className="visual-index">{num}</span>}
          {city && <span className="city-stamp">{city}</span>}
        </Link>
        <div className="card-copy">
          <div className="eyebrow">
            <span>{article.kicker ?? article.hr_categories?.name ?? "Hampton Roads"}</span>
            {article.read_time_min != null && <span>{article.read_time_min} min</span>}
          </div>
          <h3>
            <Link href={href}>{article.title}</Link>
          </h3>
          {article.dek && <p>{article.dek}</p>}
          <div className="byline">
            By {article.hr_authors?.name ?? "Staff"} · {timeAgo(article.published_at)}
          </div>
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="compact-card">
        <div className="eyebrow">
          <span>{article.kicker ?? "The region"}</span>
          <span>{article.hr_categories?.name ?? "All cities"}</span>
        </div>
        <h3>
          <Link href={href}>{article.title}</Link>
        </h3>
        {article.dek && <p>{article.dek}</p>}
        <div className="byline">
          {article.read_time_min != null
            ? `${article.read_time_min} min · ${timeAgo(article.published_at)}`
            : `Updated ${timeAgo(article.published_at)}`}
        </div>
      </article>
    );
  }

  // row
  return (
    <article className="story-row">
      <span className="row-number">{num ?? ""}</span>
      <div>
        <div className="eyebrow">
          <span>{article.kicker ?? article.hr_categories?.name ?? "Hampton Roads"}</span>
          {article.kicker && city && <span>{city}</span>}
        </div>
        <h3>
          <Link href={href}>{article.title}</Link>
        </h3>
        {article.dek && <p>{article.dek}</p>}
      </div>
      <span className="row-time">
        {article.read_time_min != null ? `${article.read_time_min} min` : timeAgo(article.published_at)}
      </span>
    </article>
  );
}
