/**
 * Server Builder
 *
 * Builds AsyncAPI server objects from @server decorator state.
 */

import type { ServerObject } from "../domain/models/asyncapi-document.js";
import type { SecurityRequirement } from "../domain/models/asyncapi-document.js";
import { normalizeProtocol } from "../constants/protocols.js";
import type { BuilderFn } from "./types.js";

interface ServerVar {
  enum?: string[];
  default?: string;
  description?: string;
  examples?: string[];
}

/** Extract a server variable from raw config, mapping `values` → `enum` (TypeSpec reserves `enum`). */
function buildServerVar(
  rawVar: Record<string, unknown> | undefined,
  varName: string,
): ServerVar {
  if (!rawVar) {
    return { description: `Server variable: ${varName}` };
  }
  const result: ServerVar = {};
  const enumSource = Array.isArray(rawVar.values)
    ? (rawVar.values as string[])
    : Array.isArray(rawVar.enum)
      ? (rawVar.enum as string[])
      : undefined;
  if (enumSource) {
    result.enum = enumSource;
  }
  if (rawVar.default !== undefined) {
    result.default = rawVar.default as string;
  }
  if (rawVar.description !== undefined) {
    result.description = rawVar.description as string;
  }
  if (rawVar.examples !== undefined) {
    result.examples = rawVar.examples as string[];
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

/** Build all servers from state. */
export const buildServers: BuilderFn = (state, ctx) => {
  for (const [type, data] of state.servers) {
    const serverEntries = Array.isArray(data) ? data : [data];
    const namespaceBindings = state.protocolBindings.get(type);
    const namespaceTags = state.tags.get(type);
    for (const entry of serverEntries) {
      const server: ServerObject = {
        description: entry.description,
        host: entry.url,
        protocol: normalizeProtocol(entry.protocol),
      };

      const varMatches = entry.url.match(/\{(?<var>[^}]+)\}/gu);
      if (varMatches && varMatches.length > 0) {
        const vars: Record<string, ServerVar> = {};
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

      ctx.servers[entry.name] = server;
    }
  }
};
