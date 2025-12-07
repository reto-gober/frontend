import api from './api';
import { CacheKey, dedupe, getCache, invalidateCache, setCache } from './cache';

export async function fetchCached<T>(key: CacheKey, url: string): Promise<T> {
  const cached = getCache<T>(key);
  if (cached) return cached;

  return dedupe<T>(key, async () => {
    const response = await api.get(url);
    const data = (response.data?.data ?? response.data) as T;
    setCache(key, data);
    return data;
  });
}

export async function mutate<T>(key: CacheKey, fn: () => Promise<T>): Promise<T> {
  const result = await fn();
  invalidateCache(key);
  return result;
}

export { invalidateCache } from './cache';
