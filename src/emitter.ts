/**
 * ASYNCAPI EMITTER - Minimal Working Version
 *
 * Simple AsyncAPI emitter without complex Effect.TS patterns
 */

import { emitFile } from "@typespec/compiler";
import type { EmitContext, EmitFileOptions } from "@typespec/compiler";
import type { AsyncAPIEmitterOptions } from "./infrastructure/configuration/asyncAPIEmitterOptions.js";
import {
  consolidateAsyncAPIState,
  type AsyncAPIConsolidatedState,
  type MessageConfigData,
} from "./state.js";
import { Effect } from "effect";

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
  options: AsyncAPIEmitterOptions,
): AsyncAPIDocument {
  const channels: Record<string, unknown> = {};
  const messages: Record<string, unknown> = {};
  const schemas: Record<string, unknown> = {};

  // Simple channel conversion
  if (state.channels) {
    for (const [type, data] of state.channels) {
      const channelData = data as { path?: string };
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
  .join("\n")}

messages:
${Object.entries(document.messages)
  .map(([name, message]) => {
    const messageData = message as { messageId: string; schemaName: string; description: string };
    return `  ${name}:
    messageId: ${messageData.messageId}
    schemaName: ${messageData.schemaName}
    description: ${messageData.description}`;
  })
  .join("\n")}

components:
  schemas:
${Object.entries(document.components.schemas)
  .map(([name]) => {
    return `  ${name}:
    type: object
    properties: {}`;
  })
  .join("\n")}
`;
}

/**
 * Generate AsyncAPI file from TypeSpec program
 */
export async function $onEmit(context: EmitContext<AsyncAPIEmitterOptions>): Promise<void> {
  const options = context.options;

  // Use Effect.runPromise to execute logging effects
  await Effect.runPromise(
    Effect.gen(function* () {
      yield* Effect.log("🔍 EMITTER DEBUG: $onEmit called");
      yield* Effect.log("🔍 EMITTER DEBUG: Options:").pipe(
        Effect.annotateLogs({ options: JSON.stringify(options) }),
      );
      yield* Effect.log("🔍 EMITTER DEBUG: Has program:").pipe(
        Effect.annotateLogs({ hasProgram: context.program !== undefined }),
      );

      // Extract decorator state from program
      const rawState = consolidateAsyncAPIState(context.program);

      yield* Effect.log("🔍 EMITTER DEBUG: Raw state:").pipe(
        Effect.annotateLogs({
          rawState: JSON.stringify(rawState, (key: string, value: unknown): unknown =>
            typeof value === "object" && value instanceof Map ? Object.fromEntries(value) : value,
          ),
        }),
      );

      // Generate basic AsyncAPI document
      const asyncapiDocument = generateBasicAsyncAPI(rawState, options);

      yield* Effect.log("🔍 EMITTER DEBUG: Generated document").pipe(
        Effect.annotateLogs({ channelCount: Object.keys(asyncapiDocument.channels || {}).length }),
      );

      // Generate YAML content
      const content = generateYAML(asyncapiDocument);
      const outputPath = "asyncapi.yaml";

      yield* Effect.log("🔍 EMITTER DEBUG: Generated YAML").pipe(
        Effect.annotateLogs({ contentLength: content.length }),
      );

      // Emit file
      const _emitOptions: EmitFileOptions = {
        path: outputPath,
        content: content,
      };

      yield* Effect.log("🔍 EMITTER DEBUG: About to call emitFile").pipe(
        Effect.annotateLogs({ outputPath }),
      );

      // Use Effect.tryPromise for async operations
      yield* Effect.tryPromise({
        try: () => emitFile(context.program, _emitOptions),
        catch: (error) => new Error(`emitFile failed: ${String(error)}`),
      });

      yield* Effect.log("🔍 EMITTER DEBUG: emitFile completed");
    }),
  );
}
