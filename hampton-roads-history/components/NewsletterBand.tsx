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
    <section className="grid grid-cols-1 items-center gap-5 rounded-[2px_18px_2px_18px] bg-federal p-6 text-white shadow-[var(--shadow-sm)] md:grid-cols-[1fr_auto] md:gap-8 md:p-7">
      <div>
        <h3 className="font-display text-[19px] font-extrabold tracking-[-0.01em]">{title}</h3>
        <p className="mt-1 max-w-[52ch] text-[14px] text-[#aebdcc]">{copy}</p>
      </div>
      <div className="w-full md:w-72">
        <NewsletterWidget source={source} />
      </div>
    </section>
  );
}
