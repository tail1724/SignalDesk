"use client";

import { useSyncExternalStore } from "react";
import { AdSlot } from "@/components/AdSlot";

const DISMISS_PREFIX = "hrh-anchor-dismissed:";

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}
function subscribeDismissal(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function isDismissed(slotId: string) {
  try {
    return sessionStorage.getItem(DISMISS_PREFIX + slotId) === "1";
  } catch {
    return false;
  }
}
function dismiss(slotId: string) {
  try {
    sessionStorage.setItem(DISMISS_PREFIX + slotId, "1");
  } catch {
    // sessionStorage unavailable (private mode) — dismissal won't persist, but notify() still hides it now
  }
  notify();
}

function subscribeScroll(cb: () => void) {
  window.addEventListener("scroll", cb, { passive: true });
  return () => window.removeEventListener("scroll", cb);
}
function getScrolledPastFirstScreen() {
  return window.scrollY > window.innerHeight * 0.65;
}
function getScrolledServerSnapshot() {
  return false;
}

// mobile-anchor-01: dismissible, capped at ~54px (well under the 15% of a
// typical mobile viewport ceiling), reveals only after the reader has
// scrolled past the first screen so it never blocks first-useful-content.
// Dismissal persists for the browser session, not just the component's
// lifetime.
export function MobileAnchor({ slotId }: { slotId: string }) {
  const revealed = useSyncExternalStore(subscribeScroll, getScrolledPastFirstScreen, getScrolledServerSnapshot);
  const dismissed = useSyncExternalStore(subscribeDismissal, () => isDismissed(slotId), () => false);

  if (!revealed || dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Advertisement"
      className="fixed inset-x-0 bottom-0 z-40 flex min-h-[54px] items-center gap-2.5 border-t border-white/10 bg-federal/95 px-3 py-2 text-white backdrop-blur-md lg:hidden"
    >
      <AdSlot slotId={slotId} variant="anchor" />
      <button
        type="button"
        onClick={() => dismiss(slotId)}
        aria-label="Close advertisement"
        className="grid h-[25px] w-[25px] shrink-0 place-items-center rounded-full border border-white/25 text-white"
      >
        ×
      </button>
    </div>
  );
}
