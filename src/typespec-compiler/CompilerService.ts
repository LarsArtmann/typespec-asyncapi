/**
 * TypeSpec Compiler Integration Service
 * 
 * Replaces manual string parsing with proper TypeSpec compiler integration.
 * Provides direct AST access and type-safe extraction.
 * 
 * @author TypeSpec AsyncAPI Emitter Team
 * @since v1.1.0
 */

import { Effect } from "effect";
import { Program, Namespace, Model, Operation } from "@typespec/compiler";
import { TypeSpecCompilerIntegration, TypeSpecToAsyncAPIGenerator, TypeSpecProgramAnalyzer } from "../types/TypeSpecIntegration.js";
import { AsyncAPIObject, ServerConfig, ChannelConfig, OperationConfig } from "../types/branded-types.js";

/**
 * TypeSpec Compiler Integration Service
 * 
 * Main service for TypeSpec-to-AsyncAPI generation using compiler APIs
 */
export class TypeSpecCompilerService {
  private program: Program;
  
  constructor(program: Program) {
    this.program = program;
  }

  /**
   * Generate AsyncAPI specification using TypeSpec compiler integration
   */
  generateAsyncAPI(): Effect.Effect<AsyncAPIObject, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Generating AsyncAPI specification using TypeSpec compiler integration`);
      
      // Generate AsyncAPI using proper compiler integration
      const asyncapiDoc = yield* TypeSpecToAsyncAPIGenerator.generateAsyncAPI(this.program);
      
      yield* Effect.log(`✅ AsyncAPI specification generated successfully using compiler integration`);
      
      return asyncapiDoc;
    });
  }

  /**
   * Extract server configurations using compiler APIs
   */
  extractServers(): Effect.Effect<Record<string, ServerConfig>, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Extracting server configurations using compiler APIs`);
      
      const namespaces = TypeSpecCompilerIntegration.extractNamespaces(this.program);
      const servers: Record<string, ServerConfig> = {};
      
      for (const namespace of namespaces) {
        const serverConfigs = TypeSpecCompilerIntegration.extractServerConfigs(namespace);
        
        for (const [serverName, serverConfig] of serverConfigs.entries()) {
          // Validate server configuration
          servers[serverName] = {
            name: serverName,
            url: serverConfig.url,
            protocol: serverConfig.protocol,
            description: serverConfig.description || `Server for ${serverName}`,
            metadata: {
              namespace: namespace.name,
              timestamp: new Date(),
              extractedUsing: "TypeSpec compiler APIs"
            }
          };
        }
      }
      
      yield* Effect.log(`✅ Server configurations extracted: ${Object.keys(servers).length} servers`);
      
      return servers;
    });
  }

  /**
   * Extract channel configurations using compiler APIs
   */
  extractChannels(): Effect.Effect<Record<string, ChannelConfig>, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Extracting channel configurations using compiler APIs`);
      
      const namespaces = TypeSpecCompilerIntegration.extractNamespaces(this.program);
      const channels: Record<string, ChannelConfig> = {};
      
      for (const namespace of namespaces) {
        const channelConfigs = TypeSpecCompilerIntegration.extractChannelConfigs(namespace);
        
        for (const [channelAddress, channelConfig] of channelConfigs.entries()) {
          channels[channelAddress] = {
            address: channelConfig.address,
            description: channelConfig.description || `Channel for ${channelAddress}`,
            messages: channelConfig.messages,
            metadata: {
              namespace: namespace.name,
              timestamp: new Date(),
              extractedUsing: "TypeSpec compiler APIs"
            }
          };
        }
      }
      
      yield* Effect.log(`✅ Channel configurations extracted: ${Object.keys(channels).length} channels`);
      
      return channels;
    });
  }

  /**
   * Extract operation configurations using compiler APIs
   */
  extractOperations(): Effect.Effect<Record<string, OperationConfig>, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Extracting operation configurations using compiler APIs`);
      
      const namespaces = TypeSpecCompilerIntegration.extractNamespaces(this.program);
      const operations: Record<string, OperationConfig> = {};
      
      for (const namespace of namespaces) {
        const extractedOperations = TypeSpecCompilerIntegration.extractOperations(namespace);
        
        for (const operation of extractedOperations) {
          operations[operation.name] = {
            name: operation.name,
            action: this.inferOperationAction(operation),
            channel: this.inferOperationChannel(operation),
            description: operation.description || `Operation ${operation.name}`,
            metadata: {
              namespace: namespace.name,
              timestamp: new Date(),
              extractedUsing: "TypeSpec compiler APIs"
            }
          };
        }
      }
      
      yield* Effect.log(`✅ Operation configurations extracted: ${Object.keys(operations).length} operations`);
      
      return operations;
    });
  }

  /**
   * Extract message configurations using compiler APIs
   */
  extractMessages(): Effect.Effect<Record<string, any>, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Extracting message configurations using compiler APIs`);
      
      const namespaces = TypeSpecCompilerIntegration.extractNamespaces(this.program);
      const messages: Record<string, any> = {};
      
      for (const namespace of namespaces) {
        const models = TypeSpecCompilerIntegration.extractModels(namespace);
        
        for (const model of models) {
          const messageConfigs = TypeSpecCompilerIntegration.extractMessageConfigs(model);
          
          for (const [messageName, messageConfig] of messageConfigs.entries()) {
            messages[messageName] = {
              name: messageName,
              title: `Message for ${messageName}`,
              contentType: messageConfig.contentType,
              payload: messageConfig.payload,
              metadata: {
                namespace: namespace.name,
                timestamp: new Date(),
                extractedUsing: "TypeSpec compiler APIs"
              }
            };
          }
        }
      }
      
      yield* Effect.log(`✅ Message configurations extracted: ${Object.keys(messages).length} messages`);
      
      return messages;
    });
  }

  /**
   * Analyze TypeSpec program structure using compiler APIs
   */
  analyzeProgram(): Effect.Effect<any, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Analyzing TypeSpec program using compiler APIs`);
      
      const analysis = yield* TypeSpecProgramAnalyzer.analyzeProgram(this.program);
      
      yield* Effect.log(`✅ Program analysis completed: ${JSON.stringify(analysis, null, 2)}`);
      
      return analysis;
    });
  }

  /**
   * Extract model configurations using compiler APIs
   */
  extractModels(): Effect.Effect<Record<string, any>, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Extracting model configurations using compiler APIs`);
      
      const namespaces = TypeSpecCompilerIntegration.extractNamespaces(this.program);
      const models: Record<string, any> = {};
      
      for (const namespace of namespaces) {
        const extractedModels = TypeSpecCompilerIntegration.extractModels(namespace);
        
        for (const model of extractedModels) {
          const modelConfig = TypeSpecCompilerIntegration.extractSchemaConfigs(model);
          
          for (const [schemaName, schemaConfig] of modelConfig.entries()) {
            models[schemaName] = {
              name: schemaName,
              title: `Schema for ${schemaName}`,
              type: schemaConfig.type,
              properties: schemaConfig.properties,
              required: schemaConfig.required,
              metadata: {
                namespace: namespace.name,
                timestamp: new Date(),
                extractedUsing: "TypeSpec compiler APIs"
              }
            };
          }
        }
      }
      
      yield* Effect.log(`✅ Model configurations extracted: ${Object.keys(models).length} models`);
      
      return models;
    });
  }

  /**
   * Infer operation action from TypeSpec operation
   */
  private inferOperationAction(operation: Operation): "send" | "receive" | "reply" {
    // Use TypeSpec compiler integration to infer action
    return TypeSpecCompilerIntegration.inferOperationAction(operation);
  }

  /**
   * Infer operation channel from TypeSpec operation
   */
  private inferOperationChannel(operation: Operation): string {
    // Use TypeSpec compiler integration to infer channel
    return TypeSpecCompilerIntegration.inferOperationChannel(operation);
  }

  /**
   * Get TypeSpec program instance
   */
  getProgram(): Program {
    return this.program;
  }

  /**
   * Validate TypeSpec program structure
   */
  validateProgram(): Effect.Effect<boolean, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Validating TypeSpec program structure`);
      
      // Basic validation
      if (!this.program) {
        throw new Error("TypeSpec program is null or undefined");
      }
      
      if (!this.program.namespaces) {
        throw new Error("TypeSpec program has no namespaces");
      }
      
      if (this.program.namespaces.length === 0) {
        yield* Effect.log(`⚠️ Warning: TypeSpec program has no namespaces`);
        return true; // Not an error, but warning
      }
      
      // Validate at least one namespace has content
      const hasContent = this.program.namespaces.some(namespace => 
        namespace.models.length > 0 || 
        (namespace.operations && namespace.operations.length > 0) ||
        (namespace.decorators && namespace.decorators.length > 0)
      );
      
      if (!hasContent) {
        yield* Effect.log(`⚠️ Warning: TypeSpec program has no content in any namespace`);
        return true; // Not an error, but warning
      }
      
      yield* Effect.log(`✅ TypeSpec program structure validated successfully`);
      
      return true;
    });
  }

  /**
   * Extract all decorators from TypeSpec program
   */
  extractDecorators(): Effect.Effect<Array<{
    name: string;
    namespace: string;
    type: string;
    target: any;
    options: any;
  }>, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Extracting all decorators from TypeSpec program`);
      
      const decorators: Array<{
        name: string;
        namespace: string;
        type: string;
        target: any;
        options: any;
      }> = [];
      
      const namespaces = TypeSpecCompilerIntegration.extractNamespaces(this.program);
      
      for (const namespace of namespaces) {
        // Extract decorators from models
        const models = TypeSpecCompilerIntegration.extractModels(namespace);
        for (const model of models) {
          if (model.decorators) {
            for (const decorator of model.decorators) {
              decorators.push({
                name: decorator.name,
                namespace: namespace.name,
                type: "model",
                target: model,
                options: decorator.options
              });
            }
          }
        }
        
        // Extract decorators from operations
        const operations = TypeSpecCompilerIntegration.extractOperations(namespace);
        for (const operation of operations) {
          if (operation.decorators) {
            for (const decorator of operation.decorators) {
              decorators.push({
                name: decorator.name,
                namespace: namespace.name,
                type: "operation",
                target: operation,
                options: decorator.options
              });
            }
          }
        }
      }
      
      yield* Effect.log(`✅ Decorators extracted: ${decorators.length} total`);
      
      return decorators;
    });
  }
}

export {
  Effect
};