/**
 * Effect.TS Performance Benchmark Suite
 * 
 * Comprehensive benchmarking of Effect.TS schema validation performance
 * with comparison against baseline implementations.
 */

import { Effect, Context } from "effect";
import { performance } from "perf_hooks";
import {
  parseAsyncAPIEmitterOptions,
  validateAsyncAPIEmitterOptions,
  createAsyncAPIEmitterOptions,
  isAsyncAPIEmitterOptions
} from "../options.js";
import type { AsyncAPIEmitterOptions } from "../types/options.js";

// BENCHMARK TEST CASES
const generateTestCases = () => {
  const cases: Array<{ name: string; data: unknown }> = [];
  
  // Simple cases
  cases.push({
    name: "minimal_valid",
    data: { "output-file": "test.yaml" }
  });
  
  cases.push({
    name: "empty_object", 
    data: {}
  });
  
  // Complex valid case
  cases.push({
    name: "complex_valid",
    data: {
      "output-file": "complex-api.yaml",
      "file-type": "yaml",
      "asyncapi-version": "3.0.0",
      "omit-unreachable-types": true,
      "include-source-info": false,
      "validate-spec": true,
      "default-servers": {
        "production": {
          host: "api.example.com",
          protocol: "https",
          description: "Production server",
          variables: {
            "version": {
              description: "API version",
              default: "v1",
              enum: ["v1", "v2", "v3"]
            }
          }
        }
      },
      "security-schemes": {
        "oauth2": {
          type: "oauth2",
          description: "OAuth2 authentication",
          flows: {
            authorizationCode: {
              authorizationUrl: "https://auth.example.com/oauth/authorize",
              tokenUrl: "https://auth.example.com/oauth/token"
            }
          }
        }
      },
      "protocol-bindings": ["kafka", "websocket"],
      "versioning": {
        "separate-files": true,
        "file-naming": "suffix"
      }
    }
  });
  
  // Large objects for stress testing
  for (let i = 0; i < 5; i++) {
    cases.push({
      name: `large_servers_${i}`,
      data: {
        "default-servers": Object.fromEntries(
          Array.from({ length: 50 }, (_, j) => [
            `server-${i}-${j}`,
            {
              host: `server-${i}-${j}.example.com`,
              protocol: "https",
              description: `Server ${i}-${j}`,
              variables: {
                "region": {
                  description: "Deployment region",
                  default: "us-east-1",
                  enum: ["us-east-1", "us-west-2", "eu-west-1"]
                }
              }
            }
          ])
        )
      }
    });
  }
  
  // Invalid cases for error handling benchmarks
  cases.push({
    name: "invalid_file_type",
    data: { "file-type": "invalid" }
  });
  
  cases.push({
    name: "invalid_complex",
    data: {
      "file-type": "xml",
      "asyncapi-version": "2.0.0",
      "protocol-bindings": ["invalid-protocol"]
    }
  });
  
  return cases;
};

// BENCHMARK RUNNER
type BenchmarkResult = {
  operation: string;
  testCase: string;
  duration: number;
  success: boolean;
  iterations: number;
  throughput: number; // operations per second
  memoryDelta?: number;
}

const runBenchmark = async (
  operation: string,
  testCase: { name: string; data: unknown },
  iterations: number,
  fn: (data: unknown) => Promise<any>
): Promise<BenchmarkResult> => {
  // Warm up
  for (let i = 0; i < 5; i++) {
    try {
      await fn(testCase.data);
    } catch {
      // Ignore errors during warm-up
    }
  }
  
  // Memory measurement
  const startMem = process.memoryUsage().heapUsed;
  
  const startTime = performance.now();
  let successCount = 0;
  
  for (let i = 0; i < iterations; i++) {
    try {
      await fn(testCase.data);
      successCount++;
    } catch {
      // Count failures
    }
  }
  
  const endTime = performance.now();
  const endMem = process.memoryUsage().heapUsed;
  const duration = endTime - startTime;
  
  return {
    operation,
    testCase: testCase.name,
    duration,
    success: successCount === iterations,
    iterations,
    throughput: (iterations / duration) * 1000, // ops/sec
    memoryDelta: endMem - startMem
  };
};

