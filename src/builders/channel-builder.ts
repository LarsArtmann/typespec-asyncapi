/**
 * Channel Builder
 *
 * Creates and manages channel objects, registers messages into channels,
 * applies @doc descriptions, and attaches protocol bindings.
 */

import type { ChannelObject, Ref } from "../domain/models/asyncapi-document.js";
import { escapeRefToken, ref, refMessage, refSchema } from "../domain/models/asyncapi-document.js";
import type { BuilderFn, DocumentBuildContext } from "./_imports.js";
import { buildProtocolBinding, extractChannelParameters, iterNamedTypes } from "./shared-utils.js";

/** Get or create a channel in the context. */
export function ensureChannel(ctx: DocumentBuildContext, channelKey: string): ChannelObject {
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
      ...(msgData?.title ? { title: msgData.title } : {}),
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
export function buildOperationMessageRef(channelKey: string, messageName: string): Ref {
  return ref(`#/channels/${escapeRefToken(channelKey)}/messages/${escapeRefToken(messageName)}`);
}

/** Apply @doc descriptions and @summary summaries to channels from the context maps. */
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
}

/** Attach protocol bindings to channels from protocolConfigs state. */
export const attachChannelBindings: BuilderFn = (state, ctx) => {
  for (const { name, data } of iterNamedTypes(state.protocolConfigs)) {
    const channelKey = ctx.opToChannel.get(name) ?? name;
    const channel = ctx.channels[channelKey];
    if (data.protocol && channel) {
      channel.bindings = buildProtocolBinding(data);
    }
  }
};
