/**
 * Performance Benchmark Tests for AsyncAPI Validation
 * 
 * Tests performance characteristics of the AsyncAPI validation framework
 * to ensure it meets enterprise-scale requirements with proper benchmarking.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { 
  PerformanceBenchmark,
  runValidationBenchmark,
  PerformanceAssertions,
  type BenchmarkResult,
  type BenchmarkOptions
} from "../../src/validation/index";

describe("AsyncAPI Validation Performance Benchmarks", () => {
  describe("Quick Performance Tests", () => {
    it("should validate small documents efficiently", async () => {
      const options: BenchmarkOptions = {
        iterations: 50,
        warmupIterations: 5,
        documentSizes: ["small"],
        profileMemory: true,
      };

      const results = await runValidationBenchmark(options);
      const smallDocResult = results.find(r => r.name === "validation-small-documents");

      expect(smallDocResult).toBeDefined();
      expect(smallDocResult!.operations).toBe(250); // 50 iterations * 5 small document variants
      expect(smallDocResult!.opsPerSecond).toBeGreaterThan(100); // Should be much faster than this
      expect(smallDocResult!.avgDuration).toBeLessThan(100); // Should be under 100ms on average

      // Performance assertion
      PerformanceAssertions.assertPerformance(smallDocResult!, 50); // Min 50 ops/sec
      PerformanceAssertions.assertLatency(smallDocResult!, 50); // Max 50ms average
    });

    it("should handle medium-sized documents with good performance", async () => {
      const options: BenchmarkOptions = {
        iterations: 20,
        warmupIterations: 3,
        documentSizes: ["medium"],
        profileMemory: true,
      };

      const results = await runValidationBenchmark(options);
      const mediumDocResult = results.find(r => r.name === "validation-medium-documents");

      expect(mediumDocResult).toBeDefined();
      expect(mediumDocResult!.operations).toBe(100); // 20 iterations * 5 variants  
      expect(mediumDocResult!.opsPerSecond).toBeGreaterThan(10); // Should handle at least 10 ops/sec
      expect(mediumDocResult!.avgDuration).toBeLessThan(1000); // Should be under 1 second

      // Performance assertions
      PerformanceAssertions.assertPerformance(mediumDocResult!, 5); // Min 5 ops/sec
      PerformanceAssertions.assertLatency(mediumDocResult!, 200); // Max 200ms average
    });

    it("should demonstrate cache performance benefits", async () => {
      const options: BenchmarkOptions = {
        iterations: 100,
        warmupIterations: 10,
        documentSizes: ["small"],
      };

      const results = await runValidationBenchmark(options);
      
      const noCacheResult = results.find(r => r.name === "validation-no-cache");
      const withCacheResult = results.find(r => r.name === "validation-with-cache");

      expect(noCacheResult).toBeDefined();
      expect(withCacheResult).toBeDefined();

      // Cache should provide significant speedup
      const speedup = noCacheResult!.opsPerSecond / withCacheResult!.opsPerSecond;
      expect(speedup).toBeLessThan(1); // With cache should be faster (higher ops/sec)
      
      // Or check it the other way around
      const cacheSpeedup = withCacheResult!.opsPerSecond / noCacheResult!.opsPerSecond;
      expect(cacheSpeedup).toBeGreaterThan(1); // Should be at least some speedup
    });

    it("should handle error validation efficiently", async () => {
      const options: BenchmarkOptions = {
        iterations: 30,
        warmupIterations: 5,
        documentSizes: ["small"],
      };

      const results = await runValidationBenchmark(options);
      const errorResult = results.find(r => r.name === "validation-error-handling");

      expect(errorResult).toBeDefined();
      expect(errorResult!.opsPerSecond).toBeGreaterThan(20); // Should handle errors efficiently
      expect(errorResult!.avgDuration).toBeLessThan(100); // Error handling shouldn't be slow

      PerformanceAssertions.assertPerformance(errorResult!, 10); // Min 10 ops/sec for error handling
    });

    it("should handle batch validation efficiently", async () => {
      const options: BenchmarkOptions = {
        iterations: 10,
        documentSizes: ["medium"],
      };

      const results = await runValidationBenchmark(options);
      const batchResult = results.find(r => r.name === "validation-batch");

      expect(batchResult).toBeDefined();
      expect(batchResult!.opsPerSecond).toBeGreaterThan(1); // Should handle batches reasonably
      expect(batchResult!.operations).toBeGreaterThan(1); // Should process multiple documents
    });
  });

  describe("Memory Usage Tests", () => {
    it("should have reasonable memory usage for small documents", async () => {
      const options: BenchmarkOptions = {
        iterations: 100,
        warmupIterations: 10,
        documentSizes: ["small"],
        profileMemory: true,
      };

      const results = await runValidationBenchmark(options);
      const smallDocResult = results.find(r => r.name === "validation-small-documents");

      expect(smallDocResult).toBeDefined();
      expect(smallDocResult!.memoryUsage).toBeDefined();

      // Memory should be reasonable for small documents
      if (smallDocResult!.memoryUsage) {
        PerformanceAssertions.assertMemoryUsage(smallDocResult!, 50); // Max 50MB heap
      }
    });

    it("should scale memory usage appropriately with document size", async () => {
      const options: BenchmarkOptions = {
        iterations: 10,
        warmupIterations: 2,
        documentSizes: ["small", "medium"],
        profileMemory: true,
      };

      const results = await runValidationBenchmark(options);
      
      const smallResult = results.find(r => r.name === "validation-small-documents");
      const mediumResult = results.find(r => r.name === "validation-medium-documents");

      if (smallResult?.memoryUsage && mediumResult?.memoryUsage) {
        const smallHeap = smallResult.memoryUsage.heapUsed / (1024 * 1024);
        const mediumHeap = mediumResult.memoryUsage.heapUsed / (1024 * 1024);

        // Medium documents should use more memory than small ones, but not excessively
        expect(mediumHeap).toBeGreaterThanOrEqual(smallHeap);
        expect(mediumHeap).toBeLessThan(smallHeap * 10); // Shouldn't be 10x more memory
      }
    });
  });

  describe("Comprehensive Benchmark Suite", () => {
    // This test takes longer but provides comprehensive performance analysis
    it("should run comprehensive benchmark suite", async () => {
      const benchmark = new PerformanceBenchmark({
        iterations: 10, // Reduced for faster testing
        warmupIterations: 2,
        profileMemory: true,
        detailedTiming: true,
        documentSizes: ["small", "medium"],
      });

      const results = await benchmark.runBenchmarkSuite();

      expect(results.length).toBeGreaterThan(4); // Should have multiple benchmark results
      
      // All results should have reasonable performance
      for (const result of results) {
        expect(result.operations).toBeGreaterThan(0);
        expect(result.totalDuration).toBeGreaterThan(0);
        expect(result.avgDuration).toBeGreaterThan(0);
        expect(result.opsPerSecond).toBeGreaterThan(0);
        expect(result.minDuration).toBeGreaterThanOrEqual(0);
        expect(result.maxDuration).toBeGreaterThanOrEqual(result.minDuration);
      }

      // Find the fastest and slowest results
      const sortedResults = results.sort((a, b) => b.opsPerSecond - a.opsPerSecond);
      const fastest = sortedResults[0];
      const slowest = sortedResults[sortedResults.length - 1];

      expect(fastest.opsPerSecond).toBeGreaterThan(0);
      expect(slowest.opsPerSecond).toBeGreaterThan(0);
      expect(fastest.opsPerSecond).toBeGreaterThanOrEqual(slowest.opsPerSecond);
    });
  });

  describe("Performance Regression Detection", () => {
    it("should detect if validation performance degrades significantly", async () => {
      // This would be used in CI/CD to catch performance regressions
      const baselineResults = await runValidationBenchmark({
        iterations: 20,
        documentSizes: ["small"],
      });

      const smallDocBaseline = baselineResults.find(r => r.name === "validation-small-documents");
      expect(smallDocBaseline).toBeDefined();

      // In a real scenario, you'd compare against saved baseline metrics
      // Here we just ensure the current performance is reasonable
      const minimumAcceptableOpsPerSec = 25; // Adjust based on your requirements
      expect(smallDocBaseline!.opsPerSecond).toBeGreaterThan(minimumAcceptableOpsPerSec);
    });

    it("should maintain consistent performance across multiple runs", async () => {
      const run1 = await runValidationBenchmark({
        iterations: 15,
        documentSizes: ["small"],
      });

      const run2 = await runValidationBenchmark({
        iterations: 15,
        documentSizes: ["small"],
      });

      const result1 = run1.find(r => r.name === "validation-small-documents");
      const result2 = run2.find(r => r.name === "validation-small-documents");

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();

      // Performance should be relatively consistent (within 50% variance)
      const performanceRatio = result1!.opsPerSecond / result2!.opsPerSecond;
      expect(performanceRatio).toBeGreaterThan(0.5);
      expect(performanceRatio).toBeLessThan(2.0);
    });
  });

  describe("Stress Testing", () => {
    it("should handle high iteration counts without degrading", async () => {
      const highIterationResults = await runValidationBenchmark({
        iterations: 200, // High iteration count
        warmupIterations: 20,
        documentSizes: ["small"],
        profileMemory: true,
      });

      const result = highIterationResults.find(r => r.name === "validation-small-documents");
      expect(result).toBeDefined();

      // Should still maintain reasonable performance with high iteration counts
      expect(result!.opsPerSecond).toBeGreaterThan(20);
      expect(result!.avgDuration).toBeLessThan(100);

      // Memory usage shouldn't grow excessively
      if (result!.memoryUsage) {
        PerformanceAssertions.assertMemoryUsage(result!, 100); // Max 100MB for high iteration test
      }
    });

    // NOTE: This test is commented out as it would take a very long time
    // Uncomment for full enterprise-scale testing
    /*
    it("should handle enterprise-scale documents", async () => {
      const enterpriseResults = await runValidationBenchmark({
        iterations: 5, // Small iteration count due to document size
        warmupIterations: 1,
        documentSizes: ["enterprise"],
        profileMemory: true,
      });

      const result = enterpriseResults.find(r => r.name === "validation-enterprise-documents");
      expect(result).toBeDefined();

      // Even enterprise documents should validate in reasonable time
      expect(result!.avgDuration).toBeLessThan(5000); // Max 5 seconds per validation
      expect(result!.opsPerSecond).toBeGreaterThan(0.1); // At least 1 doc per 10 seconds

      // Memory usage will be higher but should be bounded
      if (result!.memoryUsage) {
        PerformanceAssertions.assertMemoryUsage(result!, 500); // Max 500MB for enterprise docs
      }
    });
    */
  });
});