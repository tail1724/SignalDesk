import Link from "next/link";
import type { Article } from "@/lib/supabase/types";
import { articleHref } from "@/components/ArticleCard";

// "Keep going" recirculation block at the end of an article body
// (design-blueprint.html §04 component inventory: ContextRail).
export function ContextRail({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;

  return (
    <section aria-label="Keep reading" className="mt-9 border-t-[3px] border-federal pt-6">
      <span className="mb-1 block font-mono text-[8px] uppercase tracking-[.14em] text-accent-soft">
        Keep going
      </span>
      <h2 className="mb-1 font-display text-[25px] font-black text-ink">More on this story</h2>
      <div className="flex flex-col">
        {articles.map((article, i) => (
          <Link
            key={article.id}
            href={articleHref(article)}
            className="grid grid-cols-[34px_1fr] gap-2.5 border-b border-line py-3.5 font-display text-[16px] font-extrabold leading-[1.25] text-ink hover:text-accent"
          >
            <span className="font-mono text-[8px] font-normal text-accent-soft">
              {String(i + 1).padStart(2, "0")}
            </span>
            {article.title}
          </Link>
        ))}
      </div>
    </section>
  );
}
