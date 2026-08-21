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
  NumericLiteral,
  Operation,
  Program,
  Scalar,
  StringLiteral,
  Tuple,
  Type,
  Union,
} from "@typespec/compiler";
import { getDiscriminator, isTemplateInstance, resolveEncodedName } from "@typespec/compiler";
import { TypeEmitter } from "@typespec/asset-emitter";
import type {
  Context,
  EmittedSourceFile,
  EmitterOutput,
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
  modelDeclaration(model: Model, name: string): EmitterOutput<JsonSchema> {
    return this.declareModelSchema(model, name);
  }
  /**
   * Template instantiations (`Page<User>`): speakable ones declare under
   * their argument-derived name (`PageUser`); unspeakable ones
   * (`Box<{ ... }>`, `Box<string | int32>`) inline; indexed ones
   * (`Record<string, T>`) inline as `additionalProperties`.
   */
  modelInstantiation(
    model: Model,
    name: string | undefined,
  ): EmitterOutput<JsonSchema> {
    if (model.indexer) {
      return this.indexedModelSchema(model);
    }
    if (name === undefined) {
      return this.collectPropertiesSchema(model, false);
    }
    return this.declareModelSchema(model, name);
  }
  private declareModelSchema(
    model: Model,
    name: string,
  ): EmitterOutput<JsonSchema> {
    const program = this.emitter.getProgram();
    const base = model.baseModel ? this.baseSchemaOf(model.baseModel) : null;
    const schema = this.collectPropertiesSchema(model, base === null);
    if (base) {
      schema.allOf = [base];
    }
    const disc = getDiscriminator(program, model);
    if (disc) {
      const discProp = model.properties.get(disc.propertyName);
      const wireName = discProp ? this.wireNameOf(discProp) : disc.propertyName;
      schema.discriminator = wireName;
      if (!(schema.required ??= []).includes(wireName)) {
        schema.required.push(wireName);
      }
    }
    return this.declareSchema(name, model, schema);
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

  unionDeclaration(union: Union, name: string): EmitterOutput<JsonSchema> {
    return this.declareSchema(name, union, this.composedUnionSchema(union));
  }
  /** Template unions: speakable instantiations declare, unspeakable inline. */
  unionInstantiation(
    union: Union,
    name: string | undefined,
  ): EmitterOutput<JsonSchema> {
    const schema = this.composedUnionSchema(union);
    if (name === undefined) {
      return schema;
    }
    return this.declareSchema(name, union, schema);
  }

  intrinsic(intrinsic: Type, _name: string): EmitterOutput<JsonSchema> {
    return this.intrinsicSchema((intrinsic as { name?: string }).name);
  }

  scalarDeclaration(scalar: Scalar, name: string): EmitterOutput<JsonSchema> {
    return this.declareSchema(name, scalar, this.intrinsicSchema(scalar.name));
  }

  scalarInstantiation = (
    s: Scalar,
    name: string | undefined,
  ): EmitterOutput<JsonSchema> =>
    name ? this.scalarDeclaration(s, name) : this.intrinsicSchema(s.name);

  stringLiteral = (literal: StringLiteral): EmitterOutput<JsonSchema> =>
    this.returnConst(literal.value);
  numericLiteral = (literal: NumericLiteral): EmitterOutput<JsonSchema> =>
    this.returnConst(literal.value);
  booleanLiteral = (literal: BooleanLiteral): EmitterOutput<JsonSchema> =>
    this.returnConst(literal.value);
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

  /** `{ type: "object", additionalProperties }` for indexed models (`Record<K, V>`). */
  private indexedModelSchema(model: Model): JsonSchema {
    const value = model.indexer?.value;
    return {
      additionalProperties: value
        ? this.elementTypeToSchema(value)
        : { type: "string" },
      type: "object",
    };
  }

  private elementTypeToSchema(elementType: Type): JsonSchema {
    return this.refOrFallback(elementType, (t) => this.typeToSchema(t));
  }

  programContext(_program: Program): Context {
    const sourceFile = this.emitter.createSourceFile("schemas.json");
    return { scope: sourceFile.globalScope };
  }

  /** Emit return types so op-return instantiations (`op x(): Page<User>`) get declared. */
  operationReturnType = (
    _operation: Operation,
    returnType: Type,
  ): EmitterOutput<JsonSchema> => this.emitter.emitTypeReference(returnType);
  interfaceDeclaration = (_iface: Interface): EmitterOutput<JsonSchema> =>
    this.emitter.result.none();
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
    type: Model | Scalar | Enum | Union,
    schema: JsonSchema,
  ): EmitterOutput<JsonSchema> {
    applyMetadata(this.emitter.getProgram(), type, schema);
    return this.emitter.result.declaration(name, schema);
  }

  /** Compose a union's variants into an enum/oneOf/anyOf schema. */
  private composedUnionSchema(union: Union): JsonSchema {
    return this.composeUnionVariants(this.mapUnionVariants(union), union);
  }

  /** Map union variants to schemas: named types → `$ref`, string literals → `const`, else intrinsic fallback. */
  private mapUnionVariants(union: Union): JsonSchema[] {
    return [...union.variants.values()].map((v) =>
      this.refOrFallback(v.type, (t) => {
        const tt = t as { kind: string; name?: string; value?: string };
        if (tt.kind === "String" && tt.value !== undefined) {
          return { const: tt.value };
        }
        return intrinsicToSchema(tt.name ?? "string");
      }),
    );
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

  /**
   * Resolve a type to a JSON Schema. Plain named types short-circuit to a
   * hand-built `$ref` (the namespace walk declares them). Instantiations
   * (`Page<User>`) run `emitTypeReference` first so their declaration is
   * created; empty results fall through to the ref, then `typeToSchema`.
   */
  private refOrFallback(
    elementType: Type,
    fallback: (t: Type) => JsonSchema,
  ): JsonSchema {
    const ref = refForNamedType(elementType);
    if (ref && !isTemplateInstance(elementType)) {
      return ref;
    }
    const extracted = extractValue(
      this.emitter.emitTypeReference(elementType),
    );
    if (Object.keys(extracted).length > 0) {
      return extracted;
    }
    return ref ?? fallback(elementType);
  }

  /**
   * `$ref` for a named type; template instantiations (never namespace-walked)
   * are emitted first so the declaration exists before being referenced.
   */
  private refEnsuringDeclaration(t: Type): JsonSchema | null {
    const ref = refForNamedType(t);
    if (ref && isTemplateInstance(t)) {
      this.emitter.emitTypeReference(t);
    }
    return ref;
  }

  /**
   * Composition schema for a base model: `$ref` when named; inline
   * properties when an unspeakable instantiation (`extends Base<{ ... }>`,
   * no declarable name); `null` to flatten the base into the derived model.
   */
  private baseSchemaOf(base: Model): JsonSchema | null {
    return (
      this.refEnsuringDeclaration(base) ??
      (isTemplateInstance(base)
        ? this.collectPropertiesSchema(base, true)
        : null)
    );
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
      for (const [, prop] of m.properties) {
        const wireName = this.wireNameOf(prop);
        if (properties[wireName] !== undefined) {
          continue;
        }
        properties[wireName] = this.propertyToSchema(prop);
        if (!prop.optional) {
          required.push(wireName);
        }
      }
    };
    visit(model);

    return { properties, required };
  }

  /** Wire-format property name: `@encodedName("application/json", ...)` if set. */
  private wireNameOf(prop: ModelProperty): string {
    return resolveEncodedName(this.emitter.getProgram(), prop, "application/json");
  }

  private propertyToSchema(prop: ModelProperty): JsonSchema {
    const schema = this.refOrFallback(prop.type, (t) => this.typeToSchema(t));
    return applyConstraints(this.emitter.getProgram(), prop, schema);
  }

  private typeToSchema(t: Type): JsonSchema {
    const { kind } = t as { kind: string };
    if (kind === "ModelProperty") {
      return this.typeToSchema((t as { type: Type }).type);
    }
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
          const ref = this.refEnsuringDeclaration(inner);
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
    if (kind === "Model" && (t as Model).indexer) {
      return this.indexedModelSchema(t as Model);
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