// BENCHMARK OPERATIONS
const benchmarkOperations = {
  parseAsyncAPIEmitterOptions: async (data: unknown) => {
    return await Effect.runPromise(parseAsyncAPIEmitterOptions(data).pipe(
      Effect.provide(Context.empty())
    ));
  },
  
  validateAsyncAPIEmitterOptions: async (data: unknown) => {
    return await Effect.runPromise(validateAsyncAPIEmitterOptions(data).pipe(
      Effect.provide(Context.empty())
    ));
  },
  
  createAsyncAPIEmitterOptions: async (data: unknown) => {
    return await Effect.runPromise(createAsyncAPIEmitterOptions(data as Partial<AsyncAPIEmitterOptions>).pipe(
      Effect.provide(Context.empty())
    ));
  },
  
  isAsyncAPIEmitterOptions: async (data: unknown) => {
    return isAsyncAPIEmitterOptions(data);
  }
};

// MAIN BENCHMARK SUITE
export const runEffectBenchmarkSuite = async (iterations = 1000) => {
  console.log(`🚀 Starting Effect.TS Performance Benchmark (${iterations} iterations per test)`);
  console.log("=" + "=".repeat(80));
  
  const testCases = generateTestCases();
  const results: BenchmarkResult[] = [];
  
  // Run benchmarks for each operation and test case
  for (const [operationName, operationFn] of Object.entries(benchmarkOperations)) {
    console.log(`\n📊 Benchmarking: ${operationName}`);
    console.log("-" + "-".repeat(50));
    
    for (const testCase of testCases) {
      const result = await runBenchmark(operationName, testCase, iterations, operationFn);
      results.push(result);
      
      console.log(
        `  ${testCase.name.padEnd(20)}: ${result.duration.toFixed(2)}ms total, ` +
        `${result.throughput.toFixed(0)} ops/sec, ` +
        `${result.success ? "✅" : "❌"} ` +
        `(mem: ${((result.memoryDelta || 0) / 1024).toFixed(1)}KB)`
      );
    }
  }
  
  // Performance analysis
  console.log("\n📈 PERFORMANCE ANALYSIS");
  console.log("=" + "=".repeat(80));
  
  const groupedResults = new Map<string, BenchmarkResult[]>();
  for (const result of results) {
    if (!groupedResults.has(result.operation)) {
      groupedResults.set(result.operation, []);
    }
    groupedResults.get(result.operation)!.push(result);
  }
  
  for (const [operation, operationResults] of Array.from(groupedResults.entries())) {
    const validResults = operationResults.filter(r => r.success);
    const avgThroughput = validResults.reduce((sum, r) => sum + r.throughput, 0) / validResults.length;
    const minThroughput = Math.min(...validResults.map(r => r.throughput));
    const maxThroughput = Math.max(...validResults.map(r => r.throughput));
    const totalMemory = operationResults.reduce((sum, r) => sum + (r.memoryDelta || 0), 0);
    
    console.log(`\n${operation}:`);
    console.log(`  Average Throughput: ${avgThroughput.toFixed(0)} ops/sec`);
    console.log(`  Throughput Range: ${minThroughput.toFixed(0)} - ${maxThroughput.toFixed(0)} ops/sec`);
    console.log(`  Total Memory Delta: ${(totalMemory / 1024).toFixed(1)}KB`);
    console.log(`  Success Rate: ${((validResults.length / operationResults.length) * 100).toFixed(1)}%`);
  }
  
  // Performance thresholds
  console.log("\n⚡ PERFORMANCE THRESHOLDS");
  console.log("=" + "=".repeat(80));
  
  const thresholds = {
    minThroughput: 1000, // ops/sec
    maxMemoryPerOp: 1024, // bytes
    maxValidationTime: 5 // ms per operation
  };
  
  let allPassed = true;
  
  for (const [operation, operationResults] of Array.from(groupedResults.entries())) {
    const validResults = operationResults.filter(r => r.success);
    const avgThroughput = validResults.reduce((sum, r) => sum + r.throughput, 0) / validResults.length;
    const avgMemoryPerOp = operationResults.reduce((sum, r) => sum + (r.memoryDelta || 0), 0) / operationResults.length / iterations;
    const avgTimePerOp = validResults.reduce((sum, r) => sum + r.duration, 0) / validResults.length / iterations;
    
    console.log(`\n${operation}:`);
    
    // Throughput check
    const throughputPass = avgThroughput >= thresholds.minThroughput;
    console.log(`  Throughput: ${avgThroughput.toFixed(0)} ops/sec ${throughputPass ? "✅" : "❌"} (min: ${thresholds.minThroughput})`);
    if (!throughputPass) allPassed = false;
    
    // Memory check
    const memoryPass = avgMemoryPerOp <= thresholds.maxMemoryPerOp;
    console.log(`  Memory/Op: ${avgMemoryPerOp.toFixed(1)} bytes ${memoryPass ? "✅" : "❌"} (max: ${thresholds.maxMemoryPerOp})`);
    if (!memoryPass) allPassed = false;
    
    // Time check
    const timePass = avgTimePerOp <= thresholds.maxValidationTime;
    console.log(`  Time/Op: ${avgTimePerOp.toFixed(3)}ms ${timePass ? "✅" : "❌"} (max: ${thresholds.maxValidationTime})`);
    if (!timePass) allPassed = false;
  }
  
  console.log(`\n🎯 OVERALL PERFORMANCE: ${allPassed ? "✅ PASSED" : "❌ NEEDS OPTIMIZATION"}`);
  
  return {
    results,
    summary: {
      totalTests: results.length,
      successRate: (results.filter(r => r.success).length / results.length) * 100,
      overallPassed: allPassed
    }
  };
};

