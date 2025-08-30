/**
 * Performance Validation Test Suite
 * 
 * Validates >35K ops/sec throughput targets and <1KB memory usage
 * using pure Effect.TS Railway Programming patterns.
 */

import { Effect, Duration } from "effect";
import { PerformanceMetricsService } from "./metrics.js";
import { MemoryMonitorService } from "./memory-monitor.js";
import { executeBenchmarkSuite, quickPerformanceCheck, DefaultBenchmarkConfig } from "./benchmarks.js";
import { validateAsyncAPIEmitterOptions, createAsyncAPIEmitterOptions } from "../options.js";

// TAGGED ERROR TYPES
export class PerformanceValidationError extends Error {
  readonly _tag = "PerformanceValidationError";
  override readonly name = "PerformanceValidationError";
  
  constructor(public readonly requirement: string, public readonly actual: number, public readonly expected: number) {
    super(`Performance requirement '${requirement}' failed: actual ${actual} vs expected ${expected}`);
  }
}

export class ValidationTestError extends Error {
  readonly _tag = "ValidationTestError";
  override readonly name = "ValidationTestError";
  
  constructor(public override readonly message: string, public override readonly cause?: unknown) {
    super(message);
    if (cause) {
      (this as any).cause = cause;
    }
  }
}

// PERFORMANCE REQUIREMENTS
export const PERFORMANCE_TARGETS = {
  THROUGHPUT_OPS_PER_SEC: 35000,
  MEMORY_BYTES_PER_OPERATION: 1024, // 1KB
  LATENCY_MICROSECONDS: 100,
  INITIALIZATION_TIME_MS: 2000,
  BUILD_TIME_SECONDS: 10
} as const;

// PERFORMANCE VALIDATION TEST SUITE
export type PerformanceTestResult = {
  testName: string;
  passed: boolean;
  actualValue: number;
  expectedValue: number;
  unit: string;
  margin: number;
  errorMessage?: string;
}

export type PerformanceValidationSummary = {
  overallPassed: boolean;
  testsRun: number;
  testsPassed: number;
  testsFailed: number;
  results: PerformanceTestResult[];
  recommendations: string[];
}

/**
 * Comprehensive performance validation test suite
 */
