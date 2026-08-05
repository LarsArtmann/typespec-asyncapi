/**
 * Channel Builder
 *
 * Creates and manages channel objects, registers messages into channels,
 * applies @doc descriptions, and attaches protocol bindings.
 */

import type { AsyncAPIConsolidatedState } from "../state.js";
import type { ChannelObject, Ref } from "../domain/models/asyncapi-document.js";
import {
  escapeRefToken,
  ref,
  refMessage,
  refSchema,
} from "../domain/models/asyncapi-document.js";
import type { DocumentBuildContext } from "./types.js";
import { nameOfType } from "./types.js";
import {
  buildProtocolBinding,
  extractChannelParameters,
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
    ctx.messages[messageName] = {
      name: msgData?.title ?? messageName,
      contentType: msgData?.contentType ?? "application/json",
      ...(msgData?.description ? { summary: msgData.description } : {}),
      payload: refSchema(schema),
    };
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

/** Apply @doc descriptions to channels from the channelDocs map. */
export function applyChannelDocs(ctx: DocumentBuildContext): void {
  for (const [channelKey, doc] of ctx.channelDocs) {
    const channel = ctx.channels[channelKey];
    if (channel && !channel.description) {
      channel.description = doc;
    }
  }
}

/** Attach protocol bindings to channels from protocolConfigs state. */
export function attachChannelBindings(
  state: AsyncAPIConsolidatedState,
  ctx: DocumentBuildContext,
): void {
  for (const [type, data] of state.protocolConfigs) {
    const name = nameOfType(type);
    if (!name) {
      continue;
    }
    const channelKey = ctx.opToChannel.get(name) ?? name;
    if (data.protocol && ctx.channels[channelKey]) {
      ctx.channels[channelKey].bindings = buildProtocolBinding(data);
    }
  }
}
