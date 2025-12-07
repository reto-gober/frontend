export type CacheKey = 'user' | 'systemSettings' | 'alertRules';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

type CacheEntry<T> = {
  value: T;
  timestamp: number;
};

const memoryCache = new Map<CacheKey, CacheEntry<any>>();
const inflight = new Map<CacheKey, Promise<any>>();

const hasWindow = typeof window !== 'undefined';

export function getCache<T>(key: CacheKey): T | null {
  const now = Date.now();

  // Memoria primero
  const mem = memoryCache.get(key);
  if (mem && now - mem.timestamp < CACHE_TTL_MS) {
    return mem.value as T;
  }

  // localStorage
  if (hasWindow) {
    const raw = localStorage.getItem(`cache:${key}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as CacheEntry<T>;
        if (now - parsed.timestamp < CACHE_TTL_MS) {
          memoryCache.set(key, parsed);
          return parsed.value;
        }
      } catch (e) {
        console.warn('[cache] error parsing cache', key, e);
        localStorage.removeItem(`cache:${key}`);
      }
    }
  }

  return null;
}

export function setCache<T>(key: CacheKey, value: T) {
  const entry: CacheEntry<T> = { value, timestamp: Date.now() };
  memoryCache.set(key, entry);
  if (hasWindow) {
    try {
      localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
    } catch (e) {
      console.warn('[cache] unable to persist', key, e);
    }
  }
}

export function invalidateCache(keys?: CacheKey | CacheKey[]) {
  const list = keys ? (Array.isArray(keys) ? keys : [keys]) : Array.from(memoryCache.keys());
  list.forEach((k) => {
    memoryCache.delete(k as CacheKey);
    inflight.delete(k as CacheKey);
    if (hasWindow) localStorage.removeItem(`cache:${k}`);
  });
}

export function dedupe<T>(key: CacheKey, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = fn().finally(() => inflight.delete(key));
  inflight.set(key, promise as Promise<any>);
  return promise;
}

export const cacheTtlMs = CACHE_TTL_MS;
