/**
 * TypeSpec AsyncAPI Emitter with Effect.TS Integration
 * 
 * This is the REAL emitter that connects the ghost Effect.TS system
 * with proper AsyncAPI validation using asyncapi-validator.
 * 
 * FIXES APPLIED:
 * - Fixed stateKeys access: program.stateMap($lib.stateKeys.xxx) instead of Symbol.for()
 * - $lib.stateKeys provides proper symbols, not strings like the local stateKeys export
 * - Connected decorator state properly: channel paths and operation types  
 * - Made validation fail the Effect pipeline when AsyncAPI document is invalid
 * - Added proper logging to show decorator data being accessed
 * - Added explicit type annotations for validation error parameters
 */

import { Effect, Console, pipe, Layer } from "effect";
import type { EmitContext, Program, Operation, Model, Namespace } from "@typespec/compiler";
import { createAssetEmitter, TypeEmitter, type AssetEmitter } from "@typespec/asset-emitter";
import { emitFile, getDoc } from "@typespec/compiler";
import { stringify } from "yaml";
import type { AsyncAPIEmitterOptions } from "./options.js";
import type { AsyncAPIDocument, SchemaObject } from "./types/index.js";
import { validateAsyncAPIEffect, type ValidationError } from "./validation/index.js";
import { $lib } from "./lib.js";
import { 
  PERFORMANCE_METRICS_SERVICE,
  PERFORMANCE_METRICS_SERVICE_LIVE
} from "./performance/metrics.js";
import {
  MEMORY_MONITOR_SERVICE,
  MEMORY_MONITOR_SERVICE_LIVE
} from "./performance/memory-monitor.js";

// Using centralized types from types/index.ts
// AsyncAPIDocument and SchemaObject (as AsyncAPISchema) are now imported

/**
 * Enhanced AsyncAPI TypeEmitter with Effect.TS integration
 * Combines the best of both worlds: AssetEmitter architecture + Effect.TS
 */
export class AsyncAPIEffectEmitter extends TypeEmitter<string, AsyncAPIEmitterOptions> {
  private operations: Operation[] = [];
  private readonly asyncApiDoc: AsyncAPIDocument;

  constructor(emitter: AssetEmitter<string, AsyncAPIEmitterOptions>) {
    super(emitter);
    this.asyncApiDoc = this.createInitialDocument();
  }

  private createInitialDocument(): AsyncAPIDocument {
    return {
      asyncapi: "3.0.0",
      info: {
        title: "AsyncAPI Specification",
        version: "1.0.0",
        description: "Generated from TypeSpec with Effect.TS integration"
      },
      channels: {},
      operations: {},
      components: {
        schemas: {},
        messages: {}
      }
    };
  }

