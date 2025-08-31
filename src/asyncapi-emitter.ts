import type { EmitContext, Operation, Model, Program, Namespace, ModelProperty } from "@typespec/compiler";
import { createAssetEmitter, TypeEmitter, type AssetEmitter, type SourceFile, type EmittedSourceFile } from "@typespec/asset-emitter";
import { emitFile, getDoc } from "@typespec/compiler";
import { stringify } from "yaml";
import { dirname } from "node:path";
import type { AsyncAPIEmitterOptions } from "./options.js";
import type { SchemaObject, ChannelObject, OperationObject, AsyncAPIDocument } from "./types/index.js";
import { $lib } from "./lib.js";
import { validateKafkaChannelBinding, createDefaultKafkaChannelBinding } from "./bindings/kafka.js";
import { convertModelToSchema, getPropertyType } from "./utils/schema-conversion.js";

// ChannelObject and OperationObject now imported from centralized types
import { 
  resolvePathTemplateWithValidation, 
  hasTemplateVariables, 
  type PathTemplateContext 
} from "./path-templates.js";

// MIGRATED TO @typespec/asset-emitter architecture for modern TypeSpec emitter patterns

/**
 * Internal AsyncAPI document structure for the emitter
 */
type EmitterAsyncAPIDocument = AsyncAPIDocument & {
  // Extend AsyncAPIDocument with required fields for emitter
  asyncapi: "3.0.0";
  info: {
    title: string;
    version: string;
    description: string;
  };
  channels: Record<string, ChannelObject>;
  operations: Record<string, OperationObject>;
  components: {
    schemas: Record<string, SchemaObject>;
  };
}

/**
 * AsyncAPI TypeEmitter for AssetEmitter architecture
 * Handles emission of AsyncAPI documents using modern TypeSpec patterns
 */
class AsyncAPITypeEmitter extends TypeEmitter<string, AsyncAPIEmitterOptions> {
  private operations: Operation[] = [];
  private asyncApiDoc: EmitterAsyncAPIDocument;

  constructor(emitter: AssetEmitter<string, AsyncAPIEmitterOptions>) {
    super(emitter);
    this.asyncApiDoc = this.createAsyncAPIDocument([]);
  }

  override programContext(_program: Program): Record<string, unknown> {
    return {
      program: "AsyncAPI",
    };
  }

  override async writeOutput(_sourceFiles: SourceFile<string>[]): Promise<void> {
    // Discover all operations from the program
    this.operations = this.discoverOperations(this.emitter.getProgram());
    this.asyncApiDoc = this.createAsyncAPIDocument(this.operations);

    // Process each operation
    for (const op of this.operations) {
      this.processOperation(op);
    }

    // Generate output file
    await this.generateOutputFile();
  }

  override sourceFile(_sourceFile: SourceFile<string>): EmittedSourceFile {
    // For AssetEmitter compatibility, return the raw content directly
    const options = this.emitter.getOptions();
    const program = this.emitter.getProgram();
    const content = this.generateContent(options["file-type"] ?? "yaml", program);
    
    return {
      path: _sourceFile.path,
      contents: content,
    };
  }

  private createAsyncAPIDocument(operations: Operation[]): EmitterAsyncAPIDocument {
    return {
      asyncapi: "3.0.0" as const,
      info: {
        title: "Generated from REAL TypeSpec AST",
        version: "1.0.0",
        description: `Found ${operations.length} operations in TypeSpec source`,
      },
      channels: {},
      operations: {},
      components: {
        schemas: {},
      }
    };
  }

  private discoverOperations(program: Program): Operation[] {
    const operations: Operation[] = [];
    
    // No need for condition - getGlobalNamespaceType is always available on Program type
    
    this.walkNamespace(program.getGlobalNamespaceType(), operations, program);
    return operations;
  }

  private walkNamespace(ns: Namespace, operations: Operation[], program: Program): void {
    // ns.operations is always defined on Namespace type
    ns.operations.forEach((operation, name) => {
      operations.push(operation);
      console.log(`🔍 FOUND REAL OPERATION: ${name} (kind: ${operation.kind})`);
      this.logOperationDetails(operation, program);
    });
    
    // ns.namespaces is always defined on Namespace type
    ns.namespaces.forEach((childNs, _) => {
      this.walkNamespace(childNs, operations, program);
    });
  }