// COMPARISON WITH BASELINE (if available)
export const runComparison = async () => {
  console.log("\n🔄 RUNNING BASELINE COMPARISON");
  console.log("=" + "=".repeat(80));
  
  // This would compare with a JSON Schema validator like AJV
  // For now, we'll simulate baseline performance
  
  const testCase = {
    "output-file": "test.yaml",
    "file-type": "yaml",
    "validate-spec": true
  };
  
  const iterations = 10000;
  
  // Effect.TS validation
  const startEffect = performance.now();
  for (let i = 0; i < iterations; i++) {
    try {
      await Effect.runPromise(parseAsyncAPIEmitterOptions(testCase).pipe(
        Effect.provide(Context.empty())
      ));
    } catch {
      // Ignore errors
    }
  }
  const effectTime = performance.now() - startEffect;
  
  // Simulate baseline (JSON Schema + manual validation)
  const startBaseline = performance.now();
  for (let i = 0; i < iterations; i++) {
    // Simulate validation work
    const valid = typeof testCase === "object" && 
                 testCase !== null &&
                 (!testCase["file-type"] || ["yaml", "json"].includes(testCase["file-type"]));
    if (!valid) throw new Error("Invalid");
  }
  const baselineTime = performance.now() - startBaseline;
  
  const improvement = ((baselineTime - effectTime) / baselineTime) * 100;
  
  console.log(`Effect.TS: ${effectTime.toFixed(2)}ms (${(iterations/effectTime*1000).toFixed(0)} ops/sec)`);
  console.log(`Baseline: ${baselineTime.toFixed(2)}ms (${(iterations/baselineTime*1000).toFixed(0)} ops/sec)`);
  console.log(`Performance: ${improvement >= 0 ? "+" : ""}${improvement.toFixed(1)}% ${improvement >= 0 ? "🚀" : "🐌"}`);
  
  return { effectTime, baselineTime, improvement };
};

// CLI RUNNER
if (typeof process !== "undefined" && process.argv[1]?.endsWith("effect-performance-benchmark.ts")) {
  const iterations = parseInt(process.argv[2] ?? "1000") || 1000;
  
  const benchmark = await runEffectBenchmarkSuite(iterations);
  await runComparison();
  
  process.exit(benchmark.summary.overallPassed ? 0 : 1);
}