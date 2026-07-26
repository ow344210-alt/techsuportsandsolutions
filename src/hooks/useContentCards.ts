import { useEffect, useState } from "react";
import { fetchActiveCards } from "../lib/contentCards";
import type { ContentCard } from "../lib/contentCards";

export function useContentCards(section: string) {
  const [cards, setCards] = useState<ContentCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await fetchActiveCards(section);
        if (isMounted) setCards(data);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, [section]);

  return { cards, loading };
}