  override async writeOutput(): Promise<void> {
    // Use Effect.TS for the entire emission pipeline with performance monitoring
    const emitProgram = pipe(
      Effect.gen((function* (this: AsyncAPIEffectEmitter) {
        const metricsService = yield* PERFORMANCE_METRICS_SERVICE;
        const memoryMonitor = yield* MEMORY_MONITOR_SERVICE;
        
        console.log(`🚀 Starting AsyncAPI emission pipeline with comprehensive performance monitoring...`);
        
        // Start overall pipeline measurement
        const overallMeasurement = yield* metricsService.startMeasurement("emission_pipeline");
        
        // Start continuous memory monitoring during emission
        yield* memoryMonitor.startMonitoring(5000); // Monitor every 5 seconds
        
        // Execute the emission stages
        const ops = yield* this.discoverOperationsEffect();
        yield* this.processOperationsEffect(ops);
        const doc = yield* this.generateDocumentEffect();
        const validatedDoc = yield* this.validateDocumentEffect(doc);
        yield* this.writeDocumentEffect(validatedDoc);
        
        // Stop memory monitoring
        yield* memoryMonitor.stopMonitoring();
        
        // Record overall pipeline performance
        const overallResult = yield* metricsService.recordThroughput(overallMeasurement, this.operations.length);
        
        // Generate comprehensive performance reports
        console.log(`\n🎯 === COMPREHENSIVE PERFORMANCE REPORT ===`);
        console.log(`📊 Pipeline Performance:`);
        console.log(`  - Total Operations Processed: ${this.operations.length}`);
        console.log(`  - Overall Throughput: ${overallResult.operationsPerSecond.toFixed(0)} ops/sec`);
        console.log(`  - Total Duration: ${overallResult.totalDuration.toFixed(2)} ms`);
        console.log(`  - Average Memory/Operation: ${overallResult.averageMemoryPerOperation.toFixed(0)} bytes`);
        console.log(`  - Memory Efficiency: ${(overallResult.memoryEfficiency * 100).toFixed(1)}%`);
        
        // Generate detailed performance report
        const performanceReport = yield* metricsService.generatePerformanceReport();
        const memoryReport = yield* memoryMonitor.generateMemoryReport();
        
        console.log(`\n📋 Detailed Performance Analysis:`);
        console.log(performanceReport);
        
        console.log(`\n🧠 Memory Usage Analysis:`);
        console.log(memoryReport);
        
        // Get final metrics summary
        const metricsSummary = yield* metricsService.getMetricsSummary();
        const memoryMetrics = yield* memoryMonitor.getMemoryMetrics();
        
        console.log(`\n📈 Final Metrics Summary:`);
        console.log(`  Performance Metrics:`, metricsSummary);
        console.log(`  Memory Metrics:`, memoryMetrics);
        
        console.log(`\n✅ AsyncAPI emission pipeline completed with full performance monitoring!`);
      }).bind(this)),
      Effect.catchAll(error => 
        Effect.gen(function* () {
          yield* Console.error(`❌ Emission pipeline failed: ${error}`);
          // Try to stop monitoring if it was started
          yield* MEMORY_MONITOR_SERVICE.pipe(
            Effect.flatMap(monitor => monitor.stopMonitoring()),
            Effect.ignore
          );
          return yield* Effect.fail(new Error(`Emission pipeline failed: ${error}`));
        })
      )
    );

    // Create the performance layers and run the pipeline with them
    const performanceLayers = Layer.merge(
      PERFORMANCE_METRICS_SERVICE_LIVE,
      MEMORY_MONITOR_SERVICE_LIVE
    );
    
    // Run the Effect pipeline with performance monitoring
    await Effect.runPromise(
      Effect.provide(emitProgram, performanceLayers)
    );
  }

  /**
   * Discover operations using Effect.TS with performance monitoring
   */
  private discoverOperationsEffect() {
    return Effect.gen((function* (this: AsyncAPIEffectEmitter) {
      const metricsService = yield* PERFORMANCE_METRICS_SERVICE;
      const memoryMonitor = yield* MEMORY_MONITOR_SERVICE;
      
      // Start performance measurement for discovery stage
      const measurement = yield* metricsService.startMeasurement("operation_discovery");
      console.log(`🔍 Starting operation discovery with performance monitoring...`);
      
      const discoveryOperation = Effect.sync(() => {
        const program = this.emitter.getProgram();
        const operations: Operation[] = [];
        
        const walkNamespace = (ns: Namespace) => {
          if (ns.operations) {
            ns.operations.forEach((op: Operation, name: string) => {
              operations.push(op);
              console.log(`🔍 Found operation: ${name}`);
            });
          }
          
          if (ns.namespaces) {
            ns.namespaces.forEach((childNs: Namespace) => {
              walkNamespace(childNs);
            });
          }
        };
        
        walkNamespace(program.getGlobalNamespaceType());
        this.operations = operations;
        
        console.log(`📊 Total operations discovered: ${operations.length}`);
        return operations;
      });
      
      // Execute discovery with memory tracking
      const { result: operations } = yield* memoryMonitor.measureOperationMemory(
        discoveryOperation,
        "operation_discovery"
      );
      
      // Record throughput metrics for discovery stage
      const throughputResult = yield* metricsService.recordThroughput(measurement, operations.length);
      console.log(`📊 Discovery stage completed: ${throughputResult.operationsPerSecond.toFixed(0)} ops/sec, ${throughputResult.averageMemoryPerOperation.toFixed(0)} bytes/op`);
      
      return operations;
    }).bind(this)).pipe(Effect.mapError(error => new Error(`Operation discovery failed: ${error}`)));
  }