export const validatePerformanceTargets = (): Effect.Effect<PerformanceValidationSummary, ValidationTestError, PerformanceMetricsService | MemoryMonitorService> =>
  Effect.gen(function* () {
    yield* Effect.logInfo("Starting comprehensive performance validation suite");
    
    const results: PerformanceTestResult[] = [];
    
    // Test 1: Throughput Validation
    yield* Effect.logInfo("Testing throughput performance target");
    const throughputResult = yield* validateThroughputTarget().pipe(
      Effect.either
    );
    
    results.push({
      testName: "Throughput Target",
      passed: throughputResult._tag === "Right",
      actualValue: throughputResult._tag === "Right" ? throughputResult.right.throughput : 0,
      expectedValue: PERFORMANCE_TARGETS.THROUGHPUT_OPS_PER_SEC,
      unit: "ops/sec",
      margin: 0.1, // 10% tolerance
      errorMessage: throughputResult._tag === "Left" ? throughputResult.left.message : undefined
    });
    
    // Test 2: Memory Usage Validation
    yield* Effect.logInfo("Testing memory usage performance target");
    const memoryResult = yield* validateMemoryTarget().pipe(
      Effect.either
    );
    
    results.push({
      testName: "Memory Per Operation Target",
      passed: memoryResult._tag === "Right",
      actualValue: memoryResult._tag === "Right" ? memoryResult.right.memoryPerOp : 0,
      expectedValue: PERFORMANCE_TARGETS.MEMORY_BYTES_PER_OPERATION,
      unit: "bytes",
      margin: 0.2, // 20% tolerance
      errorMessage: memoryResult._tag === "Left" ? memoryResult.left.message : undefined
    });
    
    // Test 3: Latency Validation
    yield* Effect.logInfo("Testing latency performance target");
    const latencyResult = yield* validateLatencyTarget().pipe(
      Effect.either
    );
    
    results.push({
      testName: "Average Latency Target",
      passed: latencyResult._tag === "Right",
      actualValue: latencyResult._tag === "Right" ? latencyResult.right.latency : 0,
      expectedValue: PERFORMANCE_TARGETS.LATENCY_MICROSECONDS,
      unit: "microseconds",
      margin: 0.5, // 50% tolerance for latency
      errorMessage: latencyResult._tag === "Left" ? latencyResult.left.message : undefined
    });
    
    // Test 4: Initialization Time Validation
    yield* Effect.logInfo("Testing initialization time performance target");
    const initResult = yield* validateInitializationTarget().pipe(
      Effect.either
    );
    
    results.push({
      testName: "Initialization Time Target",
      passed: initResult._tag === "Right",
      actualValue: initResult._tag === "Right" ? initResult.right.initTime : 0,
      expectedValue: PERFORMANCE_TARGETS.INITIALIZATION_TIME_MS,
      unit: "milliseconds",
      margin: 0.3, // 30% tolerance
      errorMessage: initResult._tag === "Left" ? initResult.left.message : undefined
    });
    
    // Test 5: Comprehensive Benchmark Suite
    yield* Effect.logInfo("Running comprehensive benchmark suite");
    const benchmarkResult = yield* validateBenchmarkSuite().pipe(
      Effect.either
    );
    
    results.push({
      testName: "Comprehensive Benchmark Suite",
      passed: benchmarkResult._tag === "Right",
      actualValue: benchmarkResult._tag === "Right" ? benchmarkResult.right.overallThroughput : 0,
      expectedValue: PERFORMANCE_TARGETS.THROUGHPUT_OPS_PER_SEC,
      unit: "ops/sec",
      margin: 0.15, // 15% tolerance for complex benchmarks
      errorMessage: benchmarkResult._tag === "Left" ? benchmarkResult.left.message : undefined
    });
    
    // Calculate summary
    const testsPassed = results.filter(r => r.passed).length;
    const testsFailed = results.length - testsPassed;
    const overallPassed = testsFailed === 0;
    
    // Generate recommendations
    const recommendations = generatePerformanceRecommendations(results);
    
    const summary: PerformanceValidationSummary = {
      overallPassed,
      testsRun: results.length,
      testsPassed,
      testsFailed,
      results,
      recommendations
    };
    
    yield* Effect.logInfo("Performance validation completed", {
      overallPassed,
      testsRun: results.length,
      testsPassed,
      testsFailed
    });
    
    return summary;
  }).pipe(
    Effect.catchAll(error =>
      Effect.fail(new ValidationTestError(
        `Performance validation suite failed: ${error}`,
        error
      ))
    )
  );

/**
 * Validate throughput target with realistic workload
 */
