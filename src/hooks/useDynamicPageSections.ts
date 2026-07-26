import { useEffect, useState } from "react";
import { fetchPageSections } from "../lib/contentCards";
import type { PageSectionData } from "../lib/contentCards";

export function useDynamicPageSections(page: string) {
  const [sections, setSections] = useState<PageSectionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await fetchPageSections(page);
        if (isMounted) setSections(data);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, [page]);

  return { sections, loading };
}