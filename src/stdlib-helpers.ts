import { isStdNamespace } from "@typespec/compiler";
import type { Namespace, Type } from "@typespec/compiler";

export function isStdlibType(type: Type): boolean {
  const typeWithNs = type as Type & {
    namespace?: Namespace;
    type?: { namespace?: Namespace };
  };
  let ns = typeWithNs.namespace ?? typeWithNs.type?.namespace;
  while (ns) {
    if (isStdNamespace(ns)) {
      return true;
    }
    ns = ns.namespace;
  }
  return false;
}