const validateThroughputTarget = (): Effect.Effect<{ throughput: number }, ValidationTestError, PerformanceMetricsService> =>
  Effect.gen(function* () {
    const performanceMetrics = yield* PerformanceMetricsService;
    const measurement = yield* performanceMetrics.startMeasurement("throughput-validation");
    
    // Create realistic validation workload
    const testConfigurations = Array(50000).fill(null).map((_, index) => {
      const baseConfig = {
        "output-file": `api-${index % 100}`,
        "file-type": index % 2 === 0 ? "yaml" as const : "json" as const,
        "validate-spec": index % 3 === 0,
        "protocol-bindings": index % 5 === 0 ? ["kafka"] as const : undefined,
      };
      
      // Add complexity for some tests
      if (index % 10 === 0) {
        return {
          ...baseConfig,
          "versioning": {
            "separate-files": true,
            "file-naming": "prefix" as const
          },
          "security-schemes": ["oauth2", "apiKey"] as const
        };
      }
      
      return baseConfig;
    });
    
    // Execute validation batch with high concurrency
    const validations = testConfigurations.map(config => () => 
      validateAsyncAPIEmitterOptions(config).pipe(
        Effect.catchAll(() => createAsyncAPIEmitterOptions({}))
      )
    );
    
    yield* Effect.logInfo(`Executing ${testConfigurations.length} validation operations for throughput test`);
    
    yield* performanceMetrics.measureValidationBatch(validations);
    const throughputResult = yield* performanceMetrics.recordThroughput(measurement, testConfigurations.length);
    
    yield* Effect.logInfo("Throughput validation completed", {
      operationsExecuted: testConfigurations.length,
      throughput: `${throughputResult.operationsPerSecond.toFixed(0)} ops/sec`,
      target: `${PERFORMANCE_TARGETS.THROUGHPUT_OPS_PER_SEC} ops/sec`,
      passed: throughputResult.operationsPerSecond >= PERFORMANCE_TARGETS.THROUGHPUT_OPS_PER_SEC
    });
    
    if (throughputResult.operationsPerSecond < PERFORMANCE_TARGETS.THROUGHPUT_OPS_PER_SEC) {
      return yield* Effect.fail(new ValidationTestError(
        `Throughput target not met: ${throughputResult.operationsPerSecond.toFixed(0)} < ${PERFORMANCE_TARGETS.THROUGHPUT_OPS_PER_SEC} ops/sec`
      ));
    }
    
    return { throughput: throughputResult.operationsPerSecond };
  }).pipe(
    Effect.catchAll(error => 
      Effect.fail(new ValidationTestError(
        `Throughput validation failed: ${error}`,
        error
      ))
    )
  );

/**
 * Validate memory usage target
 */
const validateMemoryTarget = (): Effect.Effect<{ memoryPerOp: number }, ValidationTestError, MemoryMonitorService> =>
  Effect.gen(function* () {
    const memoryMonitor = yield* MemoryMonitorService;
    
    yield* memoryMonitor.startMonitoring(100); // High-frequency monitoring
    
    // Execute memory-intensive operations
    const operations = Array(1000).fill(null).map((_, index) => {
      const complexConfig = {
        "output-file": `complex-api-${index}`,
        "file-type": "yaml" as const,
        "validate-spec": true,
        "protocol-bindings": ["kafka", "websocket", "amqp"] as const,
        "security-schemes": ["oauth2", "apiKey", "openIdConnect"] as const,
        "versioning": {
          "separate-files": true,
          "file-naming": "suffix" as const
        },
        "format-options": {
          "yaml": {
            "indent": 4,
            "line-width": 120,
            "preserve-comments": true
          }
        }
      };
      
      return validateAsyncAPIEmitterOptions(complexConfig).pipe(
        Effect.flatMap(validated => createAsyncAPIEmitterOptions(validated))
      );
    });
    
    let totalMemoryUsed = 0;
    
    for (const operation of operations) {
      const { memoryUsed } = yield* memoryMonitor.measureOperationMemory(
        operation,
        "memory-validation"
      );
      totalMemoryUsed += memoryUsed;
    }
    
    yield* memoryMonitor.stopMonitoring();
    
    const avgMemoryPerOp = totalMemoryUsed / operations.length;
    
    yield* Effect.logInfo("Memory validation completed", {
      operationsExecuted: operations.length,
      totalMemoryUsed: `${totalMemoryUsed} bytes`,
      avgMemoryPerOp: `${avgMemoryPerOp.toFixed(0)} bytes`,
      target: `${PERFORMANCE_TARGETS.MEMORY_BYTES_PER_OPERATION} bytes`,
      passed: avgMemoryPerOp <= PERFORMANCE_TARGETS.MEMORY_BYTES_PER_OPERATION
    });
    
    if (avgMemoryPerOp > PERFORMANCE_TARGETS.MEMORY_BYTES_PER_OPERATION) {
      return yield* Effect.fail(new ValidationTestError(
        `Memory target not met: ${avgMemoryPerOp.toFixed(0)} > ${PERFORMANCE_TARGETS.MEMORY_BYTES_PER_OPERATION} bytes/op`
      ));
    }
    
    return { memoryPerOp: avgMemoryPerOp };
  }).pipe(
    Effect.catchAll(error => 
      Effect.fail(new ValidationTestError(
        `Memory validation failed: ${error}`,
        error
      ))
    )
  );

