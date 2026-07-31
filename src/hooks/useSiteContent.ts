// Reads content for a given section from the shared SiteContentContext
// instead of firing its own Supabase query. Falls back to the provided
// defaults for any field not yet set by the admin. This makes every public
// component's content call effectively free after the initial single fetch.
import { useMemo } from "react";
import { useSiteContentContext } from "../contexts/SiteContentContext.types";

export function useSiteContent(section: string, defaults: Record<string, string> = {}) {
  const { contentMap, loading } = useSiteContentContext();

  const content = useMemo(() => {
    const result: Record<string, string> = { ...defaults };
    Object.keys(defaults).forEach((key) => {
      const value = contentMap.get(`${section}:${key}`);
      if (value !== undefined) {
        result[key] = value;
      }
    });
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentMap, section]);

  return { content, loading };
}