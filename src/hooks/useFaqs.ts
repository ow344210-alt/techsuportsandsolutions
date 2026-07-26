// Fetches active, ordered FAQs for a given page. Used by the public FAQ component.
import { useEffect, useState } from "react";
import { fetchActiveFaqs } from "../lib/faqs";
import type { Faq } from "../lib/faqs";

export function useFaqs(page: string) {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await fetchActiveFaqs(page);
        if (isMounted) setFaqs(data);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, [page]);

  return { faqs, loading };
}