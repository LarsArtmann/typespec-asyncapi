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
        for (const [name] of namespace.models) {
          names.add(name);
        }
        for (const [name] of namespace.scalars) {
          names.add(name);
        }
        for (const [name] of namespace.enums) {
          names.add(name);
        }
        for (const sub of namespace.namespaces.values()) {
          collectFrom(sub);
        }
      }
      collectFrom(ns);
    }
  }
  return names;
}
