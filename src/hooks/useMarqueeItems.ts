import { useEffect, useState } from "react";
import {
  getPublicMarqueeItems,
  subscribeToMarqueeItems,
} from "../lib/marqueeItems";
import type { MarqueeItem } from "../lib/marqueeItems";

export function usePublicMarqueeItems() {
  const [items, setItems] = useState<MarqueeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await getPublicMarqueeItems();
        if (active) setItems(data);
      } catch {
        // Intentionally silent: the public strip hides on failure rather than
        // exposing raw Supabase errors to visitors.
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    // One realtime subscription; any INSERT/UPDATE/DELETE triggers a refetch.
    // A window-focus refetch recovers gracefully if the realtime connection
    // drops. Both are torn down on unmount.
    const unsubscribe = subscribeToMarqueeItems(() => {
      void load();
    });

    const handleFocus = () => {
      void load();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return { items, loading };
}
