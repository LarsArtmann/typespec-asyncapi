/**
 * Shared utility functions for the document builder pipeline.
 */

import type { Type } from "@typespec/compiler";
import type {
  ChannelObject,
  OperationAction,
  ParameterObject,
  ProtocolBindings,
  SecurityScheme,
} from "../domain/models/asyncapi-document.js";
import type {
  MessageConfigData,
  OperationTypeData,
  ProtocolConfigData,
} from "../state.js";
import {
  getLatestBindingVersion,
  hasProtocolBindings,
  normalizeBindingProtocol,
  supportsBindingPlacement,
} from "../constants/binding-versions.js";
import { nameOfType } from "./types.js";
import type { DocumentBuildContext } from "./types.js";
import { schemaNameForType } from "../schema-ref.js";

const OAUTH2_FLOW_KEYS = [
  "implicit",
  "password",
  "clientCredentials",
  "authorizationCode",
] as const;

/**
 * Iterate a `state.<map>` (Type → Data) skipping entries whose type has no name.
 * Consolidates the recurring `for (const [type, data] of map) { const name = nameOfType(type); if (!name) continue; ... }`
 * pattern across all builders.
 */
export function* iterNamedTypes<K, V>(
  map: Map<K, V>,
): Generator<{ type: K & Type; name: string; data: V }> {
  for (const [type, data] of map) {
    const name = nameOfType(type as Type);
    if (!name) {
      continue;
    }
    yield { data, name, type: type as K & Type };
  }
}

/**
 * Build a `Set` of the named-type names from a `state.<map>`. Unnamed types
 * are filtered out. Used to test membership in the set of already-discovered
 * operations.
 */
export function namesOfTypes<K>(map: Map<K, unknown>): Set<string> {
  const out = new Set<string>();
  for (const key of map.keys()) {
    const n = nameOfType(key as Type);
    if (n) {
      out.add(n);
    }
  }
  return out;
}

/**
 * Normalize OAuth2 flows: AsyncAPI 3.1 uses `availableScopes` (not `scopes`).
 * Accept both as input; always output `availableScopes`.
 */
export function normalizeOAuth2Scopes(scheme: SecurityScheme): SecurityScheme {
  if (!scheme.flows) {
    return scheme;
  }
  const flows = { ...scheme.flows };
  for (const key of OAUTH2_FLOW_KEYS) {
    const flow = flows[key];
    if (!flow) {
      continue;
    }
    const raw = flow as unknown as Record<string, unknown>;
    if ("scopes" in raw && !("availableScopes" in raw)) {
      const { scopes, ...rest } = raw;
      flows[key] = { ...rest, availableScopes: scopes } as typeof flow;
    }
  }
  return { ...scheme, flows };
}

/** Infer the operation action (send/receive) from the operation name. */
export function inferActionFromName(name: string): OperationAction {
  const lower = name.toLowerCase();
  if (
    lower.startsWith("publish") ||
    lower.startsWith("send") ||
    lower.startsWith("emit") ||
    lower.startsWith("produce")
  ) {
    return "send";
  }
  return "receive";
}

/** Map a decorator-declared operation type to an AsyncAPI OperationAction. */
export function operationAction(
  type: OperationTypeData["type"],
): OperationAction {
  return type === "publish" ? "send" : "receive";
}

/**
 * Extract message model `selector(type)` values from an Operation's return type.
 *
 * Supports single model returns (`op foo(): Bar`) and union returns
 * (`op foo(): Bar | Baz`) for multi-message operations. The `selector` is
 * applied to each named model type; use `t => t.name` for string names or
 * `t => t` to collect the Type objects themselves.
 */
export function returnModels<T>(type: Type, selector: (t: Type) => T): T[] {
  if (type.kind !== "Operation") {
    return [];
  }
  const rt = type.returnType;

  if (rt.kind === "Union") {
    const out: T[] = [];
    for (const variant of rt.variants.values()) {
      const v = variant.type;
      if ("name" in v && typeof v.name === "string" && v.name) {
        out.push(selector(v));
      }
    }
    return out;
  }

  if (
    "name" in rt &&
    typeof rt.name === "string" &&
    rt.name &&
    rt.kind !== "Operation"
  ) {
    return [selector(rt)];
  }

  return [];
}

/**
 * Resolve the channel object for a named operation/channel type, following
 * `@channel` path overrides recorded during discovery.
 */
export function channelForName(
  ctx: DocumentBuildContext,
  name: string,
): ChannelObject | undefined {
  return ctx.channels[ctx.opToChannel.get(name) ?? name];
}

