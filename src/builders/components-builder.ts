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
import type { Type } from "@typespec/compiler";
import type { BuilderFn } from "./_imports.js";
import { nameOfType } from "./_imports.js";
import { iterNamedTypes } from "./shared-utils.js";
import type { AsyncAPIConsolidatedState } from "../state.js";
import type { DocumentBuildContext } from "./types.js";

type Ctx = DocumentBuildContext;
type DataRecord = Record<string, unknown>;

function populateNamed<T extends { name: string }>(
  source: Map<Type, T[]>,
  build: (item: T) => DataRecord,
  postFn?: (item: T, record: DataRecord) => void,
): DataRecord {
  const out: DataRecord = {};
  for (const { data } of iterNamedTypes(source)) {
    for (const item of data) {
      const record = build(item);
      out[item.name] = record;
      postFn?.(item, record);
    }
  }
  return out;
}

/** Resolve a Type to its MessageObject in ctx, or undefined if not found. */
function resolveMessage(
  state: AsyncAPIConsolidatedState,
  ctx: Ctx,
  type: Type,
): MessageObject | undefined {
  const override = state.messages.get(type)?.messageId;
  return ctx.messages[override ?? nameOfType(type) ?? ""];
}

/** Build reusable component maps from namespace-level decorator state. */
export const buildReusableComponents: BuilderFn = (state, ctx) => {
  Object.assign(
    ctx.operationTraits,
    populateNamed(state.operationTraits, (t) =>
      pickOpt(t, [
        "title",
        "summary",
        "description",
        "security",
        "tags",
        "bindings",
      ]),
    ),
  );
  Object.assign(
    ctx.messageTraits,
    populateNamed(state.messageTraits, (t) => ({
      name: t.name,
      ...pickOpt(t, [
        "contentType",
        "description",
        "title",
        "summary",
        "tags",
        "bindings",
        "headers",
        "correlationId",
      ]),
    })),
  );
  Object.assign(
    ctx.reusableParameters,
    populateNamed(
      state.reusableParameters,
      (p) =>
        pickOpt(p, ["description", "location", "enum", "default", "examples"]),
      (p) => {
        upgradeChannelParameterRefs(ctx, p.name);
      },
    ),
  );
  Object.assign(
    ctx.reusableCorrelationIds,
    populateNamed(state.reusableCorrelationIds, (c) => {
      const obj: CorrelationIdObject = { location: c.location };
      if (c.description) {
        obj.description = c.description;
      }
      return obj as unknown as DataRecord;
    }),
  );
};

/** Apply @useOperationTrait, @useMessageTrait, @useCorrelationId, @useBinding refs. */
export const applyReusableRefs: BuilderFn = (state, ctx) => {
  for (const [type, names] of state.operationTraitRefs) {
    const opName = nameOfType(type);
    if (!opName || !ctx.operations[opName]) {
      continue;
    }
    ctx.operations[opName].traits = names
      .filter((n) => n in ctx.operationTraits)
      .map((n) => refOperationTrait(n));
  }

  const refTypes = new Set<Type>([
    ...state.messageTraitRefs.keys(),
    ...state.correlationIdRefs.keys(),
  ]);
  for (const type of refTypes) {
    const msg = resolveMessage(state, ctx, type);
    if (!msg) {
      continue;
    }
    const traitNames = state.messageTraitRefs.get(type);
    if (traitNames) {
      msg.traits = traitNames
        .filter((n) => n in ctx.messageTraits)
        .map((n) => refMessageTrait(n));
    }
    const corrIdName = state.correlationIdRefs.get(type);
    if (corrIdName && corrIdName in ctx.reusableCorrelationIds) {
      msg.correlationId = refCorrelationId(corrIdName);
    }
  }

  applyBindingRefs(state, ctx);
  applyChannelBindingRefs(state, ctx);
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
    const { kind } = type as { kind: string };
    const section =
      kind === "Operation"
        ? "operationBindings"
        : kind === "Namespace"
          ? "serverBindings"
          : "messageBindings";

    const applied = applyBindingNamesToSection(
      names,
      bindingDefinitions,
      ctx[section],
    );
    if (applied.length > 0) {
      const refPointer = `#/components/${section}/${applied[0] ?? ""}`;
      applyBindingToTarget(state, ctx, type, kind, refPointer);
    }
  }
}

/** Look up binding definitions by name and assign to a section map. Returns the names that were applied. */
function applyBindingNamesToSection(
  names: string[],
  definitions: Map<string, ProtocolBindings>,
  section: Record<string, ProtocolBindings>,
): string[] {
  const applied: string[] = [];
  for (const name of names) {
    const def = definitions.get(name);
    if (def) {
      section[name] = def;
      applied.push(name);
    }
  }
  return applied;
}

function applyBindingToTarget(
  state: AsyncAPIConsolidatedState,
  ctx: Ctx,
  type: Type,
  kind: string,
  refPointer: string,
): void {
  const bindingRef = { $ref: refPointer };
  if (kind === "Operation") {
    const opName = nameOfType(type);
    if (opName && ctx.operations[opName]) {
      ctx.operations[opName].bindings = bindingRef;
    }
  } else if (kind === "Namespace") {
    const serverEntries = state.servers.get(type);
    if (serverEntries) {
      for (const { name } of serverEntries) {
        if (ctx.servers[name]) {
          ctx.servers[name].bindings = bindingRef;
        }
      }
    }
  } else {
    const target = resolveMessage(state, ctx, type);
    if (target) {
      target.bindings = bindingRef;
    }
  }
}

/** Apply @useChannelBinding refs: populate components.channelBindings and set channel.bindings to $ref. */
function applyChannelBindingRefs(
  state: AsyncAPIConsolidatedState,
  ctx: Ctx,
): void {
  if (state.channelBindingRefs.size === 0) {
    return;
  }
  const bindingDefinitions = collectBindingDefinitions(state);
  for (const [type, names] of state.channelBindingRefs) {
    const opName = nameOfType(type);
    if (!opName) {
      continue;
    }
    const channelKey = ctx.opToChannel.get(opName) ?? opName;
    const channel = ctx.channels[channelKey];
    if (!channel) {
      continue;
    }
    const applied = applyBindingNamesToSection(
      names,
      bindingDefinitions,
      ctx.channelBindings,
    );
    if (applied.length > 0) {
      channel.bindings = ref(
        `#/components/channelBindings/${applied[0] ?? ""}`,
      );
    }
  }
}

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
