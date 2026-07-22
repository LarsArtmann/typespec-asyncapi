/**
 * Shared utility functions for the document builder pipeline.
 */

import type { Type } from "@typespec/compiler";
import type {
  MessageConfigData,
  OperationTypeData,
  ProtocolConfigData,
} from "../state.js";
import {
  getLatestBindingVersion,
  hasProtocolBindings,
  normalizeBindingProtocol,
} from "../constants/binding-versions.js";

const OAUTH2_FLOW_KEYS = [
  "implicit",
  "password",
  "clientCredentials",
  "authorizationCode",
] as const;

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
export function operationAction(type: OperationTypeData["type"]): OperationAction {
  return type === "publish" ? "send" : "receive";
}

/** Extract message model names from an Operation type's return type.
 *
 * Supports single model returns (`op foo(): Bar`) and union returns
 * (`op foo(): Bar | Baz`) for multi-message operations.
 */
export function returnModelNames(type: Type): string[] {
  if (type.kind !== "Operation") {
    return [];
  }
  const rt = type.returnType;

  if (rt.kind === "Union") {
    const names: string[] = [];
    for (const variant of rt.variants.values()) {
      const v = variant.type;
      if ("name" in v && typeof v.name === "string" && v.name) {
        names.push(v.name);
      }
    }
    return names;
  }

  if (
    "name" in rt &&
    typeof rt.name === "string" &&
    rt.name &&
    rt.kind !== "Operation"
  ) {
    return [rt.name];
  }

  return [];
}

/** Extract channel path parameters from an address string. */
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

/** Build protocol-specific channel bindings from a ProtocolConfigData entry. */
export function buildProtocolBinding(data: ProtocolConfigData): ProtocolBindings {
  const bindingKey = normalizeBindingProtocol(data.protocol);
  const bindingData: Record<string, unknown> = { ...data.binding };
  if (
    hasProtocolBindings(bindingKey) &&
    bindingData.bindingVersion === undefined
  ) {
    bindingData.bindingVersion = getLatestBindingVersion(bindingKey);
  }
  return { [bindingKey]: bindingData };
}
