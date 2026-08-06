import { useEffect, useState } from "react";
import { fetchActiveFooterSocialLinks } from "../lib/footerSocialLinks";
import type { FooterSocialLink } from "../lib/footerSocialLinks";

export function useFooterSocialLinks() {
  const [links, setLinks] = useState<FooterSocialLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await fetchActiveFooterSocialLinks();
        if (isMounted) setLinks(data);
      } catch {
        // Public footer fails safe: no social links rather than an error page.
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
