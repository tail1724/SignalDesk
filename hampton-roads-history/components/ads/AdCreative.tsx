import { forwardRef } from "react";
import type { AdSlotVariant } from "@/components/AdSlot";

export interface AdCreativeData {
  advertiser: string;
  headline?: string;
  body?: string;
  destUrl: string;
  imageUrl?: string;
  isHouseAd?: boolean;
}

// Presentational ad creative — the styled markup that mirrors
// redesign/vapornet/index.html (leader-creative, native-layout,
// rail-creative, minimal-creative). Split out of AdSlot so the exact same
// production markup is what renders in the visual fixtures with the
// prototype's copy, instead of a stand-in (pixel-perfect plan §6.1).
export const AdCreative = forwardRef<HTMLAnchorElement, {
  variant: AdSlotVariant;
  data: AdCreativeData;
  onClick?: () => void;
}>(function AdCreative({ variant, data, onClick }, ref) {
  const { advertiser, headline, body, destUrl, imageUrl, isHouseAd } = data;

  if (imageUrl) {
    return (
      <a ref={ref} href={destUrl} onClick={onClick} className="block group">
        <img src={imageUrl} alt={advertiser} className="w-full rounded-[var(--r-card)]" />
      </a>
    );
  }

  if (variant === "leader") {
    return (
      <a ref={ref} href={destUrl} onClick={onClick} className="leader-creative">
        <span className="sponsor-seal">{advertiser.slice(0, 2).toUpperCase()}</span>
        <div>
          <small>{isHouseAd ? "Community" : "Presented by a regional partner"}</small>
          <strong>{headline}</strong>
        </div>
        <span className="creative-cta">{isHouseAd ? "Learn more" : "Meet the makers"}</span>
      </a>
    );
  }

  if (variant === "native") {
    return (
      <a ref={ref} href={destUrl} onClick={onClick} className="native-layout">
        <div className="native-art">
          <span>
            MADE
            <br />
            LOCAL
          </span>
        </div>
        <div>
          <small>{advertiser}</small>
          <h3>{headline}</h3>
          {body && <p>{body}</p>}
          <span className="creative-cta">Explore the series</span>
        </div>
      </a>
    );
  }

  if (variant === "rail") {
    return (
      <a ref={ref} href={destUrl} onClick={onClick} className="rail-creative">
        <small>{isHouseAd ? "COMMUNITY PARTNER" : "REGIONAL PARTNER"}</small>
        <strong>{headline}</strong>
        {body && <p>{body}</p>}
        <span className="creative-cta">Discover the series</span>
      </a>
    );
  }

  if (variant === "anchor") {
    return (
      <a ref={ref} href={destUrl} onClick={onClick} className="flex min-w-0 flex-1 items-center gap-1">
        <div className="min-w-0">
          <span className="block font-mono text-[6px] uppercase tracking-[.1em] text-[#aebdcc]">
            {isHouseAd ? "Community" : "Advertisement"}
          </span>
          <strong className="block truncate text-[9px] text-white">{headline}</strong>
        </div>
        <span className="ml-auto shrink-0 text-[8px] font-black text-white">Open</span>
      </a>
    );
  }

  // minimal — small text-only unit for extra/section-local placements
  return (
    <a ref={ref} href={destUrl} onClick={onClick} className="minimal-creative">
      <strong>{headline}</strong>
      <span className="creative-cta">Learn more →</span>
    </a>
  );
});
