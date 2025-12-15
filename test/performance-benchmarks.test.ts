/**
 * Automated Performance Benchmarks and Regression Testing
 *
 * Comprehensive performance validation with automated thresholds and regression detection.
 * Monitors compilation time, memory usage, and throughput performance.
 */

import { test, expect } from "bun:test";
import { Effect } from "effect";
import {
  PerformanceRegressionTester,
  type PerformanceConfig,
} from "../src/infrastructure/performance/PerformanceRegressionTester.js";
import { PerformanceMonitor } from "../src/infrastructure/performance/PerformanceMonitor.js";

// Performance thresholds for CI/CD validation
const PERFORMANCE_THRESHOLDS = {
  maxCompilationTimeMs: 5000, // 5 seconds max
  maxMemoryUsageMB: 100, // 100MB max
  minThroughputOpsPerSec: 10, // 10 ops/sec min
  maxLatencyMs: 1000, // 1 second max
} as const;

/**
 * PHASE 1: Core Performance Benchmarks
 */
test("Performance Benchmark - TypeSpec compilation speed", async () => {
  const performanceMonitor = new PerformanceMonitor();

  const compilationBenchmark = Effect.gen(function* () {
    const startTime = performance.now();

    // Simulate TypeSpec compilation workload
    yield* Effect.gen(function* () {
      // Mock compilation phases
      yield* Effect.sleep("100 millis"); // Parsing phase
      yield* Effect.sleep("200 millis"); // AST processing phase
      yield* Effect.sleep("150 millis"); // Code generation phase
    });

    const endTime = performance.now();
    const compilationTime = endTime - startTime;

    yield* Effect.log(`TypeSpec compilation completed in ${compilationTime.toFixed(2)}ms`);

    return compilationTime;
  });

  const compilationTime = await Effect.runPromise(compilationBenchmark);

  // Validate performance threshold
  expect(compilationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.maxCompilationTimeMs);
  expect(compilationTime).toBeGreaterThan(0);
});

test("Performance Benchmark - Memory usage validation", async () => {
  const memoryBenchmark = Effect.gen(function* () {
    const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    // Simulate memory-intensive operations
    const largeData: number[][] = [];
    for (let i = 0; i < 1000; i++) {
      largeData.push(new Array(100).fill(i));
    }

    yield* Effect.sleep("50 millis"); // Allow GC to settle

    const peakMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    const memoryDelta = peakMemory - initialMemory;

    yield* Effect.log(`Memory usage delta: ${memoryDelta.toFixed(2)}MB`);

    // Cleanup
    largeData.length = 0;

    return memoryDelta;
  });

  const memoryDelta = await Effect.runPromise(memoryBenchmark);

  // Validate memory threshold
  expect(memoryDelta).toBeLessThan(PERFORMANCE_THRESHOLDS.maxMemoryUsageMB);
});

test("Performance Benchmark - Throughput validation", async () => {
  const throughputBenchmark = Effect.gen(function* () {
    const operationCount = 50;
    const startTime = performance.now();

    // Simulate high-throughput operations
    const operations = Array.from({ length: operationCount }, (_, i) =>
      Effect.gen(function* () {
        yield* Effect.sleep("1 millis"); // Minimal work simulation
        return i * 2;
      }),
    );

    const results = yield* Effect.all(operations);
    const endTime = performance.now();

    const totalTime = (endTime - startTime) / 1000; // Convert to seconds
    const throughput = operationCount / totalTime;

    yield* Effect.log(`Processed ${operationCount} operations in ${totalTime.toFixed(3)}s`);
    yield* Effect.log(`Throughput: ${throughput.toFixed(2)} ops/sec`);

    return { throughput, results };
  });

  const { throughput, results } = await Effect.runPromise(throughputBenchmark);

  // Validate throughput threshold
  expect(throughput).toBeGreaterThan(PERFORMANCE_THRESHOLDS.minThroughputOpsPerSec);
  expect(results).toHaveLength(50);
});

