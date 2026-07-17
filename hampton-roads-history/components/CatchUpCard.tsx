import Link from "next/link";
import type { Article } from "@/lib/supabase/types";
import { articleHref } from "@/components/ArticleCard";

// "Catch up fast" briefing card — home-rail primitive from
// design-blueprint.html §04 (Home template, rail column).
export function CatchUpCard({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="rounded-[2px_16px_2px_16px] border border-line bg-surface-1 p-6 shadow-[var(--shadow-sm)]">
      <span className="mb-1 block font-mono text-[8px] uppercase tracking-[.14em] text-accent-soft">
        Catch up fast
      </span>
      <h3 className="font-display text-[25px] font-black text-ink">Five minutes. Full context.</h3>
      <ol className="my-4 flex flex-col">
        {articles.map((a, i) => (
          <li key={a.id} className="border-t border-line first:border-t-0">
            <Link
              href={articleHref(a)}
              className="grid grid-cols-[28px_1fr] gap-2 py-3 font-display text-[13px] font-extrabold leading-[1.3] text-ink hover:text-accent"
            >
              <span className="font-mono text-[9px] font-normal text-accent-soft">{i + 1}</span>
              {a.title}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
