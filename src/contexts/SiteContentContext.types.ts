import { createContext, useContext, type ReactNode } from "react";

export interface SiteContentContextValue {
  contentMap: Map<string, string>;
  loading: boolean;
  refetch: () => Promise<void>;
}

export interface SiteContentProviderProps {
  children: ReactNode;
}

export const SiteContentContext = createContext<SiteContentContextValue | null>(null);

export function useSiteContentContext() {
  const ctx = useContext(SiteContentContext);
  if (!ctx) {
    throw new Error("useSiteContentContext must be used within SiteContentProvider");
  }
  return ctx;
}