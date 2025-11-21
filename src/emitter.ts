/**
 * ASYNCAPI EMITTER - Basic file generation
 *
 * Simplest possible AsyncAPI emitter to create working output
 */

import { Effect } from "effect";
import type { EmitContext, Type, EmitFileOptions } from "@typespec/compiler";
import { emitFile } from "@typespec/compiler";
import { consolidateAsyncAPIState, type AsyncAPIConsolidatedState } from "./state.js";
import { LoggerLive } from "./logger.js";
import type { 
  AsyncAPIChannels, 
  AsyncAPIMessages, 
  AsyncAPISchemas
} from "./types/domain/asyncapi-domain-types.js";
import {
  createAsyncAPIChannels,
  createAsyncAPIMessages,
  createAsyncAPISchemas
} from "./types/domain/asyncapi-domain-types.js";
import type {
} from "./types/domain/asyncapi-branded-types.js";
import {
  createChannelPath,
  createMessageId,
  createSchemaName
} from "./types/domain/asyncapi-branded-types.js";

// ===== OFFICIAL ASYNCAPI TYPES =====
// Using AsyncAPIDocument type defined below

// ===== INTERNAL INTERFACES =====

type AsyncAPIMessageData = {
  description: string;
  contentType: string;
  title?: string;
  payload?: {
    type: string;
    properties: Record<string, unknown>;
  };
};

/**
 * Basic AsyncAPI emitter - generates working AsyncAPI files
 */
export type AsyncAPIEmitterOptions = {
  version: string;
  title?: string;
  description?: string;
  "output-file"?: string;
  "file-type"?: string;
};

/**
 * AsyncAPI Document Structure
 */
export type AsyncAPIDocument = {
  asyncapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  channels: AsyncAPIChannels;
  messages: AsyncAPIMessages;
  operations?: Record<string, unknown>;
  servers?: Record<string, unknown>;
  components: {
    schemas: AsyncAPISchemas;
  };
};

/**
 * Generate AsyncAPI file from TypeSpec program
 */
