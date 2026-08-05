/**
 * Schema Reference Resolver — maps named TypeSpec types to `$ref` pointers.
 *
 * A named, user-defined Model, Enum, or Scalar resolves to a
 * `#/components/schemas/{name}` `$ref`. Stdlib types and anonymous
 * types return `null` (caller falls back to inline schema).
 */

import type { Enum, Model, Scalar, Type } from "@typespec/compiler";
import { isStdlibType } from "./stdlib-helpers.js";
import type { JsonSchema } from "./domain/models/asyncapi-document.js";

/**
 * Return a `$ref` pointing to `#/components/schemas/{name}` for a named,
 * user-defined type. Returns `null` for stdlib types, anonymous types,
 * and models with indexers (e.g. `Record<>`).
 */
export function refForNamedType(t: Type): JsonSchema | null {
  const { kind } = t as { kind: string };

  if (kind === "Model") {
    const modelType = t as Model;
    if (modelType.name && !modelType.indexer && !isStdlibType(t)) {
      return { $ref: `#/components/schemas/${modelType.name}` };
    }
  }

  if (kind === "Enum") {
    const enumType = t as Enum;
    if (enumType.name && !isStdlibType(t)) {
      return { $ref: `#/components/schemas/${enumType.name}` };
    }
  }

  if (kind === "Scalar") {
    const scalarType = t as Scalar;
    if (scalarType.name && !isStdlibType(t)) {
      return { $ref: `#/components/schemas/${scalarType.name}` };
    }
  }

  return null;
}
