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
import { validateAsyncAPIEffect, type ValidationError } from "./validation/asyncapi-validator.js";
import { $lib } from "./lib.js";
import { 
  PerformanceMetricsService, 
  PerformanceMetricsServiceLive,
  type ThroughputResult 
} from "./performance/metrics.js";
import {
  MemoryMonitorService,
  MemoryMonitorServiceLive,
  withMemoryTracking
} from "./performance/memory-monitor.js";

// AsyncAPI document types
type AsyncAPISchema = {
  type?: string;
  format?: string;
  description?: string;
  properties?: Record<string, AsyncAPISchema>;
  required?: string[];
  payload?: { $ref: string };
  [key: string]: unknown;
}

type AsyncAPIDocument = {
  asyncapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  channels: Record<string, unknown>;
  operations: Record<string, unknown>;
  components: {
    schemas: Record<string, AsyncAPISchema>;
    messages: Record<string, unknown>;
  };
}

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
    // Use Effect.TS for the entire emission pipeline
    const emitProgram = pipe(
      this.discoverOperationsEffect(),
      Effect.flatMap(ops => this.processOperationsEffect(ops)),
      Effect.flatMap(() => this.generateDocumentEffect()),
      Effect.flatMap(doc => this.validateDocumentEffect(doc)),
      Effect.flatMap(doc => this.writeDocumentEffect(doc)),
      Effect.catchAll(error => 
        Effect.gen(function* () {
          yield* Console.error(`❌ Emission failed: ${error}`);
          throw error;
        })
      )
    );

    // Run the Effect pipeline
    await Effect.runPromise(emitProgram);
  }

  /**
   * Discover operations using Effect.TS with performance monitoring
   */
  private discoverOperationsEffect(): Effect.Effect<Operation[], Error, PerformanceMetricsService | MemoryMonitorService> {
    return Effect.gen((function* (this: AsyncAPIEffectEmitter) {
      const metricsService = yield* PerformanceMetricsService;
      const memoryMonitor = yield* MemoryMonitorService;
      
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
    }).bind(this));
  }

  /**
   * Process operations using Effect.TS
   */
  private processOperationsEffect(operations: Operation[]): Effect.Effect<void, Error> {
    return Effect.gen((function* (this: AsyncAPIEffectEmitter) {
      console.log(`🏗️ Processing ${operations.length} operations...`);
      
      for (const op of operations) {
        yield* Effect.sync(() => {
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
          
          // Add channel
          this.asyncApiDoc.channels[channelName] = {
            address: channelPath,
            description: getDoc(program, op) ?? `Channel for ${op.name}`,
            messages: {
              [`${op.name}Message`]: {
                $ref: `#/components/messages/${op.name}Message`
              }
            }
          };
          
          // Add operation
          this.asyncApiDoc.operations[op.name] = {
            action,
            channel: { $ref: `#/channels/${channelName}` },
            summary: getDoc(program, op) ?? `Operation ${op.name}`,
            description: `TypeSpec operation with ${op.parameters.properties.size} parameters`
          };
          
          // Add message to components
          this.asyncApiDoc.components.messages[`${op.name}Message`] = {
            name: `${op.name}Message`,
            title: `${op.name} Message`,
            summary: `Message for ${op.name} operation`,
            contentType: "application/json"
          };
          
          // Process return type if it's a model
          if (op.returnType.kind === "Model") {
            const model = op.returnType;
            this.asyncApiDoc.components.schemas[model.name] = this.convertModelToSchema(model, program);
            
            // Link message to schema
            const message = this.asyncApiDoc.components.messages[`${op.name}Message`];
            if (message && typeof message === 'object') {
              (message as any).payload = {
                $ref: `#/components/schemas/${model.name}`
              };
            }
          }
          
          console.log(`✅ Processed operation: ${op.name} (${action})`);
        });
      }
      
      console.log(`📊 Processed ${operations.length} operations successfully`);
    }).bind(this));
  }

  /**
   * Generate the final document using Effect.TS
   */
  private generateDocumentEffect(): Effect.Effect<string, Error> {
    return Effect.sync(() => {
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
  }

  /**
   * Validate the document using asyncapi-validator
   */
  private validateDocumentEffect(content: string): Effect.Effect<string, Error> {
    return Effect.gen(function* () {
      console.log(`🔍 Validating AsyncAPI document...`);
      
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
  }

  /**
   * Write the document to file using Effect.TS
   */
  private writeDocumentEffect(content: string): Effect.Effect<void, Error> {
    return Effect.tryPromise({
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
        console.log(`  - Operations: ${Object.keys(this.asyncApiDoc.operations).length}`);
        console.log(`  - Channels: ${Object.keys(this.asyncApiDoc.channels).length}`);
        console.log(`  - Schemas: ${Object.keys(this.asyncApiDoc.components.schemas).length}`);
        console.log(`  - Messages: ${Object.keys(this.asyncApiDoc.components.messages).length}`);
      },
      catch: (error) => new Error(`Failed to write output: ${error}`)
    });
  }

  /**
   * Convert TypeSpec model to AsyncAPI schema
   */
  private convertModelToSchema(model: Model, program: Program): AsyncAPISchema {
    const properties: Record<string, AsyncAPISchema> = {};
    const required: string[] = [];
    
    model.properties.forEach((prop, name) => {
      const propSchema: AsyncAPISchema = {
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
    
    return {
      type: "object",
      description: getDoc(program, model) ?? `Schema ${model.name}`,
      properties,
      required: required.length > 0 ? required : undefined
    };
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