/**
 * ASYNCAPI EMITTER - Basic file generation
 *
 * Simplest possible AsyncAPI emitter to create working output
 */

import { Effect } from "effect";
import type { EmitContext, Type, EmitFileOptions } from "@typespec/compiler";
import type { AsyncAPIEmitterOptions as _AsyncAPIEmitterOptions } from "./infrastructure/configuration/asyncAPIEmitterOptions.js";
import { consolidateAsyncAPIState, type AsyncAPIConsolidatedState } from "./state.js";
import { LoggerLive } from "./logger.js";
import type { 
  AsyncAPIChannels, 
  AsyncAPIMessages, 
  AsyncAPISchemas,
  ChannelConfig,
  MessageConfig
} from "./types/minimal-domain-types.js";
// Simplified imports - removed complex domain types temporarily

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
  context: EmitContext<_AsyncAPIEmitterOptions>,
): Promise<void> {
  const program = context.program;
  const options = context.options;

  // Main emitter logic as composable Effect
  const emitterProgram = Effect.gen(function*() {
    yield* Effect.log("🚀 ASYNCAPI EMITTER: Starting generation");

    yield* Effect.log("📋 Emitter options:").pipe(
      Effect.annotateLogs({ options: JSON.stringify(context.options) })
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
        const channelData = data as ChannelConfig;
        const channelKey = channelData.path ?? (type as { name: string }).name;
        channels[channelKey] = {
          path: channelKey,
          description: `Generated channel for ${channelKey}`,
        } as Record<string, unknown>;
      }
    }

    // Convert message configs to AsyncAPI messages
    if (rawState.messages) {
      for (const [type, data] of rawState.messages) {
        const messageData = data as MessageConfig;
        const typeName = (type as { name: string }).name;
        const messageKey = messageData.schemaName ?? `message${typeName}`;
        messages[messageKey] = {
          id: messageKey,
          schemaName: messageKey,
          description: messageData.description ?? `Generated message for ${messageKey}`,
        } as Record<string, unknown>;
        
        // Add basic schema
        schemas[messageKey] = {
          type: "object",
          description: messageData.description ?? `Schema for ${messageKey}`,
          properties: {}
        } as Record<string, unknown>;
      }
    }

    // Generate complete AsyncAPI document
    const asyncapiDocument: AsyncAPIDocument = {
      asyncapi: "3.0.0",
      info: {
        title: options?.title ?? "Generated API",
        version: options?.version ?? "1.0.0",
        description: options?.description ?? "API generated from TypeSpec"
      },
      channels,
      messages,
      components: {
        schemas
      }
    };

    // Write to output file - respect options
    const outputFile = options?.["output-file"] || "asyncapi.yaml";
    const fileType = options?.["file-type"] || "yaml";

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

    // CRITICAL FIX: Use absolute path for emitFile
    const emitOptions: EmitFileOptions = {
      path: outputPath,  // Use just filename, let TypeSpec handle directory
      content: content,
    };
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
  options: _AsyncAPIEmitterOptions,
): Effect.Effect<AsyncAPIDocument, unknown> {
  return Effect.gen(function*() {
    const channels = yield* generateChannels(state);
    const messages = yield* generateMessages(state);
    const schemas = yield* generateSchemas(state);
    const bindings = yield* generateProtocolBindings(state);
    
    return {
      asyncapi: "3.0.0",
      info: {
        title: options?.title ?? "Generated API",
        version: options?.version ?? "1.0.0",
        description: options?.description ?? "API generated from TypeSpec",
      },
      channels,
      messages,
      components: {
        schemas,
        ...(Object.keys(bindings).length > 0 && { bindings })
      },
    };
  });
}

/**
 * Generate protocol bindings from stored configurations
 */
function generateProtocolBindings(state: AsyncAPIConsolidatedState): Effect.Effect<Record<string, any>, Error> {
  return Effect.gen(function*() {
    const bindings: Record<string, any> = {};
    
    for (const [target, protocolConfig] of state.protocolConfigs) {
      const targetName = (target as { name: string }).name;
      const protocolType = protocolConfig.protocol;
      
      switch (protocolType) {
        case "kafka": {
          bindings.kafka = {
            version: protocolConfig.version || "0.5.0",
            ...(protocolConfig.partitions && {
              bindingVersion: "0.5.0",
              topicConfiguration: {
                partitions: protocolConfig.partitions
              }
            }),
            ...(protocolConfig.consumerGroup && {
              groupId: protocolConfig.consumerGroup
            }),
            ...(protocolConfig.sasl && {
              sasl: {
                mechanism: protocolConfig.sasl.mechanism,
                ...(protocolConfig.sasl.username && {
                  username: protocolConfig.sasl.username
                }),
                ...(protocolConfig.sasl.password && {
                  password: protocolConfig.sasl.password
                })
              }
            })
          };
          break;
        }
        
        case "ws": {
          bindings.ws = {
            version: protocolConfig.version || "0.5.0",
            ...(protocolConfig.subprotocol && {
              subprotocol: protocolConfig.subprotocol
            }),
            ...(protocolConfig.queryParams && {
              query: protocolConfig.queryParams
            }),
            ...(protocolConfig.headers && {
              headers: protocolConfig.headers
            })
          };
          break;
        }
        
        case "mqtt": {
          bindings.mqtt = {
            version: protocolConfig.version || "0.5.0",
            ...(protocolConfig.qos !== undefined && {
              qos: protocolConfig.qos
            }),
            ...(protocolConfig.retain !== undefined && {
              retain: protocolConfig.retain
            }),
            ...(protocolConfig.lastWill && {
              will: {
                topic: protocolConfig.lastWill.topic,
                payload: protocolConfig.lastWill.message,
                qos: protocolConfig.lastWill.qos,
                retain: protocolConfig.lastWill.retain
              }
            })
          };
          break;
        }
        
        default:
          // Generic protocol binding
          bindings[protocolType] = {
            version: protocolConfig.version || "0.5.0",
            ...protocolConfig
          };
      }
    }
    
    return bindings;
  });
}

/**
 * Generate channels from state data
 */
function generateChannels(state: AsyncAPIConsolidatedState): Effect.Effect<AsyncAPIChannels, unknown> {
  return Effect.gen(function*() {
    const channels: Record<string, Record<string, unknown>> = {};
    
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
      const channelDescription = `Channel for ${operationName ?? "unnamed"} operation`;

      // Add publish/subscribe operations
      const publishOperation = operationType?.type === "publish" ? {
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
      } : undefined;

      const subscribeOperation = operationType?.type === "subscribe" ? {
        operationId: operationName,
        description: operationType.description ?? `Subscribe ${operationName} operation`,
        message: {
          payload: {
            type: "object",
            properties: {}
          }
        }
      } : undefined;

      const channelData: Record<string, unknown> = {
        description: channelDescription,
        ...(publishOperation && { publish: publishOperation }),
        ...(subscribeOperation && { subscribe: subscribeOperation }),
      };
      
      channels[channelPathData.path] = channelData;
    }
  
    return channels;
  });
}

/**
 * Generate messages from state data
 */
function generateMessages(state: AsyncAPIConsolidatedState): Effect.Effect<AsyncAPIMessages, unknown> {
  return Effect.gen(function*() {
    const messages: Record<string, Record<string, unknown>> = {};
  
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

    const messageId = modelName ?? "unnamed";
    messages[messageId] = messageData;
  }
  
  return messages;
});
}

/**
 * Generate JSON Schemas from TypeSpec models
 */
function generateSchemas(state: AsyncAPIConsolidatedState): Effect.Effect<AsyncAPISchemas, unknown> {
  return Effect.gen(function*() {
    const schemas: Record<string, Record<string, unknown>> = {};
  
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

      const schemaName = modelName ?? "unnamed";
      schemas[schemaName] = schemaData as Record<string, unknown>;
    }
  }
  
  return schemas;
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
