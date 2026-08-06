type RequiredVar =
  | "VITE_SUPABASE_URL"
  | "VITE_SUPABASE_ANON_KEY"
  | "VITE_APP_URL"
  | "VITE_APP_NAME"
  | "VITE_SUPPORT_EMAIL";

function getEnvVar(name: RequiredVar): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Please set it in your .env file or deployment platform's environment variables.`
    );
  }
  return value;
}

// Optional public-site URL used by the footer's website row. Returns "" when
// unset so callers can decide whether to render the row (see isPublicSiteUrl
// in Footer.tsx) instead of ever showing a development address.
function getOptionalEnvVar(name: string): string {
  const value = import.meta.env[name];
  return typeof value === "string" ? value.trim() : "";
}

export const env = {
  SUPABASE_URL: getEnvVar("VITE_SUPABASE_URL"),
  SUPABASE_ANON_KEY: getEnvVar("VITE_SUPABASE_ANON_KEY"),
  APP_URL: getEnvVar("VITE_APP_URL").replace(/\/+$/, ""),
  APP_NAME: getEnvVar("VITE_APP_NAME"),
  SUPPORT_EMAIL: getEnvVar("VITE_SUPPORT_EMAIL"),
  PUBLIC_SITE_URL: getOptionalEnvVar("VITE_PUBLIC_SITE_URL"),
} as const;