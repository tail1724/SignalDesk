"use client";

import { setPref, useThemePref, type ThemePref } from "@/lib/theme";

const OPTIONS: { value: ThemePref; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

// Canonical theme control for Settings → Appearance. Reads/writes the shared
// theme store; "system" follows the OS (kept in sync in lib/theme).
export function ThemeControls() {
  const pref = useThemePref();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex rounded-lg border border-line-strong overflow-hidden"
    >
      {OPTIONS.map((o) => {
        const active = pref === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setPref(o.value)}
            className={`px-4 py-2 text-[13px] font-semibold transition-colors ${
              active
                ? "bg-accent text-white"
                : "bg-surface-2 text-ink-2 hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
