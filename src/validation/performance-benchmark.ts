/**
 * Performance Benchmark Suite for AsyncAPI Validation
 * 
 * Provides comprehensive performance testing and benchmarking
 * for AsyncAPI validation operations with enterprise-scale testing.
 */

import { AsyncAPIValidator } from "./asyncapi-validator.js";
import type { AsyncAPIDocument } from "../types/asyncapi.js";

export interface BenchmarkResult {
  /** Benchmark name */
  name: string;
  /** Total operations performed */
  operations: number;
  /** Total duration in milliseconds */
  totalDuration: number;
  /** Average duration per operation */
  avgDuration: number;
  /** Minimum duration */
  minDuration: number;
  /** Maximum duration */
  maxDuration: number;
  /** Operations per second */
  opsPerSecond: number;
  /** Memory usage (if available) */
  memoryUsage?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  /** Document statistics */
  documentStats: {
    avgChannels: number;
    avgOperations: number;
    avgSchemas: number;
    avgDocumentSize: number;
  };
}

export interface BenchmarkOptions {
  /** Number of iterations per test */
  iterations?: number;
  /** Number of warmup iterations */
  warmupIterations?: number;
  /** Enable memory profiling */
  profileMemory?: boolean;
  /** Enable detailed timing */
  detailedTiming?: boolean;
  /** Document size variants */
  documentSizes?: ("small" | "medium" | "large" | "enterprise")[];
}

/**
 * Performance benchmark runner for AsyncAPI validation
 */
export class PerformanceBenchmark {
  private validator: AsyncAPIValidator;
  private results: BenchmarkResult[] = [];

  constructor(private options: BenchmarkOptions = {}) {
    this.validator = new AsyncAPIValidator({
      enableCache: false, // Disable cache for accurate benchmarking
      benchmarking: true,
      strict: true,
    });
  }

  /**
   * Run comprehensive performance benchmark suite
   */
  async runBenchmarkSuite(): Promise<BenchmarkResult[]> {
    console.log("🏁 Starting AsyncAPI Validation Performance Benchmark Suite");
    
    await this.validator.initialize();
    
    // Run benchmarks for different document sizes
    const sizes = this.options.documentSizes || ["small", "medium", "large"];
    
    for (const size of sizes) {
      await this.benchmarkDocumentSize(size);
    }

    // Run specialized benchmarks
    await this.benchmarkCachePerformance();
    await this.benchmarkBatchValidation();
    await this.benchmarkErrorHandling();

    this.generateReport();
    return this.results;
  }

  /**
   * Benchmark validation performance for specific document size
   */
  async benchmarkDocumentSize(size: "small" | "medium" | "large" | "enterprise"): Promise<void> {
    const documents = this.generateDocuments(size);
    const iterations = this.options.iterations || 100;
    const warmupIterations = this.options.warmupIterations || 10;

    console.log(`📊 Benchmarking ${size} documents (${documents.length} variants, ${iterations} iterations each)`);

    // Warmup
    for (let i = 0; i < warmupIterations; i++) {
      for (const doc of documents) {
        await this.validator.validate(doc.document);
      }
    }

    // Actual benchmark
    const durations: number[] = [];
    const stats = {
      totalChannels: 0,
      totalOperations: 0,
      totalSchemas: 0,
      totalDocumentSize: 0,
    };

    let memoryBefore: NodeJS.MemoryUsage | undefined;
    if (this.options.profileMemory && typeof process !== "undefined") {
      memoryBefore = process.memoryUsage();
    }

    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      for (const doc of documents) {
        const iterationStart = performance.now();
        const result = await this.validator.validate(doc.document);
        const iterationDuration = performance.now() - iterationStart;
        
        durations.push(iterationDuration);
        
        // Accumulate stats
        stats.totalChannels += result.metrics.channelCount;
        stats.totalOperations += result.metrics.operationCount;
        stats.totalSchemas += result.metrics.schemaCount;
        stats.totalDocumentSize += result.metrics.documentSize;
      }
    }

