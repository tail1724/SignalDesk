import Link from "next/link";
import type { Article } from "@/lib/supabase/types";
import { articleHref } from "@/components/ArticleCard";

// "Keep going" recirculation — DOM mirrors redesign/vapornet/index.html's
// .article-recirculation (kicker, headline, numbered links).
export function ContextRail({
  articles,
  heading = "Stories that add context",
}: {
  articles: Article[];
  heading?: string;
}) {
  if (articles.length === 0) return null;

  return (
    <section className="article-recirculation" aria-label="Keep reading">
      <span className="section-kicker">Keep going</span>
      <h2>{heading}</h2>
      {articles.map((article, i) => (
        <Link key={article.id} href={articleHref(article)}>
          <span>{String(i + 1).padStart(2, "0")}</span>
          {article.title}
        </Link>
      ))}
    </section>
  );
}
