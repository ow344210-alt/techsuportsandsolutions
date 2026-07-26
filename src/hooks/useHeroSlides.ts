import { useEffect, useState } from "react";
import { fetchActiveSlides } from "../lib/heroSlides";
import type { HeroSlide } from "../lib/heroSlides";

export function useHeroSlides() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await fetchActiveSlides();
        if (isMounted) setSlides(data);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  return { slides, loading };
}