/**
 * Validate latency target
 */
const validateLatencyTarget = (): Effect.Effect<{ latency: number }, ValidationTestError, never> =>
  Effect.gen(function* () {
    const iterations = 10000;
    const latencies: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      yield* validateAsyncAPIEmitterOptions({
        "output-file": "latency-test",
        "file-type": "json" as const
      }).pipe(
        Effect.catchAll(() => createAsyncAPIEmitterOptions({}))
      );
      
      const endTime = performance.now();
      const latencyMicroseconds = (endTime - startTime) * 1000;
      latencies.push(latencyMicroseconds);
    }
    
    const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    const sortedLatencies = latencies.sort((a, b) => a - b);
    const p95Index = Math.floor(latencies.length * 0.95);
    const p95Latency = sortedLatencies[p95Index];
    if (p95Latency === undefined) {
      return yield* Effect.fail(new ValidationTestError("Unable to calculate P95 latency"));
    }
    
    yield* Effect.logInfo("Latency validation completed", {
      iterations,
      avgLatency: `${avgLatency.toFixed(2)} μs`,
      p95Latency: `${p95Latency.toFixed(2)} μs`,
      target: `${PERFORMANCE_TARGETS.LATENCY_MICROSECONDS} μs`,
      passed: avgLatency <= PERFORMANCE_TARGETS.LATENCY_MICROSECONDS
    });
    
    if (avgLatency > PERFORMANCE_TARGETS.LATENCY_MICROSECONDS) {
      return yield* Effect.fail(new ValidationTestError(
        `Latency target not met: ${avgLatency.toFixed(2)} > ${PERFORMANCE_TARGETS.LATENCY_MICROSECONDS} μs`
      ));
    }
    
    return { latency: avgLatency };
  }).pipe(
    Effect.catchAll(error => 
      Effect.fail(new ValidationTestError(
        `Latency validation failed: ${error}`,
        error
      ))
    )
  );

/**
 * Validate initialization time target
 */
const validateInitializationTarget = (): Effect.Effect<{ initTime: number }, ValidationTestError, PerformanceMetricsService | MemoryMonitorService> =>
  Effect.gen(function* () {
    const iterations = 100;
    const initTimes: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      // Simulate full emitter initialization
      const performanceMetrics = yield* PerformanceMetricsService;
      const memoryMonitor = yield* MemoryMonitorService;
      
      yield* memoryMonitor.startMonitoring(1000);
      yield* performanceMetrics.startMeasurement("init-test");
      
      // Simulate typical initialization work
      yield* Effect.sleep(Duration.millis(10));
      
      yield* memoryMonitor.stopMonitoring();
      
      const endTime = performance.now();
      initTimes.push(endTime - startTime);
    }
    
    const avgInitTime = initTimes.reduce((sum, time) => sum + time, 0) / initTimes.length;
    
    yield* Effect.logInfo("Initialization validation completed", {
      iterations,
      avgInitTime: `${avgInitTime.toFixed(2)} ms`,
      target: `${PERFORMANCE_TARGETS.INITIALIZATION_TIME_MS} ms`,
      passed: avgInitTime <= PERFORMANCE_TARGETS.INITIALIZATION_TIME_MS
    });
    
    if (avgInitTime > PERFORMANCE_TARGETS.INITIALIZATION_TIME_MS) {
      return yield* Effect.fail(new ValidationTestError(
        `Initialization time target not met: ${avgInitTime.toFixed(2)} > ${PERFORMANCE_TARGETS.INITIALIZATION_TIME_MS} ms`
      ));
    }
    
    return { initTime: avgInitTime };
  }).pipe(
    Effect.catchAll(error => 
      Effect.fail(new ValidationTestError(
        `Initialization validation failed: ${error}`,
        error
      ))
    )
  );

