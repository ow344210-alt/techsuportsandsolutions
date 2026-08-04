import { FunctionsHttpError } from "@supabase/supabase-js";

// Extracts a user-facing message from a supabase-js Edge Function error.
// When the function returns a non-2xx status, the response body usually
// contains `{ error: "..." }` — that message is far more useful than the
// generic "Edge Function returned a non-2xx status code" error message.
export async function getFunctionErrorMessage(
  error: unknown,
  fallback: string,
): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    const context = error.context as Response | undefined;
    if (context && typeof context.json === "function") {
      try {
        const body: unknown = await context.json();
        if (
          body &&
          typeof body === "object" &&
          "error" in body &&
          typeof body.error === "string" &&
          body.error
        ) {
          return body.error;
        }
      } catch {
        // Response body could not be read; fall through to the default.
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
