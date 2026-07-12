import Link from "next/link";
import type { Article } from "@/lib/supabase/types";
import { articleHref } from "@/components/ArticleCard";
import { timeAgo } from "@/lib/format";

export function HeroBentoGrid({ articles }: { articles: Article[] }) {
  const [hero, second, ...rest] = articles;
  const trending = rest.slice(0, 6);
  const third = rest[6];

  if (!hero) return null;

  return (
    <section
      aria-label="Top stories"
      className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-4"
    >
      <div className="grid grid-rows-[auto_auto] gap-4">
        <Link
          href={articleHref(hero)}
          className="group relative flex flex-col justify-end min-h-[420px] rounded-[var(--r-card)] p-8 overflow-hidden border border-line bg-surface-1"
        >
          <div
            className="absolute inset-0 -z-10 opacity-70"
            style={{
              background:
                "radial-gradient(700px 340px at 75% 15%, rgba(192,71,47,.18), transparent 60%), radial-gradient(560px 300px at 15% 85%, rgba(79,125,140,.16), transparent 60%)",
            }}
          />
          <div className="font-mono text-xs tracking-wide uppercase text-accent-soft mb-3">
            {hero.hr_categories?.name} · {hero.kicker ?? "Feature"}
          </div>
          <h1 className="font-display font-black text-[clamp(28px,3.6vw,46px)] leading-[1.05] tracking-tight mb-4 group-hover:text-accent-soft transition-colors max-w-[22ch]">
            {hero.title}
          </h1>
          {hero.dek && <p className="text-ink-2 max-w-[58ch] mb-4">{hero.dek}</p>}
          <div className="font-mono text-[11px] text-ink-3 flex gap-4 flex-wrap">
            <span>{hero.hr_authors?.name ?? "Staff"}</span>
            <span>{timeAgo(hero.published_at)}</span>
            {hero.read_time_min && <span>{hero.read_time_min} min read</span>}
          </div>
        </Link>

        {second && (
          <Link
            href={articleHref(second)}
            className="rounded-[var(--r-card)] p-6 border border-line bg-surface-1 hover:border-line-strong transition-colors"
          >
            <div className="font-mono text-xs tracking-wide uppercase text-accent-soft mb-2">
              {second.hr_categories?.name}
            </div>
            <h3 className="font-display font-extrabold text-lg leading-snug mb-1.5">{second.title}</h3>
            {second.dek && <p className="text-ink-2 text-[13.5px] line-clamp-2">{second.dek}</p>}
          </Link>
        )}
      </div>

      <aside className="rounded-[var(--r-card)] border border-line bg-surface-1 p-5 flex flex-col gap-4">
        <div>
          <h4 className="font-mono text-[11px] tracking-wide uppercase text-ink-3 mb-3">
            Readers are loving
          </h4>
          <ol className="flex flex-col">
            {trending.map((a, i) => (
              <li key={a.id} className="flex gap-3 py-2.5 border-b border-line last:border-none">
                <span className="font-mono text-accent-blue text-xs pt-0.5 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Link href={articleHref(a)} className="text-[13.5px] font-semibold leading-snug hover:text-accent-soft">
                  {a.title}
                </Link>
              </li>
            ))}
          </ol>
        </div>

        {third && (
          <Link
            href={articleHref(third)}
            className="rounded-2xl p-4 bg-surface-2 hover:bg-surface-3 transition-colors"
          >
            <div className="font-mono text-[11px] tracking-wide uppercase text-accent-soft mb-1.5">
              {third.hr_categories?.name}
            </div>
            <h4 className="font-display font-bold text-sm leading-snug">{third.title}</h4>
          </Link>
        )}
      </aside>
    </section>
  );
}
