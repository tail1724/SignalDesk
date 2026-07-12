"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

type Breaking = { text: string; url?: string } | null;

// TODO: wire to Payload `breakingBanner` global afterChange -> Realtime broadcast
// once Payload is deployed. For now this only listens; nothing publishes yet,
// so the banner stays hidden until a real broadcast arrives.
export function BreakingBanner() {
  const [breaking, setBreaking] = useState<Breaking>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    const channel = supabase
      .channel("breaking")
      .on("broadcast", { event: "BREAKING" }, (msg: { payload: Breaking }) => {
        setBreaking(msg.payload);
        setDismissed(false);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!breaking || dismissed) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-accent text-white px-5 py-2.5 flex items-center gap-3 text-sm font-medium"
    >
      <span className="bg-white text-accent rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase shrink-0">
        New
      </span>
      <span className="flex-1">{breaking.text}</span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="opacity-80 hover:opacity-100 shrink-0"
      >
        ✕
      </button>
    </div>
  );
}
