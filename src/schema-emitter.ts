/**
 * AsyncAPI JSON Schema Emitter
 *
 * Minimal TypeEmitter that produces JSON Schema objects from TypeSpec models.
 * These are embedded into components.schemas of the AsyncAPI document.
 */

import type {
  Namespace,
  Type,
  Program,
  Model,
  ModelProperty,
  Union,
  Enum,
  EnumMember,
  Scalar,
  Tuple,
  Operation,
  Interface,
  StringLiteral,
  NumericLiteral,
  BooleanLiteral,
} from "@typespec/compiler";
import { createAssetEmitter, TypeEmitter } from "@typespec/asset-emitter";
import type {
  EmitEntity,
  EmitterOutput,
  Context,
  SourceFile,
  EmittedSourceFile,
} from "@typespec/asset-emitter";
import { isStdNamespace, getDoc } from "@typespec/compiler";
import type { EmitContext } from "@typespec/compiler";
import type { AsyncAPIEmitterOptions } from "./infrastructure/configuration/asyncAPIEmitterOptions.js";
import type { SchemaObject } from "./domain/models/asyncapi-document.js";
import { intrinsicToSchema } from "./intrinsic-mapping.js";

export class AsyncAPISchemaEmitter extends TypeEmitter<SchemaObject, AsyncAPIEmitterOptions> {
  namespaceDeclaration(_namespace: Namespace): EmitterOutput<SchemaObject> {
    return this.emitter.result.none();
  }

  modelDeclaration(model: Model): EmitterOutput<SchemaObject> {
    const properties: Record<string, SchemaObject> = {};
    const required: string[] = [];

    const collectProperties = (m: Model) => {
      if (m.baseModel) collectProperties(m.baseModel);
      for (const [name, prop] of m.properties) {
        if (properties[name] !== undefined) continue;
        properties[name] = this.propertyToSchema(prop);
        const propDoc = getDoc(this.emitter.getProgram(), prop);
        if (propDoc && typeof properties[name] === "object" && properties[name] !== null) {
          properties[name].description = propDoc;
        }
        if (!prop.optional) {
          required.push(name);
        }
      }
    };
    collectProperties(model);

    const schema: SchemaObject = { type: "object", properties };
    if (required.length > 0) schema.required = required;

    const doc = getDoc(this.emitter.getProgram(), model);
    if (doc) schema.description = doc;

    return this.emitter.result.declaration(model.name, schema);
  }

  modelLiteral(model: Model): EmitterOutput<SchemaObject> {
    const properties: Record<string, SchemaObject> = {};
    const required: string[] = [];

    for (const [name, prop] of model.properties) {
      properties[name] = this.propertyToSchema(prop);
      if (!prop.optional) required.push(name);
    }

    const schema: SchemaObject = { type: "object", properties };
    if (required.length > 0) schema.required = required;
    return schema;
  }

  modelProperties(model: Model): EmitterOutput<SchemaObject> {
    const props: Record<string, unknown> = {};
    for (const [name, prop] of model.properties) {
      const result = this.emitter.emitModelProperty(prop);
      props[name] = extractValue(result);
    }
    return props;
  }

  modelProperty(prop: ModelProperty): EmitterOutput<SchemaObject> {
    return this.emitter.emitTypeReference(prop.type);
  }

  union(union: Union): EmitterOutput<SchemaObject> {
    const variants = [...union.variants.values()].map((v) => {
      const extracted = extractValue(this.emitter.emitTypeReference(v.type));
      if (Object.keys(extracted).length === 0) {
        const t = v.type as { kind: string; name?: string; value?: string };
        if (t.kind === "String" && t.value !== undefined) return { const: t.value };
        return intrinsicToSchema(t.name ?? "string");
      }
      return extracted;
    });
    const allConst = variants.every((v) => "const" in v);
    if (allConst) {
      return {
        type: "string",
        enum: variants.map((v) => (v as { const: unknown }).const),
      };
    }
    return { anyOf: variants };
  }