export async function $onEmit(
  context: EmitContext<AsyncAPIEmitterOptions>,
): Promise<void> {
  const program = context.program;
  const options = context.options;

  // Main emitter logic as composable Effect
  const emitterProgram = Effect.gen(function*() {
    yield* Effect.log("🚀 ASYNCAPI EMITTER: Starting generation");

    yield* Effect.log("📋 Emitter options:").pipe(
      Effect.annotateLogs({ options: JSON.stringify(options) })
    );

    yield* Effect.log("📊 ASYNCAPI EMITTER: Extracting decorator state from program");

    // Extract decorator state from program
    const rawState = consolidateAsyncAPIState(program);

    yield* Effect.log("🏗️ ASYNCAPI EMITTER: Generating AsyncAPI 3.0 document structure");
  
    // Convert raw state to AsyncAPI format
    const channels: AsyncAPIChannels = {};
    const messages: AsyncAPIMessages = {};
    const schemas: AsyncAPISchemas = {};

    // Convert channel paths to AsyncAPI channels
    if (rawState.channels) {
      for (const [type, data] of rawState.channels) {
        const channelKey = data.path;
        channels[channelKey] = {
          description: `Generated channel for ${data.path}`,
          // Add basic structure - can be enhanced later
        };
      }
    }

    // Convert message configs to AsyncAPI messages
    if (rawState.messages) {
      for (const [type, data] of rawState.messages) {
        const messageKey = data.schemaName || `message${type.name}`;
        messages[messageKey] = {
          $ref: `#/components/schemas/${messageKey}`,
          description: data.description || `Generated message for ${messageKey}`,
          contentType: "application/json"
        };
        
        // Add basic schema
        schemas[messageKey] = {
          type: "object",
          description: data.description || `Schema for ${messageKey}`,
          properties: {}
        };
      }
    }

    // Generate complete AsyncAPI document
    const asyncapiDocument: AsyncAPIDocument = {
      asyncapi: "3.0.0",
      info: {
        title: options.title ?? "Generated API",
        version: options.version ?? "1.0.0",
        description: options.description ?? "API generated from TypeSpec"
      },
      channels,
      messages,
      components: {
        schemas
      }
    };

    // Write to output file - respect options
    const outputFile = options["output-file"];
    const fileType = options["file-type"];

    // Debug option parsing
    yield* Effect.logDebug(`🔧 DEBUG: outputFile option: "${outputFile}"`);
    yield* Effect.logDebug(`🔧 DEBUG: fileType option: "${fileType}"`);

    // Determine output path based on options
    let outputPath = outputFile ?? "asyncapi";
    if (!outputFile && fileType) {
      outputPath = `asyncapi.${fileType}`;
    } else if (outputFile && !outputFile.includes('.') && fileType) {
      outputPath = `${outputFile}.${fileType}`;
    }

    // Debug final path
    yield* Effect.logDebug(`🔧 DEBUG: Final outputPath: "${outputPath}"`);

    // Convert document to requested format
    const isJsonFormat = fileType === "json";
    let content: string;

    if (isJsonFormat) {
      content = JSON.stringify(asyncapiDocument, null, 2);
    } else {
      // Always use YAML format (default)
      content = `asyncapi: 3.0.0
info:
  title: ${asyncapiDocument.info.title}
  version: ${asyncapiDocument.info.version}
  description: ${asyncapiDocument.info.description}

channels:
${Object.entries(asyncapiDocument.channels)
  .map(([path, channel]) => {
    const channelObj = channel as Record<string, unknown>;
    let channelYaml = `  ${path}:
    description: "${String(channelObj.description ?? '')}"`;
    
    if (channelObj.publish) {
      const publish = channelObj.publish as Record<string, unknown>;
      channelYaml += `
    publish:
      operationId: "${String(publish.operationId ?? '')}"
      description: "${String(publish.description ?? '')}"`;
    }
    
    if (channelObj.subscribe) {
      const subscribe = channelObj.subscribe as Record<string, unknown>;
      channelYaml += `
    subscribe:
      operationId: "${String(subscribe.operationId ?? '')}"
      description: "${String(subscribe.description ?? '')}"`;
    }
    
    return channelYaml;
  })
  .join('\n')}

messages:
${Object.entries(asyncapiDocument.messages)
  .map(([name, message]) => {
    const messageObj = message as Record<string, unknown>;
    return `  ${name}:
    description: "${String(messageObj.description ?? '')}"
    contentType: "${String(messageObj.contentType ?? '')}"
    title: "${String(messageObj.title ?? '')}"`;
  })
  .join('\n')}

components:
  schemas:
${Object.entries(asyncapiDocument.components.schemas)
  .map(([name, schema]) => {
    const schemaObj = schema as Record<string, unknown>;
    const properties = schemaObj.properties as Record<string, unknown> | undefined;
    const required = schemaObj.required as string[] | undefined;
    
    let schemaYaml = `  ${name}:
    type: object
    properties:`;
    
    if (properties) {
      schemaYaml += Object.entries(properties)
        .map(([propName, prop]) => {
          const propObj = prop as Record<string, unknown>;
          return `      ${propName}:
        type: "${String(propObj.type ?? '')}"
        description: "${String(propObj.description ?? '')}"`;
        })
        .join('\n');
    }
    
    if (required && required.length > 0) {
      schemaYaml += `
    required:
${required.map(req => `      - ${req}`).join('\n')}`;
    }
    
      return schemaYaml;
    })
    .join('\n')}

`;
    }

    // Debug emitter output directory
    yield* Effect.logDebug(`🔧 DEBUG: context.emitterOutputDir: "${context.emitterOutputDir}"`);

    // CRITICAL FIX: Use emitFile with just filename (TypeSpec handles directory automatically)
    const emitOptions: EmitFileOptions = {
      path: outputPath,  // Let TypeSpec handle directory placement
      content: content,
    };

    // Emit the file using TypeSpec's emitFile API
    yield* Effect.tryPromise({
      try: () => emitFile(context.program, emitOptions),
      catch: (error) => new Error(`Failed to generate ${outputPath}: ${String(error)}`)
    });

    yield* Effect.log(`✅ ASYNCAPI EMITTER: Generated ${outputPath} via emitFile API`);

    // Report generation statistics (side effect)
    reportGenerationStatistics(asyncapiDocument);
  }).pipe(Effect.provide(LoggerLive));

  // Run the emitter program
  await Effect.runPromise(emitterProgram);
}

/**
 * Generate complete AsyncAPI 3.0 document from state
 */
function _generateAsyncAPI30Document(
  state: AsyncAPIConsolidatedState,
  options: AsyncAPIEmitterOptions,
): Effect.Effect<AsyncAPIDocument, Error> {
  return Effect.gen(function*() {
    const channels = yield* generateChannels(state);
    const messages = yield* generateMessages(state);
    const schemas = yield* generateSchemas(state);
    
    return {
      asyncapi: "3.0.0",
      info: {
        title: options.title ?? "Generated API",
        version: options.version ?? "1.0.0",
        description: options.description ?? "API generated from TypeSpec",
      },
      channels,
      messages,
      components: {
        schemas
      },
    };
  });
}

/**
 * Generate channels from state data
 */