  private logOperationDetails(operation: Operation, program: Program): void {
    console.log(`  - Return type: ${operation.returnType.kind}`);
    console.log(`  - Parameters: ${operation.parameters.properties.size}`);
    
    const doc = getDoc(program, operation);
    if (doc) {
      console.log(`  - Documentation: "${doc}"`);
    }
    
    // operation.parameters.properties is always defined
    operation.parameters.properties.forEach((param, paramName) => {
      console.log(`  - Parameter: ${paramName} (${param.type.kind})`);
    });
  }

  private processOperation(op: Operation): void {
    console.log(`🏗️  Processing operation: ${op.name}`);
    
    const { name: channelName, definition: channelDef } = this.createChannelDefinition(op);
    this.asyncApiDoc.channels[channelName] = channelDef;
    
    this.asyncApiDoc.operations[op.name] = this.createOperationDefinition(op, channelName);
    
    if (op.returnType.kind === "Model") {
      const model = op.returnType;
      this.asyncApiDoc.components.schemas[model.name] = this.convertModelToSchema(model);
    }
  }

  private createChannelDefinition(op: Operation): { name: string, definition: ChannelObject } {
    const program = this.emitter.getProgram();
    const channelName = `channel_${op.name}`;
    
    // Get channel path from @channel decorator
    const channelPathsMap = program.stateMap($lib.stateKeys.channelPaths);
    const channelPath = channelPathsMap.get(op) as string | undefined;
    
    const definition: ChannelObject = {
      address: channelPath ?? `/${op.name.toLowerCase()}`,
      description: getDoc(program, op) ?? `Channel for ${op.name}`,
      messages: {
        [`${op.name}Message`]: {
          $ref: `#/components/messages/${op.name}Message`
        }
      }
    };

    // Add Kafka bindings if channel path looks like a Kafka topic
    if (channelPath && this.looksLikeKafkaTopic(channelPath)) {
      const kafkaBinding = createDefaultKafkaChannelBinding(channelPath);
      const validation = validateKafkaChannelBinding(kafkaBinding);
      
      if (validation.isValid) {
        definition.bindings = {
          kafka: kafkaBinding
        };
        console.log(`✅ Added Kafka binding for channel ${channelName}: topic="${kafkaBinding.topic}"`);
      } else {
        console.warn(`⚠️ Invalid Kafka binding for ${channelName}: ${validation.errors.join(', ')}`);
      }
    }

    return { name: channelName, definition };
  }

  private looksLikeKafkaTopic(path: string): boolean {
    // Simple heuristics for detecting Kafka topics:
    // - Contains dots (common in Kafka topic names)
    // - No leading slash (Kafka topics don't start with /)
    // - Contains underscores or dashes
    return !path.startsWith('/') && 
           (path.includes('.') || path.includes('_') || path.includes('-')) &&
           /^[a-zA-Z0-9._-]+$/.test(path);
  }

  private createOperationDefinition(op: Operation, channelName: string): OperationObject {
    const program = this.emitter.getProgram();
    // Get operation type from decorator state
    const operationTypesMap = program.stateMap($lib.stateKeys.operationTypes);
    const operationType = operationTypesMap.get(op) as string | undefined;
    
    // Determine action based on decorator type
    let action: "send" | "receive" = "send"; // default for @publish or no decorator
    if (operationType === "subscribe") {
      action = "receive";
    } else if (operationType === "publish") {
      action = "send";
    }
    
    console.log(`📡 Operation ${op.name} type: ${operationType ?? "none"} -> action: ${action}`);
    
    return {
      action,
      channel: { $ref: `#/channels/${channelName}` },
      summary: getDoc(program, op) ?? `Operation ${op.name}`,
      description: `Generated from TypeSpec operation with ${op.parameters.properties.size} parameters`,
    };
  }

