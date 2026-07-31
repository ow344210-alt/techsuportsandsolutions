import { env } from "../config/env";

export const SEO_DEFAULTS = {
  title: env.APP_NAME,
  description:
    "Full-service software house specializing in web development, mobile apps, cloud solutions, and ongoing support.",
  image: `${env.APP_URL}/og-image.png`,
  type: "website",
  siteName: env.APP_NAME,
} as const;

export interface SEOProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noIndex?: boolean;
  structuredData?: Record<string, unknown> | null;
}