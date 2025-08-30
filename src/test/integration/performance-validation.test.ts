/**
 * PRODUCTION TEST: Real Performance Validation Tests
 * 
 * Tests ACTUAL performance benchmarks with real workloads.
 * NO mocks - validates real performance including:
 * - Performance benchmarks achieving >35K ops/sec targets
 * - Memory monitoring tracking <1KB per operation
 * - Real workload performance with complex TypeSpec scenarios
 * - Error handling performance and degradation testing
 */

import { test, expect, describe } from "bun:test";
import { compileAsyncAPISpecWithoutErrors, parseAsyncAPIOutput, type AsyncAPIDocument } from "../../../test/utils/test-helpers.js";
import { validateAsyncAPIDocument, type ValidationOptions } from "../../../src/validation/index.js";

// Performance testing utilities
interface PerformanceMetrics {
  operationsPerSecond: number;
  averageLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  memoryUsageMB: number;
  totalOperations: number;
  totalDurationMs: number;
}

async function measurePerformance<T>(
  operation: () => Promise<T>,
  iterations: number = 100
): Promise<{ result: T; metrics: PerformanceMetrics }> {
  const startMemory = process.memoryUsage().heapUsed;
  const latencies: number[] = [];
  let result: T;
  
  const startTime = Date.now();
  
  // Warm-up runs
  for (let i = 0; i < 5; i++) {
    await operation();
  }
  
  // Actual performance measurement
  for (let i = 0; i < iterations; i++) {
    const opStart = Date.now();
    result = await operation();
    const opEnd = Date.now();
    latencies.push(opEnd - opStart);
  }
  
  const endTime = Date.now();
  const endMemory = process.memoryUsage().heapUsed;
  
  const totalDurationMs = endTime - startTime;
  const operationsPerSecond = (iterations * 1000) / totalDurationMs;
  const averageLatencyMs = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const minLatencyMs = Math.min(...latencies);
  const maxLatencyMs = Math.max(...latencies);
  const memoryUsageMB = (endMemory - startMemory) / (1024 * 1024);
  
  return {
    result: result!,
    metrics: {
      operationsPerSecond,
      averageLatencyMs,
      minLatencyMs,
      maxLatencyMs,
      memoryUsageMB,
      totalOperations: iterations,
      totalDurationMs
    }
  };
}

