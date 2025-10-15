/**
 * Discovery Cache System
 * 
 * High-performance LRU cache for TypeSpec file metadata and discovery results.
 * Provides type-safe caching with performance monitoring and optimization.
 * 
 * @author TypeSpec AsyncAPI Emitter Team
 * @since v1.1.0
 */

import { Effect } from "effect";
import { TypeSpecFileInfo } from "./BaseDiscovery.js";

/**
 * Cache entry interface
 * Represents a single cache entry with metadata
 */
export interface CacheEntry {
  readonly key: string;
  readonly value: TypeSpecFileInfo;
  readonly timestamp: number;
  readonly ttl: number;
  readonly size: number;
}

/**
 * Cache configuration interface
 * Configuration options for cache behavior
 */
export interface CacheConfig {
  readonly maxSize: number;
  readonly defaultTTL: number;
  readonly cleanupInterval: number;
  readonly enableMetrics: boolean;
  readonly enableCompression: boolean;
}

/**
 * Cache metrics interface
 * Performance and usage metrics for cache operations
 */
export interface CacheMetrics {
  readonly totalRequests: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
  readonly hitRate: number;
  readonly averageLookupTime: number;
  readonly totalSize: number;
  readonly evictionCount: number;
  readonly memoryUsage: number;
}

/**
 * LRU Cache implementation for TypeSpec file metadata
 */
export class LRUCache {
  private cache: Map<string, CacheEntry>;
  private accessOrder: string[];
  private maxSize: number;
  private defaultTTL: number;
  private metrics: CacheMetrics;
  private cleanupTimer: NodeJS.Timeout | null;

  constructor(config: CacheConfig) {
    this.cache = new Map<string, CacheEntry>();
    this.accessOrder = [];
    this.maxSize = config.maxSize;
    this.defaultTTL = config.defaultTTL;
    
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      averageLookupTime: 0,
      totalSize: 0,
      evictionCount: 0,
      memoryUsage: 0
    };