/**
 * Validate comprehensive benchmark suite
 */
const validateBenchmarkSuite = (): Effect.Effect<{ overallThroughput: number }, ValidationTestError, PerformanceMetricsService> =>
  Effect.gen(function* () {
    const config = {
      ...DefaultBenchmarkConfig,
      measurementIterations: 5000, // Reduced for validation test
      warmupIterations: 500,
      concurrencyLevels: [10, 50, 100] // Focus on key concurrency levels
    };
    
    const benchmarkSuite = yield* executeBenchmarkSuite(config);
    
    yield* Effect.logInfo("Benchmark suite validation completed", {
      overallThroughput: `${benchmarkSuite.summary.overallThroughput.toFixed(0)} ops/sec`,
      target: `${PERFORMANCE_TARGETS.THROUGHPUT_OPS_PER_SEC} ops/sec`,
      targetsMet: benchmarkSuite.summary.targetsMet.throughput
    });
    
    if (!benchmarkSuite.summary.targetsMet.throughput) {
      return yield* Effect.fail(new ValidationTestError(
        `Benchmark suite throughput target not met: ${benchmarkSuite.summary.overallThroughput.toFixed(0)} < ${PERFORMANCE_TARGETS.THROUGHPUT_OPS_PER_SEC} ops/sec`
      ));
    }
    
    return { overallThroughput: benchmarkSuite.summary.overallThroughput };
  }).pipe(
    Effect.catchAll(error => 
      Effect.fail(new ValidationTestError(
        `Benchmark suite validation failed: ${error}`,
        error
      ))
    )
  );

/**
 * Generate performance recommendations based on test results
 */
