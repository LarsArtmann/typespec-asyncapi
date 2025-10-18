import { Effect, Layer, Context, Ref, Option } from 'effect';
import type { CacheConfig, CacheMetrics, TypeSpecFileInfo } from './types.js';

// Define the cache state interface
interface DiscoveryCacheState {
  cache: Map<string, CacheEntry>;
  accessOrder: string[];
  config: CacheConfig;
  metrics: CacheMetrics;
}

// Define cache entry interface
interface CacheEntry {
  data: TypeSpecFileInfo;
  timestamp: number;
  TTL: number;
  accessCount: number;
  size: number;
}

// Define the service tag
export class DiscoveryCache extends Context.Tag('DiscoveryCache')<
  DiscoveryCache,
  {
    readonly has: (key: string) => Effect.Effect<boolean, Error>;
    readonly get: (key: string) => Effect.Effect<Option<TypeSpecFileInfo>, Error>;
    readonly set: (key: string, data: TypeSpecFileInfo, options?: { TTL?: number }) => Effect.Effect<void, Error>;
    readonly delete: (key: string) => Effect.Effect<boolean, Error>;
    readonly clear: () => Effect.Effect<void, Error>;
    readonly size: () => Effect.Effect<number, Error>;
    readonly getMetrics: () => Effect.Effect<CacheMetrics, Error>;
    readonly cleanup: () => Effect.Effect<number, Error>;
    readonly getMemoryUsage: () => Effect.Effect<number, Error>;
    readonly destroy: () => Effect.Effect<void, Error>;
    readonly getPerformanceAnalysis: () => Effect.Effect<{
      efficiency: string;
      utilization: string;
      performance: string;
    }, Error>;
  }
>() {}

// Helper functions
const calculateSize = (data: TypeSpecFileInfo): number => {
  const jsonString = JSON.stringify(data);
  return new Blob([jsonString]).size;
};

const updateTotalSize = (state: DiscoveryCacheState): void => {
  let totalSize = 0;
  for (const entry of state.cache.values()) {
    totalSize += entry.size;
  }
  state.metrics.memoryUsage = totalSize;
};

const updateHitRate = (state: DiscoveryCacheState): void => {
  if (state.metrics.totalRequests > 0) {
    state.metrics.hitRate = state.metrics.cacheHits / state.metrics.totalRequests;
  }
};

const moveToFront = (state: DiscoveryCacheState, key: string): void => {
  const index = state.accessOrder.indexOf(key);
  if (index > -1) {
    state.accessOrder.splice(index, 1);
    state.accessOrder.unshift(key);
  }
};

const removeAccessOrder = (state: DiscoveryCacheState, key: string): void => {
  const index = state.accessOrder.indexOf(key);
  if (index > -1) {
    state.accessOrder.splice(index, 1);
  }
};

const evictOldest = (state: DiscoveryCacheState): Effect.Effect<void, Error> =>
  Effect.sync(() => {
    while (state.cache.size >= state.config.maxSize && state.accessOrder.length > 0) {
      const oldestKey = state.accessOrder[state.accessOrder.length - 1];
      state.cache.delete(oldestKey);
      removeAccessOrder(state, oldestKey);
      state.metrics.evictions++;
    }
  });

