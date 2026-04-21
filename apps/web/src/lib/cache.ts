const DEFAULT_TTL_MS = 5 * 60 * 1000;

interface Entry<T> {
  value: T;
  expires: number;
}

export function createTtlMemo<A extends unknown[], T>(
  fn: (...args: A) => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): (...args: A) => Promise<T> {
  const store = new Map<string, Entry<T>>();
  return async (...args: A): Promise<T> => {
    const key = JSON.stringify(args);
    const now = Date.now();
    const hit = store.get(key);
    if (hit && hit.expires > now) return hit.value;
    const value = await fn(...args);
    if (value !== null && value !== undefined) {
      store.set(key, { value, expires: now + ttlMs });
    }
    return value;
  };
}
