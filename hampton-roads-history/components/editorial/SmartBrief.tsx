import { Fragment } from "react";

export type BriefItem = { term: string; description: string };

// Two renderings of the same "briefing" primitive, DOM mirrored from
// redesign/vapornet/index.html: the hero's glass .hero-brief card
// (brief-number / brief-label / brief-rule) and the article's .smart-brief
// block (kicker + dl). All styling from the verbatim vapornet.css.
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
      <aside className="hero-brief" aria-label="Story summary">
        {number && <span className="brief-number">{number}</span>}
        {items.map((item, i) => (
          <Fragment key={item.term}>
            {i > 0 && <div className="brief-rule" />}
            <p className="brief-label">{item.term}</p>
            <p>{item.description}</p>
          </Fragment>
        ))}
      </aside>
    );
  }

  return (
    <section className="smart-brief" aria-label={eyebrow}>
      <span className="section-kicker">{eyebrow}</span>
      {heading && <h2>{heading}</h2>}
      <dl>
        {items.map((item) => (
          <div key={item.term}>
            <dt>{item.term}</dt>
            <dd>{item.description}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