    // Set up cleanup interval
    if (config.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, config.cleanupInterval);
    }
  }

  /**
   * Get value from cache with LRU tracking
   * @param key - Cache key
   * @returns Promise resolving to cached value or null
   */
  get(key: string): Effect.Effect<TypeSpecFileInfo | null, Error> {
    return Effect.gen(function* () {
      const startTime = performance.now();
      this.metrics.totalRequests++;

      const entry = this.cache.get(key);
      
      if (!entry) {
        this.metrics.cacheMisses++;
        this.updateHitRate();
        yield* Effect.log(`🔍 Cache miss: ${key}`);
        return null;
      }

      // Check TTL
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        this.removeAccessOrder(key);
        this.metrics.cacheMisses++;
        this.updateHitRate();
        yield* Effect.log(`🔍 Cache expired: ${key}`);
        return null;
      }

      // Update access order (LRU)
      this.moveToFront(key);
      this.metrics.cacheHits++;
      this.updateHitRate();
      this.metrics.averageLookupTime = (this.metrics.averageLookupTime * (this.metrics.totalRequests - 1) + (performance.now() - startTime)) / this.metrics.totalRequests;

      yield* Effect.log(`✅ Cache hit: ${key}`);
      return entry.value;
    });
  }

  /**
   * Set value in cache with LRU tracking
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in milliseconds
   * @returns Promise resolving to operation result
   */
  set(key: string, value: TypeSpecFileInfo, ttl?: number): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      const now = Date.now();
      
      // Calculate TTL
      const cacheTTL = ttl || this.defaultTTL;
      
      // Create cache entry
      const entry: CacheEntry = {
        key,
        value,
        timestamp: now,
        ttl: cacheTTL,
        size: this.calculateSize(value)
      };

      // Check if eviction is needed
      if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
        this.evictOldest();
      }

      // Remove existing entry if present
      if (this.cache.has(key)) {
        this.removeAccessOrder(key);
      }

      // Add new entry
      this.cache.set(key, entry);
      this.moveToFront(key);
      this.updateTotalSize();

      yield* Effect.log(`💾 Cache set: ${key} (${entry.size} bytes)`);
    });
  }

  /**
   * Remove value from cache
   * @param key - Cache key to remove
   * @returns Promise resolving to removed value or null
   */
  remove(key: string): Effect.Effect<TypeSpecFileInfo | null, Error> {
    return Effect.gen(function* () {
      const entry = this.cache.get(key);
      
      if (!entry) {
        yield* Effect.log(`🔍 Cache remove miss: ${key}`);
        return null;
      }

      this.cache.delete(key);
      this.removeAccessOrder(key);
      this.updateTotalSize();

      yield* Effect.log(`🗑️ Cache removed: ${key}`);
      return entry.value;
    });

  /**
   * Check if cache contains key
   * @param key - Cache key to check
   * @returns Promise resolving to boolean
   */
  has(key: string): Effect.Effect<boolean, Error> {
    return Effect.gen(function* () {
      const entry = this.cache.get(key);
      
      if (!entry) {
        return false;
      }

      // Check TTL
      if (Date.now() - entry.timestamp > entry.tTL) {
        return false;
      }

      yield* Effect.log(`✅ Cache has: ${key}`);
      return true;
    });
  }

  /**
   * Clear all cache entries
   * @returns Promise resolving to operation result
   */
  clear(): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      this.cache.clear();
      this.accessOrder = [];
      this.updateTotalSize();
      this.metrics.totalRequests++;
      this.metrics.cacheMisses++;
      this.metrics.cacheHits = 0;
      this.updateHitRate();

      yield* Effect.log(`🗑️ Cache cleared`);
    });
  }

  /**
   * Get cache size
   * @returns Current cache size
   */
  size(): Effect.Effect<number, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`📊 Cache size: ${this.cache.size}`);
      return this.cache.size;
    });
  }

  /**
   * Get cache metrics
   * @returns Promise resolving to current metrics
   */
  getMetrics(): Effect.Effect<CacheMetrics, Error> {
    return Effect.gen(function* () {
      this.updateHitRate();
      yield* Effect.log(`📊 Cache metrics: ${JSON.stringify(this.metrics, null, 2)}`);
      return { ...this.metrics };
    });
  }

  /**
   * Cleanup expired entries
   * @returns Promise resolving to cleanup result
   */
  cleanup(): Effect.Effect<number, Error> {
    return Effect.gen(function* {
      const now = Date.now();
      const expiredKeys: string[] = [];

      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          expiredKeys.push(key);
        }
      }

      for (const key of expiredKeys) {
        this.cache.delete(key);
        this.removeAccessOrder(key);
      }

      this.updateTotalSize();
      this.metrics.evictionCount += expiredKeys.length;

      if (expiredKeys.length > 0) {
        yield* Effect.log(`🗑️ Cache cleanup: ${expiredKeys.length} expired entries`);
      }

      return expiredKeys.length;
    });
  }

  /**
   * Evict oldest entries to maintain size limit
   */
  private evictOldest(): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      if (this.accessOrder.length === 0) {
        return;
      }

      const oldestKey = this.accessOrder.shift();
      const oldestEntry = this.cache.get(oldestKey);
      
      if (oldestEntry) {
        this.cache.delete(oldestKey);
        this.updateTotalSize();
        this.metrics.evictionCount++;
        yield* Effect.log(`🗑️ Cache evicted: ${oldestKey}`);
      }
    });
  }

  /**
   * Move key to front of access order
   * @param key - Key to move to front
   */
  private moveToFront(key: string): void {
    // Remove from current position
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }

    // Add to front
    this.accessOrder.unshift(key);
  }

  /**
   * Remove key from access order
   * @param key - Key to remove
   */
  private removeAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Calculate size of value
   * @param value - Value to calculate size for
   * @return Size in bytes
   */
  private calculateSize(value: TypeSpecFileInfo): number {
    return JSON.stringify(value).length + key.length;
  }

  /**
   * Update total cache size
   */
  private updateTotalSize(): void {
    let totalSize = 0;
    
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }

    this.metrics.totalSize = totalSize;
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    if (this.metrics.totalRequests > 0) {
      this.metrics.hitRate = this.metrics.cacheHits / this.metrics.totalRequests;
    }
  }

  /**
   * Get memory usage estimate
   * @returns Estimated memory usage in bytes
   */
  getMemoryUsage(): Effect.Effect<number, Error> {
    return Effect.gen(function* () {
      let totalSize = 0;
      
      for (const entry of this.cache.values()) {
        totalSize += entry.size;
      }

      // Add overhead for access order array and map overhead
      totalSize += this.accessOrder.length * 8; // String pointer estimation
      totalSize += this.cache.size * 24; // Map overhead estimation
      
      this.metrics.memoryUsage = totalSize;
      yield* Effect.log(`💾 Cache memory usage: ${totalSize} bytes`);
      
      return totalSize;
    });
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
        this.cleanupTimer = null;
      }

      this.clear();
      this.accessOrder = [];
      this.metrics = {
        totalRequests: 0,
        cacheHits: 0,
        cacheStats: 0,
        hitRate: 0,
        averageLookupTime: 0,
        totalSize: 0,
        evictionCount: 0,
        memoryUsage: 0
      };

      yield* Effect.log(`🗑️ Cache destroyed`);
    });
  }

  /**
   * Get cache performance analysis
   * @returns Performance analysis
   */
  getPerformanceAnalysis(): Effect.Effect<{
    efficiency: string;
    utilization: string;
    performance: string;
  }, Error> {
    return Effect.gen(function* {
      const efficiency = this.metrics.hitRate > 0.8 ? "Excellent" :
                     this.metrics.hitRate > 0.6 ? "Good" :
                     this.metrics.hitRate > 0.4 ? "Fair" : "Poor";

      const utilization = this.cache.size / this.maxSize > 0.8 ? "High" :
                     this.cache.size / this.maxSize > 0.6 ? "Medium" : "Low";

      const performance = this.metrics.averageLookupTime < 1 ? "Excellent" :
                     this.metrics.averageLookupTime < 5 ? "Good" :
                     this.metrics.averageLookupTime < 10 ? "Fair" : "Poor";

      yield* Effect.log(`📊 Cache performance: ${efficiency} efficiency, ${utilization} utilization, ${performance} performance`);
      
      return { efficiency, utilization, performance };
    });
  }
}

