/**
 * Performance Utilities - Shared performance measurement helpers
 *
 * Extracted from duplicated code in:
 * - MetricsCollector.ts
 * - ImmutableDocumentManager.ts
 */

/**
 * Get memory usage from browser Performance API
 *
 * Type-safe memory usage calculation with proper type guards
 * for browser-specific performance.memory API
 *
 * @returns Memory usage in MB, or 0 if API unavailable
 */
export function getMemoryUsageFromPerformance(): number {
  // Type-safe memory usage calculation
  if (typeof performance !== "undefined") {
    // Browser performance API
    const perf = performance as unknown;
    if (typeof perf === "object" && perf !== null) {
      // Check for memory API in browser
      const memoryAPI = (perf as Record<string, unknown>).memory;
      if (typeof memoryAPI === "object" && memoryAPI !== null) {
        const usedJSHeapSize = (memoryAPI as Record<string, unknown>)
          .usedJSHeapSize;
        if (typeof usedJSHeapSize === "number") {
          return usedJSHeapSize / 1024 / 1024; // Convert bytes to MB
        }
      }
    }
  }
  return 0;
}
