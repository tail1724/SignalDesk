import { NewsletterWidget } from "@/components/rail/NewsletterWidget";

// Inline newsletter capture band — DOM mirrors redesign/vapornet/index.html
// (.morning-line: kicker + headline + copy on the left, .inline-form right).
export function NewsletterBand({
  kicker = "The Morning Tide",
  title,
  copy,
  source = "feed-band",
}: {
  kicker?: string;
  title: string;
  copy: string;
  source?: string;
}) {
  return (
    <section className="morning-line" aria-label="Morning briefing signup">
      <div>
        <span className="section-kicker">{kicker}</span>
        <strong>{title}</strong>
        <p>{copy}</p>
      </div>
      <NewsletterWidget source={source} variant="inline" />
    </section>
  );
}
