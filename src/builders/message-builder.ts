/**
 * Message Builder
 *
 * Builds message objects from @message decorator state and auto-registered
 * messages. Applies correlation IDs, headers, bindings, tags, and @doc.
 */

import type {
  JsonSchema,
  MessageObject,
} from "../domain/models/asyncapi-document.js";
import { refSchema } from "../domain/models/asyncapi-document.js";
import { getDoc, nameOfType } from "./_imports.js";
import type { AsyncAPIConsolidatedState, BuilderFn } from "./_imports.js";
import { iterNamedTypes } from "./shared-utils.js";

/** Merge explicit @message decorator data into the messages map. */
export const mergeExplicitMessages: BuilderFn = (state, ctx) => {
  for (const { type, name, data } of iterNamedTypes(state.messages)) {
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
};

/** Apply @doc to messages without explicit @message description. */
const applyExplicitMessageDocs: BuilderFn = (state, ctx) => {
  for (const { type, name, data } of iterNamedTypes(state.messages)) {
    const key = data.messageId ?? name;
    const msg = ctx.messages[key];
    if (!msg) {
      continue;
    }
    if (!msg.summary) {
      const doc = getDoc(ctx.program, type);
      if (doc) {
        msg.summary = doc;
      }
    }
  }
};

/** Apply decorators (correlation, headers, bindings, tags) to auto-registered messages. */
const applyAutoMessageDecorators: BuilderFn = (state, ctx) => {
  for (const type of new Set([
    ...state.correlationIds.keys(),
    ...state.messageHeaders.keys(),
    ...state.protocolBindings.keys(),
    ...state.tags.keys(),
  ])) {
    const typeName = nameOfType(type);
    if (!typeName) {
      continue;
    }
    const msgData = state.messages.get(type);
    const key = msgData?.messageId ?? typeName;
    const msg = ctx.messages[key];
    if (!msg) {
      continue;
    }
    applyCorrelationId(state, type, msg, true);
    applyHeaders(state, type, msg, true);
    applyMessageBindings(state, type, msg, true);

    const msgTags = state.tags.get(type);
    if (msgTags && msgTags.length > 0 && !msg.tags) {
      msg.tags = msgTags;
    }
  }
};

/**
 * Apply a decorator to a message, skipping if `skipExisting` is true and the
 * property is already set. Returns the value if it should be applied, or null.
 */
/**
 * Apply a decorator to a message, skipping if `skipExisting` is true and the
 * property is already set. Returns the value if it should be applied, or null.
 */
function readDecoratorValue<T>(
  state: AsyncAPIConsolidatedState,
  type: unknown,
  msg: MessageObject,
  opts: {
    prop: keyof MessageObject;
    skipExisting: boolean;
    read: (s: AsyncAPIConsolidatedState, t: unknown) => T | null;
  },
): T | null {
  if (opts.skipExisting && msg[opts.prop] !== undefined) {
    return null;
  }
  return opts.read(state, type);
}

/**
 * Common signature for functions that apply a single decorator to a message.
 * Used by `applyCorrelationId`, `applyHeaders`, and `applyMessageBindings`.
 */
type MessageDecoratorFn = (
  state: AsyncAPIConsolidatedState,
  type: unknown,
  msg: MessageObject,
  skipExisting?: boolean,
) => void;

/** Apply correlation ID to a message if present in state. */
const applyCorrelationId: MessageDecoratorFn = (
  state,
  type,
  msg,
  skipExisting = false,
) => {
  const value = readDecoratorValue(state, type, msg, {
    prop: "correlationId",
    skipExisting,
    read: (s, t) => {
      const correlation = s.correlationIds.get(t as never);
      return correlation ? { location: correlation.location } : null;
    },
  });
  if (value) {
    msg.correlationId = value;
  }
};

/** Apply headers to a message if present in state. */
const applyHeaders: MessageDecoratorFn = (
  state,
  type,
  msg,
  skipExisting = false,
) => {
  const value = readDecoratorValue(state, type, msg, {
    prop: "headers",
    skipExisting,
    read: (s, t) => {
      const headers = s.messageHeaders.get(t as never);
      if (!headers || headers.length === 0) {
        return null;
      }
      const headerProps: Record<string, JsonSchema> = {};
      for (const h of headers) {
        headerProps[h.name] = {
          type: h.type ?? "string",
          ...(h.description ? { description: h.description } : {}),
        };
      }
      return { properties: headerProps, type: "object" as const };
    },
  });
  if (value) {
    msg.headers = value;
  }
};

/** Apply protocol bindings to a message if present in state. */
const applyMessageBindings: MessageDecoratorFn = (
  state,
  type,
  msg,
  skipExisting = false,
) => {
  const value = readDecoratorValue(state, type, msg, {
    prop: "bindings",
    skipExisting,
    read: (s, t) => {
      const msgBindings = s.protocolBindings.get(t as never);
      if (msgBindings && Object.keys(msgBindings).length > 0) {
        return msgBindings;
      }
      return null;
    },
  });
  if (value) {
    msg.bindings = value;
  }
};