    const totalDuration = performance.now() - startTime;
    const totalOperations = iterations * documents.length;

    let memoryUsage: BenchmarkResult["memoryUsage"];
    if (memoryBefore && typeof process !== "undefined") {
      const memoryAfter = process.memoryUsage();
      memoryUsage = {
        heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
        heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
        external: memoryAfter.external - memoryBefore.external,
      };
    }

    const result: BenchmarkResult = {
      name: `validation-${size}-documents`,
      operations: totalOperations,
      totalDuration,
      avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      opsPerSecond: totalOperations / (totalDuration / 1000),
      memoryUsage,
      documentStats: {
        avgChannels: stats.totalChannels / totalOperations,
        avgOperations: stats.totalOperations / totalOperations,
        avgSchemas: stats.totalSchemas / totalOperations,
        avgDocumentSize: stats.totalDocumentSize / totalOperations,
      },
    };

    this.results.push(result);
    console.log(`   ✅ ${size}: ${result.opsPerSecond.toFixed(2)} ops/sec, ${result.avgDuration.toFixed(2)}ms avg`);
  }

  /**
   * Benchmark cache performance impact
   */
  async benchmarkCachePerformance(): Promise<void> {
    console.log("🗄️ Benchmarking cache performance");

    const document = this.generateDocuments("medium")[0].document;
    const iterations = this.options.iterations || 1000;

    // Without cache
    const noCacheValidator = new AsyncAPIValidator({ enableCache: false });
    await noCacheValidator.initialize();

    const noCacheStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      await noCacheValidator.validate(document);
    }
    const noCacheDuration = performance.now() - noCacheStart;

    // With cache
    const cacheValidator = new AsyncAPIValidator({ enableCache: true });
    await cacheValidator.initialize();

    const cacheStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      await cacheValidator.validate(document, "cache-test");
    }
    const cacheDuration = performance.now() - cacheStart;

    // Results
    this.results.push({
      name: "validation-no-cache",
      operations: iterations,
      totalDuration: noCacheDuration,
      avgDuration: noCacheDuration / iterations,
      minDuration: 0,
      maxDuration: 0,
      opsPerSecond: iterations / (noCacheDuration / 1000),
      documentStats: {
        avgChannels: 0,
        avgOperations: 0,
        avgSchemas: 0,
        avgDocumentSize: 0,
      },
    });

    this.results.push({
      name: "validation-with-cache",
      operations: iterations,
      totalDuration: cacheDuration,
      avgDuration: cacheDuration / iterations,
      minDuration: 0,
      maxDuration: 0,
      opsPerSecond: iterations / (cacheDuration / 1000),
      documentStats: {
        avgChannels: 0,
        avgOperations: 0,
        avgSchemas: 0,
        avgDocumentSize: 0,
      },
    });

    const speedup = noCacheDuration / cacheDuration;
    console.log(`   ✅ Cache speedup: ${speedup.toFixed(2)}x faster`);
  }

  /**
   * Benchmark batch validation performance
   */
  async benchmarkBatchValidation(): Promise<void> {
    console.log("📦 Benchmarking batch validation");

    const documents = this.generateDocuments("medium").map((doc, i) => ({
      document: doc.document,
      name: `batch-doc-${i}`,
    }));

    const batchStart = performance.now();
    const results = await this.validator.validateBatch(documents);
    const batchDuration = performance.now() - batchStart;

    this.results.push({
      name: "validation-batch",
      operations: documents.length,
      totalDuration: batchDuration,
      avgDuration: batchDuration / documents.length,
      minDuration: 0,
      maxDuration: 0,
      opsPerSecond: documents.length / (batchDuration / 1000),
      documentStats: {
        avgChannels: 0,
        avgOperations: 0,
        avgSchemas: 0,
        avgDocumentSize: 0,
      },
    });

    console.log(`   ✅ Batch: ${(documents.length / (batchDuration / 1000)).toFixed(2)} docs/sec`);
  }

  /**
   * Benchmark error handling performance
   */
  async benchmarkErrorHandling(): Promise<void> {
    console.log("⚠️ Benchmarking error handling");

    const invalidDocuments = this.generateInvalidDocuments();
    const iterations = this.options.iterations || 100;

    const durations: number[] = [];
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      for (const doc of invalidDocuments) {
        const iterationStart = performance.now();
        await this.validator.validate(doc.document);
        const iterationDuration = performance.now() - iterationStart;
        durations.push(iterationDuration);
      }
    }

    const totalDuration = performance.now() - startTime;
    const totalOperations = iterations * invalidDocuments.length;

    this.results.push({
      name: "validation-error-handling",
      operations: totalOperations,
      totalDuration,
      avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      opsPerSecond: totalOperations / (totalDuration / 1000),
      documentStats: {
        avgChannels: 0,
        avgOperations: 0,
        avgSchemas: 0,
        avgDocumentSize: 0,
      },
    });

    console.log(`   ✅ Error handling: ${(totalOperations / (totalDuration / 1000)).toFixed(2)} ops/sec`);
  }

  /**
   * Generate test documents of different sizes
   */
  private generateDocuments(size: "small" | "medium" | "large" | "enterprise"): Array<{ document: AsyncAPIDocument; name: string }> {
    const configs = {
      small: { channels: 5, operations: 5, schemas: 5 },
      medium: { channels: 25, operations: 25, schemas: 25 },
      large: { channels: 100, operations: 100, schemas: 100 },
      enterprise: { channels: 500, operations: 500, schemas: 500 },
    };

    const config = configs[size];
    const documents: Array<{ document: AsyncAPIDocument; name: string }> = [];

    // Generate multiple variants for better statistical sampling
    const variants = size === "enterprise" ? 2 : 5;

    for (let variant = 0; variant < variants; variant++) {
      const document: AsyncAPIDocument = {
        asyncapi: "3.0.0",
        info: {
          title: `${size} Benchmark API v${variant}`,
          version: "1.0.0",
          description: `Generated ${size} document for benchmarking`,
        },
        channels: {},
        operations: {},
        components: {
          schemas: {},
        },
      };

      // Generate channels
      for (let i = 0; i < config.channels; i++) {
        const channelName = `channel_${variant}_${i}`;
        document.channels![channelName] = {
          address: `/${size}/events/${i}`,
          description: `Generated channel ${i}`,
          messages: {
            [`message_${i}`]: {
              payload: {
                $ref: `#/components/schemas/Schema_${i}`,
              },
            },
          },
        };
      }

      // Generate operations
      for (let i = 0; i < config.operations; i++) {
        const operationName = `operation_${variant}_${i}`;
        const channelRef = `channel_${variant}_${i % config.channels}`;
        document.operations![operationName] = {
          action: i % 2 === 0 ? "send" : "receive",
          channel: { $ref: `#/channels/${channelRef}` },
          description: `Generated operation ${i}`,
        };
      }

      // Generate schemas
      for (let i = 0; i < config.schemas; i++) {
        const schemaName = `Schema_${i}`;
        document.components.schemas![schemaName] = {
          type: "object",
          description: `Generated schema ${i}`,
          properties: {
            id: { type: "string", description: "Identifier" },
            name: { type: "string", description: "Name" },
            timestamp: { type: "string", format: "date-time", description: "Timestamp" },
            data: {
              type: "object",
              properties: this.generateProperties(i % 10 + 1),
            },
          },
          required: ["id", "name", "timestamp"],
        };
      }

      documents.push({
        document,
        name: `${size}-variant-${variant}`,
      });
    }

    return documents;
  }

  /**
   * Generate properties for schema complexity
   */
  private generateProperties(count: number): Record<string, unknown> {
    const properties: Record<string, unknown> = {};
    
    for (let i = 0; i < count; i++) {
      properties[`property_${i}`] = {
        type: ["string", "number", "boolean"][i % 3],
        description: `Generated property ${i}`,
      };
    }

    return properties;
  }

  /**
   * Generate invalid documents for error handling benchmarks
   */
  private generateInvalidDocuments(): Array<{ document: unknown; name: string }> {
    return [
      {
        name: "missing-asyncapi-version",
        document: {
          info: { title: "Test", version: "1.0.0" },
          channels: {},
        },
      },
      {
        name: "invalid-operation-action",
        document: {
          asyncapi: "3.0.0",
          info: { title: "Test", version: "1.0.0" },
          channels: {
            test: { address: "test" },
          },
          operations: {
            test: {
              action: "invalid", // Should be "send" or "receive"
              channel: { $ref: "#/channels/test" },
            },
          },
        },
      },
      {
        name: "missing-required-info",
        document: {
          asyncapi: "3.0.0",
          channels: {},
        },
      },
    ];
  }

  /**
   * Generate comprehensive benchmark report
   */
  private generateReport(): void {
    console.log("\n📋 AsyncAPI Validation Performance Report");
    console.log("=" .repeat(60));

    const sortedResults = this.results.sort((a, b) => b.opsPerSecond - a.opsPerSecond);

    for (const result of sortedResults) {
      console.log(`\n${result.name}:`);
      console.log(`  Operations: ${result.operations}`);
      console.log(`  Avg Duration: ${result.avgDuration.toFixed(2)}ms`);
      console.log(`  Ops/Second: ${result.opsPerSecond.toFixed(2)}`);
      
      if (result.memoryUsage) {
        const heapMB = result.memoryUsage.heapUsed / (1024 * 1024);
        console.log(`  Memory: ${heapMB.toFixed(2)}MB heap`);
      }

      if (result.documentStats.avgDocumentSize > 0) {
        console.log(`  Doc Stats: ${result.documentStats.avgChannels.toFixed(1)} ch, ${result.documentStats.avgOperations.toFixed(1)} ops, ${result.documentStats.avgSchemas.toFixed(1)} schemas`);
      }
    }

    // Performance summary
    const fastest = sortedResults[0];
    const slowest = sortedResults[sortedResults.length - 1];
    
    console.log(`\n🏆 Performance Summary:`);
    console.log(`  Fastest: ${fastest.name} (${fastest.opsPerSecond.toFixed(2)} ops/sec)`);
    console.log(`  Slowest: ${slowest.name} (${slowest.opsPerSecond.toFixed(2)} ops/sec)`);
    console.log(`  Performance Ratio: ${(fastest.opsPerSecond / slowest.opsPerSecond).toFixed(2)}x`);
  }
}

