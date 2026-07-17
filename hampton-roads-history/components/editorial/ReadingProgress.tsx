"use client";

import { useEffect, useState } from "react";

// Ports prototype.js's updateReadingProgress(): measures how far the
// referenced element has scrolled past the top of the viewport, not overall
// page scroll — so the bar reflects article-body progress specifically.
export function ReadingProgress({ targetId }: { targetId: string }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    function update() {
      const el = document.getElementById(targetId);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = Math.max(1, el.offsetHeight - window.innerHeight);
      const traveled = Math.min(total, Math.max(0, -rect.top + 70));
      setPct(Math.round((traveled / total) * 100));
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [targetId]);

  return (
    <div aria-hidden className="sticky top-0 z-50 h-[3px]">
      <span
        className="block h-full bg-gradient-to-r from-[var(--signal-red)] to-[var(--gold)] transition-[width] duration-100 ease-linear"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
