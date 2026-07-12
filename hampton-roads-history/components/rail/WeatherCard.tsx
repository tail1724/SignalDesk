"use client";

import { useEffect, useState } from "react";

type Weather = { tempF: number; description: string; hi: number; lo: number };

export function WeatherCard() {
  const [wx, setWx] = useState<Weather | null>(null);

  useEffect(() => {
    fetch("/api/weather")
      .then((r) => r.json())
      .then(setWx)
      .catch(() => setWx(null));
  }, []);

  return (
    <div className="bg-surface-1 border border-line rounded-[var(--r-card)] p-5">
      <h4 className="font-mono text-[11px] tracking-wide uppercase text-ink-3 mb-3 flex items-center justify-between">
        Hampton Roads weather
        <span className="text-[9px] normal-case text-ink-3">local</span>
      </h4>
      {wx ? (
        <div className="flex items-center gap-4">
          <div className="font-display font-black text-4xl">{wx.tempF}°</div>
          <div className="text-ink-2 text-[12.5px]">
            {wx.description}
            <br />
            H {wx.hi}° · L {wx.lo}°
          </div>
        </div>
      ) : (
        <p className="text-ink-3 text-[13px]">Loading today&apos;s forecast…</p>
      )}
    </div>
  );
}
