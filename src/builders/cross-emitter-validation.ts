/**
 * Cross-Emitter Validation
 *
 * Detects friction when this emitter is combined with `@typespec/http`-based
 * emitters (e.g. `@typespec/openapi3`) in one program:
 *
 * `@typespec/http` routes EVERY operation under a `@service` namespace as a
 * REST endpoint on every compile (its program-level validation hook), with
 * verb-less operations defaulting to GET. AsyncAPI event operations that live
 * inside the service namespace therefore leak into OpenAPI output as phantom
 * GET endpoints and collide as duplicate routes.
 *
 * Emits the `event-op-in-service-namespace` warning for that case and exposes
 * the shared detection helpers used to keep bare REST operations out of the
 * AsyncAPI document (see `discoverBareOps`).
 */

import { listServices } from "@typespec/compiler";
import type { Namespace, Program, Type } from "@typespec/compiler";
import type { AsyncAPIConsolidatedState } from "../state.js";
import { reportProgramDiagnostic } from "../decorator-helpers.js";
import type { BuilderFn } from "./types.js";

/** True when the program has loaded the `@typespec/http` library. */
export function isHttpLibraryLoaded(program: Program): boolean {
  const typeSpecNs = program.getGlobalNamespaceType().namespaces.get("TypeSpec");
  return typeSpecNs?.namespaces.has("Http") ?? false;
}

/** The namespace of `type`, when the type carries one. */
function namespaceOf(type: Type): Namespace | undefined {
  return "namespace" in type ? type.namespace : undefined;
}

/**
 * The `@service` namespace containing `type` in its subtree, if any
 * (operations in a service subtree are HTTP-routed by `@typespec/http`).
 */
export function findEnclosingServiceNamespace(
  program: Program,
  type: Type,
): Namespace | undefined {
  const services = listServices(program).map((service) => service.type);
  if (services.length === 0) {
    return undefined;
  }
  for (let ns = namespaceOf(type); ns !== undefined; ns = namespaceOf(ns)) {
    const match = services.find((service) => service === ns);
    if (match) {
      return match;
    }
  }
  return undefined;
}

/** True when the nearest AsyncAPI server in scope uses the http(s) protocol. */
function isAsyncApiOverHttp(
  state: AsyncAPIConsolidatedState,
  type: Type,
): boolean {
  for (let ns = namespaceOf(type); ns !== undefined; ns = namespaceOf(ns)) {
    const servers = state.servers.get(ns);
    if (servers !== undefined) {
      return servers.some(
        (server) => server.protocol === "http" || server.protocol === "https",
      );
    }
  }
  return false;
}

/** Warn about AsyncAPI event operations routed by `@typespec/http`. */
export const validateCrossEmitterUsage: BuilderFn = (state, ctx) => {
  if (!isHttpLibraryLoaded(ctx.program)) {
    return;
  }
  const eventTypes = new Set<Type>([...state.channels.keys(), ...state.operations.keys()]);
  for (const type of eventTypes) {
    const service = findEnclosingServiceNamespace(ctx.program, type);
    if (service === undefined) {
      continue;
    }
    if (isAsyncApiOverHttp(state, type)) {
      continue;
    }
    reportProgramDiagnostic(ctx.program, {
      code: "event-op-in-service-namespace",
      target: type,
      format: {
        operationName: "name" in type ? String(type.name) : "operation",
        serviceName: service.name,
      },
    });
  }
};
