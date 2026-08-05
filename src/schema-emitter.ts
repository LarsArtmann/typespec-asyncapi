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
import { TypeEmitter } from "@typespec/asset-emitter";
import type {
  Context,
  EmittedSourceFile,
  EmitterOutput,
  NoEmit,
  SourceFile,
} from "@typespec/asset-emitter";
import { getDoc } from "@typespec/compiler";
import type { AsyncAPIEmitterOptions } from "./infrastructure/configuration/asyncAPIEmitterOptions.js";
import type { JsonSchema } from "./domain/models/asyncapi-document.js";
import { intrinsicToSchema } from "./intrinsic-mapping.js";
import { extractValue } from "./extract-value.js";
import { isStdlibType } from "./stdlib-helpers.js";

export class AsyncAPISchemaEmitter extends TypeEmitter<
  JsonSchema,
  AsyncAPIEmitterOptions
> {
  namespaceDeclaration(_namespace: Namespace): EmitterOutput<JsonSchema> {
    return this.returnNone();
  }

  modelDeclaration(model: Model): EmitterOutput<JsonSchema> {
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];

    const collectProperties = (m: Model): void => {
      if (m.baseModel) {
        collectProperties(m.baseModel);
      }
      for (const [name, prop] of m.properties) {
        if (properties[name] !== undefined) {
          continue;
        }
        properties[name] = this.propertyToSchema(prop);
        const propDoc = getDoc(this.emitter.getProgram(), prop);
        if (
          propDoc &&
          typeof properties[name] === "object" &&
          properties[name] !== null
        ) {
          properties[name].description = propDoc;
        }
        if (!prop.optional) {
          required.push(name);
        }
      }
    };
    collectProperties(model);

    const schema: JsonSchema = { properties, type: "object" };
    if (required.length > 0) {
      schema.required = required;
    }

    const doc = getDoc(this.emitter.getProgram(), model);
    if (doc) {
      schema.description = doc;
    }

    return this.emitter.result.declaration(model.name, schema);
  }

  modelLiteral(model: Model): EmitterOutput<JsonSchema> {
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];

    for (const [name, prop] of model.properties) {
      properties[name] = this.propertyToSchema(prop);
      if (!prop.optional) {
        required.push(name);
      }
    }

    const schema: JsonSchema = { properties, type: "object" };
    if (required.length > 0) {
      schema.required = required;
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
    const variants = [...union.variants.values()].map((v) => {
      const extracted = extractValue(this.emitter.emitTypeReference(v.type));
      if (Object.keys(extracted).length === 0) {
        const t = v.type as { kind: string; name?: string; value?: string };
        if (t.kind === "String" && t.value !== undefined) {
          return { const: t.value };
        }
        return intrinsicToSchema(t.name ?? "string");
      }
      return extracted;
    });
    const allConst = variants.every((v) => "const" in v);
    if (allConst) {
      return {
        enum: variants.map((v) => (v as { const: unknown }).const),
        type: "string",
      };
    }
    return { anyOf: variants };
  }

  enum(en: Enum): EmitterOutput<JsonSchema> {
    const values = [...en.members.values()].map(
      (m: EnumMember) => m.value ?? m.name,
    );
    return { enum: values, type: "string" };
  }

  intrinsic(intrinsic: Type, _name: string): EmitterOutput<JsonSchema> {
    return intrinsicToSchema((intrinsic as { name?: string }).name ?? "string");
  }

  scalar(scalar: Scalar): EmitterOutput<JsonSchema> {
    return intrinsicToSchema(scalar.name);
  }

  scalarDeclaration(scalar: Scalar, name: string): EmitterOutput<JsonSchema> {
    return this.emitter.result.declaration(
      name,
      intrinsicToSchema(scalar.name),
    );
  }

  scalarInstantiation(
    scalar: Scalar,
    name: string | undefined,
  ): EmitterOutput<JsonSchema> {
    if (name) {
      return this.scalarDeclaration(scalar, name);
    }
    return intrinsicToSchema(scalar.name);
  }

  stringLiteral(literal: StringLiteral): EmitterOutput<JsonSchema> {
    return this.returnConst(literal.value);
  }

  numericLiteral(literal: NumericLiteral): EmitterOutput<JsonSchema> {
    return this.returnConst(literal.value);
  }

  booleanLiteral(literal: BooleanLiteral): EmitterOutput<JsonSchema> {
    return this.returnConst(literal.value);
  }

  tuple(tuple: Tuple): EmitterOutput<JsonSchema> {
    const items = tuple.values.map((v: Type) =>
      this.refOrFallback(v, (t) => this.typeToSchema(t)),
    );
    return { items, type: "array" };
  }

  arrayDeclaration(
    array: Type,
    name: string,
    elementType: Type,
  ): EmitterOutput<JsonSchema> {
    return { items: this.elementTypeToSchema(elementType), type: "array" };
  }

  arrayLiteral(array: Type, elementType: Type): EmitterOutput<JsonSchema> {
    return { items: this.elementTypeToSchema(elementType), type: "array" };
  }

  private elementTypeToSchema(elementType: Type): JsonSchema {
    return this.refOrFallback(elementType, (t) => this.typeToSchema(t));
  }

  programContext(_program: Program): Context {
    const sourceFile = this.emitter.createSourceFile("schemas.json");
    return { scope: sourceFile.globalScope };
  }

  operation(_operation: Operation): EmitterOutput<JsonSchema> {
    return this.returnNone();
  }

  interfaceDeclaration(_iface: Interface): EmitterOutput<JsonSchema> {
    return this.returnNone();
  }

  enumDeclaration(en: Enum, name: string): EmitterOutput<JsonSchema> {
    const values = [...en.members.values()].map(
      (m: EnumMember) => m.value ?? m.name,
    );
    const schema: JsonSchema = { enum: values, type: "string" };
    const doc = getDoc(this.emitter.getProgram(), en);
    if (doc) {
      schema.description = doc;
    }
    return this.emitter.result.declaration(name, schema);
  }

  sourceFile(sourceFile: SourceFile<JsonSchema>): EmittedSourceFile {
    return { contents: "", path: sourceFile.path };
  }

  /** Build a `{ const: value }` literal schema. */
  private returnConst(value: unknown): JsonSchema {
    return { const: value };
  }

  /** Return the AssetEmitter `none()` result for "no schema output". */
  private returnNone(): NoEmit {
    return this.emitter.result.none();
  }

  /** Resolve a type to a JSON Schema: prefer named-type `$ref`, fall back to extraction, then `typeToSchema`. */
  private refOrFallback(
    elementType: Type,
    fallback: (t: Type) => JsonSchema,
  ): JsonSchema {
    const ref = this.refForNamedType(elementType);
    if (ref) {
      return ref;
    }
    const extracted = extractValue(this.emitter.emitTypeReference(elementType));
    if (Object.keys(extracted).length > 0) {
      return extracted;
    }
    return fallback(elementType);
  }

  private refForNamedType(t: Type): JsonSchema | null {
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

  private propertyToSchema(prop: ModelProperty): JsonSchema {
    return this.refOrFallback(prop.type, (t) => this.typeToSchema(t));
  }

  private typeToSchema(t: Type): JsonSchema {
    const { kind } = t as { kind: string };
    if (kind === "Union") {
      const tUnion = t as Union;
      const variants = [...tUnion.variants.values()].map((v) => {
        const inner = v.type;
        const innerKind = (inner as { kind: string }).kind;
        if (
          innerKind === "String" &&
          (inner as { value?: string }).value !== undefined
        ) {
          return (inner as { value: string }).value;
        }
        const s = this.typeToSchema(inner);
        return Object.keys(s).length > 0 ? s : { type: "string" };
      });
      const allStrings = variants.every((v) => typeof v === "string");
      if (allStrings) {
        return { enum: variants, type: "string" };
      }
      return {
        anyOf: variants.map((v) => (typeof v === "string" ? { const: v } : v)),
      };
    }
    if (
      kind === "Model" &&
      (t as { indexer?: { key?: unknown; value?: Type } }).indexer
    ) {
      const { indexer } = t as { indexer: { key: Type; value: Type } };
      const valueRef = this.refForNamedType(indexer.value);
      return {
        additionalProperties: valueRef ?? this.typeToSchema(indexer.value),
        type: "object",
      };
    }
    if (kind === "Scalar" || kind === "Intrinsic") {
      return intrinsicToSchema((t as { name: string }).name);
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
