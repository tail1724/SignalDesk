"use client";

import { useEffect, useState } from "react";

type Weather = { tempF: number; description: string; hi: number; lo: number };

// One-line weather chip for the top of the feed (replaces the rail card).
export function WeatherChip() {
  const [wx, setWx] = useState<Weather | null>(null);

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
    <div className="flex items-center gap-2.5 text-[13px] text-ink-3 mb-6">
      <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden />
      <span>{today}</span>
      {wx && (
        <>
          <span aria-hidden>·</span>
          <span className="text-ink-2 font-medium">
            {wx.tempF}° {wx.description}
          </span>
        </>
      )}
      <span aria-hidden>·</span>
      <span>Hampton Roads</span>
    </div>
  );
}
