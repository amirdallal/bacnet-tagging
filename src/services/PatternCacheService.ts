import { createHash } from 'crypto';
import { config } from '../config.js';
import type { EnrichmentResult } from '../types/enrichment.js';

interface CacheEntry {
  result: EnrichmentResult;
  expiresAt: number;
}

/**
 * In-memory cache for enrichment results.
 * Key: hash(objectName + objectType + units)
 * Interface is Redis-compatible for future swap.
 */
export class PatternCacheService {
  private store = new Map<string, CacheEntry>();
  private hits = 0;
  private misses = 0;

  private ttlMs = config.cache.ttlHours * 60 * 60 * 1000;

  /**
   * Build a cache key from point attributes.
   */
  buildKey(objectName: string, objectType: string, units: string): string {
    return createHash('sha256')
      .update(`${objectName}|${objectType}|${units}`)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Get a cached result. Returns null on miss or expiry.
   */
  get(key: string): EnrichmentResult | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return { ...entry.result, enrichmentSource: 'cache' };
  }

  /**
   * Store an enrichment result.
   */
  set(key: string, result: EnrichmentResult): void {
    this.store.set(key, {
      result,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  /**
   * Invalidate a specific key (used when user corrects a classification).
   */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all cache entries.
   */
  clear(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics.
   */
  getStats(): { size: number; hits: number; misses: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }
}