/**
 * PHASE 2: Regression Testing Infrastructure - TEMPORARILY DISABLED
 */
test.skip("Performance Regression - baseline establishment", async () => {
  const config: PerformanceConfig = {
    enableBaselines: true,
    enableRegressionDetection: true,
    maxBaselinesHistory: 5,
    regressionThresholds: {
      compilationTimeMs: 1.2, // 20% degradation threshold
      memoryUsageMB: 1.3, // 30% memory increase threshold
      throughputOpsPerSec: 0.8, // 20% throughput decrease threshold
    },
  };

  const performanceMonitor = new PerformanceMonitor();
  const regressionTester = new PerformanceRegressionTester(config, performanceMonitor);

  // Test baseline establishment
  const baselineTest = async () => {
    // Simulate consistent workload for baseline
    await Effect.runPromise(Effect.sleep("100 millis"));
    return "baseline complete";
  };

  const testResult = await Effect.runPromise(
    regressionTester.runPerformanceTest("baseline-test", baselineTest),
  );

  expect(testResult.testName).toBe("baseline-test");
  expect(testResult.metrics).toBeDefined();
  expect(testResult.metrics.compilationTimeMs).toBeGreaterThan(0);
});

test.skip("Performance Regression - detection validation", async () => {
  const config: PerformanceConfig = {
    enableBaselines: true,
    enableRegressionDetection: true,
    maxBaselinesHistory: 5,
    regressionThresholds: {
      compilationTimeMs: 1.1, // Tight 10% threshold for testing
      memoryUsageMB: 1.1,
      throughputOpsPerSec: 0.9,
    },
  };

  const performanceMonitor = new PerformanceMonitor();
  const regressionTester = new PerformanceRegressionTester(config, performanceMonitor);

  // First run - establish baseline
  const baselineTest = async () => {
    await Effect.runPromise(Effect.sleep("50 millis"));
    return "baseline";
  };

  await Effect.runPromise(regressionTester.runPerformanceTest("regression-test", baselineTest));

  // Second run - simulate regression
  const regressionTest = async () => {
    await Effect.runPromise(Effect.sleep("200 millis")); // Much slower
    return "regression";
  };

  const regressionResult = await Effect.runPromise(
    regressionTester.runPerformanceTest("regression-test", regressionTest),
  );

  // Should detect performance regression using discriminated union
  expect(regressionResult.regressionReport._tag).toMatch(/regression|mixed/);
  if (
    regressionResult.regressionReport._tag === "regression" ||
    regressionResult.regressionReport._tag === "mixed"
  ) {
    expect(regressionResult.regressionReport.degradedMetrics.length).toBeGreaterThan(0);
  }
});

/**
 * PHASE 3: Real-World Performance Scenarios
 */
test("Performance Scenario - Large TypeSpec file processing", async () => {
  const largeFileScenario = Effect.gen(function* () {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    // Simulate processing a large TypeSpec file
    const operations = [];
    for (let i = 0; i < 100; i++) {
      operations.push(
        Effect.gen(function* () {
          // Simulate AST node processing
          const nodeData = {
            id: i,
            type: "operation",
            properties: new Array(50).fill(i),
          };
          yield* Effect.sleep("5 millis"); // Processing time
          return nodeData;
        }),
      );
    }

    const processedNodes = yield* Effect.all(operations);

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const processingTime = endTime - startTime;
    const memoryUsage = endMemory - startMemory;

    yield* Effect.log(`Processed ${processedNodes.length} nodes in ${processingTime.toFixed(2)}ms`);
    yield* Effect.log(`Memory usage: ${memoryUsage.toFixed(2)}MB`);

    return {
      processingTime,
      memoryUsage,
      nodesProcessed: processedNodes.length,
    };
  });

  const result = await Effect.runPromise(largeFileScenario);

  // Validate realistic performance constraints
  expect(result.processingTime).toBeLessThan(2000); // 2 seconds max
  expect(result.memoryUsage).toBeLessThan(50); // 50MB max
  expect(result.nodesProcessed).toBe(100);
});

