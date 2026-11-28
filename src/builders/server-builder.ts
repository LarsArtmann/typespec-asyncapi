/**
 * Server Builder
 *
 * Builds AsyncAPI server objects from @server decorator state.
 */

import type {
  ProtocolBindings,
  SecurityRequirement,
  ServerObject,
  ServerVariable,
  Tag,
} from "../domain/models/asyncapi-document.js";
import type { ServerConfigData } from "../state.js";
import { normalizeProtocol } from "../constants/protocols.js";
import type { BuilderFn } from "./types.js";

/** Extract a server variable from raw config, mapping `values` → `enum` (TypeSpec reserves `enum`). */
function buildServerVar(rawVar: unknown, varName: string): ServerVariable {
  if (!rawVar || typeof rawVar !== "object") {
    return { description: `Server variable: ${varName}` };
  }
  const raw = rawVar as Record<string, unknown>;
  const result: ServerVariable = {};
  const enumSource = Array.isArray(raw.values)
    ? (raw.values as string[])
    : Array.isArray(raw.enum)
      ? (raw.enum as string[])
      : undefined;
  if (enumSource) {
    result.enum = enumSource;
  }
  if (raw.default !== undefined) {
    result.default = raw.default as string;
  }
  if (raw.description !== undefined) {
    result.description = raw.description as string;
  }
  if (raw.examples !== undefined) {
    result.examples = raw.examples as string[];
  }
  return result;
}

/** Normalize security to an array of SecurityRequirement objects. */
function normalizeSecurity(
  security: unknown,
): SecurityRequirement[] | undefined {
  if (Array.isArray(security)) {
    return security as SecurityRequirement[];
  }
  if (security && typeof security === "object") {
    return [security] as SecurityRequirement[];
  }
  return undefined;
}

/** Convert a stored server config entry into a ServerObject. */
function buildServerObject(
  entry: ServerConfigData,
  namespaceBindings: ProtocolBindings | undefined,
  namespaceTags: Tag[] | undefined,
): ServerObject {
  const server: ServerObject = {
    description: entry.description,
    host: entry.url,
    protocol: normalizeProtocol(entry.protocol),
  };

  const varMatches = entry.url.match(/\{(?<var>[^}]+)\}/gu);
  if (varMatches && varMatches.length > 0) {
    const vars: Record<string, ServerVariable> = {};
    for (const match of varMatches) {
      const varName = match.slice(1, -1);
      const rawVar = entry.variables?.[varName];
      vars[varName] = buildServerVar(rawVar, varName);
    }
    server.variables = vars;
  }

  if (entry.protocolVersion !== undefined) {
    server.protocolVersion = entry.protocolVersion;
  }
  if (entry.pathname !== undefined) {
    server.pathname = entry.pathname;
  }
  const security = normalizeSecurity(entry.security);
  if (security && security.length > 0) {
    server.security = security;
  }

  if (namespaceBindings && Object.keys(namespaceBindings).length > 0) {
    server.bindings = namespaceBindings;
  }

  if (namespaceTags && namespaceTags.length > 0) {
    server.tags = namespaceTags;
  }

  return server;
}

/** Build all servers from state. */
export const buildServers: BuilderFn = (state, ctx) => {
  for (const [type, data] of state.servers) {
    const serverEntries = Array.isArray(data) ? data : [data];
    const namespaceBindings = state.protocolBindings.get(type);
    const namespaceTags = state.tags.get(type);
    for (const entry of serverEntries) {
      ctx.servers[entry.name] = buildServerObject(
        entry,
        namespaceBindings,
        namespaceTags,
      );
    }
  }
};

/** Build reusable server definitions from state into components.servers. */
export const buildReusableServers: BuilderFn = (state, ctx) => {
  for (const [type, entry] of state.reusableServers) {
    ctx.reusableServers[entry.name] = buildServerObject(
      entry,
      state.protocolBindings.get(type),
      state.tags.get(type),
    );
  }
};
