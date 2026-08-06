/**
 * AsyncAPI JSON Schema Emitter
 *
 * Minimal TypeEmitter that produces JSON Schema objects from TypeSpec models.
 * These are embedded into components.schemas of the AsyncAPI document.
 */

import type {
  BooleanLiteral,
  Enum,
  EnumMember,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  NumericLiteral,
  Operation,
  Program,
  Scalar,
  StringLiteral,
  Tuple,
  Type,
  Union,
} from "@typespec/compiler";
import { getDiscriminator } from "@typespec/compiler";
import { TypeEmitter } from "@typespec/asset-emitter";
import type {
  Context,
  EmittedSourceFile,
  EmitterOutput,
  NoEmit,
  SourceFile,
} from "@typespec/asset-emitter";
import { applyConstraints, applyMetadata } from "./constraint-mapper.js";
import type { AsyncAPIEmitterOptions } from "./infrastructure/configuration/asyncAPIEmitterOptions.js";
import type { JsonSchema } from "./domain/models/asyncapi-document.js";
import { intrinsicToSchema } from "./intrinsic-mapping.js";
import { extractValue } from "./extract-value.js";
import { refForNamedType } from "./schema-ref.js";

export class AsyncAPISchemaEmitter extends TypeEmitter<
  JsonSchema,
  AsyncAPIEmitterOptions