  enum(en: Enum): EmitterOutput<SchemaObject> {
    const values = [...en.members.values()].map((m: EnumMember) => m.value ?? m.name);
    return { type: "string", enum: values };
  }

  intrinsic(intrinsic: Type, _name: string): EmitterOutput<SchemaObject> {
    return intrinsicToSchema((intrinsic as { name?: string }).name ?? "string");
  }

  scalar(scalar: Scalar): EmitterOutput<SchemaObject> {
    return intrinsicToSchema(scalar.name);
  }

  scalarDeclaration(scalar: Scalar, name: string): EmitterOutput<SchemaObject> {
    return this.emitter.result.declaration(name, intrinsicToSchema(scalar.name));
  }

  scalarInstantiation(scalar: Scalar, name: string | undefined): EmitterOutput<SchemaObject> {
    if (name) return this.scalarDeclaration(scalar, name);
    return intrinsicToSchema(scalar.name);
  }

  stringLiteral(literal: StringLiteral): EmitterOutput<SchemaObject> {
    return { const: literal.value };
  }

  numericLiteral(literal: NumericLiteral): EmitterOutput<SchemaObject> {
    return { const: literal.value };
  }

  booleanLiteral(literal: BooleanLiteral): EmitterOutput<SchemaObject> {
    return { const: literal.value };
  }

  tuple(tuple: Tuple): EmitterOutput<SchemaObject> {
    const items = tuple.values.map((v: Type) => extractValue(this.emitter.emitTypeReference(v)));
    return { type: "array", items: { type: "array", enum: items } };
  }

  arrayDeclaration(array: Type, name: string, elementType: Type): EmitterOutput<SchemaObject> {
    return { type: "array", items: this.elementTypeToSchema(elementType) };
  }

  arrayLiteral(array: Type, elementType: Type): EmitterOutput<SchemaObject> {
    return { type: "array", items: this.elementTypeToSchema(elementType) };
  }

  private elementTypeToSchema(elementType: Type): SchemaObject {
    const ref = this.refForNamedType(elementType);
    if (ref) return ref;

    const extracted = extractValue(this.emitter.emitTypeReference(elementType));
    if (Object.keys(extracted).length > 0) return extracted;

    return this.typeToSchema(elementType);
  }

  programContext(_program: Program): Context {
    const sourceFile = this.emitter.createSourceFile("schemas.json");
    return { scope: sourceFile.globalScope };
  }

  operation(_operation: Operation): EmitterOutput<SchemaObject> {
    return this.emitter.result.none();
  }

  interfaceDeclaration(_iface: Interface): EmitterOutput<SchemaObject> {
    return this.emitter.result.none();
  }

  enumDeclaration(en: Enum, name: string): EmitterOutput<SchemaObject> {
    const values = [...en.members.values()].map((m: EnumMember) => m.value ?? m.name);
    const schema: SchemaObject = { type: "string", enum: values };
    const doc = getDoc(this.emitter.getProgram(), en);
    if (doc) schema.description = doc;
    return this.emitter.result.declaration(name, schema);
  }

  sourceFile(sourceFile: SourceFile<SchemaObject>): EmittedSourceFile {
    return { contents: "", path: sourceFile.path };
  }

