/**
 * Pure JSON Schema fragment constructors.
 *
 * Small, side-effect-free builders shared by the schema emitter's
 * declaration paths (literals, enums, union composition).
 */
import type { EnumMember, Program, Union } from "@typespec/compiler";
import { getDiscriminator } from "@typespec/compiler";
import type { JsonSchema } from "./domain/models/asyncapi-document.js";

/** Build a `{ const: value }` literal schema. */
export function constSchema(value: unknown): JsonSchema {
  return { const: value };
}

/** Build an enum schema `{ enum: values, type: "string" }` from a map of `EnumMember`. */
export function enumSchema(members: Map<string, EnumMember>): JsonSchema {
  const values = [...members.values()].map((m) => m.value ?? m.name);
  return { enum: values, type: "string" };
}

/** Decide oneOf vs anyOf for union variants, applying discriminator when all variants are models. */
export function composeUnionVariants(
  variants: JsonSchema[],
  union: Union,
  program: Program,
): JsonSchema {
  const allModelVariants = [...union.variants.values()].every(
    (v) => (v.type as { kind: string }).kind === "Model",
  );
  if (allModelVariants) {
    const disc = getDiscriminator(program, union);
    if (disc) {
      return { oneOf: variants, discriminator: disc.propertyName };
    }
    return { oneOf: variants };
  }
  return { anyOf: variants };
}
