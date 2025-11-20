/**
 * ASYNCAPI EMITTER - Basic file generation
 *
 * Simplest possible AsyncAPI emitter to create working output
 */

import type { EmitContext, Type } from "@typespec/compiler";
import { consolidateAsyncAPIState, type AsyncAPIConsolidatedState } from "./state.js";
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
  ChannelPath,
  MessageId,
  SchemaName
} from "./types/domain/asyncapi-branded-types.js";
import {
  createChannelPath,
  createMessageId,
  createSchemaName
} from "./types/domain/asyncapi-branded-types.js";

/**
 * Basic AsyncAPI emitter - generates working AsyncAPI files
 */
export type AsyncAPIEmitterOptions = {
  version: string;
  title?: string;
  description?: string;
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
  // eslint-disable-next-line no-console
  console.log("🚀 ASYNCAPI EMITTER: Starting generation");

  const program = context.program;
  const options = context.options;

  // eslint-disable-next-line no-console
  console.log("📋 Emitter options:", options);

  // eslint-disable-next-line no-console
  console.log("📊 ASYNCAPI EMITTER: Extracting decorator state from program");
  
  // Extract decorator state from program
  const state = consolidateAsyncAPIState(program);
  
  // eslint-disable-next-line no-console
  console.log("🏗️ ASYNCAPI EMITTER: Generating AsyncAPI 3.0 document structure");
  
  // Generate complete AsyncAPI document
  const asyncapiDocument = generateAsyncAPI30Document(state, options);

  // Write to output file
  const outputPath = "asyncapi.yaml";
  
  // Convert document to YAML format (simple implementation)
  const yamlContent = `asyncapi: 3.0.0
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

  await context.program.host.writeFile(outputPath, yamlContent);
  // eslint-disable-next-line no-console
  console.log(`✅ ASYNCAPI EMITTER: Generated ${outputPath}`);
  
  // Report generation statistics
  reportGenerationStatistics(asyncapiDocument);
}

/**
 * Generate complete AsyncAPI 3.0 document from state
 */
function generateAsyncAPI30Document(
  state: AsyncAPIConsolidatedState,
  options: AsyncAPIEmitterOptions,
): AsyncAPIDocument {
  return {
    asyncapi: "3.0.0",
    info: {
      title: options.title ?? "Generated API",
      version: options.version ?? "1.0.0",
      description: options.description ?? "API generated from TypeSpec",
    },
    channels: generateChannels(state),
    messages: generateMessages(state),
    components: {
      schemas: generateSchemas(state)
    },
  };
}

/**
 * Generate channels from state data
 */
function generateChannels(state: AsyncAPIConsolidatedState): AsyncAPIChannels {
  const channels: AsyncAPIChannels = {};
  
  for (const [operation, channelPathData] of state.channels) {
    const operationName = getOperationName(operation);
    const operationType = state.operations.get(operation);
    
    // eslint-disable-next-line no-console
    console.log(`🔍 Processing channel for operation ${operationName ?? "unknown"}`);
    // eslint-disable-next-line no-console
    console.log(`📍 Channel path: ${channelPathData.path}`);
    // eslint-disable-next-line no-console
    console.log(`⚡ Operation type: ${operationType?.type}`);
    
    // Build channel with operations
    const channelData: any = {
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

    const brandedChannelPath = createChannelPath(channelPathData.path);
    (channels as any)[brandedChannelPath] = channelData as unknown;
  }
  
  return createAsyncAPIChannels(channels);
}

/**
 * Generate messages from state data
 */
function generateMessages(state: AsyncAPIConsolidatedState): AsyncAPIMessages {
  const messages: AsyncAPIMessages = {};
  
  for (const [model, messageConfig] of state.messages) {
    const modelName = getOperationName(model);
    // eslint-disable-next-line no-console
    console.log(`📨 Processing message for model ${modelName ?? "unknown"}`);
    
    // Generate full message structure from TypeSpec model
    const messageData: any = {
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
        const messagePayload = messageData.payload as any;
        (messagePayload.properties as any)[propName] = {
          type: getTypeString(propType),
          description: `Property ${propName}`
        };
      }
    }

    const brandedMessageId = createMessageId(modelName ?? "unnamed");
  (messages as any)[brandedMessageId] = messageData;
  }
  
  return createAsyncAPIMessages(messages);
}

/**
 * Generate JSON Schemas from TypeSpec models
 */
function generateSchemas(state: AsyncAPIConsolidatedState): AsyncAPISchemas {
  const schemas: AsyncAPISchemas = {};
  
  for (const [model, _] of state.messages) {
    const modelName = getOperationName(model);
    
    if (model.kind === "Model") {
      const schemaData = {
        type: "object",
        properties: {},
        required: []
      };

      // Process model properties
      for (const [propName, prop] of model.properties) {
        ((schemaData as any).properties as any)[propName] = {
          type: getTypeString(prop.type),
          description: `Property ${propName}`
        };

        // Check if property is required (no optional)
        if (!prop.optional) {
          ((schemaData as any).required as string[]).push(propName);
        }
      }

      const brandedSchemaName = createSchemaName(modelName ?? "unnamed");
      (schemas as any)[brandedSchemaName] = schemaData;
    }
  }
  
  return createAsyncAPISchemas(schemas);
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
  
  // eslint-disable-next-line no-console
  console.log("📊 ASYNCAPI EMITTER: Generation Statistics:", stats);
  // eslint-disable-next-line no-console
  console.log(`🎯 ASYNCAPI EMITTER: Generated ${stats.channels} channels, ${stats.messages} messages`);
}
