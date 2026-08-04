// Minimal Deno runtime typings so the shared Edge Function helper
// (supabase/functions/_shared/cors.ts) type-checks when it is imported from
// unit tests in the Vite/TypeScript project. The Edge Functions themselves
// run inside Deno, where the real `Deno.env` API exists.
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};
