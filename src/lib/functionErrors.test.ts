import { describe, it, expect } from "vitest";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { getFunctionErrorMessage } from "./functionErrors";

describe("getFunctionErrorMessage", () => {
  it("returns the server-provided error message from a FunctionsHttpError body", async () => {
    const response = new Response(
      JSON.stringify({ error: "Too many submissions. Please try again later." }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      },
    );
    const error = new FunctionsHttpError(response);

    const message = await getFunctionErrorMessage(error, "fallback");

    expect(message).toBe("Too many submissions. Please try again later.");
  });

  it("falls back to the default error message when the body has no error field", async () => {
    const response = new Response(JSON.stringify({ detail: "something" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
    const error = new FunctionsHttpError(response);

    const message = await getFunctionErrorMessage(error, "fallback");

    expect(message).toBe(error.message);
  });

  it("falls back when the response body is not JSON", async () => {
    const response = new Response("boom", { status: 500 });
    const error = new FunctionsHttpError(response);

    const message = await getFunctionErrorMessage(error, "fallback");

    expect(message).toBe(error.message);
  });

  it("returns the plain message for non-HTTP errors", async () => {
    const message = await getFunctionErrorMessage(
      new Error("Network error"),
      "fallback",
    );

    expect(message).toBe("Network error");
  });

  it("returns the fallback for non-Error values", async () => {
    const message = await getFunctionErrorMessage("unexpected", "fallback");

    expect(message).toBe("fallback");
  });
});
