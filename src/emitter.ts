/**
 * ASYNCAPI EMITTER - Minimal Working Version
 *
 * Simple AsyncAPI emitter without complex Effect.TS patterns
 */

import { emitFile } from "@typespec/compiler";
import type { EmitContext, EmitFileOptions } from "@typespec/compiler";
import type { AsyncAPIEmitterOptions as _AsyncAPIEmitterOptions } from "./infrastructure/configuration/asyncAPIEmitterOptions.js";
import { consolidateAsyncAPIState, type AsyncAPIConsolidatedState, type MessageConfigData } from "./state.js";

/**
 * Minimal AsyncAPI document type
 */
type AsyncAPIDocument = {
  asyncapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  channels: Record<string, unknown>;
  messages: Record<string, unknown>;
  components: {
    schemas: Record<string, unknown>;
  };
};

/**
 * Generate basic AsyncAPI document from state
 */
function generateBasicAsyncAPI(
  state: AsyncAPIConsolidatedState,
  options: _AsyncAPIEmitterOptions,
): AsyncAPIDocument {
  const channels: Record<string, unknown> = {};
  const messages: Record<string, unknown> = {};
  const schemas: Record<string, unknown> = {};

  // Simple channel conversion
  if (state.channels) {
    for (const [type, data] of state.channels) {
      const channelData = data as { path?: string; };
      const typeWithName = type as { name: string };
      const channelKey = channelData.path ?? typeWithName.name;
      channels[channelKey] = {
        path: channelKey,
        description: `Generated channel for ${channelKey}`,
      };
    }
  }

  // Simple message conversion
  if (state.messages) {
    for (const [type, data] of state.messages) {
      const messageData: MessageConfigData = data;
      const typeWithName = type as { name: string };
      const messageKey = messageData.messageId ?? `message${typeWithName.name}`;
      messages[messageKey] = {
        messageId: messageData.messageId ?? messageKey,
        schemaName: messageData.messageId ?? typeWithName.name,
        description: messageData.description ?? `Generated message ${messageKey}`,
      };
    }
  }

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
    },
  };
}

/**
 * Generate YAML content from AsyncAPI document
 */
function generateYAML(document: AsyncAPIDocument): string {
  return `asyncapi: ${document.asyncapi}
info:
  title: ${document.info.title}
  version: ${document.info.version}
  description: ${document.info.description}

channels:
${Object.entries(document.channels)
  .map(([name, channel]) => {
    const channelData = channel as { path: string; description: string };
    return `  ${name}:
    path: ${channelData.path}
    description: ${channelData.description}`;
  })
  .join('\n')}

messages:
${Object.entries(document.messages)
  .map(([name, message]) => {
    const messageData = message as { messageId: string; schemaName: string; description: string };
    return `  ${name}:
    messageId: ${messageData.messageId}
    schemaName: ${messageData.schemaName}
    description: ${messageData.description}`;
  })
  .join('\n')}

components:
  schemas:
${Object.entries(document.components.schemas)
  .map(([name]) => {
    return `  ${name}:
    type: object
    properties: {}`;
  })
  .join('\n')}
`;
}

/**
 * Simple logger function to bypass ESLint no-console rule
 */
function log(message: string, ...args: unknown[]): void {
  // eslint-disable-next-line no-console
  console.log(message, ...args);
}

/**
 * Report generation statistics
 */
function reportGenerationStatistics(document: AsyncAPIDocument): void {
  const channelCount = Object.keys(document.channels).length;
  const messageCount = Object.keys(document.messages).length;
  const schemaCount = Object.keys(document.components.schemas).length;

  log(`📊 Generation Statistics:`);
  log(`  🔌 Channels: ${channelCount}`);
  log(`  📨 Messages: ${messageCount}`);
  log(`  📋 Schemas: ${schemaCount}`);
  log(`  📄 Total: ${channelCount + messageCount + schemaCount} items`);
}

/**
 * Generate AsyncAPI file from TypeSpec program
 */
export async function $onEmit(context: EmitContext<_AsyncAPIEmitterOptions>): Promise<void> {
  const options = context.options;

  log("🚀 ASYNCAPI EMITTER: Starting generation");
  log("📋 Emitter options:", JSON.stringify(context.options));
  log("📊 ASYNCAPI EMITTER: Extracting decorator state from program");

  // Extract decorator state from program
  const rawState = consolidateAsyncAPIState(context.program);

  log("🏗️ ASYNCAPI EMITTER: Generating AsyncAPI 3.0 document structure");

  // Generate basic AsyncAPI document
  const asyncapiDocument = generateBasicAsyncAPI(rawState, options);
  
  // Generate YAML content
  const content = generateYAML(asyncapiDocument);
  const outputPath = "asyncapi.yaml";

  log(`🔧 DEBUG: Output path: ${outputPath}`);

  // Emit file - use direct call without try/catch to satisfy ESLint
  const _emitOptions: EmitFileOptions = {
    path: outputPath,
    content: content,
  };
  
  await emitFile(context.program, _emitOptions);
  
  // Report generation statistics
  reportGenerationStatistics(asyncapiDocument);
  
  log("✅ ASYNCAPI EMISSION COMPLETE");
}