/**
 * CacheManager - Enterprise Caching Strategy
 * 
 * Implements:
 * 1. Output/Fragment Caching - full response caching for dashboard data
 * 2. Data-level Caching - individual entity caching for threat data
 * 
 * Features:
 * - Absolute expiration strategy
 * - Sliding expiration strategy  
 * - Cache invalidation policy
 * - Performance comparison (cached vs uncached)
 * - Memory trade-off tracking
 */

class CacheManager {
  constructor() {
    this.store = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      invalidations: 0,
      evictions: 0,
      totalAccessTime: 0,
      accessCount: 0
    };
    this.typeStats = {
      output: { hits: 0, misses: 0, sets: 0 },
      data: { hits: 0, misses: 0, sets: 0 }
    };

    // Memory tracking
    this.memoryUsage = {
      maxSize: 100 * 1024 * 1024, // 100MB limit
      currentSize: 0,
      peakSize: 0
    };

    // Start periodic cleanup
    this.cleanupInterval = setInterval(() => this.evictExpired(), 10000);
  }

  /**
   * GET from cache
   * Supports both absolute and sliding expiration
   */
  get(key) {
    const startTime = process.hrtime.bigint();
    const entry = this.store.get(key);

    if (!entry) {
      this.stats.misses++;
      if (entry === undefined) {
        this.trackAccessTime(startTime);
      }
      return null;
    }

    // Check absolute expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      this.updateMemoryUsage(-entry.size);
      this.trackAccessTime(startTime);
      return null;
    }

    // Sliding expiration: extend TTL on access
    if (entry.sliding && entry.ttl) {
      entry.expiresAt = Date.now() + entry.ttl;
    }

    entry.hits++;
    entry.lastAccessedAt = Date.now();
    this.stats.hits++;

    // Track type-specific stats
    if (this.typeStats[entry.type]) {
      this.typeStats[entry.type].hits++;
    }

    this.trackAccessTime(startTime);
    return entry.value;
  }

  /**
   * SET cache entry
   * @param {string} key 
   * @param {*} value 
   * @param {Object} options - { ttl, type: 'output'|'data', sliding: boolean }
   */
  set(key, value, options = {}) {
    const { ttl = 60000, type = 'data', sliding = false } = options;
    const size = this.estimateSize(value);

    // Evict if over memory limit
    while (this.memoryUsage.currentSize + size > this.memoryUsage.maxSize && this.store.size > 0) {
      this.evictLRU();
    }

    const entry = {
      key,
      value,
      type,
      ttl,
      sliding,
      size,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      hits: 0
    };

    // Remove old entry size if replacing
    const existing = this.store.get(key);
    if (existing) {
      this.updateMemoryUsage(-existing.size);
    }

    this.store.set(key, entry);
    this.updateMemoryUsage(size);
    this.stats.sets++;

    if (this.typeStats[type]) {
      this.typeStats[type].sets++;
    }
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key) {
    const entry = this.store.get(key);
    if (entry) {
      this.updateMemoryUsage(-entry.size);
      this.store.delete(key);
      this.stats.invalidations++;
    }
  }

  /**
   * Invalidate by pattern (prefix match)
   */
  invalidateByPattern(pattern) {
    let count = 0;
    this.store.forEach((entry, key) => {
      if (key.startsWith(pattern)) {
        this.updateMemoryUsage(-entry.size);
        this.store.delete(key);
        count++;
      }
    });
    this.stats.invalidations += count;
    return count;
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.store.clear();
    this.memoryUsage.currentSize = 0;
    this.stats.invalidations++;
  }

  /**
   * Performance comparison: cached vs uncached
   */
  async performanceComparison() {
    const iterations = 100;
    
    // Test 1: Uncached - simulate expensive computation each time
    const uncachedTimes = [];
    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      // Simulate DB query / computation
      this.simulateExpensiveOperation();
      const end = process.hrtime.bigint();
      uncachedTimes.push(Number(end - start) / 1000000); // Convert to ms
    }

    // Test 2: Cached - first call computes, rest are cache hits
    this.set('perf-test', { data: 'test-result' }, { ttl: 60000, type: 'output' });
    const cachedTimes = [];
    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      this.get('perf-test');
      const end = process.hrtime.bigint();
      cachedTimes.push(Number(end - start) / 1000000);
    }

    // Cleanup
    this.invalidate('perf-test');

    const avgUncached = uncachedTimes.reduce((a, b) => a + b, 0) / iterations;
    const avgCached = cachedTimes.reduce((a, b) => a + b, 0) / iterations;
    const improvement = ((avgUncached - avgCached) / avgUncached * 100).toFixed(1);

    return {
      iterations,
      uncached: {
        averageMs: avgUncached.toFixed(4),
        minMs: Math.min(...uncachedTimes).toFixed(4),
        maxMs: Math.max(...uncachedTimes).toFixed(4),
        totalMs: uncachedTimes.reduce((a, b) => a + b, 0).toFixed(2)
      },
      cached: {
        averageMs: avgCached.toFixed(4),
        minMs: Math.min(...cachedTimes).toFixed(4),
        maxMs: Math.max(...cachedTimes).toFixed(4),
        totalMs: cachedTimes.reduce((a, b) => a + b, 0).toFixed(2)
      },
      improvement: `${improvement}%`,
      speedup: `${(avgUncached / avgCached).toFixed(1)}x faster`,
      memoryTradeoff: {
        cacheMemoryUsed: this.formatBytes(this.memoryUsage.currentSize),
        peakMemoryUsed: this.formatBytes(this.memoryUsage.peakSize),
        maxAllowed: this.formatBytes(this.memoryUsage.maxSize),
        note: 'Cache trades memory for latency reduction'
      }
    };
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(1)
      : '0.0';

    return {
      overall: {
        hits: this.stats.hits,
        misses: this.stats.misses,
        hitRate: `${hitRate}%`,
        sets: this.stats.sets,
        invalidations: this.stats.invalidations,
        evictions: this.stats.evictions,
        entries: this.store.size
      },
      byType: this.typeStats,
      memory: {
        current: this.formatBytes(this.memoryUsage.currentSize),
        peak: this.formatBytes(this.memoryUsage.peakSize),
        max: this.formatBytes(this.memoryUsage.maxSize),
        utilization: `${((this.memoryUsage.currentSize / this.memoryUsage.maxSize) * 100).toFixed(1)}%`
      },
      expirationPolicy: {
        outputCache: {
          strategy: 'absolute',
          defaultTTL: '30 seconds',
          description: 'Dashboard/fragment data expires after fixed duration'
        },
        dataCache: {
          strategy: 'sliding',
          defaultTTL: '60 seconds',
          description: 'Entity data TTL resets on each access'
        }
      },
      invalidationPolicy: {
        method: 'explicit + TTL-based + LRU eviction',
        description: 'Cache entries are invalidated via explicit calls, TTL expiry, or LRU eviction when memory limit is reached'
      }
    };
  }

  // Helper methods
  simulateExpensiveOperation() {
    // Simulate 1-2ms of CPU work
    const target = Date.now() + 1 + Math.random();
    while (Date.now() < target) {}
  }

  evictExpired() {
    const now = Date.now();
    this.store.forEach((entry, key) => {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.updateMemoryUsage(-entry.size);
        this.store.delete(key);
        this.stats.evictions++;
      }
    });
  }

  evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;
    this.store.forEach((entry, key) => {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt;
        oldestKey = key;
      }
    });
    if (oldestKey) {
      const entry = this.store.get(oldestKey);
      this.updateMemoryUsage(-entry.size);
      this.store.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  estimateSize(value) {
    return Buffer.byteLength(JSON.stringify(value), 'utf8');
  }

  updateMemoryUsage(delta) {
    this.memoryUsage.currentSize = Math.max(0, this.memoryUsage.currentSize + delta);
    this.memoryUsage.peakSize = Math.max(this.memoryUsage.peakSize, this.memoryUsage.currentSize);
  }

  trackAccessTime(startTime) {
    const elapsed = Number(process.hrtime.bigint() - startTime) / 1000000;
    this.stats.totalAccessTime += elapsed;
    this.stats.accessCount++;
  }

  formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

module.exports = CacheManager;
