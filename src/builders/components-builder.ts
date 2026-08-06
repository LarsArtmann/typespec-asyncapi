/**
 * Reusable Components Builder
 *
 * Populates components.* maps from namespace-level decorator state:
 *   - operationTraits, messageTraits
 *   - parameters (reusable channel parameters)
 *   - correlationIds (reusable)
 *   - operationBindings, messageBindings (reusable protocol bindings)
 *
 * Also applies trait/correlationId/binding references to operations
 * and messages based on @use* decorator state.
 */

import {
  ref,
  refCorrelationId,
  refMessageTrait,
  refOperationTrait,
  type CorrelationIdObject,
  type MessageObject,
  type ProtocolBindings,
} from "../domain/models/asyncapi-document.js";
import type { BuilderFn } from "./_imports.js";
import { nameOfType, withMessage } from "./_imports.js";
import { iterNamedTypes } from "./shared-utils.js";
import type { AsyncAPIConsolidatedState } from "../state.js";
import type { DocumentBuildContext } from "./types.js";

type Ctx = DocumentBuildContext;
type DataRecord = Record<string, unknown>;

/** Build reusable component maps from namespace-level decorator state. */
export const buildReusableComponents: BuilderFn = (state, ctx) => {
  for (const { data } of iterNamedTypes(state.operationTraits)) {
    for (const trait of data) {
      ctx.operationTraits[trait.name] = pickOpt(trait, ["title", "summary", "description"]);
    }
  }
  for (const { data } of iterNamedTypes(state.messageTraits)) {
    for (const trait of data) {
      ctx.messageTraits[trait.name] = { name: trait.name, ...pickOpt(trait, ["contentType", "description", "title"]) };
    }
  }
  for (const { data } of iterNamedTypes(state.reusableParameters)) {
    for (const param of data) {
      ctx.reusableParameters[param.name] = pickOpt(param, ["description", "location"]);
      upgradeChannelParameterRefs(ctx, param.name);
    }
  }
  for (const { data } of iterNamedTypes(state.reusableCorrelationIds)) {
    for (const corrId of data) {
      const obj: CorrelationIdObject = { location: corrId.location };
      if (corrId.description) {
        obj.description = corrId.description;
      }
      ctx.reusableCorrelationIds[corrId.name] = obj;
    }
  }
};

/** Apply @useOperationTrait, @useMessageTrait, @useCorrelationId, @useBinding refs. */
export const applyReusableRefs: BuilderFn = (state, ctx) => {
  for (const [type, names] of state.operationTraitRefs) {
    const opName = nameOfType(type);
    if (!opName) {
      continue;
    }
    const op = ctx.operations[opName];
    if (!op) {
      continue;
    }
    op.traits = names.filter((n) => n in ctx.operationTraits).map((n) => refOperationTrait(n));
  }

  for (const [type, names] of state.messageTraitRefs) {
    applyToMessage(state, ctx, type, (msg) => {
      msg.traits = names.filter((n) => n in ctx.messageTraits).map((n) => refMessageTrait(n));
    });
  }

  for (const [type, corrIdName] of state.correlationIdRefs) {
    if (corrIdName in ctx.reusableCorrelationIds) {
      applyToMessage(state, ctx, type, (msg) => {
        msg.correlationId = refCorrelationId(corrIdName);
      });
    }
  }

  applyBindingRefs(state, ctx);
};

function pickOpt(data: object, keys: string[]): DataRecord {
  const src = data as DataRecord;
  const out: DataRecord = {};
  for (const key of keys) {
    if (src[key] !== undefined) {
      out[key] = src[key];
    }
  }
  return out;
}

function resolveMessageKey(state: AsyncAPIConsolidatedState, type: unknown): string | undefined {
  const typeName = nameOfType(type as never);
  if (!typeName) {
    return undefined;
  }
  const msgData = state.messages.get(type as never);
  return msgData?.messageId ?? typeName;
}

function applyToMessage(
  state: AsyncAPIConsolidatedState,
  ctx: Ctx,
  type: unknown,
  fn: (msg: MessageObject) => void,
): void {
  const key = resolveMessageKey(state, type);
  if (key) {
    withMessage(ctx, key, fn);
  }
}

function upgradeChannelParameterRefs(ctx: Ctx, paramName: string): void {
  for (const channel of Object.values(ctx.channels)) {
    if (!channel.parameters || !(paramName in channel.parameters)) {
      continue;
    }
    channel.parameters[paramName] = ref(`#/components/parameters/${paramName}`);
  }
}

function applyBindingRefs(state: AsyncAPIConsolidatedState, ctx: Ctx): void {
  const bindingDefinitions = collectBindingDefinitions(state);

  for (const [type, names] of state.bindingRefs) {
    const targetKind = (type as { kind: string }).kind;
    const isOperation = targetKind === "Operation";
    const section = isOperation ? "operationBindings" : "messageBindings";

    for (const bindingName of names) {
      const definition = bindingDefinitions.get(bindingName);
      if (!definition) {
        continue;
      }
      ctx[section][bindingName] = definition;
      const refPointer = `#/components/${section}/${bindingName}`;
      if (isOperation) {
        const typeName = nameOfType(type);
        if (typeName && ctx.operations[typeName]) {
          ctx.operations[typeName].bindings = { $ref: refPointer };
        }
      } else {
        applyToMessage(state, ctx, type, (msg) => {
          msg.bindings = { $ref: refPointer };
        });
      }
    }
  }
}

function collectBindingDefinitions(state: AsyncAPIConsolidatedState): Map<string, ProtocolBindings> {
  const out = new Map<string, ProtocolBindings>();
  for (const { data } of iterNamedTypes(state.reusableBindings)) {
    for (const binding of data) {
      out.set(binding.name, binding.bindings);
    }
  }
  return out;
}
