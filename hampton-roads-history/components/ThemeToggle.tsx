"use client";

import { useIsDark, setPref } from "@/lib/theme";

// Quick light/dark toggle for the header. Full Light/Dark/System control
// lives in Settings (ThemeControls) — this is a shortcut to the same
// preference. Reads the resolved theme from an external store (no effects),
// which matches the pre-paint theme applied by the layout script.
export function ThemeToggle() {
  const dark = useIsDark();

  return (
    <button
      type="button"
      onClick={() => setPref(dark ? "light" : "dark")}
      aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
      className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-line text-ink-2 hover:bg-surface-2 hover:text-ink transition-colors"
    >
      {dark ? (
        // moon
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        // sun
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