/** Extract message model names from an Operation type's return type. */
export function returnModelNames(type: Type): string[] {
  return returnModels(type, (t) => (t as { name: string }).name);
}

/** Extract message model Type objects from an Operation type's return type. */
export function returnModelTypes(type: Type): Type[] {
  return returnModels(type, (t) => t);
}

/** Resolve the effective message key for a model type, checking @messageId overrides. */
export function resolveMessageKey(
  modelType: Type,
  stateMessages: Map<Type, MessageConfigData>,
): string {
  const name =
    schemaNameForType(modelType) ??
    ("name" in modelType && typeof modelType.name === "string"
      ? modelType.name
      : "");
  const msgData = stateMessages.get(modelType);
  return msgData?.messageId ?? name;
}
export function extractChannelParameters(
  address: string,
): Record<string, ParameterObject> | undefined {
  const matches = address.match(/\{(?<param>[^}]+)\}/gu);
  if (!matches || matches.length === 0) {
    return undefined;
  }
  const params: Record<string, ParameterObject> = {};
  for (const match of matches) {
    const paramName = match.slice(1, -1);
    params[paramName] = { description: `Channel parameter: ${paramName}` };
  }
  return params;
}

/** Drop `undefined` values from a field map, keeping only written config. */
function definedFields(
  entries: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

/** Spec-derived binding fields for one protocol, keyed by placement. */
interface PlacementFields {
  channel?: Record<string, unknown>;
  operation?: Record<string, unknown>;
}

type ProtocolFieldPicker = (data: ProtocolConfigData) => PlacementFields;

const kafkaFields: ProtocolFieldPicker = (d) => {
  if (d.protocol !== "kafka") {
    return {};
  }
  return {
    channel: definedFields({
      partitions: d.partitions,
      replicas: d.replicationFactor,
    }),
    operation: definedFields({
      groupId:
        d.consumerGroup === undefined
          ? undefined
          : { type: "string", const: d.consumerGroup },
    }),
  };
};

const wsFields: ProtocolFieldPicker = (d) => {
  if (d.protocol !== "ws" && d.protocol !== "wss") {
    return {};
  }
  return {
    channel: definedFields({ headers: d.headers, query: d.queryParams }),
  };
};

const mqttFields: ProtocolFieldPicker = (d) => {
  if (d.protocol !== "mqtt" && d.protocol !== "mqtt5") {
    return {};
  }
  return {
    operation: definedFields({ qos: d.qos, retain: d.retain }),
  };
};

/** Field pickers keyed by the `@protocol` config discriminant. */
const FIELD_PICKERS: Readonly<Record<string, ProtocolFieldPicker>> = {
  kafka: kafkaFields,
  ws: wsFields,
  wss: wsFields,
  mqtt: mqttFields,
  mqtt5: mqttFields,
};

/** Protocol bindings derived from one `@protocol` config, keyed by placement. */
export interface ProtocolBindingPlacements {
  channel?: ProtocolBindings;
  operation?: ProtocolBindings;
}

/**
 * Build the channel and operation bindings from a `@protocol` config entry,
 * honoring the spec-derived placement matrix:
 *
 * - Fields map to the placement the AsyncAPI 3.1 binding spec defines them
 *   at (e.g. kafka `partitions` → channel, `consumerGroup` → operation).
 * - The raw `binding:` passthrough routes to the channel binding when the
 *   protocol defines one, otherwise the operation binding (e.g. HTTP).
 * - Bindings without content fields are omitted entirely (no version-only
 *   shells); `bindingVersion` is auto-injected from the binding specs.
 */
export function buildProtocolBindings(
  data: ProtocolConfigData,
): ProtocolBindingPlacements {
  const bindingKey = normalizeBindingProtocol(data.protocol);
  const passthroughTarget: "channel" | "operation" =
    supportsBindingPlacement(bindingKey, "channel") ? "channel" : "operation";
  const fields = FIELD_PICKERS[data.protocol]?.(data) ?? {};

  const result: ProtocolBindingPlacements = {};
  for (const placement of ["channel", "operation"] as const) {
    if (!supportsBindingPlacement(bindingKey, placement)) {
      continue;
    }
    const bindingFields: Record<string, unknown> = {
      ...fields[placement],
      ...(placement === passthroughTarget ? data.binding : undefined),
    };
    if (Object.keys(bindingFields).length === 0) {
      continue;
    }
    if (
      hasProtocolBindings(bindingKey) &&
      bindingFields.bindingVersion === undefined
    ) {
      bindingFields.bindingVersion = getLatestBindingVersion(bindingKey);
    }
    result[placement] = { [bindingKey]: bindingFields };
  }
  return result;
}