  /**
   * Process operations using Effect.TS with performance monitoring
   */
  private processOperationsEffect(operations: Operation[]) {
    return Effect.gen((function* (this: AsyncAPIEffectEmitter) {
      const metricsService = yield* PERFORMANCE_METRICS_SERVICE;
      const memoryMonitor = yield* MEMORY_MONITOR_SERVICE;
      
      // Start performance measurement for processing stage
      const measurement = yield* metricsService.startMeasurement("operation_processing");
      console.log(`🏗️ Processing ${operations.length} operations with performance monitoring...`);

	  //TODO: this functions is getting to big for my liking

      for (const op of operations) {
        const singleOpProcessing = Effect.sync(() => {
          // Get data from decorators
          const program = this.emitter.getProgram();
          const operationTypesMap = program.stateMap($lib.stateKeys.operationTypes);
          const channelPathsMap = program.stateMap($lib.stateKeys.channelPaths);
          
          const operationType = operationTypesMap.get(op) as string | undefined;
          const decoratedChannelPath = channelPathsMap.get(op) as string | undefined;
          
          console.log(`🔍 Operation ${op.name}: type=${operationType ?? 'none'}, channel=${decoratedChannelPath ?? 'default'}`);
          
          // Create channel - use decorator path or fallback
          const channelName = `channel_${op.name}`;
          const channelPath = decoratedChannelPath ?? `/${op.name.toLowerCase()}`;
          
          // Determine action
          const action = operationType === "subscribe" ? "receive" : "send";
          
          // Add channel (ensure channels object exists)
          if (!this.asyncApiDoc.channels) this.asyncApiDoc.channels = {};
          this.asyncApiDoc.channels[channelName] = {
            address: channelPath,
            description: getDoc(program, op) ?? `Channel for ${op.name}`,
            messages: {
              [`${op.name}Message`]: {
                $ref: `#/components/messages/${op.name}Message`
              }
            }
          };
          
          // Add operation (ensure operations object exists)
          if (!this.asyncApiDoc.operations) this.asyncApiDoc.operations = {};
          this.asyncApiDoc.operations[op.name] = {
            action,
            channel: { $ref: `#/channels/${channelName}` },
            summary: getDoc(program, op) ?? `Operation ${op.name}`,
            description: `TypeSpec operation with ${op.parameters.properties.size} parameters`
          };
          
          // Add message to components (ensure components structure exists)
          if (!this.asyncApiDoc.components) this.asyncApiDoc.components = {};
          if (!this.asyncApiDoc.components.messages) this.asyncApiDoc.components.messages = {};
          this.asyncApiDoc.components.messages[`${op.name}Message`] = {
            name: `${op.name}Message`,
            title: `${op.name} Message`,
            summary: `Message for ${op.name} operation`,
            contentType: "application/json"
          };
          
          // Process return type if it's a model
          if (op.returnType.kind === "Model") {
            const model = op.returnType;
            if (!this.asyncApiDoc.components.schemas) this.asyncApiDoc.components.schemas = {};
            this.asyncApiDoc.components.schemas[model.name] = this.convertModelToSchema(model, program);
            
            // Link message to schema
            const message = this.asyncApiDoc.components.messages?.[`${op.name}Message`];
            if (message && typeof message === 'object' && 'payload' in message) {
              (message as { payload?: { $ref?: string } }).payload = {
                $ref: `#/components/schemas/${model.name}`
              };
            }
          }
          
          console.log(`✅ Processed operation: ${op.name} (${action})`);
          return op.name;
        });
        
        // Execute each operation processing with memory tracking
        yield* memoryMonitor.measureOperationMemory(
          singleOpProcessing,
          `operation_processing_${op.name}`
        );
      }
      
      // Record throughput metrics for processing stage
      const throughputResult = yield* metricsService.recordThroughput(measurement, operations.length);
      console.log(`📊 Processing stage completed: ${throughputResult.operationsPerSecond.toFixed(0)} ops/sec, ${throughputResult.averageMemoryPerOperation.toFixed(0)} bytes/op`);
      console.log(`📊 Processed ${operations.length} operations successfully`);
    }).bind(this)).pipe(Effect.mapError(error => new Error(`Operation processing failed: ${error}`)));
  }

