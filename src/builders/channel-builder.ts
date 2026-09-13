/**
 * Channel Builder
 *
 * Creates and manages channel objects, registers messages into channels,
 * applies @doc descriptions, and attaches protocol bindings.
 */

import type { Type } from "@typespec/compiler";
import type {
  ChannelObject,
  ProtocolBindings,
  Ref,
} from "../domain/models/asyncapi-document.js";
import type { ProtocolConfigData } from "../state.js";
import { reportProgramDiagnostic } from "../decorator-helpers.js";
import {
  escapeRefToken,
  ref,
  refMessage,
} from "../domain/models/asyncapi-document.js";
import {
  normalizeBindingProtocol,
  supportsBindingPlacement,
} from "./_imports.js";
import type { AsyncAPIConsolidatedState, BuilderFn, DocumentBuildContext } from "./_imports.js";
import { withMessage } from "./_imports.js";
import {
  buildMessageObject,
  buildProtocolBindings,
  channelForName,
  extractChannelParameters,
  injectLatestBindingVersion,
  iterNamedTypes,
  resolveMessageKey,
} from "./shared-utils.js";

/** Get or create a channel in the context. */
export function ensureChannel(
  ctx: DocumentBuildContext,
  channelKey: string,
): ChannelObject {
  if (!ctx.channels[channelKey]) {
    const params = extractChannelParameters(channelKey);
    ctx.channels[channelKey] = {
      address: channelKey,
      messages: {},
      ...(params ? { parameters: params } : {}),
    };
  }
  return ctx.channels[channelKey];
}

/** Register a message in both the global messages map and the channel. */
export function registerMessage(
  ctx: DocumentBuildContext,
  messageName: string,
  channelKey: string,
  msgData?: { title?: string; description?: string; contentType?: string },
  schemaName?: string,
): void {
  if (!ctx.messages[messageName]) {
    const schema = schemaName ?? messageName;
    ctx.messages[messageName] = buildMessageObject(messageName, schema, {
      title: msgData?.title,
      contentType: msgData?.contentType,
      summary: msgData?.description,
    });
  }
  const channel = ensureChannel(ctx, channelKey);
  const channelMsgs = channel.messages ?? {};
  channelMsgs[messageName] = refMessage(messageName);
  channel.messages = channelMsgs;
}

/** Build the messages ref array for an operation's channel. */
export function buildOperationMessageRef(
  channelKey: string,
  messageName: string,
): Ref {
  return ref(
    `#/channels/${escapeRefToken(channelKey)}/messages/${escapeRefToken(messageName)}`,
  );
}

/** Apply @doc descriptions, @summary summaries, and @tags to channels from the context maps. */
export function applyChannelDocs(ctx: DocumentBuildContext): void {
  for (const [channelKey, doc] of ctx.channelDocs) {
    const channel = ctx.channels[channelKey];
    if (channel && !channel.description) {
      channel.description = doc;
    }
  }
  for (const [channelKey, summary] of ctx.channelSummaries) {
    const channel = ctx.channels[channelKey];
    if (channel && !channel.summary) {
      channel.summary = summary;
    }
  }
  for (const [channelKey, tags] of ctx.channelTags) {
    const channel = ctx.channels[channelKey];
    if (channel && !channel.tags) {
      channel.tags = tags;
    }
  }
}

/** Attach protocol bindings to channels, operations, and models from protocolConfigs state. */
export const attachChannelBindings: BuilderFn = (state, ctx) => {
  for (const { type, name, data } of iterNamedTypes(state.protocolConfigs)) {
    if (type.kind === "Model") {
      attachModelProtocolBindings(state, ctx, type, name, data);
      continue;
    }
    const { channel: channelBinding, operation: operationBinding } =
      buildProtocolBindings(data);
    const channel = channelForName(ctx, name);
    if (channel && channelBinding) {
      channel.bindings = channelBinding;
    }
    const operation = ctx.operations[name];
    if (operation && operationBinding && !isRef(operation.bindings)) {
      operation.bindings = mergeProtocolBindings(
        operation.bindings,
        operationBinding,
      );
    }
  }
};

/**
 * Route `@protocol` on a Model to the model's message bindings.
 *
 * Models map to messages, so only message-placement content applies: the
 * `binding:` passthrough becomes the message binding (with `bindingVersion`
 * auto-injected). Channel/operation-only config fields (e.g. kafka
 * `partitions`) cannot attach to a message and are reported as unplaced.
 */
function attachModelProtocolBindings(
  state: AsyncAPIConsolidatedState,
  ctx: DocumentBuildContext,
  modelType: Type,
  modelName: string,
  data: ProtocolConfigData,
): void {
  const bindingKey = normalizeBindingProtocol(data.protocol);
  const bindingFields: Record<string, unknown> = { ...data.binding };
  const unplaced = modelConfigFieldsWithoutMessagePlacement(data);
  const messageKey = resolveMessageKey(modelType, state.messages);
  const message = ctx.messages[messageKey];
  const messagePlaced =
    message !== undefined &&
    supportsBindingPlacement(bindingKey, "message") &&
    Object.keys(bindingFields).length > 0;

  if (messagePlaced) {
    injectLatestBindingVersion(bindingKey, bindingFields);
    withMessage(ctx, messageKey, (msg) => {
      if (isRef(msg.bindings)) {
        return;
      }
      msg.bindings = mergeProtocolBindings(msg.bindings, {
        [bindingKey]: bindingFields,
      });
    });
  } else {
    unplaced.push(...Object.keys(bindingFields));
  }

  if (unplaced.length > 0) {
    reportProgramDiagnostic(ctx.program, {
      code: "protocol-model-fields-unplaced",
      target: modelType,
      messageId:
        message === undefined && Object.keys(bindingFields).length > 0
          ? "no-message"
          : undefined,
      format: { model: modelName, fields: unplaced.join(", ") },
    });
  }
}

/** `@protocol` config fields that can never attach to a message binding. */
function modelConfigFieldsWithoutMessagePlacement(
  data: ProtocolConfigData,
): string[] {
  return Object.entries(data)
    .filter(
      ([key, value]) =>
        key !== "protocol" &&
        key !== "version" &&
        key !== "binding" &&
        value !== undefined,
    )
    .map(([key]) => key);
}

function isRef(value: unknown): value is Ref {
  return (
    typeof value === "object" &&
    value !== null &&
    "$ref" in value &&
    Object.keys(value).length === 1
  );
}

/**
 * Merge `@protocol`-derived operation bindings into existing `@bindings`
 * output. Existing (explicit) binding fields win per protocol key.
 */
function mergeProtocolBindings(
  existing: ProtocolBindings | undefined,
  incoming: ProtocolBindings,
): ProtocolBindings {
  if (existing === undefined) {
    return incoming;
  }
  const merged: ProtocolBindings = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    merged[key] = { ...value, ...existing[key] };
  }
  return merged;
}

/** Apply @useChannelServer refs: attach server $refs to each channel's `servers` field. */
export const attachChannelServerRefs: BuilderFn = (state, ctx) => {
  if (state.channelServerRefs.size === 0) {
    return;
  }
  for (const { name, data } of iterNamedTypes(state.channelServerRefs)) {
    const channel = channelForName(ctx, name);
    if (!channel) {
      continue;
    }
    const refs: Ref[] = [];
    for (const serverName of data) {
      if (serverName in ctx.servers) {
        refs.push({ $ref: `#/servers/${serverName}` });
      }
    }
    if (refs.length > 0) {
      channel.servers = refs;
    }
  }
};
