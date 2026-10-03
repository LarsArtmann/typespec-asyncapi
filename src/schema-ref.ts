/**
 * Schema Reference Resolver — maps named TypeSpec types to `$ref` pointers.
 *
 * A named, user-defined Model, Enum, or Scalar resolves to a
 * `#/components/schemas/{name}` `$ref`. Stdlib types and anonymous
 * types return `null` (caller falls back to inline schema).
 *
 * Template instantiations (`Page<User>`) resolve to argument-derived
 * names (`PageUser`) — the same naming the asset-emitter's
 * `declarationName` computes for the declaration, so `$ref` and
 * declaration always agree.
 */

import type { Type } from "@typespec/compiler";
import { isStdlibType } from "./stdlib-helpers.js";
import { refSchema } from "./domain/models/asyncapi-document.js";
import type { JsonSchema } from "./domain/models/asyncapi-document.js";

/**
 * Canonical schema name for a named type, or `null` when the type must be
 * inlined (stdlib, anonymous, indexed models, unspeakable template
 * instantiations such as `Box<{ ... }>` or `Box<string | int32>`).
 *
 * Mirrors the asset-emitter's `declarationName`: template instantiation
 * names are the base name plus each argument's (recursively resolved)
 * name with its first letter capitalized.
 */
export function schemaNameForType(t: Type): string | null {
  const { kind } = t as { kind: string };
  if (kind !== "Model" && kind !== "Enum" && kind !== "Scalar") {
    return null;
  }
  if (isStdlibType(t)) {
    return null;
  }
  return declarationNameOf(t);
}

/** Types whose declaration name can contribute to an instantiation name. */
const NAMEABLE_KINDS: ReadonlySet<string> = new Set([
  "Model",
  "Scalar",
  "Interface",
  "Operation",
  "Enum",
  "Union",
  "Intrinsic",
]);

/**
 * Name of a type as it contributes to a template-instantiation name,
 * mirroring the emitter framework's `declarationName`: base name plus,
 * for instantiations, each argument's name with its first letter
 * capitalized (`Page` + `User`, `string` → `PageUser`, `PageString`).
 *
 * Unlike `schemaNameForType`, stdlib scalars ARE nameable here (an arg of
 * `int32` yields `Int32`) because the framework names them the same way.
 * Returns `null` for unspeakable types (anonymous, indexed, literal, or
 * union-expression arguments).
 */
function declarationNameOf(t: Type): string | null {
  const { kind } = t as { kind: string };
  if (!NAMEABLE_KINDS.has(kind)) {
    return null;
  }
  const named = t as { name?: string; indexer?: unknown };
  if (kind === "Model" && named.indexer !== undefined) {
    return null;
  }
  const { name: baseName } = named;
  if (!baseName) {
    return null;
  }

  const mapper = (t as { templateMapper?: unknown }).templateMapper as
    | { args?: unknown[] }
    | undefined;
  if (mapper === undefined || mapper.args === undefined) {
    return baseName;
  }

  let name = baseName;
  for (const rawArg of mapper.args) {
    const arg =
      (rawArg as { entityKind?: string }).entityKind === "Indeterminate"
        ? (rawArg as { type?: unknown }).type
        : rawArg;
    if (typeof arg !== "object" || arg === null) {
      return null;
    }
    const argName = declarationNameOf(arg as Type);
    const [firstChar] = argName ?? [];
    if (argName === null || firstChar === undefined) {
      return null;
    }
    name += firstChar.toUpperCase() + argName.slice(1);
  }
  return name;
}

/**
 * Return a `$ref` pointing to `#/components/schemas/{name}` for a named,
 * user-defined type. Returns `null` for stdlib types, anonymous types,
 * and models with indexers (e.g. `Record<>`).
 */
export function refForNamedType(t: Type): JsonSchema | null {
  const name = schemaNameForType(t);
  return name === null ? null : { ...refSchema(name) };
}