// Create the live layer implementation
export const DiscoveryCacheLive = Layer.effect(
  DiscoveryCache,
  Effect.gen(function*() {
    // Initialize the state
    const config: CacheConfig = {
      maxSize: 100,
      defaultTTL: 300000, // 5 minutes
      enableMetrics: true,
      enableCompression: false,
      enableBackgroundCleanup: false,
    };

    const initialState: DiscoveryCacheState = {
      cache: new Map(),
      accessOrder: [],
      config,
      metrics: {
        totalRequests: 0,
        cacheHits: 0,
        cacheMisses: 0,
        evictions: 0,
        memoryUsage: 0,
        hitRate: 0,
        lastAccessTime: Date.now(),
        cleanupCount: 0,
      },
    };

    const stateRef = yield* Ref.make(initialState);

    // Service implementation
    const service = DiscoveryCache.of({
      has: (key: string) =>
        Effect.gen(function*() {
          const state = yield* Ref.get(stateRef);
          const entry = state.cache.get(key);

          if (!entry) {
            return false;
          }

          // Check TTL
          if (Date.now() - entry.timestamp > entry.TTL) {
            yield* Effect.sync(() => {
              state.cache.delete(key);
              removeAccessOrder(state, key);
            });
            return false;
          }

          return true;
        }),

      get: (key: string) =>
        Effect.gen(function*() {
          const state = yield* Ref.get(stateRef);
          const entry = state.cache.get(key);

          if (!entry) {
            state.metrics.totalRequests++;
            state.metrics.cacheMisses++;
            updateHitRate(state);
            yield* Effect.log(`💔 Cache miss for ${key}`);
            return Option.none();
          }

          // Check TTL
          if (Date.now() - entry.timestamp > entry.TTL) {
            yield* Effect.sync(() => {
              state.cache.delete(key);
              removeAccessOrder(state, key);
            });
            state.metrics.totalRequests++;
            state.metrics.cacheMisses++;
            updateHitRate(state);
            yield* Effect.log(`⏰ Cache expired for ${key}`);
            return Option.none();
          }

          // Update access tracking
          yield* Effect.sync(() => {
            entry.accessCount++;
            entry.timestamp = Date.now();
            moveToFront(state, key);
            state.metrics.totalRequests++;
            state.metrics.cacheHits++;
            updateHitRate(state);
            state.metrics.lastAccessTime = Date.now();
          });

          yield* Effect.log(`✅ Cache hit for ${key} (accessed ${entry.accessCount} times)`);
          return Option.some(entry.data);
        }),

      set: (key: string, data: TypeSpecFileInfo, options?: { TTL?: number }) =>
        Effect.gen(function*() {
          const state = yield* Ref.get(stateRef);
          const size = calculateSize(data);
          const TTL = options?.TTL || state.config.defaultTTL;

          // Evict if necessary
          yield* evictOldest(state);

          // Add or update entry
          const entry: CacheEntry = {
            data,
            timestamp: Date.now(),
            TTL,
            accessCount: 1,
            size,
          };

          yield* Effect.sync(() => {
            state.cache.set(key, entry);
            moveToFront(state, key);
            updateTotalSize(state);
          });

          yield* Effect.log(`💾 Cached ${key} (size: ${size} bytes, TTL: ${TTL}ms)`);
        }),

      delete: (key: string) =>
        Effect.gen(function*() {
          const state = yield* Ref.get(stateRef);
          const existed = state.cache.has(key);

          if (existed) {
            yield* Effect.sync(() => {
              state.cache.delete(key);
              removeAccessOrder(state, key);
              updateTotalSize(state);
            });
            yield* Effect.log(`🗑️ Removed ${key} from cache`);
          }

          return existed;
        }),

      clear: () =>
        Effect.gen(function*() {
          yield* Effect.sync(() => {
            const state = stateRef.current;
            state.cache.clear();
            state.accessOrder = [];
            updateTotalSize(state);
            state.metrics.totalRequests++;
            state.metrics.cacheMisses++;
            state.metrics.cacheHits = 0;
            updateHitRate(state);
          });

          yield* Effect.log(`🗑️ Cache cleared`);
        }),

      size: () =>
        Effect.gen(function*() {
          const state = yield* Ref.get(stateRef);
          yield* Effect.log(`📊 Cache size: ${state.cache.size}`);
          return state.cache.size;
        }),

      getMetrics: () =>
        Effect.gen(function*() {
          const state = yield* Ref.get(stateRef);
          const metrics = { ...state.metrics };
          metrics.hitRate = state.metrics.totalRequests > 0 
            ? state.metrics.cacheHits / state.metrics.totalRequests 
            : 0;
          return metrics;
        }),

      cleanup: () =>
        Effect.gen(function*() {
          const state = yield* Ref.get(stateRef);
          let cleanedCount = 0;
          const now = Date.now();

          yield* Effect.forEach(Array.from(state.cache.keys()), (key) =>
            Effect.gen(function*() {
              const entry = state.cache.get(key);
              if (entry && now - entry.timestamp > entry.TTL) {
                state.cache.delete(key);
                removeAccessOrder(state, key);
                cleanedCount++;
              }
            })
          );

          if (cleanedCount > 0) {
            yield* Effect.sync(() => {
              updateTotalSize(state);
              state.metrics.cleanupCount++;
            });
            yield* Effect.log(`🧹 Cleaned ${cleanedCount} expired entries`);
          }

          return cleanedCount;
        }),

      getMemoryUsage: () =>
        Effect.gen(function*() {
          const state = yield* Ref.get(stateRef);
          let totalSize = 0;
          let entries = 0;

          yield* Effect.forEach(Array.from(state.cache.values()), (entry) =>
            Effect.sync(() => {
              totalSize += entry.size;
              entries++;
            })
          );

          const overhead = state.accessOrder.length * 8;
          const metadataSize = JSON.stringify(state.metrics).length;
          const totalMemory = totalSize + overhead + metadataSize;

          yield* Effect.log(
            `💾 Memory usage: ${totalMemory} bytes (${entries} entries + ${overhead} bytes overhead + ${metadataSize} bytes metadata)`
          );

          return totalMemory;
        }),

      destroy: () =>
        Effect.gen(function*() {
          const state = yield* Ref.get(stateRef);
          const size = state.cache.size;

          yield* Effect.sync(() => {
            state.cache.clear();
            state.accessOrder = [];
            state.metrics = {
              totalRequests: 0,
              cacheHits: 0,
              cacheMisses: 0,
              evictions: 0,
              memoryUsage: 0,
              hitRate: 0,
              lastAccessTime: Date.now(),
              cleanupCount: 0,
            };
          });

          yield* Effect.log(`💥 Cache destroyed (${size} entries cleared)`);
        }),

      getPerformanceAnalysis: () =>
        Effect.gen(function*() {
          const state = yield* Ref.get(stateRef);
          const metrics = { ...state.metrics };
          const hitRate = metrics.totalRequests > 0 
            ? metrics.cacheHits / metrics.totalRequests 
            : 0;

          const efficiency = hitRate > 0.8 
            ? 'excellent' 
            : hitRate > 0.6 
              ? 'good' 
              : hitRate > 0.4 
                ? 'fair' 
                : 'poor';

          const utilization = metrics.memoryUsage > 0 
            ? ((metrics.memoryUsage / (1024 * 1024)) > 10 ? 'high' : 'normal') 
            : 'minimal';

          const performance = hitRate > 0.7 && utilization !== 'high' 
            ? 'optimal' 
            : hitRate > 0.5 
              ? 'acceptable' 
              : 'needs-improvement';

          return {
            efficiency,
            utilization,
            performance,
          };
        }),
    });

    return service;
  })
);