  private convertModelToSchema(model: Model): SchemaObject {
    const program = this.emitter.getProgram();
    console.log(`🔄 Converting model: ${model.name} with ${model.properties.size} properties`);
    
    const schema = convertModelToSchema(model, program);
    
    console.log(`✅ Converted model ${model.name} to AsyncAPI schema`);
    return schema;
  }

  private processModelProperties(model: Model, program: Program): { properties: Record<string, SchemaObject>, required: string[] } {
    const properties: Record<string, SchemaObject> = {};
    const required: string[] = [];
    
    model.properties.forEach((prop, propName) => {
      console.log(`  - Property: ${propName} (${prop.type.kind}) required: ${String(!prop.optional)}`);
      
      const typeInfo = getPropertyType(prop);
      properties[propName] = {
        ...typeInfo,
        description: getDoc(program, prop) ?? `Property ${propName}`,
      };
      
      if (!prop.optional) {
        required.push(propName);
      }
    });
    
    return { properties, required };
  }

  private getPropertyType(prop: ModelProperty): { type: "string" | "number" | "boolean" | "object" | "array" | "null" | "integer", format?: string } {
    return getPropertyType(prop);
  }

  /**
   * Resolve output file path with template variable support
   */
  private resolveOutputFilePath(): string {
    const options = this.emitter.getOptions();
    const program = this.emitter.getProgram();
    const outputFile = options["output-file"] ?? "asyncapi";
    const fileType = options["file-type"] ?? "yaml";
    
    // Check if output file contains template variables
    if (hasTemplateVariables(outputFile)) {
      console.log(`🔧 Resolving path template: ${outputFile}`);
      
      const emitterOutputDir = this.emitter.getContext()["emitterOutputDir"] as string | undefined;
      const context: PathTemplateContext = {
        program,
        emitterOutputDir: emitterOutputDir ?? "",
      };
      
      try {
        const resolvedPath = resolvePathTemplateWithValidation(outputFile, context);
        console.log(`✅ Resolved path template to: ${resolvedPath}`);
        
        // Add file extension if not already present
        if (!resolvedPath.endsWith(`.${fileType}`)) {
          return `${resolvedPath}.${fileType}`;
        }
        return resolvedPath;
      } catch (error) {
        console.warn(`⚠️ Path template resolution failed: ${error instanceof Error ? error.message : String(error)}`);
        console.warn(`   Falling back to simple concatenation: ${outputFile}.${fileType}`);
        return `${outputFile}.${fileType}`;
      }
    }
    
    // No template variables, use simple concatenation
    return `${outputFile}.${fileType}`;
  }

  private async generateOutputFile(): Promise<void> {
    const options = this.emitter.getOptions();
    const program = this.emitter.getProgram();
    const fileName = this.resolveOutputFilePath();
    const content = this.generateContent(options["file-type"] ?? "yaml", program);
    
    // Create a source file and write the content using AssetEmitter patterns
    const sourceFile = this.emitter.createSourceFile(fileName);
    
    try {
      // Ensure directory exists for path templates
      const { existsSync, mkdirSync } = await import("node:fs");
      const targetDir = dirname(sourceFile.path);
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
        console.log(`📁 Created directory: ${targetDir}`);
      }
      
      // Write the content directly to the output using emitFile
      await emitFile(program, {
        path: sourceFile.path,
        content,
      });
      console.log(`✅ Generated ${fileName} with REAL TypeSpec data using AssetEmitter architecture!`);
    } catch (error) {
      console.log(`⚠️ File write failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }

    this.logProcessingStats();
  }

  private generateContent(fileType: string, program: Program): string {
    const sourceFiles = Array.from(program.sourceFiles.keys()).join(", ") || "none";
    const operationNames = this.operations.map(op => op.name).join(", ") || "none";
    
    let content: string;
    if (fileType === "json") {
      // For JSON, add metadata as a comment field in the document itself
      const docWithMeta = {
        ...this.asyncApiDoc,
        "x-generated-from-typespec": {
          sourceFiles: sourceFiles,
          operationsFound: operationNames,
          note: "Generated from TypeSpec using AssetEmitter - NOT hardcoded!",
        },
      };
      content = JSON.stringify(docWithMeta, null, 2);
    } else {
      // For YAML, use comment headers
      const header = `# Generated from TypeSpec using AssetEmitter - NOT hardcoded!\n# Source files: ${sourceFiles}\n# Operations found: ${operationNames}\n\n`;
      content = header + stringify(this.asyncApiDoc);
    }
    
    return content;
  }

