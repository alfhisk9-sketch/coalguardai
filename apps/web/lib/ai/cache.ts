import { createHash } from "crypto";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hash: string;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes default TTL
const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Generates a stable deterministic hash from an arbitrary object or input context.
 */
export function hashSignal(input: unknown): string {
  try {
    const serialized = JSON.stringify(input, Object.keys(input as object).sort());
    return createHash("sha256").update(serialized).digest("hex").slice(0, 16);
  } catch {
    return createHash("sha256").update(String(input)).digest("hex").slice(0, 16);
  }
}

/**
 * Retrieves a cached AI result if valid and unexpired.
 */
export function getCachedAiResult<T>(cacheKey: string, currentHash?: string): T | null {
  const entry = cache.get(cacheKey) as CacheEntry<T> | undefined;
  if (!entry) return null;

  // Check TTL
  const now = Date.now();
  if (now - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(cacheKey);
    return null;
  }

  // Check hash freshness if provided
  if (currentHash && entry.hash !== currentHash) {
    cache.delete(cacheKey);
    return null;
  }

  return entry.data;
}

/**
 * Stores an AI result in the memory cache.
 */
export function setCachedAiResult<T>(cacheKey: string, data: T, hash = ""): void {
  // Evict oldest if map exceeds 500 entries to prevent memory leaks
  if (cache.size > 500) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }

  cache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    hash,
  });
}

/**
 * Clears cached entries for a specific mine or all entries.
 */
export function invalidateAiCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}