function generateChannels(state: AsyncAPIConsolidatedState): Effect.Effect<AsyncAPIChannels, Error> {
  return Effect.gen(function*() {
    const channels: Record<string, unknown> = {};
    
    for (const [operation, channelPathData] of state.channels) {
      const operationName = getOperationName(operation);
      const operationType = state.operations.get(operation);

      yield* Effect.log(`🔍 Processing channel for operation ${operationName ?? "unknown"}`).pipe(
        Effect.annotateLogs({
          channelPath: channelPathData.path,
          operationType: operationType?.type
        })
      );
      yield* Effect.log(`📍 Channel path: ${channelPathData.path}`);
      yield* Effect.log(`⚡ Operation type: ${operationType?.type}`);
      
      // Build channel with operations
      const channelData: {
        description?: string;
        publish?: Record<string, unknown>;
        subscribe?: Record<string, unknown>;
      } = {
        description: `Channel for ${operationName ?? "unnamed"} operation`,
      };

      // Add publish/subscribe operations
      if (operationType?.type === "publish") {
        channelData.publish = {
          operationId: operationName,
          description: operationType.description ?? `Publish ${operationName} operation`,
          message: operationType.messageType ? {
            $ref: `#/components/messages/${operationType.messageType}`
          } : {
            payload: {
              type: "object",
              properties: {}
            }
          }
        };
      }

      if (operationType?.type === "subscribe") {
        channelData.subscribe = {
          operationId: operationName,
          description: operationType.description ?? `Subscribe ${operationName} operation`,
          message: {
            payload: {
              type: "object",
              properties: {}
            }
          }
        };
      }

      const brandedChannelPath = yield* createChannelPath(channelPathData.path);
      channels[brandedChannelPath] = channelData;
    }
  
    return yield* createAsyncAPIChannels(channels);
  });
}

/**
 * Generate messages from state data
 */
function generateMessages(state: AsyncAPIConsolidatedState): Effect.Effect<AsyncAPIMessages, Error> {
  return Effect.gen(function*() {
    const messages: Record<string, unknown> = {};
  
    for (const [model, messageConfig] of state.messages) {
      const modelName = getOperationName(model);
      yield* Effect.log(`📨 Processing message for model ${modelName ?? "unknown"}`);
      
      // Generate full message structure from TypeSpec model
      const messageData: AsyncAPIMessageData = {
        description: messageConfig.description ?? `Message ${modelName}`,
        contentType: messageConfig.contentType ?? "application/json",
        title: messageConfig.title ?? modelName,
      };

    // Add schema from model properties
    if (model.kind === "Model" && model.properties.size > 0) {
      messageData.payload = {
        type: "object",
        properties: {}
      };

      // Process model properties
      for (const [propName, prop] of model.properties) {
        const propType = prop.type;
        if (messageData.payload) {
          messageData.payload.properties[propName] = {
            type: getTypeString(propType),
            description: `Property ${propName}`
          };
        }
      }
    }

    const brandedMessageId = yield* createMessageId(modelName ?? "unnamed");
    messages[brandedMessageId] = messageData;
  }
  
  return yield* createAsyncAPIMessages(messages);
});
}

/**
 * Generate JSON Schemas from TypeSpec models
 */
function generateSchemas(state: AsyncAPIConsolidatedState): Effect.Effect<AsyncAPISchemas, Error> {
  return Effect.gen(function*() {
    const schemas: AsyncAPISchemas = {};
  
  for (const [model, _] of state.messages) {
    const modelName = getOperationName(model);
    
    if (model.kind === "Model") {
      const schemaData: {
        type: "object";
        properties: Record<string, {
          type: string;
          description: string;
        }>;
        required: string[];
      } = {
        type: "object",
        properties: {},
        required: []
      };

      // Process model properties
      for (const [propName, prop] of model.properties) {
        schemaData.properties[propName] = {
          type: getTypeString(prop.type),
          description: `Property ${propName}`
        };

        // Check if property is required (no optional)
        if (!prop.optional) {
          schemaData.required.push(propName);
        }
      }

      const brandedSchemaName = yield* createSchemaName(modelName ?? "unnamed");
      schemas[brandedSchemaName] = schemaData;
    }
  }
  
  return yield* createAsyncAPISchemas(schemas);
  });
}

/**
 * Helper function to get operation name from Type
 */
function getOperationName(operation: Type): string | undefined {
  if (operation.kind === "Operation") {
    return operation.name;
  }
  if (operation.kind === "Model") {
    return operation.name;
  }
  return undefined;
}

/**
 * Helper function to convert TypeSpec type to JSON Schema type string
 */
function getTypeString(type: Type): string {
  switch ((type as { kind: string }).kind) {
    case "String": return "string";
    case "Number": 
    case "Integer": return "number";
    case "Boolean": return "boolean";
    case "Model": return "object";
    default: return "string";
  }
}

/**
 * Report Emission Statistics
 */
function reportGenerationStatistics(document: AsyncAPIDocument): void {
  const stats = {
    channels: Object.keys(document.channels ?? {}).length,
    messages: Object.keys(document.messages ?? {}).length,
    components: document.components ? Object.keys(document.components).length : 0,
  };

  Effect.runSync(
    Effect.log("📊 ASYNCAPI EMITTER: Generation Statistics:").pipe(
      Effect.annotateLogs({ stats: JSON.stringify(stats) })
    )
  );
  Effect.runSync(
    Effect.log(`🎯 ASYNCAPI EMITTER: Generated ${stats.channels} channels, ${stats.messages} messages`)
  );
}