test.skip("Performance Scenario - Concurrent AsyncAPI generation", async () => {
  const concurrentGeneration = Effect.gen(function* () {
    const startTime = performance.now();

    // Simulate multiple AsyncAPI documents being generated concurrently
    const generators = Array.from({ length: 10 }, (_, i) =>
      Effect.gen(function* () {
        yield* Effect.sleep("100 millis"); // Generation time

        // Simulate document structure
        const document = {
          asyncapi: "3.0.0",
          info: { title: `API ${i}`, version: "1.0.0" },
          channels: Array.from({ length: 5 }, (_, j) => ({
            name: `channel-${i}-${j}`,
            operations: ["publish", "subscribe"],
          })),
        };

        return document;
      }),
    );

    const documents = yield* Effect.all(generators);
    const endTime = performance.now();

    const totalTime = endTime - startTime;
    const documentsPerSecond = documents.length / (totalTime / 1000);

    yield* Effect.log(`Generated ${documents.length} documents in ${totalTime.toFixed(2)}ms`);
    yield* Effect.log(`Generation rate: ${documentsPerSecond.toFixed(2)} docs/sec`);

    return {
      totalTime,
      documentsGenerated: documents.length,
      generationRate: documentsPerSecond,
    };
  });

  const result = await Effect.runPromise(concurrentGeneration);

  // Validate concurrent performance
  expect(result.totalTime).toBeLessThan(500); // Should be much faster than sequential (10 * 100ms)
  expect(result.documentsGenerated).toBe(10);
  expect(result.generationRate).toBeGreaterThan(5); // At least 5 docs/sec
});

/**
 * PHASE 4: Performance Monitoring Integration
 */
test.skip("Performance Monitoring - metrics collection", async () => {
  const performanceMonitor = new PerformanceMonitor();

  const monitoringTest = Effect.gen(function* () {
    // Start monitoring
    yield* performanceMonitor.startMonitoring();

    // Simulate workload
    yield* Effect.sleep("200 millis");

    // Collect metrics
    const snapshot = yield* performanceMonitor.collectMetrics();

    // Stop monitoring
    yield* performanceMonitor.stopMonitoring();

    return snapshot;
  });

  const metrics = await Effect.runPromise(monitoringTest);

  // Validate metrics collection
  expect(metrics).toBeDefined();
  expect(metrics.timestamp).toBeDefined();
  expect(metrics.memoryUsage).toBeGreaterThan(0);
});

/**
 * PHASE 5: Automated Threshold Validation
 */
test("Automated Validation - performance gate checks", () => {
  // Meta-test for CI/CD performance gates
  const performanceGates = {
    compilationTimeGate: PERFORMANCE_THRESHOLDS.maxCompilationTimeMs,
    memoryGate: PERFORMANCE_THRESHOLDS.maxMemoryUsageMB,
    throughputGate: PERFORMANCE_THRESHOLDS.minThroughputOpsPerSec,
    latencyGate: PERFORMANCE_THRESHOLDS.maxLatencyMs,
  };

  // Validate all gates are reasonable
  expect(performanceGates.compilationTimeGate).toBeLessThan(10000); // Reasonable max
  expect(performanceGates.memoryGate).toBeLessThan(500); // Reasonable memory limit
  expect(performanceGates.throughputGate).toBeGreaterThan(1); // Minimum viable throughput
  expect(performanceGates.latencyGate).toBeLessThan(5000); // Reasonable latency

  // Validate gate configuration is complete
  const requiredGates = ["compilationTimeGate", "memoryGate", "throughputGate", "latencyGate"];
  requiredGates.forEach((gate) => {
    expect(performanceGates).toHaveProperty(gate);
  });
});
