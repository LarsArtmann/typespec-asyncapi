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
  type MessageTraitObject,
  type OperationTraitObject,
  type ParameterObject,
  type ProtocolBindings,
} from "../domain/models/asyncapi-document.js";
import type { BuilderFn } from "./_imports.js";
import { nameOfType, withMessage } from "./_imports.js";
import { iterNamedTypes } from "./shared-utils.js";
import type { AsyncAPIConsolidatedState } from "../state.js";

type Ctx = Parameters<BuilderFn>[1];

/** Build reusable component maps from namespace-level decorator state. */
export const buildReusableComponents: BuilderFn = (state, ctx) => {
  buildOperationTraits(state, ctx);
  buildMessageTraits(state, ctx);
  buildReusableParameters(state, ctx);
  buildReusableCorrelationIds(state, ctx);
};

/** Apply @useOperationTrait, @useMessageTrait, @useCorrelationId, @useBinding refs. */
export const applyReusableRefs: BuilderFn = (state, ctx) => {
  applyOperationTraitRefs(state, ctx);
  applyMessageTraitRefs(state, ctx);
  applyCorrelationIdRefs(state, ctx);
  applyBindingRefs(state, ctx);
};

function buildOperationTraits(state: AsyncAPIConsolidatedState, ctx: Ctx): void {
  for (const { data } of iterNamedTypes(state.operationTraits)) {
    for (const trait of data) {
      const obj: OperationTraitObject = {};
      if (trait.title) {
        obj.title = trait.title;
      }
      if (trait.summary) {
        obj.summary = trait.summary;
      }
      if (trait.description) {
        obj.description = trait.description;
      }
      ctx.operationTraits[trait.name] = obj;
    }
  }
}

function buildMessageTraits(state: AsyncAPIConsolidatedState, ctx: Ctx): void {
  for (const { data } of iterNamedTypes(state.messageTraits)) {
    for (const trait of data) {
      const obj: MessageTraitObject = { name: trait.name };
      if (trait.contentType) {
        obj.contentType = trait.contentType;
      }
      if (trait.description) {
        obj.description = trait.description;
      }
      if (trait.title) {
        obj.title = trait.title;
      }
      ctx.messageTraits[trait.name] = obj;
    }
  }
}

function buildReusableParameters(
  state: AsyncAPIConsolidatedState,
  ctx: Ctx,
): void {
  for (const { data } of iterNamedTypes(state.reusableParameters)) {
    for (const param of data) {
      const obj: ParameterObject = {};
      if (param.description) {
        obj.description = param.description;
      }
      if (param.location) {
        obj.location = param.location;
      }
      ctx.reusableParameters[param.name] = obj;
      upgradeChannelParameterRefs(ctx, param.name);
    }
  }
}

/** Replace inline channel parameters matching `paramName` with `$ref`s. */
function upgradeChannelParameterRefs(ctx: Ctx, paramName: string): void {
  for (const channel of Object.values(ctx.channels)) {
    if (!channel.parameters || !(paramName in channel.parameters)) {
      continue;
    }
    channel.parameters[paramName] = ref(
      `#/components/parameters/${paramName}`,
    );
  }
}

function buildReusableCorrelationIds(
  state: AsyncAPIConsolidatedState,
  ctx: Ctx,
): void {
  for (const { data } of iterNamedTypes(state.reusableCorrelationIds)) {
    for (const corrId of data) {
      const obj: CorrelationIdObject = { location: corrId.location };
      if (corrId.description) {
        obj.description = corrId.description;
      }
      ctx.reusableCorrelationIds[corrId.name] = obj;
    }
  }
}

function applyOperationTraitRefs(
  state: AsyncAPIConsolidatedState,
  ctx: Ctx,
): void {
  for (const [type, traitNames] of state.operationTraitRefs) {
    const opName = nameOfType(type);
    if (!opName) {
      continue;
    }
    const op = ctx.operations[opName];
    if (!op) {
      continue;
    }
    op.traits = traitNames
      .filter((name) => name in ctx.operationTraits)
      .map((name) => refOperationTrait(name));
  }
}

function applyMessageTraitRefs(
  state: AsyncAPIConsolidatedState,
  ctx: Ctx,
): void {
  for (const [type, traitNames] of state.messageTraitRefs) {
    const typeName = nameOfType(type);
    if (!typeName) {
      continue;
    }
    const msgData = state.messages.get(type);
    const key = msgData?.messageId ?? typeName;
    withMessage(ctx, key, (msg: MessageObject) => {
      msg.traits = traitNames
        .filter((name) => name in ctx.messageTraits)
        .map((name) => refMessageTrait(name));
    });
  }
}

function applyCorrelationIdRefs(
  state: AsyncAPIConsolidatedState,
  ctx: Ctx,
): void {
  for (const [type, corrIdName] of state.correlationIdRefs) {
    if (!(corrIdName in ctx.reusableCorrelationIds)) {
      continue;
    }
    const typeName = nameOfType(type);
    if (!typeName) {
      continue;
    }
    const msgData = state.messages.get(type);
    const key = msgData?.messageId ?? typeName;
    withMessage(ctx, key, (msg: MessageObject) => {
      msg.correlationId = refCorrelationId(corrIdName);
    });
  }
}

function applyBindingRefs(state: AsyncAPIConsolidatedState, ctx: Ctx): void {
  const bindingDefinitions = collectBindingDefinitions(state);

  for (const [type, bindingNames] of state.bindingRefs) {
    const typeName = nameOfType(type);
    if (!typeName) {
      continue;
    }

    const targetKind = (type as { kind: string }).kind;
    const isOperation = targetKind === "Operation";
    const componentSection = isOperation ? "operationBindings" : "messageBindings";

    for (const bindingName of bindingNames) {
      const definition = bindingDefinitions.get(bindingName);
      if (!definition) {
        continue;
      }

      ctx[componentSection][bindingName] = definition;
      const refPointer = `#/components/${componentSection}/${bindingName}`;

      if (isOperation) {
        const op = ctx.operations[typeName];
        if (op) {
          op.bindings = { $ref: refPointer };
        }
      } else {
        const msgData = state.messages.get(type);
        const key = msgData?.messageId ?? typeName;
        withMessage(ctx, key, (msg: MessageObject) => {
          msg.bindings = { $ref: refPointer };
        });
      }
    }
  }
}

/** Collect all reusable binding definitions keyed by name. */
function collectBindingDefinitions(
  state: AsyncAPIConsolidatedState,
): Map<string, ProtocolBindings> {
  const out = new Map<string, ProtocolBindings>();
  for (const { data } of iterNamedTypes(state.reusableBindings)) {
    for (const binding of data) {
      out.set(binding.name, binding.bindings);
    }
  }
  return out;
}
