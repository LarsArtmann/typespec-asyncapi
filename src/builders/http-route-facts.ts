/**
 * HTTP Route Facts
 *
 * Exact ownership evidence from `@typespec/http`'s resolved routing table.
 * In mixed programs (REST + events), `@typespec/http` routes every operation
 * under a `@service` namespace as a REST endpoint (verb-less operations
 * default to GET unless they carry a body). Reading the actual route table
 * replaces namespace-geometry heuristics with facts.
 *
 * The accessor is GUARDED: `@typespec/http` is an optional runtime concern of
 * the consumer's program, never a hard dependency of this emitter. When the
 * library is absent (not installed, or installed but not loaded by the
 * program) the accessor returns `undefined` and callers fall back to the
 * documented heuristics (see `discoverBareOps`).
 */

import type { Operation, Program } from "@typespec/compiler";
import type { HttpService } from "@typespec/http";

/** One resolved REST route reported by `@typespec/http`. */
export interface HttpRoute {
  readonly path: string;
  readonly uriTemplate: string;
  readonly verb: string;
}

/** The resolved `@typespec/http` route table for a program. */
export interface HttpRouteFacts {
  readonly routes: ReadonlyMap<Operation, HttpRoute>;
  readonly isRouted: (operation: Operation) => boolean;
  readonly routeOf: (operation: Operation) => HttpRoute | undefined;
}

const factsCache = new WeakMap<
  Program,
  Promise<HttpRouteFacts | undefined>
>();

/**
 * Load the program's HTTP route table, or `undefined` when `@typespec/http`
 * provides no usable evidence. Cached per program; safe to call repeatedly
 * (the `$onValidate` hook and the emitter both resolve ownership).
 */
export function loadHttpRouteFacts(
  program: Program,
): Promise<HttpRouteFacts | undefined> {
  const cached = factsCache.get(program);
  if (cached) {
    return cached;
  }
  const promise = resolveHttpRouteFacts(program);
  factsCache.set(program, promise);
  return promise;
}

async function resolveHttpRouteFacts(
  program: Program,
): Promise<HttpRouteFacts | undefined> {
  if (!isHttpLibraryLoaded(program)) {
    return undefined;
  }
  try {
    const http = await import("@typespec/http");
    return extractRouteFacts(http.getAllHttpServices(program)[0]);
  } catch {
    return undefined;
  }
}

function extractRouteFacts(
  services: HttpService[],
): HttpRouteFacts | undefined {
  const routes = new Map<Operation, HttpRoute>();
  for (const service of services) {
    for (const httpOp of service.operations) {
      routes.set(httpOp.operation, {
        path: httpOp.path,
        uriTemplate: httpOp.uriTemplate,
        verb: httpOp.verb,
      });
    }
  }
  return {
    isRouted: (operation) => routes.has(operation),
    routeOf: (operation) => routes.get(operation),
    routes,
  };
}

/** True when the program has loaded the `@typespec/http` library. */
export function isHttpLibraryLoaded(program: Program): boolean {
  const typeSpecNs = program
    .getGlobalNamespaceType()
    .namespaces.get("TypeSpec");
  return typeSpecNs?.namespaces.has("Http") ?? false;
}
