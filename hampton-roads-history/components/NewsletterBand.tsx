import { NewsletterWidget } from "@/components/rail/NewsletterWidget";
import { LaserFlowLayer } from "@/components/reactbits/LaserFlowLayer";

// Inline newsletter capture band — DOM mirrors redesign/vapornet/index.html
// (.morning-line: kicker + headline + copy on the left, .inline-form right).
// Surface 2 — a signal-red LaserFlow beam pours down into the signup pill
// (composited over the federal-navy band with `screen`; motion-gated).
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
      <LaserFlowLayer
        color="#c93d37"
        laserProps={{
          horizontalBeamOffset: 0.32,
          verticalBeamOffset: -0.05,
          flowSpeed: 0.45,
          fogIntensity: 0.3,
          wispDensity: 1,
          wispIntensity: 3.5,
          mouseTiltStrength: 0.8,
          verticalSizing: 1.8,
        }}
      />
      <div>
        <span className="section-kicker">{kicker}</span>
        <strong>{title}</strong>
        <p>{copy}</p>
      </div>
      <NewsletterWidget source={source} variant="inline" />
    </section>
  );
}
