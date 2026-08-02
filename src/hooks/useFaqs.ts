// Fetches active, ordered FAQs for a given page. Accepts either a single page
// key (e.g. "contact-faq") or an array of page keys (e.g. ["contact-faq",
// "home"]). When multiple pages are supplied, records are merged in order and
// de-duplicated by normalized question text so content spread across legacy
// page buckets is never shown twice.
import { useCallback, useEffect, useState } from "react";
import { fetchActiveFaqs } from "../lib/faqs";
import type { Faq } from "../lib/faqs";

export function useFaqs(pages: string | string[]) {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const pagesKey = Array.isArray(pages) ? pages.join(",") : pages;

  const retry = useCallback(() => {
    setError(false);
    setLoading(true);
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const pageList = pagesKey.split(",").filter(Boolean);
      const outcomes = await Promise.all(
        pageList.map(async (page) => {
          try {
            return { ok: true as const, items: await fetchActiveFaqs(page) };
          } catch {
            return { ok: false as const, items: [] as Faq[] };
          }
        }),
      );
      if (!isMounted) return;

      const anySuccess = outcomes.some((outcome) => outcome.ok);
      if (!anySuccess) {
        setError(true);
        setFaqs([]);
      } else {
        const seen = new Set<string>();
        const merged: Faq[] = [];
        for (const outcome of outcomes) {
          for (const item of outcome.items) {
            const key = item.question.trim().toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            merged.push(item);
          }
        }
        setError(false);
        setFaqs(merged);
      }
      setLoading(false);
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, [pagesKey, attempt]);

  return { faqs, loading, error, retry };
}