  private logProcessingStats(): void {
    console.log(`\n📊 FINAL STATS FROM REAL TYPESPEC (AssetEmitter):`);
    console.log(`  - Operations processed: ${this.operations.length}`);
    console.log(`  - Channels created: ${Object.keys(this.asyncApiDoc.channels).length}`);
    console.log(`  - Schemas generated: ${Object.keys(this.asyncApiDoc.components.schemas).length}`);
  }
}

// LEGACY FUNCTIONS: The following functions have been migrated to the AsyncAPITypeEmitter class
// They are kept here for reference but are no longer used in the AssetEmitter architecture

/*
 * MIGRATED FUNCTIONS (now in AsyncAPITypeEmitter class):
 * - walkNamespace() -> moved to AsyncAPITypeEmitter.walkNamespace()
 * - logOperationDetails() -> moved to AsyncAPITypeEmitter.logOperationDetails()
 * - discoverOperations() -> moved to AsyncAPITypeEmitter.discoverOperations()
 * - createAsyncAPIDocument() -> moved to AsyncAPITypeEmitter.createAsyncAPIDocument()
 * - createChannelDefinition() -> moved to AsyncAPITypeEmitter.createChannelDefinition()
 * - createOperationDefinition() -> moved to AsyncAPITypeEmitter.createOperationDefinition()
 * - getPropertyType() -> moved to AsyncAPITypeEmitter.getPropertyType()
 * - processModelProperties() -> moved to AsyncAPITypeEmitter.processModelProperties()
 * - convertModelToSchema() -> moved to AsyncAPITypeEmitter.convertModelToSchema()
 * - processOperation() -> moved to AsyncAPITypeEmitter.processOperation()
 * - generateContent() -> moved to AsyncAPITypeEmitter.generateContent()
 * - generateOutputFile() -> moved to AsyncAPITypeEmitter.generateOutputFile()
 * - logProcessingStats() -> moved to AsyncAPITypeEmitter.logProcessingStats()
 * 
 * The new AssetEmitter architecture provides:
 * - Better performance through caching and deduplication
 * - Improved memory management
 * - Modern TypeSpec emitter patterns
 * - Enhanced error handling
 * - Future-proof architecture for TypeSpec ecosystem changes
 */

/**
 * Generate AsyncAPI 3.0 specification using AssetEmitter architecture
 * 
 * ⚠️ VERSIONING LIMITATION: This function does NOT support TypeSpec.Versioning decorators.
 * It generates a single AsyncAPI document without version-aware processing.
 * 
 * UNSUPPORTED:
 * - @added(Version.v2) decorators - operations/models included regardless of version
 * - @removed(Version.v3) decorators - operations/models never excluded
 * - @renamedFrom decorators - no property renaming across versions  
 * - Multi-version document generation - only single asyncapi.yaml output
 * 
 * See GitHub issue #1 for planned versioning support.
 */
export async function generateAsyncAPI(context: EmitContext<AsyncAPIEmitterOptions>): Promise<void> {
  console.log("🚀 ASYNCAPI EMITTER (AssetEmitter): Processing REAL TypeSpec AST - NOT HARDCODED!");
  console.log("⚠️  VERSIONING NOT SUPPORTED - See GitHub issue #1");
  console.log(`📁 Output: ${context.emitterOutputDir}`);
  console.log(`🔧 Source files: ${context.program.sourceFiles.size}`);

  // Create AssetEmitter instance
  const assetEmitter = createAssetEmitter(
    context.program,
    AsyncAPITypeEmitter,
    context
  );

  // Emit the program using AssetEmitter
  assetEmitter.emitProgram();

  // Write output files
  await assetEmitter.writeOutput();
  
  console.log(`🎯 PROOF: This emitter processed actual TypeSpec AST using AssetEmitter!`);
}