  private refForNamedType(t: Type): SchemaObject | null {
    const kind = (t as { kind: string }).kind;

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

  private propertyToSchema(prop: ModelProperty): SchemaObject {
    const ref = this.refForNamedType(prop.type);
    if (ref) return ref;

    const propSchema = this.emitter.emitTypeReference(prop.type);
    const extracted = extractValue(propSchema);
    if (Object.keys(extracted).length === 0) {
      return this.typeToSchema(prop.type);
    }
    return extracted;
  }

  private typeToSchema(t: Type): SchemaObject {
    const kind = (t as { kind: string }).kind;
    if (kind === "Union") {
      const tUnion = t as Union;
      const variants = [...tUnion.variants.values()].map((v) => {
        const inner = v.type;
        const innerKind = (inner as { kind: string }).kind;
        if (innerKind === "String" && (inner as { value?: string }).value !== undefined)
          return (inner as { value: string }).value;
        const s = this.typeToSchema(inner);
        return Object.keys(s).length > 0 ? s : { type: "string" };
      });
      const allStrings = variants.every((v) => typeof v === "string");
      if (allStrings) return { type: "string", enum: variants };
      return {
        anyOf: variants.map((v) => (typeof v === "string" ? { const: v } : v)),
      };
    }
    if (kind === "Model" && (t as { indexer?: { key?: unknown; value?: Type } }).indexer) {
      const indexer = (t as { indexer: { key: Type; value: Type } }).indexer;
      const valueRef = this.refForNamedType(indexer.value);
      return {
        type: "object",
        additionalProperties: valueRef ?? this.typeToSchema(indexer.value),
      };
    }
    if (kind === "Scalar" || kind === "Intrinsic")
      return intrinsicToSchema((t as { name: string }).name);
    if (kind === "String") return { const: (t as { value: string }).value };
    if (kind === "Number") return { const: (t as { value: number }).value };
    if (kind === "Boolean") return { const: (t as { value: boolean }).value };
    if (kind === "Tuple")
      return {
        type: "array",
        items: {
          type: "array",
          enum: (t as Tuple).values.map((v: Type) => this.typeToSchema(v)),
        },
      };
    if (kind === "Model") return { type: "object", properties: {} };
    return { type: "string" };
  }
}

export function extractValue(entity: EmitEntity<SchemaObject> | undefined): SchemaObject {
  if (!entity) return {};
  switch (entity.kind) {
    case "declaration":
    case "code": {
      const v = entity.value;
      if (!v || typeof v !== "object") return {};
      if (typeof (v as { onValue?: unknown }).onValue === "function") return {};
      return v as SchemaObject;
    }
    default:
      return {};
  }
}

function isStdlibType(type: Type): boolean {
  const typeWithNs = type as Type & {
    namespace?: Namespace;
    type?: { namespace?: Namespace };
  };
  const ns = typeWithNs.namespace ?? typeWithNs.type?.namespace;
  if (!ns) return false;
  if (isStdNamespace(ns)) return true;
  return false;
}

function collectAllStdlibNames(program: Program): Set<string> {
  const names = new Set<string>();
  const globalNs = program.getGlobalNamespaceType();
  for (const ns of globalNs.namespaces.values()) {
    if (isStdNamespace(ns)) {
      function collectFrom(ns: Namespace) {
        for (const [name] of ns.models) names.add(name);
        for (const [name] of ns.scalars) names.add(name);
        for (const [name] of ns.enums) names.add(name);
        for (const sub of ns.namespaces.values()) collectFrom(sub);
      }
      collectFrom(ns);
    }
  }
  return names;
}

export function generateSchemas(
  context: EmitContext<AsyncAPIEmitterOptions>,
): Record<string, SchemaObject> {
  const schemas: Record<string, SchemaObject> = {};
  const stdlibNames = collectAllStdlibNames(context.program);

  try {
    const assetEmitter = createAssetEmitter<SchemaObject, AsyncAPIEmitterOptions>(
      context.program,
      AsyncAPISchemaEmitter,
      context,
    );

    assetEmitter.emitProgram({ emitGlobalNamespace: true });

    for (const sourceFile of assetEmitter.getSourceFiles()) {
      const scope = sourceFile.globalScope;
      for (const declaration of scope.declarations) {
        if (declaration.name && declaration.value) {
          if (stdlibNames.has(declaration.name)) continue;
          schemas[declaration.name] = declaration.value as SchemaObject;
        }
      }
    }
  } catch {
    // Fall back to empty schemas if asset-emitter fails
  }

  return schemas;
}