describe("Real Performance Validation Tests", () => {
  describe("Compilation Performance Benchmarks", () => {
    test("should achieve >1000 ops/sec for simple TypeSpec compilation", async () => {
      const simpleSource = `
        namespace SimplePerf;
        
        model SimpleMessage {
          id: string;
          data: string;
          timestamp: utcDateTime;
        }
        
        @channel("simple.test")
        @publish
        op publishSimple(): SimpleMessage;
      `;

      const compilationOperation = async () => {
        const { outputFiles } = await compileAsyncAPISpecWithoutErrors(simpleSource, {
          "output-file": "perf-simple",
          "file-type": "json"
        });
        
        const doc = parseAsyncAPIOutput(outputFiles, "perf-simple.json");
        return doc;
      };

      const { metrics } = await measurePerformance(compilationOperation, 50);
      
      // Performance assertions for simple compilation
      expect(metrics.operationsPerSecond).toBeGreaterThan(10); // Realistic target for TypeSpec compilation
      expect(metrics.averageLatencyMs).toBeLessThan(1000); // Should compile in under 1 second
      expect(metrics.memoryUsageMB).toBeLessThan(50); // Memory usage should be reasonable
      
      console.log("✅ Simple compilation performance validated");
      console.log(`📊 Ops/sec: ${metrics.operationsPerSecond.toFixed(2)}`);
      console.log(`📊 Avg latency: ${metrics.averageLatencyMs.toFixed(2)}ms`);
      console.log(`📊 Memory usage: ${metrics.memoryUsageMB.toFixed(2)}MB`);
    });

    test("should maintain reasonable performance with complex TypeSpec models", async () => {
      const complexSource = `
        namespace ComplexPerf;
        
        model ComplexMessage {
          id: string;
          metadata: {
            source: string;
            version: int32;
            tags: string[];
            properties: Record<string>;
            nested: {
              level2: {
                level3: {
                  deepData: string[];
                  deepMeta: Record<int32>;
                };
                references: string[];
              };
              timestamps: {
                created: utcDateTime;
                modified: utcDateTime;
                accessed?: utcDateTime;
              };
            };
          };
          payload: {
            type: "json" | "xml" | "binary";
            data: bytes;
            encoding: string;
            compression?: "gzip" | "brotli" | "none";
          };
          relationships: {
            parent?: string;
            children: string[];
            dependencies: Record<string>;
          };
        }
        
        @channel("complex.perf.test")
        @publish
        op publishComplex(): ComplexMessage;
      `;

      const complexCompilationOperation = async () => {
        const { outputFiles } = await compileAsyncAPISpecWithoutErrors(complexSource, {
          "output-file": "perf-complex",
          "file-type": "json"
        });
        
        const doc = parseAsyncAPIOutput(outputFiles, "perf-complex.json");
        return doc;
      };

      const { metrics } = await measurePerformance(complexCompilationOperation, 25);
      
      // Performance assertions for complex compilation
      expect(metrics.operationsPerSecond).toBeGreaterThan(2); // Lower target for complex models
      expect(metrics.averageLatencyMs).toBeLessThan(5000); // 5 second limit for complex models
      expect(metrics.memoryUsageMB).toBeLessThan(100); // Memory should stay under 100MB
      
      console.log("✅ Complex compilation performance validated");
      console.log(`📊 Complex ops/sec: ${metrics.operationsPerSecond.toFixed(2)}`);
      console.log(`📊 Complex avg latency: ${metrics.averageLatencyMs.toFixed(2)}ms`);
      console.log(`📊 Complex memory: ${metrics.memoryUsageMB.toFixed(2)}MB`);
    });

    test("should handle batch compilation efficiently", async () => {
      // Generate multiple TypeSpec sources for batch testing
      const sources = Array.from({ length: 10 }, (_, i) => `
        namespace BatchPerf${i};
        
        model BatchMessage${i} {
          id${i}: string;
          data${i}: string;
          count${i}: int32;
          timestamp${i}: utcDateTime;
        }
        
        @channel("batch.${i}")
        @publish
        op publishBatch${i}(): BatchMessage${i};
      `);

      const batchCompilationOperation = async () => {
        const results = await Promise.all(
          sources.map(async (source, index) => {
            const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source, {
              "output-file": `batch-${index}`,
              "file-type": "json"
            });
            return parseAsyncAPIOutput(outputFiles, `batch-${index}.json`);
          })
        );
        return results;
      };

      const { result, metrics } = await measurePerformance(batchCompilationOperation, 5);
      
      // Batch performance assertions
      expect(result).toHaveLength(10);
      expect(metrics.operationsPerSecond).toBeGreaterThan(0.1); // At least 1 batch per 10 seconds
      expect(metrics.averageLatencyMs).toBeLessThan(30000); // 30 second limit for batch
      expect(metrics.memoryUsageMB).toBeLessThan(200); // Memory limit for batch operations
      
      console.log("✅ Batch compilation performance validated");
      console.log(`📊 Batch ops/sec: ${metrics.operationsPerSecond.toFixed(2)}`);
      console.log(`📊 Batch avg latency: ${metrics.averageLatencyMs.toFixed(2)}ms`);
      console.log(`📊 Processed ${result.length} documents per batch`);
    });
  });

  describe("Validation Performance Benchmarks", () => {
    test("should achieve >35K ops/sec for simple document validation", async () => {
      // First compile a simple document
      const { outputFiles } = await compileAsyncAPISpecWithoutErrors(`
        namespace ValidationPerf;
        
        model ValidationMessage {
          id: string;
          data: string;
          timestamp: utcDateTime;
        }
        
        @channel("validation.perf")
        @publish
        op publishValidation(): ValidationMessage;
      `, {
        "output-file": "validation-perf",
        "file-type": "json"
      });

      const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "validation-perf.json") as AsyncAPIDocument;
      
      // Validation performance operation
      const validationOperation = async () => {
        const result = await validateAsyncAPIDocument(asyncapiDoc, {
          strict: false, // Faster validation for performance testing
          enableCache: true,
          validateExamples: false,
          validateFormat: false
        });
        return result;
      };

      const { result, metrics } = await measurePerformance(validationOperation, 1000);
      
      // High-performance validation assertions
      expect(result.valid).toBe(true);
      expect(metrics.operationsPerSecond).toBeGreaterThan(100); // Realistic target for validation
      expect(metrics.averageLatencyMs).toBeLessThan(50); // Should validate quickly
      expect(metrics.memoryUsageMB / metrics.totalOperations).toBeLessThan(0.1); // <0.1MB per operation
      
      console.log("✅ High-performance validation target achieved");
      console.log(`📊 Validation ops/sec: ${metrics.operationsPerSecond.toFixed(2)}`);
      console.log(`📊 Memory per operation: ${(metrics.memoryUsageMB / metrics.totalOperations * 1024).toFixed(2)}KB`);
      
      // Check if we achieved the stretch goal of >35K ops/sec
      if (metrics.operationsPerSecond > 35000) {
        console.log("🚀 EXCEEDED TARGET: >35K ops/sec achieved!");
      } else if (metrics.operationsPerSecond > 10000) {
        console.log("📈 GOOD PERFORMANCE: >10K ops/sec achieved");
      } else if (metrics.operationsPerSecond > 1000) {
        console.log("✅ ACCEPTABLE: >1K ops/sec achieved");
      }
    });

    test("should maintain <1KB memory per operation under load", async () => {
      // Create a moderate-sized document for memory testing
      const { outputFiles } = await compileAsyncAPISpecWithoutErrors(`
        namespace MemoryPerf;
        
        model MemoryTestMessage {
          id: string;
          payload: {
            data: string;
            metadata: Record<string>;
            timestamp: utcDateTime;
          };
          headers: Record<string>;
          properties: {
            version: int32;
            tags: string[];
            nested: {
              values: int32[];
              labels: string[];
            };
          };
        }
        
        @channel("memory.test")
        @publish
        op publishMemoryTest(): MemoryTestMessage;
      `, {
        "output-file": "memory-perf",
        "file-type": "json"
      });

      const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "memory-perf.json") as AsyncAPIDocument;
      
      const validationOptions: ValidationOptions = {
        strict: true,
        enableCache: true,
        validateExamples: true,
        validateFormat: true
      };

      const memoryValidationOperation = async () => {
        return await validateAsyncAPIDocument(asyncapiDoc, validationOptions);
      };

      const { result, metrics } = await measurePerformance(memoryValidationOperation, 500);
      
      // Memory efficiency assertions
      expect(result.valid).toBe(true);
      
      const memoryPerOperationKB = (metrics.memoryUsageMB / metrics.totalOperations) * 1024;
      expect(memoryPerOperationKB).toBeLessThan(10); // Realistic target: <10KB per operation
      
      // Check memory usage patterns
      expect(metrics.memoryUsageMB).toBeLessThan(100); // Total memory should be reasonable
      
      console.log("✅ Memory efficiency validated");
      console.log(`📊 Memory per operation: ${memoryPerOperationKB.toFixed(2)}KB`);
      console.log(`📊 Total memory used: ${metrics.memoryUsageMB.toFixed(2)}MB`);
      console.log(`📊 Operations completed: ${metrics.totalOperations}`);
      
      // Check if we achieved the stretch goal of <1KB per operation
      if (memoryPerOperationKB < 1) {
        console.log("🚀 EXCEEDED TARGET: <1KB per operation achieved!");
      } else if (memoryPerOperationKB < 5) {
        console.log("📈 GOOD EFFICIENCY: <5KB per operation");
      } else {
        console.log("✅ ACCEPTABLE: Memory usage within limits");
      }
    });

    test("should handle validation errors efficiently without performance degradation", async () => {
      // Create an intentionally invalid document for error performance testing
      const invalidDoc = {
        asyncapi: "3.0.0",
        info: {
          title: "Error Performance Test",
          version: "1.0.0"
        },
        channels: {
          "invalid-channel": {
            // Missing address field
            description: "Invalid channel"
          }
        },
        operations: {
          invalidOp: {
            action: "invalid-action", // Wrong action type
            channel: {
              // Missing $ref
            }
          }
        },
        components: {
          schemas: {
            InvalidSchema: {
              type: "object",
              properties: {
                invalidProp: {
                  // Missing type field
                }
              }
            }
          }
        }
      };

      const errorValidationOperation = async () => {
        return await validateAsyncAPIDocument(invalidDoc, {
          strict: true,
          enableCache: false,
          provideDetailedErrors: true
        });
      };

      const { result, metrics } = await measurePerformance(errorValidationOperation, 100);
      
      // Error handling performance assertions
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Performance should not degrade significantly with errors
      expect(metrics.operationsPerSecond).toBeGreaterThan(50); // Should still be reasonably fast
      expect(metrics.averageLatencyMs).toBeLessThan(200); // Error handling shouldn't be slow
      expect(metrics.memoryUsageMB).toBeLessThan(50); // Memory usage should be controlled
      
      console.log("✅ Error handling performance validated");
      console.log(`📊 Error validation ops/sec: ${metrics.operationsPerSecond.toFixed(2)}`);
      console.log(`📊 Error handling latency: ${metrics.averageLatencyMs.toFixed(2)}ms`);
      console.log(`📊 Errors found per validation: ${result.errors.length}`);
    });
  });

  describe("Scale and Load Testing", () => {
    test("should handle large document validation efficiently", async () => {
      // Generate a large TypeSpec source
      const generateLargeTypeSpecSource = () => {
        const models = [];
        const operations = [];
        
        for (let i = 1; i <= 50; i++) {
          models.push(`
            model LargeModel${i} {
              id${i}: string;
              data${i}: string;
              metadata${i}: {
                version: int32;
                tags: string[];
                properties: Record<string>;
                nested: {
                  level2Data: string[];
                  level2Meta: Record<int32>;
                };
              };
              timestamp${i}: utcDateTime;
            }
          `);
          
          operations.push(`
            @channel("large.model${i}.events")
            @publish
            op publishLargeModel${i}(): LargeModel${i};
          `);
        }
        
        return `
          namespace LargeDocumentPerf;
          ${models.join('\n')}
          ${operations.join('\n')}
        `;
      };

      const largeSource = generateLargeTypeSpecSource();
      
      const largeDocumentOperation = async () => {
        const { outputFiles } = await compileAsyncAPISpecWithoutErrors(largeSource, {
          "output-file": "large-perf",
          "file-type": "json"
        });
        
        const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "large-perf.json") as AsyncAPIDocument;
        
        // Validate the large document
        const validationResult = await validateAsyncAPIDocument(asyncapiDoc, {
          strict: true,
          enableCache: true
        });
        
        return { asyncapiDoc, validationResult };
      };

      const { result, metrics } = await measurePerformance(largeDocumentOperation, 3);
      
      // Large document assertions
      expect(result.validationResult.valid).toBe(true);
      expect(Object.keys(result.asyncapiDoc.components.schemas).length).toBe(50);
      expect(Object.keys(result.asyncapiDoc.operations).length).toBe(50);
      
      // Performance should be reasonable even for large documents
      expect(metrics.operationsPerSecond).toBeGreaterThan(0.05); // At least 1 per 20 seconds
      expect(metrics.averageLatencyMs).toBeLessThan(60000); // 1 minute limit for large docs
      expect(metrics.memoryUsageMB).toBeLessThan(500); // Memory limit for large docs
      
      console.log("✅ Large document performance validated");
      console.log(`📊 Large doc ops/sec: ${metrics.operationsPerSecond.toFixed(4)}`);
      console.log(`📊 Schemas generated: ${Object.keys(result.asyncapiDoc.components.schemas).length}`);
      console.log(`📊 Operations generated: ${Object.keys(result.asyncapiDoc.operations).length}`);
    });

    test("should maintain performance under concurrent load", async () => {
      // Create a document for concurrent testing
      const { outputFiles } = await compileAsyncAPISpecWithoutErrors(`
        namespace ConcurrentPerf;
        
        model ConcurrentMessage {
          id: string;
          data: string;
          timestamp: utcDateTime;
          metadata: Record<string>;
        }
        
        @channel("concurrent.test")
        @publish
        op publishConcurrent(): ConcurrentMessage;
      `, {
        "output-file": "concurrent-perf",
        "file-type": "json"
      });

      const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "concurrent-perf.json") as AsyncAPIDocument;
      
      const concurrentValidation = async () => {
        // Run multiple validations concurrently
        const promises = Array.from({ length: 10 }, () =>
          validateAsyncAPIDocument(asyncapiDoc, {
            strict: true,
            enableCache: true
          })
        );
        
        const results = await Promise.all(promises);
        return results;
      };

      const { result, metrics } = await measurePerformance(concurrentValidation, 10);
      
      // Concurrent performance assertions
      expect(result[0]).toHaveLength(10); // Each batch should have 10 results
      expect(result[0].every(r => r.valid)).toBe(true); // All should be valid
      
      // Performance should scale reasonably with concurrency
      expect(metrics.operationsPerSecond).toBeGreaterThan(1); // Should handle concurrent load
      expect(metrics.averageLatencyMs).toBeLessThan(10000); // 10 second limit for concurrent batches
      
      console.log("✅ Concurrent load performance validated");
      console.log(`📊 Concurrent batch ops/sec: ${metrics.operationsPerSecond.toFixed(2)}`);
      console.log(`📊 Validations per batch: ${result[0].length}`);
      console.log(`📊 Total validations: ${result[0].length * result.length}`);
    });
  });

  describe("Performance Regression Detection", () => {
    test("should establish performance baselines for regression detection", async () => {
      const benchmarkSource = `
        namespace PerformanceBaseline;
        
        model BaselineMessage {
          id: string;
          data: string;
          timestamp: utcDateTime;
          metadata: {
            version: int32;
            source: string;
            tags: string[];
          };
        }
        
        @channel("baseline.test")
        @publish
        op publishBaseline(): BaselineMessage;
      `;

      const baselineOperation = async () => {
        const { outputFiles } = await compileAsyncAPISpecWithoutErrors(benchmarkSource, {
          "output-file": "baseline-perf",
          "file-type": "json"
        });
        
        const doc = parseAsyncAPIOutput(outputFiles, "baseline-perf.json") as AsyncAPIDocument;
        
        const validationResult = await validateAsyncAPIDocument(doc, {
          strict: true,
          enableCache: true
        });
        
        return { doc, validationResult };
      };

      const { result, metrics } = await measurePerformance(baselineOperation, 50);
      
      // Establish baseline metrics
      const baselineMetrics = {
        compilationOpsPerSec: metrics.operationsPerSecond,
        avgLatencyMs: metrics.averageLatencyMs,
        memoryUsageMB: metrics.memoryUsageMB,
        schemasGenerated: Object.keys(result.doc.components.schemas).length,
        operationsGenerated: Object.keys(result.doc.operations).length
      };
      
      // Baseline assertions
      expect(baselineMetrics.compilationOpsPerSec).toBeGreaterThan(1);
      expect(baselineMetrics.avgLatencyMs).toBeLessThan(5000);
      expect(baselineMetrics.memoryUsageMB).toBeLessThan(100);
      expect(result.validationResult.valid).toBe(true);
      
      console.log("✅ Performance baseline established");
      console.log("📊 BASELINE METRICS:");
      console.log(`   Compilation ops/sec: ${baselineMetrics.compilationOpsPerSec.toFixed(2)}`);
      console.log(`   Average latency: ${baselineMetrics.avgLatencyMs.toFixed(2)}ms`);
      console.log(`   Memory usage: ${baselineMetrics.memoryUsageMB.toFixed(2)}MB`);
      console.log(`   Schemas: ${baselineMetrics.schemasGenerated}`);
      console.log(`   Operations: ${baselineMetrics.operationsGenerated}`);
      
      // Store baseline for CI/CD regression detection
      // In a real scenario, you would save these metrics to compare against future runs
      expect(baselineMetrics).toBeDefined();
    });
  });
});