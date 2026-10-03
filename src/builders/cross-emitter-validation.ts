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
 * Runs as a library `$onValidate` hook — during program validation, BEFORE
 * emitters — so the `event-op-in-service-namespace` warning surfaces even
 * when `@typespec/http`'s duplicate-operation errors skip emission entirely.
 * Also exposes the shared detection helpers used to keep bare REST operations
 * out of the AsyncAPI document (see `discoverBareOps`).
 */

import { listServices } from "@typespec/compiler";
import type { Namespace, Program, Type } from "@typespec/compiler";
import type { AsyncAPIConsolidatedState } from "../state.js";
import { consolidateAsyncAPIState } from "../state.js";
import { reportProgramDiagnostic } from "../decorator-helpers.js";
import {
  type HttpRoute,
  isHttpLibraryLoaded,
  loadHttpRouteFacts,
} from "./http-route-facts.js";

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

/**
 * Library validation hook: warn about AsyncAPI event operations that
 * `@typespec/http` will route as REST endpoints. Runs during program
 * validation (before emitters) so the warning accompanies — rather than
 * disappears under — http's duplicate-operation errors.
 */
export async function $onValidate(program: Program): Promise<void> {
  await validateCrossEmitterUsage(program, consolidateAsyncAPIState(program));
}

/** One warning candidate: an event type http also routes as REST. */
interface ConflictCandidate {
  readonly namespace: Namespace;
  readonly route: HttpRoute | undefined;
  readonly service: Namespace;
  readonly type: Type;
}

/** Warn about AsyncAPI event operations routed by `@typespec/http`. */
export async function validateCrossEmitterUsage(
  program: Program,
  state: AsyncAPIConsolidatedState,
): Promise<void> {
  if (!isHttpLibraryLoaded(program)) {
    return;
  }
  const httpRouteFacts = await loadHttpRouteFacts(program);
  const eventTypes = new Set<Type>([
    ...state.channels.keys(),
    ...state.operations.keys(),
  ]);
  // Deduplicate per (service, namespace): one warning names the first
  // Affected operation and reports how many more share its namespace.
  const groups = new Map<Namespace, ConflictCandidate[]>();
  for (const type of eventTypes) {
    const service = findEnclosingServiceNamespace(program, type);
    if (service === undefined) {
      continue;
    }
    if (isAsyncApiOverHttp(state, type)) {
      continue;
    }
    const namespace = namespaceOf(type);
    if (namespace === undefined) {
      continue;
    }
    const route =
      type.kind === "Operation"
        ? httpRouteFacts?.routeOf(type)
        : undefined;
    // Exact evidence when the route table is readable: warn only for
    // Operations http actually routes. Geometry containment is the fallback.
    if (httpRouteFacts !== undefined && route === undefined) {
      continue;
    }
    const group = groups.get(namespace);
    const candidate: ConflictCandidate = {
      namespace,
      route,
      service,
      type,
    };
    if (group) {
      group.push(candidate);
    } else {
      groups.set(namespace, [candidate]);
    }
  }
  for (const candidates of groups.values()) {
    const [first] = candidates;
    if (first === undefined) {
      continue;
    }
    reportProgramDiagnostic(program, {
      code: "event-op-in-service-namespace",
      target: first.type,
      format: {
        additional:
          candidates.length > 1
            ? ` ${candidates.length - 1} more operation(s) in this namespace are also affected.`
            : "",
        operationName: "name" in first.type ? String(first.type.name) : "operation",
        routeDetail:
          first.route === undefined
            ? ""
            : ` It is routed by @typespec/http as ${first.route.verb.toUpperCase()} ${first.route.path}.`,
        serviceName: first.service.name,
      },
    });
  }
}
