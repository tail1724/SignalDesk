"use client";

import { useSyncExternalStore } from "react";

export type ThemePref = "light" | "dark" | "system";

export const THEME_KEY = "hrh-theme";

export function getStoredPref(): ThemePref {
  if (typeof window === "undefined") return "system";
  // localStorage access throws in Safari Private Browsing / when storage is
  // blocked — never let a theme lookup take down the page.
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function systemIsDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/** Resolve a preference to the concrete theme and stamp it on <html>. */
export function applyPref(pref: ThemePref) {
  if (typeof document === "undefined") return;
  const dark = pref === "dark" || (pref === "system" && systemIsDark());
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
}

function currentIsDark(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.getAttribute("data-theme") === "dark";
}

// --- external store so components can read theme without effects ---
const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}

// Keep "system" in sync with the OS after load (the inline layout script only
// runs once). Registered once when this client module first loads.
if (typeof window !== "undefined") {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (getStoredPref() === "system") applyPref("system");
    notify();
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/** Persist + apply. "system" clears the stored key so it follows the OS. */
export function setPref(pref: ThemePref) {
  try {
    if (pref === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, pref);
  } catch {
    // storage may be unavailable (private mode) — apply in-memory anyway
  }
  applyPref(pref);
  notify();
}

/** Current stored preference (light/dark/system), reactive. */
export function useThemePref(): ThemePref {
  return useSyncExternalStore(subscribe, getStoredPref, () => "system");
}

/** Whether the resolved theme is currently dark, reactive. */
export function useIsDark(): boolean {
  return useSyncExternalStore(subscribe, currentIsDark, () => false);
}
