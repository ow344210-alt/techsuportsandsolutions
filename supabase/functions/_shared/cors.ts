// Shared CORS utilities for every browser-invoked Supabase Edge Function.
//
// The approved origin list is environment-driven so production and local
// development both work without hardcoding one environment into each function:
//
//   1. The ALLOWED_ORIGINS secret (comma-separated). This is the canonical
//      allowlist and MUST contain the production Vercel/custom origins.
//   2. APP_URL / VITE_APP_URL secrets, when present.
//   3. Local development origins that are genuinely used by this project.
//
// Only an origin present in the allowlist receives a matching
// Access-Control-Allow-Origin header. Unknown origins are never reflected.

const DEFAULT_LOCAL_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
];

function buildAllowlist(): string[] {
  const allowed = new Set<string>(DEFAULT_LOCAL_ORIGINS);

  const fromSecret = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const appUrl = (Deno.env.get("APP_URL") ?? "").trim();
  const viteAppUrl = (Deno.env.get("VITE_APP_URL") ?? "").trim();

  for (const origin of [...fromSecret, appUrl, viteAppUrl]) {
    if (!origin) continue;
    if (!/^https?:\/\//i.test(origin)) continue;
    allowed.add(origin.replace(/\/+$/, ""));
  }

  return [...allowed];
}

function getAllowlist(): string[] {
  const cached = (globalThis as unknown as { __corsAllowlist?: string[] })
    .__corsAllowlist;
  if (cached) return cached;
  const allowlist = buildAllowlist();
  (globalThis as unknown as { __corsAllowlist?: string[] }).__corsAllowlist =
    allowlist;
  return allowlist;
}

/**
 * Returns the incoming origin only when it is on the approved allowlist,
 * otherwise returns null.
 */
export function resolveAllowedOrigin(origin: string | null | undefined): string | null {
  if (!origin) return null;
  const trimmed = origin.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  return getAllowlist().includes(trimmed) ? trimmed : null;
}

/**
 * CORS headers for an approved origin. Include `Vary: Origin` so shared
 * caches store per-origin variants.
 */
export function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

/**
 * JSON response with CORS headers applied only for an approved origin.
 * Disallowed/missing origins receive no ACAO header, so the browser rejects
 * them at the network layer while the server still logs the status.
 */
export function jsonResponse(
  body: unknown,
  status: number,
  origin: string | null | undefined,
): Response {
  const allowed = resolveAllowedOrigin(origin);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (allowed) {
    Object.assign(headers, corsHeaders(allowed));
  }
  return new Response(JSON.stringify(body), { status, headers });
}

/**
 * Successful OPTIONS preflight response for an approved origin (204).
 * Unknown origins still receive a 204 but with no ACAO header, which makes
 * the browser reject the follow-up request.
 */
export function corsPreflight(origin: string | null | undefined): Response {
  const allowed = resolveAllowedOrigin(origin);
  return new Response(null, {
    status: 204,
    headers: allowed ? corsHeaders(allowed) : {},
  });
}
