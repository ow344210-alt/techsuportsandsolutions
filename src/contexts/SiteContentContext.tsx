// Fetches ALL site_content rows in a SINGLE query when the app loads, then
// shares them via context. This replaces the previous pattern where every
// component (Hero, About, Services, Footer, FAQ, etc.) fired its own
// independent Supabase query for its section — turning ~12-15 requests per
// page load into just 1.
import { useEffect, useState } from "react";
import { fetchAllContent } from "../lib/siteContent";
import type { ContentField } from "../lib/siteContent";

import type { SiteContentProviderProps } from "./SiteContentContext.types";
import { SiteContentContext } from "./SiteContentContext.types";

function buildMap(fields: ContentField[]): Map<string, string> {
  const map = new Map<string, string>();
  fields.forEach((field) => {
    map.set(`${field.section}:${field.field_key}`, field.field_value);
  });
  return map;
}

export function SiteContentProvider({ children }: SiteContentProviderProps) {
  const [contentMap, setContentMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  function load(): Promise<void> {
    return fetchAllContent()
      .then((fields) => setContentMap(buildMap(fields)))
      .catch((error: unknown) => {
        // Failing to load CMS content must not take down the app: every
        // consumer renders from its static fallbacks when the map is empty.
        if (error instanceof Error) {
          console.error(
            "SiteContentProvider: failed to load site content",
            error.message,
          );
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <SiteContentContext.Provider value={{ contentMap, loading, refetch: load }}>
      {children}
    </SiteContentContext.Provider>
  );
}