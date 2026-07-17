"use client";

import { useSyncExternalStore } from "react";

const KEY = "hrh-followed-cities";
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function readFollowed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}
function isFollowing(citySlug: string) {
  return readFollowed().includes(citySlug);
}
function getServerSnapshot() {
  return false;
}

// Remembered-but-non-blocking city preference (design-blueprint.html §04):
// a device-local list, not an account/server relationship, and never mixed
// into ad targeting or cached editorial HTML.
export function FollowCityButton({ citySlug, cityName }: { citySlug: string; cityName: string }) {
  const following = useSyncExternalStore(subscribe, () => isFollowing(citySlug), getServerSnapshot);

  function toggle() {
    const current = readFollowed();
    const next = following ? current.filter((s) => s !== citySlug) : [...current, citySlug];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // storage unavailable — nothing to persist, but notify() still reflects the toggle
    }
    notify();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={following}
      className="min-h-[38px] rounded-full bg-white px-4 text-[11px] font-black text-federal"
    >
      {following ? `Following ${cityName}` : `Follow ${cityName}`}
    </button>
  );
}
