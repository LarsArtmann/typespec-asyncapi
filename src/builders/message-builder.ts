/**
 * Message Builder
 *
 * Builds message objects from @message decorator state and auto-registered
 * messages. Applies correlation IDs, headers, bindings, tags, and @doc.
 */

import { getDoc } from "@typespec/compiler";
import type { AsyncAPIConsolidatedState } from "../state.js";
import type {
  MessageObject,
  SchemaObject,
} from "../domain/models/asyncapi-document.js";
import { refSchema } from "../domain/models/asyncapi-document.js";
import type { DocumentBuildContext } from "./types.js";
import { nameOfType } from "./types.js";

/** Merge explicit @message decorator data into the messages map. */
export function mergeExplicitMessages(
  state: AsyncAPIConsolidatedState,
  ctx: DocumentBuildContext,
): void {
  for (const [type, data] of state.messages) {
    const name = nameOfType(type);
    if (!name) {
      continue;
    }
    const msgKey = data.messageId ?? name;
    const msgObj: MessageObject = {
      name: data.title ?? name,
      contentType: data.contentType ?? "application/json",
      ...(data.description ? { summary: data.description } : {}),
      payload: refSchema(name),
    };

    applyCorrelationId(state, type, msgObj);
    applyHeaders(state, type, msgObj);
    applyMessageBindings(state, type, msgObj);

    ctx.messages[msgKey] = msgObj;
  }

  applyExplicitMessageDocs(state, ctx);
  applyAutoMessageDecorators(state, ctx);
}

/** Apply @doc to messages without explicit @message description. */
function applyExplicitMessageDocs(
  state: AsyncAPIConsolidatedState,
  ctx: DocumentBuildContext,
): void {
  for (const [type] of state.messages) {
    const name = nameOfType(type);
    if (!name || !ctx.messages[name]) {
      continue;
    }
    const msg = ctx.messages[name];
    if (!msg.summary) {
      const doc = getDoc(ctx.program, type);
      if (doc) {
        msg.summary = doc;
      }
    }
  }
}

/** Apply decorators (correlation, headers, bindings, tags) to auto-registered messages. */
function applyAutoMessageDecorators(
  state: AsyncAPIConsolidatedState,
  ctx: DocumentBuildContext,
): void {
  for (const [type] of [
    ...state.correlationIds,
    ...state.messageHeaders,
    ...state.protocolBindings,
    ...state.tags,
  ]) {
    const typeName = nameOfType(type);
    if (!typeName || !ctx.messages[typeName]) {
      continue;
    }

    const msg = ctx.messages[typeName];
    applyCorrelationId(state, type, msg, true);
    applyHeaders(state, type, msg, true);
    applyMessageBindings(state, type, msg, true);

    const msgTags = state.tags.get(type);
    if (msgTags && msgTags.length > 0 && !msg.tags) {
      msg.tags = msgTags;
    }
  }
}

/** Apply correlation ID to a message if present in state. */
function applyCorrelationId(
  state: AsyncAPIConsolidatedState,
  type: unknown,
  msg: MessageObject,
  skipExisting = false,
): void {
  if (skipExisting && msg.correlationId) {
    return;
  }
  const correlation = state.correlationIds.get(type as never);
  if (correlation) {
    msg.correlationId = { location: correlation.location };
  }
}

/** Apply headers to a message if present in state. */
function applyHeaders(
  state: AsyncAPIConsolidatedState,
  type: unknown,
  msg: MessageObject,
  skipExisting = false,
): void {
  if (skipExisting && msg.headers) {
    return;
  }
  const headers = state.messageHeaders.get(type as never);
  if (headers && headers.length > 0) {
    const headerProps: Record<string, SchemaObject> = {};
    for (const h of headers) {
      headerProps[h.name] = {
        type: h.type ?? "string",
        ...(h.description ? { description: h.description } : {}),
      };
    }
    msg.headers = { properties: headerProps, type: "object" };
  }
}

/** Apply protocol bindings to a message if present in state. */
function applyMessageBindings(
  state: AsyncAPIConsolidatedState,
  type: unknown,
  msg: MessageObject,
  skipExisting = false,
): void {
  if (skipExisting && msg.bindings) {
    return;
  }
  const msgBindings = state.protocolBindings.get(type as never);
  if (msgBindings && Object.keys(msgBindings).length > 0) {
    msg.bindings = msgBindings;
  }
}
