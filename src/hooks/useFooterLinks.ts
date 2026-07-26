import { useEffect, useState } from "react";
import { fetchActiveFooterLinks } from "../lib/footerLinks";
import type { FooterLink } from "../lib/footerLinks";

export function useFooterLinks() {
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await fetchActiveFooterLinks();
        if (isMounted) setLinks(data);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  return { links, loading };
}