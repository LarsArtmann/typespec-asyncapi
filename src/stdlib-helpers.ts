import { isStdNamespace } from "@typespec/compiler";
import type { Namespace, Program, Type } from "@typespec/compiler";

export function isStdlibType(type: Type): boolean {
  const typeWithNs = type as Type & {
    namespace?: Namespace;
    type?: { namespace?: Namespace };
  };
  const ns = typeWithNs.namespace ?? typeWithNs.type?.namespace;
  if (!ns) {
    return false;
  }
  return isStdNamespace(ns);
}

export function collectAllStdlibNames(program: Program): Set<string> {
  const names = new Set<string>();
  const globalNs = program.getGlobalNamespaceType();
  for (const ns of globalNs.namespaces.values()) {
    if (isStdNamespace(ns)) {
      function collectFrom(namespace: Namespace): void {
        collectNamesInto(names, namespace.models);
        collectNamesInto(names, namespace.scalars);
        collectNamesInto(names, namespace.enums);
        for (const sub of namespace.namespaces.values()) {
          collectFrom(sub);
        }
      }
      collectFrom(ns);
    }
  }
  return names;
}

/** Add every map key into `names`. Shared by the three `models/scalars/enums` iterations. */
function collectNamesInto<K, V>(names: Set<string>, items: ReadonlyMap<K, V> | Iterable<[K, V]>): void {
  for (const [name] of items) {
    names.add(String(name));
  }
}
