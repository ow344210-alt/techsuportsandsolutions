// Tiny in-memory cache for public data fetches. Every component that needs the
// same table shares a single in-flight promise (no duplicate Supabase round
// trips) and, once resolved, reuses the result for a short TTL so revisits are
// instant. Errors are never cached, so a failed query can be retried.
//
// A timeout guards against a slow or unreachable Supabase: callers that race
// past the deadline reject and fall back to their built-in defaults instead of
// showing skeletons indefinitely. The underlying request is allowed to finish
// in the background so a warm result is available for the next visit.
const inFlight = new Map<string, Promise<unknown>>();
const resolved = new Map<string, { value: unknown; expiresAt: number }>();

export function cachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 60_000,
  timeoutMs = 10_000,
): Promise<T> {
  const hit = resolved.get(key);
  if (hit && Date.now() < hit.expiresAt) {
    return Promise.resolve(hit.value as T);
  }
  if (hit) resolved.delete(key);

  let promise = inFlight.get(key) as Promise<T> | undefined;
  if (!promise) {
    const task = fetcher();

    const guarded = new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        inFlight.delete(key);
        reject(new Error(`cachedQuery timed out after ${timeoutMs}ms: ${key}`));
      }, timeoutMs);

      task.then(
        (value) => {
          clearTimeout(timer);
          inFlight.delete(key);
          resolved.set(key, { value, expiresAt: Date.now() + ttlMs });
          resolve(value);
        },
        (error) => {
          clearTimeout(timer);
          inFlight.delete(key);
          reject(error);
        },
      );
    });

    inFlight.set(key, guarded);
    promise = guarded;
  }
  return promise;
}