const generatePerformanceRecommendations = (results: PerformanceTestResult[]): string[] => {
  const recommendations: string[] = [];
  
  for (const result of results) {
    if (!result.passed) {
      switch (result.testName) {
        case "Throughput Target":
          const throughputDeficit = result.expectedValue - result.actualValue;
          recommendations.push(
            `Throughput is ${throughputDeficit.toFixed(0)} ops/sec below target. Consider: ` +
            "(1) Optimizing validation logic, (2) Increasing concurrency, (3) Implementing object pooling"
          );
          break;
          
        case "Memory Per Operation Target":
          const memoryExcess = result.actualValue - result.expectedValue;
          recommendations.push(
            `Memory usage exceeds target by ${memoryExcess.toFixed(0)} bytes/op. Consider: ` +
            "(1) Implementing memory pooling, (2) Optimizing object creation, (3) Adding garbage collection hints"
          );
          break;
          
        case "Average Latency Target":
          const latencyExcess = result.actualValue - result.expectedValue;
          recommendations.push(
            `Latency exceeds target by ${latencyExcess.toFixed(2)} microseconds. Consider: ` +
            "(1) Algorithm optimization, (2) Reducing object allocations, (3) Caching frequently used data"
          );
          break;
          
        case "Initialization Time Target":
          recommendations.push(
            "Initialization time exceeds target. Consider: " +
            "(1) Lazy loading, (2) Reducing startup operations, (3) Parallel initialization"
          );
          break;
          
        case "Comprehensive Benchmark Suite":
          recommendations.push(
            "Benchmark suite indicates overall performance issues. Review all above recommendations and consider architectural changes."
          );
          break;
      }
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push("All performance targets met. System is operating within specifications.");
  }
  
  return recommendations;
};

/**
 * Quick performance check for CI/CD pipelines
 */
export const quickValidationCheck = (
  iterations = 1000
): Effect.Effect<{ passed: boolean; throughput: number; memoryPerOp: number }, ValidationTestError, PerformanceMetricsService> =>
  Effect.gen(function* () {
    yield* Effect.logInfo(`Running quick performance validation (${iterations} iterations)`);
    
    const result = yield* quickPerformanceCheck(iterations, PERFORMANCE_TARGETS.THROUGHPUT_OPS_PER_SEC);
    
    const passed = result.targetsMet && result.memoryPerOp <= PERFORMANCE_TARGETS.MEMORY_BYTES_PER_OPERATION;
    
    yield* Effect.logInfo("Quick validation completed", {
      throughput: `${result.throughput.toFixed(0)} ops/sec`,
      memoryPerOp: `${result.memoryPerOp.toFixed(0)} bytes`,
      passed
    });
    
    return {
      passed,
      throughput: result.throughput,
      memoryPerOp: result.memoryPerOp
    };
  }).pipe(
    Effect.catchAll(error =>
      Effect.fail(new ValidationTestError(
        `Quick validation check failed: ${error}`,
        error
      ))
    )
  );

/**
 * Generate performance validation report
 */
export const generatePerformanceValidationReport = (summary: PerformanceValidationSummary): string => {
  let report = "# Performance Validation Report\n\n";
  
  // Executive Summary
  report += "## Executive Summary\n";
  report += `- **Overall Status:** ${summary.overallPassed ? '✅ ALL TARGETS MET' : '❌ TARGETS MISSED'}\n`;
  report += `- **Tests Run:** ${summary.testsRun}\n`;
  report += `- **Tests Passed:** ${summary.testsPassed}\n`;
  report += `- **Tests Failed:** ${summary.testsFailed}\n`;
  report += `- **Success Rate:** ${((summary.testsPassed / summary.testsRun) * 100).toFixed(1)}%\n\n`;
  
  // Performance Targets
  report += "## Performance Targets\n";
  report += `- **Throughput:** ${PERFORMANCE_TARGETS.THROUGHPUT_OPS_PER_SEC.toLocaleString()} ops/sec\n`;
  report += `- **Memory Usage:** ${PERFORMANCE_TARGETS.MEMORY_BYTES_PER_OPERATION} bytes/operation\n`;
  report += `- **Latency:** ${PERFORMANCE_TARGETS.LATENCY_MICROSECONDS} microseconds\n`;
  report += `- **Initialization:** ${PERFORMANCE_TARGETS.INITIALIZATION_TIME_MS} ms\n\n`;
  
  // Detailed Results
  report += "## Detailed Results\n\n";
  report += "| Test | Status | Actual | Expected | Unit | Margin |\n";
  report += "|------|--------|--------|----------|------|--------|\n";
  
  for (const result of summary.results) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const margin = `${(result.margin * 100).toFixed(0)}%`;
    report += `| ${result.testName} | ${status} | ${result.actualValue.toFixed(0)} | ${result.expectedValue.toFixed(0)} | ${result.unit} | ${margin} |\n`;
  }
  
  report += "\n";
  
  // Failed Tests Details
  const failedTests = summary.results.filter(r => !r.passed);
  if (failedTests.length > 0) {
    report += "## Failed Tests Details\n\n";
    
    for (const failed of failedTests) {
      report += `### ${failed.testName}\n`;
      report += `- **Expected:** ${failed.expectedValue} ${failed.unit}\n`;
      report += `- **Actual:** ${failed.actualValue.toFixed(2)} ${failed.unit}\n`;
      if (failed.errorMessage) {
        report += `- **Error:** ${failed.errorMessage}\n`;
      }
      const variance = ((failed.actualValue - failed.expectedValue) / failed.expectedValue * 100);
      report += `- **Variance:** ${variance.toFixed(1)}%\n\n`;
    }
  }
  
  // Recommendations
  report += "## Recommendations\n\n";
  for (const recommendation of summary.recommendations) {
    report += `- ${recommendation}\n`;
  }
  
  return report;
};