> {
  namespaceDeclaration(_namespace: Namespace): EmitterOutput<JsonSchema> {
    return this.returnNone();
  }
  modelDeclaration(model: Model): EmitterOutput<JsonSchema> {
    const program = this.emitter.getProgram();
    const baseRef = model.baseModel ? refForNamedType(model.baseModel) : null;
    const schema = this.collectPropertiesSchema(model, baseRef === null);
    if (baseRef) {
      schema.allOf = [baseRef];
    }
    const disc = getDiscriminator(program, model);
    if (disc) {
      schema.discriminator = disc.propertyName;
      if (!(schema.required ??= []).includes(disc.propertyName)) {
        schema.required.push(disc.propertyName);
      }
    }
    applyMetadata(program, model, schema);
    return this.emitter.result.declaration(model.name, schema);
  }
  modelLiteral(model: Model): EmitterOutput<JsonSchema> {
    return this.collectPropertiesSchema(model, false);
  }
  /** Build `{ properties, type: "object" }` (plus required if any) from a model's properties. */
  private collectPropertiesSchema(
    model: Model,
    includeRequired: boolean,
  ): JsonSchema {
    const collected = this.collectModelProperties(model, includeRequired);
    const schema: JsonSchema = {
      properties: collected.properties,
      type: "object",
    };
    if (collected.required.length > 0) {
      schema.required = collected.required;
    }
    return schema;
  }

  modelProperties(model: Model): EmitterOutput<JsonSchema> {
    const props: Record<string, unknown> = {};
    for (const [name, prop] of model.properties) {
      const result = this.emitter.emitModelProperty(prop);
      props[name] = extractValue(result);
    }
    return props;
  }

  modelProperty(prop: ModelProperty): EmitterOutput<JsonSchema> {
    return this.emitter.emitTypeReference(prop.type);
  }

  union(union: Union): EmitterOutput<JsonSchema> {
    const variants = [...union.variants.values()].map((v) =>
      this.refOrFallback(v.type, (t) => {
        const tt = t as { kind: string; name?: string; value?: string };
        if (tt.kind === "String" && tt.value !== undefined) {
          return { const: tt.value };
        }
        return intrinsicToSchema(tt.name ?? "string");
      }),
    );
    const allConst = variants.every((v) => "const" in v);
    if (allConst) {
      return {
        enum: variants.map((v) => (v as { const: unknown }).const),
        type: "string",
      };
    }
    return this.composeUnionVariants(variants, union);
  }

  enum(en: Enum): EmitterOutput<JsonSchema> {
    return this.buildEnumSchema(en.members);
  }

  intrinsic(intrinsic: Type, _name: string): EmitterOutput<JsonSchema> {
    return this.intrinsicSchema((intrinsic as { name?: string }).name);
  }

  scalar(scalar: Scalar): EmitterOutput<JsonSchema> {
    return this.intrinsicSchema(scalar.name);
  }

  scalarDeclaration(scalar: Scalar, name: string): EmitterOutput<JsonSchema> {
    return this.declareSchema(name, scalar, this.intrinsicSchema(scalar.name));
  }

  scalarInstantiation(
    scalar: Scalar,
    name: string | undefined,
  ): EmitterOutput<JsonSchema> {
    if (name) {
      return this.scalarDeclaration(scalar, name);
    }
    return this.intrinsicSchema(scalar.name);
  }

  stringLiteral = (literal: StringLiteral): EmitterOutput<JsonSchema> =>
    this.returnConst(literal.value);
  numericLiteral = (literal: NumericLiteral): EmitterOutput<JsonSchema> =>
    this.returnConst(literal.value);
  booleanLiteral = (literal: BooleanLiteral): EmitterOutput<JsonSchema> =>
    this.returnConst(literal.value);
  tuple(tuple: Tuple): EmitterOutput<JsonSchema> {
    const items = tuple.values.map((v: Type) =>
      this.refOrFallback(v, (t) => this.typeToSchema(t)),
    );
    return { items, type: "array" };
  }

  arrayDeclaration = (
    _array: Type,
    _name: string,
    elementType: Type,
  ): EmitterOutput<JsonSchema> => this.arraySchema(elementType);
  arrayLiteral = (_array: Type, elementType: Type): EmitterOutput<JsonSchema> =>
    this.arraySchema(elementType);
  private arraySchema(elementType: Type): JsonSchema {
    return { items: this.elementTypeToSchema(elementType), type: "array" };
  }

  private elementTypeToSchema(elementType: Type): JsonSchema {
    return this.refOrFallback(elementType, (t) => this.typeToSchema(t));
  }

  programContext(_program: Program): Context {
    const sourceFile = this.emitter.createSourceFile("schemas.json");
    return { scope: sourceFile.globalScope };
  }

  operation = (_operation: Operation): EmitterOutput<JsonSchema> =>
    this.returnNone();
  interfaceDeclaration = (_iface: Interface): EmitterOutput<JsonSchema> =>
    this.returnNone();
  enumDeclaration(en: Enum, name: string): EmitterOutput<JsonSchema> {
    return this.declareSchema(name, en, this.buildEnumSchema(en.members));
  }

  sourceFile(sourceFile: SourceFile<JsonSchema>): EmittedSourceFile {
    return { contents: "", path: sourceFile.path };
  }

  /** Build a `{ const: value }` literal schema. */
  private returnConst(value: unknown): JsonSchema {
    return { const: value };
  }

  /** Build an intrinsic type schema. Falls back to `"string"` when name is undefined. */
  private intrinsicSchema(name: string | undefined): JsonSchema {
    return intrinsicToSchema(name ?? "string");
  }

  /** Build an enum schema `{ enum: values, type: "string" }` from a map of `EnumMember`. */
  private buildEnumSchema(members: Map<string, EnumMember>): JsonSchema {
    const values = [...members.values()].map((m) => m.value ?? m.name);
    return { enum: values, type: "string" };
  }

  /** Apply metadata decorators to a schema and register it as a named declaration. */
  private declareSchema(
    name: string,
    type: Scalar | Enum,
    schema: JsonSchema,
  ): EmitterOutput<JsonSchema> {
    applyMetadata(this.emitter.getProgram(), type, schema);
    return this.emitter.result.declaration(name, schema);
  }

  /** Return the AssetEmitter `none()` result for "no schema output". */
  private returnNone(): NoEmit {
    return this.emitter.result.none();
  }

  /** Decide oneOf vs anyOf for union variants, applying discriminator when all variants are models. */
  private composeUnionVariants(
    variants: JsonSchema[],
    union: Union,
  ): JsonSchema {
    const allModelVariants = [...union.variants.values()].every(
      (v) => (v.type as { kind: string }).kind === "Model",
    );
    if (allModelVariants) {
      const disc = getDiscriminator(this.emitter.getProgram(), union);
      if (disc) {
        return { oneOf: variants, discriminator: disc.propertyName };
      }
      return { oneOf: variants };
    }
    return { anyOf: variants };
  }

  /** Resolve a type to a JSON Schema: prefer named-type `$ref`, fall back to extraction, then `typeToSchema`. */
  private refOrFallback(
    elementType: Type,
    fallback: (t: Type) => JsonSchema,
  ): JsonSchema {
    const ref = refForNamedType(elementType);
    if (ref) {
      return ref;
    }
    const extracted = extractValue(this.emitter.emitTypeReference(elementType));
    if (Object.keys(extracted).length > 0) {
      return extracted;
    }
    return fallback(elementType);
  }

  /**
   * Walk a Model's properties (and optionally its baseModel chain), producing
   * the JSON Schema `properties` map and `required` array. Used by both
   * `modelDeclaration` and `modelLiteral`.
   */
  private collectModelProperties(
    model: Model,
    includeBase: boolean,
  ): { properties: Record<string, JsonSchema>; required: string[] } {
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];

    const visit = (m: Model): void => {
      if (includeBase && m.baseModel) {
        visit(m.baseModel);
      }
      for (const [name, prop] of m.properties) {
        if (properties[name] !== undefined) {
          continue;
        }
        properties[name] = this.propertyToSchema(prop);
        if (!prop.optional) {
          required.push(name);
        }
      }
    };
    visit(model);

    return { properties, required };
  }

  private propertyToSchema(prop: ModelProperty): JsonSchema {
    const schema = this.refOrFallback(prop.type, (t) => this.typeToSchema(t));
    return applyConstraints(this.emitter.getProgram(), prop, schema);
  }

  private typeToSchema(t: Type): JsonSchema {
    const { kind } = t as { kind: string };
    if (kind === "Union") {
      const tUnion = t as Union;
      const variants = [...tUnion.variants.values()].map(
        (v): string | JsonSchema => {
          const inner = v.type;
          const innerKind = (inner as { kind: string }).kind;
          if (
            innerKind === "String" &&
            (inner as { value?: string }).value !== undefined
          ) {
            return (inner as { value: string }).value;
          }
          const ref = refForNamedType(inner);
          if (ref) {
            return ref;
          }
          const s = this.typeToSchema(inner);
          return Object.keys(s).length > 0 ? s : { type: "string" };
        },
      );
      if (variants.every((v) => typeof v === "string")) {
        return { enum: variants, type: "string" };
      }
      const schemaVariants = variants.map((v) =>
        typeof v === "string" ? { const: v } : v,
      );
      return this.composeUnionVariants(schemaVariants, tUnion);
    }
    if (
      kind === "Model" &&
      (t as { indexer?: { key?: unknown; value?: Type } }).indexer
    ) {
      const { indexer } = t as { indexer: { key: Type; value: Type } };
      const valueRef = refForNamedType(indexer.value);
      return {
        additionalProperties: valueRef ?? this.typeToSchema(indexer.value),
        type: "object",
      };
    }
    if (kind === "Scalar" || kind === "Intrinsic") {
      return this.intrinsicSchema((t as { name?: string }).name);
    }
    if (kind === "String") {
      return this.returnConst((t as { value: string }).value);
    }
    if (kind === "Number") {
      return this.returnConst((t as { value: number }).value);
    }
    if (kind === "Boolean") {
      return this.returnConst((t as { value: boolean }).value);
    }
    if (kind === "Tuple") {
      return {
        items: (t as Tuple).values.map((v: Type) =>
          this.refOrFallback(v, (inner) => this.typeToSchema(inner)),
        ),
        type: "array",
      };
    }
    if (kind === "Model") {
      return { properties: {}, type: "object" };
    }
    return { type: "string" };
  }
}
