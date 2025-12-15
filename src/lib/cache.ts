// In-memory cache implementation for client-side caching
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const iterator = this.cache.keys();
      const firstEntry = iterator.next();
      if (!firstEntry.done) {
        this.cache.delete(firstEntry.value);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Global cache instance
export const memoryCache = new MemoryCache(200);

// Cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    memoryCache.cleanup();
  }, 5 * 60 * 1000);
}

// Cache key generators
export const cacheKeys = {
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user_profile:${id}`,
  property: (id: string) => `property:${id}`,
  properties: (filters: Record<string, any>) => 
    `properties:${JSON.stringify(filters)}`,
  reservations: (userId: string) => `reservations:${userId}`,
  reviews: (propertyId: string) => `reviews:${propertyId}`,
  notifications: (userId: string) => `notifications:${userId}`,
  analytics: (type: string, userId?: string) => 
    `analytics:${type}${userId ? `:${userId}` : ''}`,
};

// Cache wrapper for async functions
export function withCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator: (...args: T) => string,
  ttlMs: number = 5 * 60 * 1000
) {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator(...args);
    
    // Try to get from cache first
    const cached = memoryCache.get<R>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    try {
      const result = await fn(...args);
      memoryCache.set(key, result, ttlMs);
      return result;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  };
}

// Browser storage cache (persists across sessions)
export class BrowserStorageCache {
  private storage: Storage;
  private prefix: string;

  constructor(storage: Storage = localStorage, prefix: string = 'roomfindr_cache_') {
    this.storage = storage;
    this.prefix = prefix;
  }

  set<T>(key: string, data: T, ttlMs: number = 24 * 60 * 60 * 1000): void {
    try {
      const entry = {
        data,
        timestamp: Date.now(),
        ttl: ttlMs,
      };
      this.storage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (error) {
      // Storage might be full or unavailable
      console.warn('Failed to set browser cache:', error);
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = this.storage.getItem(this.prefix + key);
      if (!item) return null;

      const entry = JSON.parse(item);
      
      // Check if expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.storage.removeItem(this.prefix + key);
        return null;
      }

      return entry.data;
    } catch (error) {
      // Invalid JSON or storage error
      this.storage.removeItem(this.prefix + key);
      return null;
    }
  }

  delete(key: string): void {
    this.storage.removeItem(this.prefix + key);
  }

  clear(): void {
    const keys = Object.keys(this.storage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        this.storage.removeItem(key);
      }
    });
  }
}

export const browserCache = typeof window !== 'undefined' 
  ? new BrowserStorageCache() 
  : null;

// Query optimization helpers
export const queryOptimizations = {
  // Batch multiple queries together
  batchQueries: async <T>(queries: (() => Promise<T>)[]): Promise<T[]> => {
    return Promise.all(queries.map(query => query()));
  },

  // Debounce search queries
  debounceSearch: <T extends any[]>(
    fn: (...args: T) => Promise<any>,
    delay: number = 300
  ) => {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: T) => {
      return new Promise((resolve, reject) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          try {
            const result = await fn(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, delay);
      });
    };
  },

  // Pagination helper with caching
  createPaginatedQuery: <T>(
    baseQuery: (offset: number, limit: number) => Promise<T[]>,
    cacheKeyPrefix: string,
    pageSize: number = 20
  ) => {
    return withCache(
      baseQuery,
      (offset: number, limit: number) => 
        `${cacheKeyPrefix}:${offset}:${limit}`,
      2 * 60 * 1000 // 2 minutes cache
    );
  },
};

// Performance monitoring
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();

  startTimer(label: string): () => void {
    if (typeof window !== 'undefined' && 'performance' in window && performance.now) {
      const start = performance.now();
      
      return () => {
        const duration = performance.now() - start;
        this.recordMetric(label, duration);
      };
    } else {
      // Fallback for environments without performance.now()
      const start = Date.now();
      return () => {
        const duration = Date.now() - start;
        this.recordMetric(label, duration);
      };
    }
  }

  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    
    const values = this.metrics.get(label)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  getMetrics(label: string) {
    const values = this.metrics.get(label) || [];
    if (values.length === 0) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { avg, min, max, count: values.length };
  }

  getAllMetrics() {
    const result: Record<string, any> = {};
    for (const [label, values] of this.metrics.entries()) {
      result[label] = this.getMetrics(label);
    }
    return result;
  }
}

export const performanceMonitor = new PerformanceMonitor();