/**
 * Factory for creating cache instances
 */
export class CacheFactory {
  /**
   * Create default cache configuration
   * @returns Default cache configuration
   */
  static createDefaultConfig(): CacheConfig {
    return {
      maxSize: 1000,
      defaultTTL: 300000, // 5 minutes
      cleanupInterval: 60000, // 1 minute
      enableMetrics: true,
      enableCompression: false
    };
  }

  /**
   * Create high-performance cache configuration
   * @returns High-performance cache configuration
   */
  static createHighPerformanceConfig(): CacheConfig {
    return {
      maxSize: 5000,
      defaultTTL: 600000, // 10 minutes
      cleanupInterval: 30000, // 30 seconds
      enableMetrics: true,
      enableCompression: true
    };
  }

  /**
   * Create low-memory cache configuration
   * @returns Low-memory cache configuration
   */
  static createLowMemoryConfig(): CacheConfig {
    return {
      maxSize: 100,
      defaultTTL: 60000, // 1 minute
      cleanupInterval: 120000, // 2 minutes
      enableMetrics: false,
      enableCompression: false
    };
  }

  /**
   * Create cache instance with default configuration
   * @returns Cache instance
   */
  static createCache(): LRUCache {
    return new LRUCache(this.createDefaultConfig());
  }

  /**
   * Create cache instance with custom configuration
   * @param config - Cache configuration
   * @returns Cache instance
   */
  static createCacheWithConfig(config: CacheConfig): LRUCache {
    return new LRUCache(config);
  }

  /**
   * Create cache instance for testing
   * @returns Cache instance for testing
   */
  static createTestCache(): LRUCache {
    return new LRUCache({
      maxSize: 10,
      defaultTTL: 60000,
      cleanupInterval: 30000,
      enableMetrics: true,
      enableCompression: false
    });
  }
}