  /**
   * Generate the final document using Effect.TS with performance monitoring
   */
  private generateDocumentEffect() {
    return Effect.gen((function* (this: AsyncAPIEffectEmitter) {
      const metricsService = yield* PERFORMANCE_METRICS_SERVICE;
      const memoryMonitor = yield* MEMORY_MONITOR_SERVICE;
      
      // Start performance measurement for document generation stage
      const measurement = yield* metricsService.startMeasurement("document_generation");
      console.log(`📄 Generating AsyncAPI document with performance monitoring...`);

	    //TODO: this functions is getting to big for my liking
	    const documentGeneration = Effect.sync(() => {
        const options = this.emitter.getOptions();
        const fileType = options["file-type"] ?? "yaml";
        
        // Update info with actual stats
        this.asyncApiDoc.info.description = 
          `Generated from TypeSpec with ${this.operations.length} operations`;
        
        let content: string;
        if (fileType === "json") {
          content = JSON.stringify(this.asyncApiDoc, null, 2);
        } else {
          content = stringify(this.asyncApiDoc);
        }
        
        console.log(`📄 Generated ${fileType.toUpperCase()} document (${content.length} bytes)`);
        return content;
      });
      
      // Execute document generation with memory tracking
      const { result: content } = yield* memoryMonitor.measureOperationMemory(
        documentGeneration,
        "document_generation"
      );
      
      // Record throughput metrics for document generation stage
      const throughputResult = yield* metricsService.recordThroughput(measurement, 1); // 1 document generated
      console.log(`📊 Document generation completed: ${throughputResult.averageLatencyMicroseconds.toFixed(2)} μs, ${throughputResult.averageMemoryPerOperation.toFixed(0)} bytes`);
      
      return content;
    }).bind(this));
  }

  /**
   * Validate the document using asyncapi-validator with performance monitoring
   */
  private validateDocumentEffect(content: string) {
    return Effect.gen((function* (this: AsyncAPIEffectEmitter) {
      const metricsService = yield* PERFORMANCE_METRICS_SERVICE;
      const memoryMonitor = yield* MEMORY_MONITOR_SERVICE;
      
      // Start performance measurement for validation stage
      const measurement = yield* metricsService.startMeasurement("document_validation");
      console.log(`🔍 Validating AsyncAPI document with performance monitoring...`);

	    //TODO: this functions is getting to big for my liking
	    const validationOperation = Effect.gen(function* () {
        // Use the REAL asyncapi-validator!
        const validation = yield* validateAsyncAPIEffect(content);
        
        if (!validation.valid) {
          console.error(`❌ AsyncAPI validation FAILED:`);
          validation.errors.forEach((err: ValidationError) => {
            console.error(`  - ${err.message}`);
          });
          
          // Fail the Effect pipeline if validation fails
          return yield* Effect.fail(new Error(`AsyncAPI validation failed with ${validation.errors.length} errors`));
        } else {
          console.log(`✅ AsyncAPI document is VALID!`);
        }
        
        return content;
      });
      
      // Execute validation with memory tracking
      const { result: validatedContent } = yield* memoryMonitor.measureOperationMemory(
        validationOperation,
        "document_validation"
      );
      
      // Record throughput metrics for validation stage
      const throughputResult = yield* metricsService.recordThroughput(measurement, 1); // 1 document validated
      console.log(`📊 Validation stage completed: ${throughputResult.averageLatencyMicroseconds.toFixed(2)} μs, ${throughputResult.averageMemoryPerOperation.toFixed(0)} bytes`);
      
      return validatedContent;
    }).bind(this));
  }

