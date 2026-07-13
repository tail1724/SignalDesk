import Link from "next/link";
import { getOnThisDayArticles } from "@/lib/data";
import { articleHref } from "@/components/ArticleCard";

function yearsAgo(eventDate: string): number {
  return new Date().getUTCFullYear() - new Date(eventDate).getUTCFullYear();
}

export async function OnThisDay() {
  const articles = await getOnThisDayArticles(5);
  if (articles.length === 0) return null;

  return (
    <div className="bg-surface-1 border border-line rounded-[var(--r-card)] p-5">
      <h4 className="font-mono text-[11px] tracking-wide uppercase text-ink-3 mb-3">
        On this day in Hampton Roads history
      </h4>
      <ul className="flex flex-col gap-3">
        {articles.map((article) => (
          <li key={article.id}>
            <Link href={articleHref(article)} className="group block">
              <div className="font-mono text-[10px] text-accent-soft mb-0.5">
                {article.event_date && `${yearsAgo(article.event_date)} years ago`}
              </div>
              <div className="text-[13.5px] font-semibold leading-snug group-hover:text-accent-soft transition-colors">
                {article.title}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
