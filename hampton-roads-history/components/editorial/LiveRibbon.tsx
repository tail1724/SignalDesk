"use client";

import { useEffect, useState } from "react";
import { useBreakingBanner } from "@/lib/hooks/useBreakingBanner";
import { AdChoices } from "@/components/ads/AdChoices";

type Weather = { tempF: number; description: string; hi: number; lo: number };

// civic-strip (always on: live status, date, weather, privacy) + the
// developing-story ribbon underneath it. Replaces the old standalone
// WeatherChip + BreakingBanner — see design-blueprint.html §04 "Nav".
export function LiveRibbon() {
  const { banner } = useBreakingBanner();
  const [wx, setWx] = useState<Weather | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/weather")
      .then((r) => r.json())
      .then(setWx)
      .catch(() => setWx(null));
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <div className="flex min-h-[31px] items-center justify-center gap-4 overflow-x-auto whitespace-nowrap bg-federal px-4 font-mono text-[9px] uppercase tracking-[.06em] text-[#d8e2ec] [scrollbar-width:none] md:gap-6">
        <span className="flex shrink-0 items-center gap-1.5">
          <i
            aria-hidden
            className="inline-block h-[7px] w-[7px] rounded-full bg-[#ef5e50] shadow-[0_0_0_4px_rgba(239,94,80,.13)]"
          />
          Live desk
        </span>
        <span className="hidden shrink-0 sm:inline">{today}</span>
        <span className="shrink-0">Hampton Roads{wx ? ` · ${wx.tempF}°` : ""}</span>
        <span className="ml-auto hidden shrink-0 sm:block">
          <AdChoices label="Privacy & ad choices" />
        </span>
      </div>

      {banner && !dismissed && (
        <div
          role="status"
          className="flex min-h-10 items-center justify-center gap-3.5 bg-accent px-4 py-2 text-[11px] text-white"
        >
          <strong className="shrink-0 rounded-full bg-white px-2 py-0.5 font-mono text-[8px] uppercase tracking-[.08em] text-accent">
            Developing
          </strong>
          <span className="min-w-0 flex-1 truncate">{banner.headline}</span>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="shrink-0 opacity-80 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