  /**
   * Write the document to file using Effect.TS with performance monitoring
   */
  private writeDocumentEffect(content: string) {
    return Effect.gen((function* (this: AsyncAPIEffectEmitter) {
      const metricsService = yield* PERFORMANCE_METRICS_SERVICE;
      const memoryMonitor = yield* MEMORY_MONITOR_SERVICE;
      
      // Start performance measurement for document writing stage
      const measurement = yield* metricsService.startMeasurement("document_writing");
      console.log(`📁 Writing AsyncAPI document with performance monitoring...`);

	    //TODO: this functions is getting to big for my liking
	    const writeOperation = Effect.tryPromise({
        try: async () => {
          const options = this.emitter.getOptions();
          const program = this.emitter.getProgram();
          const fileType = options["file-type"] ?? "yaml";
          const outputFile = options["output-file"] ?? `asyncapi.${fileType}`;
          
          await emitFile(program, {
            path: outputFile,
            content
          });
          
          console.log(`✅ Written AsyncAPI to: ${outputFile}`);
          console.log(`📊 Final stats:`);
          console.log(`  - Operations: ${Object.keys(this.asyncApiDoc.operations || {}).length}`);
          console.log(`  - Channels: ${Object.keys(this.asyncApiDoc.channels || {}).length}`);
          console.log(`  - Schemas: ${Object.keys(this.asyncApiDoc.components?.schemas || {}).length}`);
          console.log(`  - Messages: ${Object.keys(this.asyncApiDoc.components?.messages || {}).length}`);
        },
        catch: (error) => new Error(`Failed to write output: ${error}`)
      });
      
      // Execute document writing with memory tracking
      const { result } = yield* memoryMonitor.measureOperationMemory(
        writeOperation,
        "document_writing"
      );
      
      // Record throughput metrics for document writing stage
      const throughputResult = yield* metricsService.recordThroughput(measurement, 1); // 1 document written
      console.log(`📊 Document writing completed: ${throughputResult.averageLatencyMicroseconds.toFixed(2)} μs, ${throughputResult.averageMemoryPerOperation.toFixed(0)} bytes`);
      
      return result;
    }).bind(this));
  }

  /**
   * Convert TypeSpec model to AsyncAPI schema
   */
  private convertModelToSchema(model: Model, program: Program): SchemaObject {
    const properties: Record<string, SchemaObject> = {};
    const required: string[] = [];

	  //TODO: this functions is getting to big for my liking
	  model.properties.forEach((prop, name) => {
      const propSchema: SchemaObject = {
        description: getDoc(program, prop) ?? `Property ${name}`
      };
      
      // Determine type
      if (prop.type.kind === "String") {
        propSchema.type = "string";
      } else if (prop.type.kind === "Number") {
        propSchema.type = "number";
      } else if (prop.type.kind === "Boolean") {
        propSchema.type = "boolean";
      } else if (prop.type.kind === "Model") {
        if ((prop.type).name === "utcDateTime") {
          propSchema.type = "string";
          propSchema.format = "date-time";
        } else {
          propSchema.type = "object";
        }
      } else {
        propSchema.type = "object";
      }
      
      properties[name] = propSchema;
      
      if (!prop.optional) {
        required.push(name);
      }
    });
    
    const schema: SchemaObject = {
      type: "object",
      description: getDoc(program, model) ?? `Schema ${model.name}`,
      properties
    };
    
    if (required.length > 0) {
      schema.required = required;
    }
    
    return schema;
  }
}

/**
 * Main emission function using Effect.TS integrated emitter
 */
export async function generateAsyncAPIWithEffect(context: EmitContext<AsyncAPIEmitterOptions>): Promise<void> {
  console.log("🚀 AsyncAPI Emitter with Effect.TS Integration");
  console.log("✨ Using REAL asyncapi-validator library!");
  console.log("🔧 Connecting ghost Effect.TS system to main emitter");
  
  const assetEmitter = createAssetEmitter(
    context.program,
    AsyncAPIEffectEmitter,
    context
  );
  
  assetEmitter.emitProgram();
  await assetEmitter.writeOutput();
  
  console.log("🎉 AsyncAPI generation complete with Effect.TS + validation!");
}