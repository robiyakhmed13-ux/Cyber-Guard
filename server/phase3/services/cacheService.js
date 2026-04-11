/**
 * Cache Service - Phase III Component 5
 * 
 * Implements:
 * - In-memory caching (Redis-like behavior)
 * - API response caching middleware
 * - Cache expiration strategy (TTL-based)
 * - Cache invalidation policy (explicit + tag-based)
 * - Performance comparison (before/after caching)
 */

const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.store = new Map();
    this.tags = new Map(); // tag -> Set of keys
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      invalidations: 0,
      evictions: 0
    };

    // Cleanup expired entries every 30s
    this.cleanupTimer = setInterval(() => this.evictExpired(), 30000);
  }

  /**
   * Get a cached value
   */
  get(key) {
    const entry = this.store.get(key);

    if (!entry) {
      this.stats.misses++;
      logger.trackCache('misses');
      return null;
    }

    // Check TTL expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.stats.evictions++;
      this.stats.misses++;
      logger.trackCache('misses');
      return null;
    }

    // Sliding window: reset TTL on access
    if (entry.sliding && entry.ttl) {
      entry.expiresAt = Date.now() + entry.ttl;
    }

    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    logger.trackCache('hits');
    return entry.value;
  }

  /**
   * Set a cached value
   * @param {string} key
   * @param {*} value
   * @param {Object} options - { ttl (ms), tags: [], sliding: bool }
   */
  set(key, value, options = {}) {
    const { ttl = 60000, tags = [], sliding = false } = options;

    this.store.set(key, {
      value,
      ttl,
      sliding,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0,
      tags
    });

    // Register tags for tag-based invalidation
    tags.forEach(tag => {
      if (!this.tags.has(tag)) this.tags.set(tag, new Set());
      this.tags.get(tag).add(key);
    });

    this.stats.sets++;
    logger.trackCache('sets');
  }

  /**
   * Invalidate by key
   */
  invalidate(key) {
    const entry = this.store.get(key);
    if (entry) {
      entry.tags.forEach(tag => {
        const tagKeys = this.tags.get(tag);
        if (tagKeys) tagKeys.delete(key);
      });
      this.store.delete(key);
      this.stats.invalidations++;
    }
  }

  /**
   * Invalidate all keys associated with a tag
   */
  invalidateByTag(tag) {
    const keys = this.tags.get(tag);
    if (!keys) return 0;
    let count = 0;
    keys.forEach(key => {
      this.store.delete(key);
      count++;
    });
    this.tags.delete(tag);
    this.stats.invalidations += count;
    return count;
  }

  /**
   * Clear all cache
   */
  clear() {
    this.store.clear();
    this.tags.clear();
    this.stats.invalidations++;
  }

  /**
   * Remove expired entries
   */
  evictExpired() {
    const now = Date.now();
    let evicted = 0;
    this.store.forEach((entry, key) => {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.store.delete(key);
        evicted++;
      }
    });
    if (evicted > 0) {
      this.stats.evictions += evicted;
      logger.info(`Cache eviction: removed ${evicted} expired entries`);
    }
  }

  /**
   * Express middleware for API response caching
   */
  cacheResponse(ttl = 30000, keyFn = null) {
    return (req, res, next) => {
      const cacheKey = keyFn ? keyFn(req) : `api:${req.method}:${req.originalUrl}`;

      const cached = this.get(cacheKey);
      if (cached) {
        return res.json({
          ...cached,
          _cache: { hit: true, key: cacheKey }
        });
      }

      // Override res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          this.set(cacheKey, body, { ttl, tags: ['api-response'] });
        }
        return originalJson(body);
      };
      next();
    };
  }

  /**
   * Performance comparison test
   */
  async performanceComparison() {
    const iterations = 200;

    // Simulated expensive operation
    const expensiveOp = () => {
      const start = Date.now();
      while (Date.now() - start < 2) {} // 2ms busy wait
      return { data: 'computed-result', timestamp: Date.now() };
    };

    // Test uncached
    const uncachedTimes = [];
    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      expensiveOp();
      uncachedTimes.push(Number(process.hrtime.bigint() - start) / 1e6);
    }

    // Test cached
    this.set('perf-test-key', expensiveOp(), { ttl: 60000 });
    const cachedTimes = [];
    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      this.get('perf-test-key');
      cachedTimes.push(Number(process.hrtime.bigint() - start) / 1e6);
    }
    this.invalidate('perf-test-key');

    const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
    const avgUncached = avg(uncachedTimes);
    const avgCached = avg(cachedTimes);

    return {
      iterations,
      uncached: {
        averageMs: avgUncached.toFixed(4),
        totalMs: uncachedTimes.reduce((a, b) => a + b, 0).toFixed(2)
      },
      cached: {
        averageMs: avgCached.toFixed(4),
        totalMs: cachedTimes.reduce((a, b) => a + b, 0).toFixed(2)
      },
      improvement: `${((avgUncached - avgCached) / avgUncached * 100).toFixed(1)}%`,
      speedup: `${(avgUncached / avgCached).toFixed(1)}x faster`
    };
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = (this.stats.hits + this.stats.misses) > 0
      ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(1)
      : '0.0';

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      entries: this.store.size,
      tags: this.tags.size,
      expirationPolicy: {
        apiResponse: { strategy: 'absolute', defaultTTL: '30s' },
        dataCache: { strategy: 'sliding', defaultTTL: '60s' },
        invalidation: 'explicit + tag-based + TTL auto-eviction'
      }
    };
  }
}

module.exports = new CacheService();
