import { NewsletterWidget } from "@/components/rail/NewsletterWidget";

// Inline-in-feed newsletter capture — the primary conversion unit. Copy on
// the left, email capture on the right; stacks on small screens.
export function NewsletterBand({
  title,
  copy,
  source = "feed-band",
}: {
  title: string;
  copy: string;
  source?: string;
}) {
  return (
    <section className="bg-band border border-line rounded-xl p-6 md:p-7 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 md:gap-8 items-center">
      <div>
        <h3 className="font-display font-extrabold text-xl tracking-[-0.01em]">{title}</h3>
        <p className="text-ink-2 text-[14px] mt-1 max-w-[52ch]">{copy}</p>
      </div>
      <div className="w-full md:w-72">
        <NewsletterWidget source={source} />
      </div>
    </section>
  );
}
