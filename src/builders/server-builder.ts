/**
 * Server Builder
 *
 * Builds AsyncAPI server objects from @server decorator state.
 */

import type { AsyncAPIConsolidatedState } from "../state.js";
import type { ServerObject } from "../domain/models/asyncapi-document.js";
import { normalizeProtocol } from "../constants/protocols.js";
import type { DocumentBuildContext } from "./types.js";

/** Build all servers from state. */
export function buildServers(
  state: AsyncAPIConsolidatedState,
  ctx: DocumentBuildContext,
): void {
  for (const [type, data] of state.servers) {
    const serverEntries = Array.isArray(data) ? data : [data];
    const namespaceBindings = state.protocolBindings.get(type);
    for (const entry of serverEntries) {
      const server: ServerObject = {
        description: entry.description,
        host: entry.url,
        protocol: normalizeProtocol(entry.protocol),
      };

      const varMatches = entry.url?.match(/\{(?<var>[^}]+)\}/gu);
      if (varMatches && varMatches.length > 0) {
        const vars: Record<string, { default?: string; description?: string }> =
          {};
        for (const match of varMatches) {
          const varName = match.slice(1, -1);
          vars[varName] = { description: `Server variable: ${varName}` };
        }
        server.variables = vars;
      }

      if (
        namespaceBindings &&
        Object.keys(namespaceBindings).length > 0
      ) {
        server.bindings = namespaceBindings;
      }

      ctx.servers[entry.name] = server;
    }
  }
}
