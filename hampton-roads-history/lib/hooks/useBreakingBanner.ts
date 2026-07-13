"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface BreakingBanner {
  id: string;
  headline: string;
  description?: string;
  image_url?: string;
  article_id?: string;
  is_active: boolean;
  updated_at: string;
}

export function useBreakingBanner() {
  const [banner, setBanner] = useState<BreakingBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getBrowserSupabase();

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    async function loadBanner() {
      try {
        const { data } = await supabase
          .from("hr_breaking")
          .select("id, headline, description, image_url, article_id, is_active, updated_at")
          .eq("is_active", true)
          .maybeSingle();

        setBanner(data);
      } catch (err) {
        console.error("Error loading breaking banner:", err);
      } finally {
        setLoading(false);
      }
    }

    loadBanner();

    // Subscribe to realtime updates
    channel = supabase
      .channel("breaking_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hr_breaking",
        },
        async () => {
          // Refetch on any change
          const { data } = await supabase
            .from("hr_breaking")
            .select("id, headline, description, image_url, article_id, is_active, updated_at")
            .eq("is_active", true)
            .maybeSingle();

          setBanner(data);
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return { banner, loading };
}