/**
 * Run quick performance benchmark
 */
export async function runValidationBenchmark(options?: BenchmarkOptions): Promise<BenchmarkResult[]> {
  const benchmark = new PerformanceBenchmark(options);
  return benchmark.runBenchmarkSuite();
}

/**
 * Performance assertion helpers for tests
 */
export const PerformanceAssertions = {
  /**
   * Assert validation performance meets minimum threshold
   */
  assertPerformance: (result: BenchmarkResult, minOpsPerSecond: number): void => {
    if (result.opsPerSecond < minOpsPerSecond) {
      throw new Error(`Performance below threshold: ${result.opsPerSecond.toFixed(2)} ops/sec < ${minOpsPerSecond} ops/sec`);
    }
  },

  /**
   * Assert memory usage is within limits
   */
  assertMemoryUsage: (result: BenchmarkResult, maxHeapMB: number): void => {
    if (!result.memoryUsage) {
      throw new Error("Memory usage not tracked");
    }

    const heapMB = result.memoryUsage.heapUsed / (1024 * 1024);
    if (heapMB > maxHeapMB) {
      throw new Error(`Memory usage above limit: ${heapMB.toFixed(2)}MB > ${maxHeapMB}MB`);
    }
  },

  /**
   * Assert validation latency is within limits
   */
  assertLatency: (result: BenchmarkResult, maxAvgMs: number): void => {
    if (result.avgDuration > maxAvgMs) {
      throw new Error(`Average latency above limit: ${result.avgDuration.toFixed(2)}ms > ${maxAvgMs}ms`);
    }
  },
};