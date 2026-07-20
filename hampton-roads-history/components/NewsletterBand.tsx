import { NewsletterWidget } from "@/components/rail/NewsletterWidget";
import { LaserFlowLayer } from "@/components/reactbits/LaserFlowLayer";

// Inline newsletter capture band. Two side-by-side boxes: the LaserFlow beam
// visual on the left, and on the right the copy stacked directly above the
// signup form. The beam is desktop-only, so on mobile the left box collapses
// and the content spans the band (see `.morning-line` in reactbits.css).
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
      <div className="morning-visual" aria-hidden>
        <LaserFlowLayer
          color="#c93d37"
          laserProps={{
            horizontalBeamOffset: 0,
            verticalBeamOffset: -0.05,
            flowSpeed: 0.45,
            fogIntensity: 0.3,
            wispDensity: 1,
            wispIntensity: 3.5,
            mouseTiltStrength: 0.8,
            verticalSizing: 1.8,
          }}
        />
      </div>
      <div className="morning-content">
        <div className="morning-copy">
          <span className="section-kicker">{kicker}</span>
          <strong>{title}</strong>
          <p>{copy}</p>
        </div>
        <NewsletterWidget source={source} variant="inline" />
      </div>
    </section>
  );
}
