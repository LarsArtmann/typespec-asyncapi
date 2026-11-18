import { isStdNamespace } from "@typespec/compiler";
import type { Namespace, Type } from "@typespec/compiler";

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
