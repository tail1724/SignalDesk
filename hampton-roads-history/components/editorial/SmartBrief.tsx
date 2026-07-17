export type BriefItem = { term: string; description: string };

// Two renderings of the same "briefing" primitive: a compact glass card for
// the hero (why it matters / what to watch) and the full dl-based block used
// atop an article body (design-blueprint.html §04 templates table).
export function SmartBrief({
  variant = "article",
  eyebrow = "The briefing",
  heading,
  items,
  number,
}: {
  variant?: "hero" | "article";
  eyebrow?: string;
  heading?: string;
  items: BriefItem[];
  number?: string;
}) {
  if (variant === "hero") {
    return (
      <aside
        aria-label="Story summary"
        className="rounded-[3px_22px_3px_22px] border border-white/25 bg-[rgba(8,25,44,.77)] p-6 shadow-[0_20px_50px_rgba(0,0,0,.3)] backdrop-blur-md"
      >
        {number && <span className="block font-mono text-[10px] text-[#f2d693]">{number}</span>}
        {items.map((item, i) => (
          <div key={item.term}>
            <p className="mb-1 mt-3.5 font-mono text-[8px] uppercase tracking-[.12em] text-[#f2d693]">
              {item.term}
            </p>
            <p className="font-display text-[14px] leading-[1.45] text-white/[.86]">{item.description}</p>
            {i < items.length - 1 && <div className="my-4.5 h-px bg-white/[.18]" />}
          </div>
        ))}
      </aside>
    );
  }

  return (
    <section
      aria-label={eyebrow}
      className="mb-8 rounded-r-[14px] border border-l-[5px] border-line border-l-accent bg-surface-2 p-6"
    >
      <span className="mb-3.5 block font-mono text-[8px] uppercase tracking-[.14em] text-accent-soft">
        {eyebrow}
      </span>
      {heading && <h2 className="mb-3.5 font-display text-[27px] font-black text-ink">{heading}</h2>}
      <dl className="m-0">
        {items.map((item) => (
          <div
            key={item.term}
            className="grid grid-cols-1 gap-1 border-t border-line py-2.5 sm:grid-cols-[125px_1fr] sm:gap-4"
          >
            <dt className="text-[9px] font-black uppercase tracking-wide text-accent-soft">{item.term}</dt>
            <dd className="m-0 text-[12px] leading-[1.5] text-ink-2">{item.description}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
