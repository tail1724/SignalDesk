import Link from "next/link";
import type { Article } from "@/lib/supabase/types";
import { articleHref } from "@/components/ArticleCard";

// "Catch up fast" — an editorial two-column numbered list inside the feed.
// Replaces the old trending sidebar and helps fill the wide shell.
export function CatchUpCard({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="bg-surface-2 border border-line rounded-xl p-6">
      <h3 className="text-[13px] uppercase tracking-wider text-ink-3 font-semibold mb-3">
        Catch up fast
      </h3>
      <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
        {articles.map((a, i) => (
          <li
            key={a.id}
            className="py-2 border-t border-line first:border-t-0 sm:[&:nth-child(2)]:border-t-0"
          >
            <Link href={articleHref(a)} className="text-[15px] font-semibold leading-snug hover:text-accent">
              <span className="text-accent font-extrabold mr-2">{i + 1}.</span>
              {a.title}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
