import { NewsletterWidget } from "@/components/rail/NewsletterWidget";

export function ConversionBand() {
  return (
    <section className="my-14 rounded-[var(--r-card)] border border-line-strong p-8 md:p-10 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center bg-gradient-to-br from-surface-2 to-surface-1">
      <div>
        <h2 className="font-display font-black text-2xl md:text-3xl tracking-tight mb-2">
          Seven cities. Four centuries. One friendly dispatch.
        </h2>
        <p className="text-ink-2 max-w-[52ch]">
          Hampton Roads is one of the most storied places in America. We bring
          you the good stuff — well-researched, warmly told — a few mornings
          a week.
        </p>
      </div>
      <div className="w-full md:w-64">
        <NewsletterWidget source="conversion-band" />
      </div>
    </section>
  );
}
