"use client";

import { BentoGrid, BentoCard } from "./MagicBento";

// Surface 5 — quiet cross-link module for the company/legal pages. Spotlight
// + masked border-glow only (no tilt, magnetism, or particles), so it reads
// as craftsmanship on a reading surface rather than spectacle. Signal-red
// glow on the parchment card.
const RED = "201, 61, 55";

export interface CrossLink {
  href: string;
  title: string;
  description: string;
  label?: string;
}

export function CrossLinkBento({ links }: { links: CrossLink[] }) {
  return (
    <BentoGrid className="crosslink-bento" glowColor={RED} spotlightRadius={280} aria-label="Related pages">
      {links.map((link) => (
        <BentoCard
          key={link.href}
          href={link.href}
          ariaLabel={link.title}
          glowColor={RED}
          className="crosslink-card"
        >
          {link.label && <span className="crosslink-label">{link.label}</span>}
          <h3 className="crosslink-title">{link.title}</h3>
          <p className="crosslink-desc">{link.description}</p>
          <span className="crosslink-arrow" aria-hidden>
            Read →
          </span>
        </BentoCard>
      ))}
    </BentoGrid>
  );
}

export default CrossLinkBento;
