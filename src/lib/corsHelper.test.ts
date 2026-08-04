import { describe, it, expect, beforeEach } from "vitest";
import {
  resolveAllowedOrigin,
  corsHeaders,
  jsonResponse,
  corsPreflight,
} from "../../supabase/functions/_shared/cors";

type EnvMap = Record<string, string>;

function installDeno(env: EnvMap) {
  (globalThis as unknown as { Deno: unknown }).Deno = {
    env: {
      get: (key: string) => env[key] ?? "",
    },
  };
}

beforeEach(() => {
  (globalThis as unknown as { __corsAllowlist?: string[] }).__corsAllowlist =
    undefined;
});

describe("shared CORS helper", () => {
  it("allows only origins present in ALLOWED_ORIGINS", () => {
    installDeno({
      ALLOWED_ORIGINS:
        "https://prod.example.com, https://www.example.com/",
    });

    expect(resolveAllowedOrigin("https://prod.example.com")).toBe(
      "https://prod.example.com",
    );
    expect(resolveAllowedOrigin("https://www.example.com")).toBe(
      "https://www.example.com",
    );
    expect(resolveAllowedOrigin("https://evil.example.com")).toBeNull();
    expect(resolveAllowedOrigin(null)).toBeNull();
    expect(resolveAllowedOrigin(undefined)).toBeNull();
    expect(resolveAllowedOrigin("")).toBeNull();
  });

  it("keeps the local development defaults", () => {
    installDeno({});

    expect(resolveAllowedOrigin("http://localhost:5173")).toBe(
      "http://localhost:5173",
    );
    expect(resolveAllowedOrigin("http://127.0.0.1:5173")).toBe(
      "http://127.0.0.1:5173",
    );
    expect(resolveAllowedOrigin("http://localhost:3000")).toBe(
      "http://localhost:3000",
    );
  });

  it("reads APP_URL and VITE_APP_URL secrets", () => {
    installDeno({
      APP_URL: "https://app.example.com/",
      VITE_APP_URL: "http://localhost:8080",
    });

    expect(resolveAllowedOrigin("https://app.example.com")).toBe(
      "https://app.example.com",
    );
    expect(resolveAllowedOrigin("http://localhost:8080")).toBe(
      "http://localhost:8080",
    );
  });

  it("ignores non-http(s) protocols", () => {
    installDeno({ ALLOWED_ORIGINS: "ftp://example.com, javascript:alert(1)" });

    expect(resolveAllowedOrigin("ftp://example.com")).toBeNull();
    expect(resolveAllowedOrigin("javascript:alert(1)")).toBeNull();
  });

  it("builds a complete CORS header set with Vary: Origin", () => {
    const headers = corsHeaders("https://prod.example.com");

    expect(headers["Access-Control-Allow-Origin"]).toBe(
      "https://prod.example.com",
    );
    expect(headers["Access-Control-Allow-Methods"]).toBe("POST, OPTIONS");
    expect(headers["Access-Control-Allow-Headers"]).toContain("authorization");
    expect(headers["Vary"]).toBe("Origin");
  });

  it("jsonResponse attaches CORS headers only for allowed origins", () => {
    installDeno({ ALLOWED_ORIGINS: "https://prod.example.com" });

    const allowed = jsonResponse({ success: true }, 200, "https://prod.example.com");
    expect(allowed.status).toBe(200);
    expect(allowed.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://prod.example.com",
    );

    const denied = jsonResponse(
      { error: "Origin not allowed" },
      403,
      "https://evil.example.com",
    );
    expect(denied.status).toBe(403);
    expect(denied.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("corsPreflight returns 204 for any origin but only echoes approved ones", () => {
    installDeno({ ALLOWED_ORIGINS: "https://prod.example.com" });

    const allowed = corsPreflight("https://prod.example.com");
    expect(allowed.status).toBe(204);
    expect(allowed.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://prod.example.com",
    );

    const denied = corsPreflight("https://evil.example.com");
    expect(denied.status).toBe(204);
    expect(denied.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});
