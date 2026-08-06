/**
 * Server Builder
 *
 * Builds AsyncAPI server objects from @server decorator state.
 */

import type { ServerObject } from "../domain/models/asyncapi-document.js";
import { normalizeProtocol } from "../constants/protocols.js";
import type { BuilderFn } from "./types.js";

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
        const vars: Record<string, { default?: string; description?: string }> = {};
        for (const match of varMatches) {
          const varName = match.slice(1, -1);
          vars[varName] = { description: `Server variable: ${varName}` };
        }
        server.variables = vars;
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
