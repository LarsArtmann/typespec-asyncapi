/**
 * AsyncAPI Emitter Core with TypeSpec Compiler Integration
 * 
 * Replaces manual string parsing with proper TypeSpec compiler integration.
 * Provides direct AST access and type-safe extraction.
 * 
 * @author TypeSpec AsyncAPI Emitter Team
 * @since v1.1.0
 */

import { Effect } from "effect";
import { Program } from "@typespec/compiler";
import { TypeSpecCompilerService } from "../typespec-compiler/CompilerService.js";
import { AsyncAPIObject } from "../types/branded-types.js";
import { STATE_KEYS, STATE_KEY_MAP } from "../lib.js";
import { railway } from "../utils/standardized-errors.js";

/**
 * AsyncAPI Emitter Core
 * 
 * Core emitter with TypeSpec compiler integration for TypeSpec-to-AsyncAPI generation
 */
export class AsyncAPIEmitterCore {
  private program: Program;
  private compilerService: TypeSpecCompilerService;

  constructor(program: Program) {
    this.program = program;
    this.compilerService = new TypeSpecCompilerService(program);
  }

  /**
   * Generate AsyncAPI specification using TypeSpec compiler integration
   */
  generateAsyncAPI(): Effect.Effect<AsyncAPIObject, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🚀 Generating AsyncAPI specification using TypeSpec compiler integration`);
      
      // Validate TypeSpec program structure
      const isValid = yield* this.compilerService.validateProgram();
      if (!isValid) {
        throw new Error("Invalid TypeSpec program structure");
      }
      
      // Generate AsyncAPI using compiler integration
      const asyncapiDoc = yield* this.compilerService.generateAsyncAPI();
      
      // Post-process the generated document
      const processedDoc = yield* this.postProcessDocument(asyncapiDoc);
      
      yield* Effect.log(`✅ AsyncAPI specification generated and processed successfully`);
      yield* Effect.log(`📊 Document summary: ${JSON.stringify(processedDoc, null, 2)}`);
      
      return processedDoc;
    });
  }

  /**
   * Generate AsyncAPI specification with full processing pipeline
   */
  generateAsyncAPIWithFullProcessing(): Effect.Effect<AsyncAPIObject, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🚀 Generating AsyncAPI with full processing pipeline`);
      
      // Step 1: Generate initial AsyncAPI using compiler integration
      const initialDoc = yield* this.compilerService.generateAsyncAPI();
      
      // Step 2: Extract and process all components
      const servers = yield* this.compilerService.extractServers();
      const channels = yield* this.compilerService.extractChannels();
      const operations = yield* this.compilerService.extractOperations();
      const messages = yield* this.compilerService.extractMessages();
      const models = yield* this.compilerService.extractModels();
      
      // Step 3: Create comprehensive AsyncAPI document
      const comprehensiveDoc = {
        asyncapi: initialDoc.asyncapi,
        info: initialDoc.info,
        servers: servers,
        channels: channels,
        operations: operations,
        components: {
          messages: messages,
          schemas: models,
          securitySchemes: initialDoc.components?.securitySchemes || {},
          parameters: initialDoc.components?.parameters || {}
        },
        tags: this.extractTags()
      };
      
      // Step 4: Validate comprehensive document
      const validation = yield* this.validateComprehensiveDocument(comprehensiveDoc);
      if (!validation.isValid) {
        yield* Effect.log(`⚠️ Document validation failed: ${validation.errors.length} errors`);
        // Continue with errors but log them
        validation.errors.forEach((error) => Effect.runSync(Effect.log(`  - ${error}`)));
      }
      
      // Step 5: Final processing and optimization
      const finalDoc = yield* this.finalizeDocument(comprehensiveDoc);
      
      yield* Effect.log(`✅ Comprehensive AsyncAPI generated successfully`);
      yield* Effect.log(`📊 Final document summary: ${JSON.stringify(finalDoc, null, 2)}`);
      
      return finalDoc;
    });
  }

  /**
   * Post-process generated AsyncAPI document
   */
  private postProcessDocument(doc: AsyncAPIObject): Effect.Effect<AsyncAPIObject, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Post-processing AsyncAPI document`);
      
      // Add metadata
      const processedDoc = {
        ...doc,
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: "TypeSpec AsyncAPI Emitter v1.1.0",
          typeSpecVersion: "1.0.0",
          compilerIntegration: true,
          totalNamespaces: this.compilerService.getProgram().namespaces?.length || 0,
          totalModels: this.extractModelCount(),
          totalOperations: this.extractOperationCount(),
          totalServers: Object.keys(doc.servers || {}).length,
          totalChannels: Object.keys(doc.channels || {}).length
        }
      };
      
      yield* Effect.log(`✅ Document post-processing completed`);
      
      return processedDoc;
    });
  }

  /**
   * Finalize document for production
   */
  private finalizeDocument(doc: AsyncAPIObject): Effect.Effect<AsyncAPIObject, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Finalizing AsyncAPI document for production`);
      
      // Ensure proper structure
      const finalDoc: AsyncAPIObject = {
        asyncapi: doc.asyncapi || "3.0.0",
        info: doc.info || {
          title: "Generated from TypeSpec",
          version: "1.0.0",
          description: "Generated from TypeSpec with TypeSpec compiler integration"
        },
        servers: doc.servers || {},
        channels: doc.channels || {},
        operations: doc.operations || {},
        components: {
          messages: doc.components?.messages || {},
          schemas: doc.components?.schemas || {},
          securitySchemes: doc.components?.securitySchemes || {},
          parameters: doc.components?.parameters || {}
        },
        tags: doc.tags || [],
        metadata: doc.metadata || {}
      };
      
      // Remove empty components
      if (Object.keys(finalDoc.components.messages).length === 0) {
        delete finalDoc.components.messages;
      }
      
      if (Object.keys(finalDoc.components.schemas).length === 0) {
        delete finalDoc.components.schemas;
      }
      
      if (Object.keys(finalDoc.components.securitySchemes).length === 0) {
        delete finalDoc.components.securitySchemes;
      }
      
      if (Object.keys(finalDoc.components.parameters).length === 0) {
        delete finalDoc.components.parameters;
      }
      
      // Remove empty components section if empty
      if (Object.keys(finalDoc.components).length === 0) {
        delete finalDoc.components;
      }
      
      // Remove empty tags section if empty
      if (finalDoc.tags.length === 0) {
        delete finalDoc.tags;
      }
      
      yield* Effect.log(`✅ Document finalized for production`);
      
      return finalDoc;
    });
  }

  /**
   * Validate comprehensive AsyncAPI document
   */
  private validateComprehensiveDocument(doc: AsyncAPIObject): Effect.Effect<{
    isValid: boolean;
    errors: Array<{ field: string; message: string; severity: "error" | "warning" }>;
    warnings: Array<{ field: string; message: string; severity: "error" | "warning" }>;
  }, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔍 Validating comprehensive AsyncAPI document`);
      
      const errors: Array<{ field: string; message: string; severity: "error" | "warning" }> = [];
      const warnings: Array<{ field: string; message: string; severity: "error" | "warning" }> = [];
      
      // Validate asyncapi field
      if (!doc.asyncapi) {
        errors.push({ field: "asyncapi", message: "Missing asyncapi field", severity: "error" });
      } else if (typeof doc.asyncapi !== "string") {
        errors.push({ field: "asyncapi", message: "Invalid asyncapi field type", severity: "error" });
      } else if (!doc.asyncapi.startsWith("3.0.")) {
        warnings.push({ field: "asyncapi", message: `Unsupported asyncapi version: ${doc.asyncapi}`, severity: "warning" });
      }
      
      // Validate info field
      if (!doc.info) {
        errors.push({ field: "info", message: "Missing info field", severity: "error" });
      } else {
        if (!doc.info.title) {
          errors.push({ field: "info.title", message: "Missing info.title field", severity: "error" });
        }
        if (!doc.info.version) {
          errors.push({ field: "info.version", message: "Missing info.version field", severity: "error" });
        }
      }
      
      // Validate consistency between channels and operations
      if (doc.channels && doc.operations) {
        const channelRefs = Object.values(doc.operations).map(op => op.channel);
        const channelKeys = Object.keys(doc.channels);
        
        for (const channelRef of channelRefs) {
          if (!channelKeys.includes(channelRef as string)) {
            errors.push({
              field: "operations",
              message: `Operation references non-existent channel: ${channelRef}`,
              severity: "error"
            });
          }
        }
        
        // Check for orphaned channels
        for (const channelKey of channelKeys) {
          const isReferenced = channelRefs.some(ref => ref === channelKey);
          if (!isReferenced) {
            warnings.push({
              field: "channels",
              message: `Channel not referenced by any operation: ${channelKey}`,
              severity: "warning"
            });
          }
        }
      }
      
      const isValid = errors.length === 0;
      
      yield* Effect.log(`✅ Validation completed: ${isValid ? "VALID" : "INVALID"} (${errors.length} errors, ${warnings.length} warnings)`);
      
      return { isValid, errors, warnings };
    });
  }

  /**
   * Extract tags from TypeSpec program
   */
  private extractTags(): Array<{ name: string; description: string }> {
    const tags: Array<{ name: string; description: string }> = [];
    
    // Extract tags from program metadata
    const programMetadata = this.program.stateMap(STATE_KEYS.programMetadata)?.get(this.program);
    
    if (programMetadata && programMetadata.tags) {
      tags.push(...programMetadata.tags);
    }
    
    // Extract tags from namespaces
    const namespaces = this.compilerService.getProgram().namespaces;
    for (const namespace of namespaces) {
      if (namespace.name && namespace.name !== "$") {
        tags.push({
          name: namespace.name,
          description: `Namespace: ${namespace.name}`
        });
      }
    }
    
    return tags;
  }

  /**
   * Extract model count
   */
  private extractModelCount(): number {
    let count = 0;
    const namespaces = this.compilerService.getProgram().namespaces;
    
    for (const namespace of namespaces) {
      count += namespace.models.length;
    }
    
    return count;
  }

  /**
   * Extract operation count
   */
  private extractOperationCount(): number {
    let count = 0;
    const namespaces = this.compilerService.getProgram().namespaces;
    
    for (const namespace of namespaces) {
      count += (namespace.operations?.length || 0);
    }
    
    return count;
  }

  /**
   * Get TypeSpec program
   */
  getProgram(): Program {
    return this.compilerService.getProgram();
  }

  /**
   * Get TypeSpec compiler service
   */
  getCompilerService(): TypeSpecCompilerService {
    return this.compilerService;
  }
}

/**
 * TypeSpec metadata extractor
 */
export class TypeSpecMetadataExtractor {
  /**
   * Extract metadata from TypeSpec program
   */
  static extractMetadata(program: Program): Effect.Effect<{
    programName: string;
    programVersion: string;
    compilerVersion: string;
    emitterVersion: string;
    namespaceCount: number;
    modelCount: number;
    operationCount: number;
    serverCount: number;
    decoratorCount: number;
  }, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Extracting TypeSpec metadata`);
      
      const namespaces = program.namespaces || [];
      const modelCount = namespaces.reduce((count, ns) => count + ns.models.length, 0);
      const operationCount = namespaces.reduce((count, ns) => count + (ns.operations?.length || 0), 0);
      
      const metadata = {
        programName: program.root?.name || "Unknown",
        programVersion: "1.0.0", // TODO: Extract from package.json
        compilerVersion: this.extractCompilerVersion(program),
        emitterVersion: "1.1.0", // TODO: Extract from package.json
        namespaceCount: namespaces.length,
        modelCount,
        operationCount,
        serverCount: this.extractServerCount(program),
        decoratorCount: this.extractDecoratorCount(program)
      };
      
      yield* Effect.log(`✅ Metadata extracted: ${JSON.stringify(metadata, null, 2)}`);
      
      return metadata;
    });
  }

  /**
   * Extract compiler version
   */
  private static extractCompilerVersion(program: Program): string {
    // TODO: Extract actual compiler version from program
    return "1.0.0";
  }

  /**
   * Extract server count
   */
  private static extractServerCount(program: Program): number {
    let count = 0;
    const namespaces = program.namespaces || [];
    
    for (const namespace of namespaces) {
      const serverConfigs = program.stateMap(STATE_KEYS.serverConfigs)?.get(namespace);
      if (serverConfigs) {
        count += serverConfigs.size;
      }
    }
    
    return count;
  }

  /**
   * Extract decorator count
   */
  private static extractDecoratorCount(program: Program): number {
    let count = 0;
    const namespaces = program.namespaces || [];
    
    for (const namespace of namespaces) {
      // Count decorators on models
      count += namespace.models.reduce((modelCount, model) => modelCount + (model.decorators?.length || 0), 0);
      
      // Count decorators on operations
      count += (namespace.operations || []).reduce((opCount, op) => opCount + (op.decorators?.length || 0), 0);
    }
    
    return count;
  }
}

export {
  Effect,
  STATE_KEYS,
  STATE_KEY_MAP
};