/**
 * Cache utilities for common operations
 */
export class CacheUtils {
  /**
   * Create cache key from file path
   * @param filePath - File path
   * @returns Cache key
   */
  static createKey(filePath: string): string {
    // Normalize path and use as key
    return filePath.replace(/[\\/]/g, ':');
  }

  /**
   * Generate cache key from file metadata
   * @param fileInfo - File information
   * @returns Cache key
   */
  static generateKey(fileInfo: TypeSpecFileInfo): string {
    // Use combination of path and last modified time for uniqueness
    return this.createKey(`${fileInfo.filePath}:${fileInfo.lastModified.getTime()}`);
  }

  /**
   * Parse cache key to extract metadata
   * @param key - Cache key
   * @returns Parsed key metadata
   */
  static parseKey(key: string): {
    const [filePath, timestamp] = key.split(':');
    return {
      filePath,
      timestamp: parseInt(timestamp),
      isVolatile: false
    };
  }

  /**
   * Check if key is volatile (based on timestamp)
   * @param key - Cache key
   * @return boolean
   */
  static isKeyVolatile(key: string): boolean {
    const parsed = this.parseKey(key);
    const now = Date.now();
    const isVolatile = (now - parsed.timestamp) < 60000; // 1 minute
    return isVolatile;
  }

  /**
   * Format cache metrics for display
   * @param metrics - Cache metrics
   * @returns Formatted string
   */
  static formatMetrics(metrics: CacheMetrics): string {
    return `Cache Metrics:
  - Requests: ${metrics.totalRequests}
  - Hits: ${metrics.cacheHits} (${metrics.hitRate.toFixed(2)}%)
  - Misses: ${metrics.cacheMisses}
  - Size: ${metrics.totalSize} entries (${(metrics.memoryUsage / 1024).toFixed(2)}KB)
  - Evictions: ${metrics.evictionCount}
  - Avg Lookup: ${metrics.averageLookupTime.toFixed(2)}ms`;
  }

  /**
   * Validate cache configuration
   * @param config - Cache configuration
   *returns Promise resolving to validation result
   */
  static validateConfig(config: CacheConfig): Effect.Effect<boolean, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔍 Validating cache configuration`);

      if (config.maxSize <= 0) {
        throw new Error(`Invalid max size: ${config.maxSize} must be > 0`);
      }

      if (config.defaultTTL <= 0) {
        throw new Error(`Invalid default TTL: ${config.defaultTTL} must be > 0`);
      }

      if (config.cleanupInterval <= 0) {
        throw new Error(`Invalid cleanup interval: ${config.cleanupInterval} must be > 0`);
      }

      yield* Effect.log(`✅ Cache configuration validated: maxSize=${config.maxSize}, TTL=${config.defaultTTL}ms`);
      return true;
    });
  }

  /**
   * Estimate memory usage for cache
   * @param size - Cache size
   * @returns Estimated memory usage in bytes
   */
  static estimateMemoryUsage(size: number): number {
    // Estimate based on average entry size
    const averageEntrySize = 512; // bytes
    const mapOverhead = size * 24;
    const accessOrderOverhead = size * 8;
    const entryData = size * averageEntrySize;

    return mapOverhead + accessOrderOverhead + entryData;
  }
}

/**
 * Cache error classes for different error types
 */
export class CacheError extends Error {
  constructor(
    public readonly type: "CACHE_ERROR" | "MEMORY_ERROR" | "METRICS_ERROR",
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
  }
}

/**
 * Memory error for cache operations
 */
export class CacheMemoryError extends CacheError {
  constructor(message: string, context?: Record<string, unknown>) {
    super("MEMORY_ERROR", message, context);
  }
}

/**
 * Metrics error for cache operations
 */
export class CacheMetricsError extends CacheError {
  constructor(message: string, context?: Record<string, unknown>) {
    super("METRICS_ERROR", message, context);
  }
}

export {
  Effect,
  LRUCache,
  CacheFactory,
  CacheUtils,
  CacheError,
  CacheMemoryError,
  CacheMetricsError
};