// Static helper functions (using the service)
export const DiscoveryService = {
  // Parse cache key
  parseCacheKey: (key: string): { filePath: string; timestamp: number } => {
    const [filePath, timestamp] = key.split(':');
    return {
      filePath,
      timestamp: parseInt(timestamp, 10),
    };
  },

  // Check if key is volatile
  isKeyVolatile: (key: string): boolean => {
    const parsed = DiscoveryService.parseCacheKey(key);
    const maxAge = 5 * 60 * 1000; // 5 minutes
    return Date.now() - parsed.timestamp > maxAge;
  },

  // Format metrics for display
  formatMetrics: (metrics: CacheMetrics): string => {
    const hitRate = (metrics.hitRate * 100).toFixed(1);
    const memoryMB = (metrics.memoryUsage / (1024 * 1024)).toFixed(2);
    
    return [
      `📊 Cache Performance Metrics:`,
      `  🎯 Hit Rate: ${hitRate}%`,
      `  📈 Total Requests: ${metrics.totalRequests}`,
      `  ✅ Hits: ${metrics.cacheHits}`,
      `  ❌ Misses: ${metrics.cacheMisses}`,
      `  💾 Memory Usage: ${memoryMB} MB`,
      `  🗑️ Evictions: ${metrics.evictions}`,
      `  🧹 Cleanups: ${metrics.cleanupCount}`,
      `  ⏰ Last Access: ${new Date(metrics.lastAccessTime).toISOString()}`,
    ].join('\n');
  },

  // Validate cache configuration
  validateConfig: (config: CacheConfig): Effect.Effect<boolean, Error> =>
    Effect.gen(function*() {
      if (config.maxSize <= 0) {
        return yield* Effect.fail(new Error('Cache maxSize must be greater than 0'));
      }

      if (config.defaultTTL <= 0) {
        return yield* Effect.fail(new Error('Cache defaultTTL must be greater than 0'));
      }

      if (config.maxSize > 10000) {
        return yield* Effect.fail(new Error('Cache maxSize too large (max: 10000)'));
      }

      return true;
    }),

  // Estimate memory usage
  estimateMemoryUsage: (size: number): number => {
    const avgEntrySize = 1024; // 1KB average
    const overheadBytes = 1024 * 10; // 10KB overhead
    return size * avgEntrySize + overheadBytes;
  },
};