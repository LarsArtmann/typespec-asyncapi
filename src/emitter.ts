/**
 * AsyncAPI 3.0 Emitter
 *
 * Reads decorator state, generates JSON Schemas from TypeSpec models
 * via @typespec/asset-emitter, and outputs AsyncAPI 3.0 YAML/JSON.
 */

import { emitFile } from "@typespec/compiler";
import type { EmitContext, Namespace, Type } from "@typespec/compiler";
import { createAssetEmitter, TypeEmitter } from "@typespec/asset-emitter";
import type { EmitEntity, EmitterOutput, Context, SourceFile, EmittedSourceFile } from "@typespec/asset-emitter";
import { stringify as yamlStringify } from "yaml";
import { isStdNamespace, getDoc } from "@typespec/compiler";
import type { AsyncAPIEmitterOptions } from "./infrastructure/configuration/asyncAPIEmitterOptions.js";
import { consolidateAsyncAPIState, type AsyncAPIConsolidatedState } from "./state.js";

type SchemaObject = Record<string, unknown>;

/**
 * Minimal TypeEmitter that produces JSON Schema objects from TypeSpec models.
 * These are embedded into components.schemas of the AsyncAPI document.
 */
class AsyncAPISchemaEmitter extends TypeEmitter<SchemaObject, AsyncAPIEmitterOptions> {
  namespaceDeclaration(_namespace: Namespace): EmitterOutput<SchemaObject> {
    return this.emitter.result.none();
  }

  modelDeclaration(model: any): EmitterOutput<SchemaObject> {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [name, prop] of model.properties) {
      const propSchema = this.emitter.emitTypeReference(prop.type);
      const extracted = extractValue(propSchema);
      if (Object.keys(extracted).length === 0) {
        // Fallback: generate schema from prop type directly
        const propType = prop.type as { kind: string; name?: string };
        properties[name] = intrinsicToSchema(propType.name ?? propType.kind);
      } else {
        properties[name] = extracted;
      }
      // Add @doc description to property schema
      const propDoc = getDoc(this.emitter.getProgram(), prop);
      if (propDoc && typeof properties[name] === "object" && properties[name] !== null) {
        (properties[name] as SchemaObject).description = propDoc;
      }
      if (!prop.optional) {
        required.push(name);
      }
    }

    const schema: SchemaObject = { type: "object", properties };
    if (required.length > 0) schema.required = required;

    const doc = getDoc(this.emitter.getProgram(), model);
    if (doc) schema.description = doc;

    if (model.baseModel) {
      const ref = this.emitter.emitTypeReference(model.baseModel);
      schema.allOf = [extractValue(ref)];
    }

    return this.emitter.result.declaration(model.name, schema);
  }

  modelLiteral(model: any): EmitterOutput<SchemaObject> {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [name, prop] of model.properties) {
      const propSchema = this.emitter.emitTypeReference(prop.type);
      const extracted = extractValue(propSchema);
      if (Object.keys(extracted).length === 0) {
        // Fallback: generate schema from prop type directly
        const propType = prop.type as { kind: string; name?: string };
        properties[name] = intrinsicToSchema(propType.name ?? propType.kind);
      } else {
        properties[name] = extracted;
      }
      if (!prop.optional) required.push(name);
    }

    const schema: SchemaObject = { type: "object", properties };
    if (required.length > 0) schema.required = required;
    return schema;
  }

  modelProperties(model: any): EmitterOutput<SchemaObject> {
    const props: Record<string, unknown> = {};
    for (const [name, prop] of model.properties) {
      const result = this.emitter.emitModelProperty(prop);
      props[name] = extractValue(result as any);
    }
    return props;
  }

  modelProperty(prop: any): EmitterOutput<SchemaObject> {
    return this.emitter.emitTypeReference(prop.type);
  }

  union(union: any): EmitterOutput<SchemaObject> {
    const variants = [...union.variants.values()].map((v: any) =>
      extractValue(this.emitter.emitTypeReference(v.type)),
    );
    return { anyOf: variants };
  }

  enum(en: any): EmitterOutput<SchemaObject> {
    const values = [...en.members.values()].map((m: any) => m.value ?? m.name);
    return { type: "string", enum: values };
  }

  intrinsic(intrinsic: any, _name: string): EmitterOutput<SchemaObject> {
    return intrinsicToSchema(intrinsic.name);
  }

  scalar(scalar: any): EmitterOutput<SchemaObject> {
    return intrinsicToSchema(scalar.name);
  }

  scalarDeclaration(scalar: any, name: string): EmitterOutput<SchemaObject> {
    return this.emitter.result.declaration(name, intrinsicToSchema(scalar.name));
  }

  scalarInstantiation(scalar: any, name: string | undefined): EmitterOutput<SchemaObject> {
    if (name) return this.scalarDeclaration(scalar, name);
    return intrinsicToSchema(scalar.name);
  }

  stringLiteral(literal: any): EmitterOutput<SchemaObject> {
    return { const: literal.value };
  }

  numericLiteral(literal: any): EmitterOutput<SchemaObject> {
    return { const: literal.value };
  }

  booleanLiteral(literal: any): EmitterOutput<SchemaObject> {
    return { const: literal.value };
  }

  tuple(tuple: any): EmitterOutput<SchemaObject> {
    const items = tuple.values.map((v: any) => extractValue(this.emitter.emitTypeReference(v)));
    return { type: "array", items };
  }

  arrayDeclaration(array: any, name: string, elementType: any): EmitterOutput<SchemaObject> {
    return {
      type: "array",
      items: this.emitter.emitTypeReference(elementType),
    };
  }

  arrayLiteral(array: any, elementType: any): EmitterOutput<SchemaObject> {
    return {
      type: "array",
      items: this.emitter.emitTypeReference(elementType),
    };
  }

  programContext(_program: any): Context {
    const sourceFile = this.emitter.createSourceFile("schemas.json");
    return { scope: sourceFile.globalScope };
  }

  operation(_operation: any): EmitterOutput<SchemaObject> {
    return this.emitter.result.none();
  }

  interfaceDeclaration(_iface: any): EmitterOutput<SchemaObject> {
    return this.emitter.result.none();
  }

  enumDeclaration(en: any, name: string): EmitterOutput<SchemaObject> {
    const values = [...en.members.values()].map((m: any) => m.value ?? m.name);
    const schema: SchemaObject = { type: "string", enum: values };
    const doc = getDoc(this.emitter.getProgram(), en);
    if (doc) schema.description = doc;
    return this.emitter.result.declaration(name, schema);
  }

  sourceFile(sourceFile: SourceFile<SchemaObject>): EmittedSourceFile {
    return { contents: "", path: sourceFile.path };
  }
}

function intrinsicToSchema(typeName: string): SchemaObject {
  switch (typeName) {
    case "string": return { type: "string" };
    case "int32": case "integer": return { type: "integer", format: typeName === "int32" ? "int32" : undefined };
    case "int64": return { type: "integer", format: "int64" };
    case "float": return { type: "number", format: "float" };
    case "numeric": return { type: "number" };
    case "boolean": return { type: "boolean" };
    case "utcDateTime": case "offsetDateTime": return { type: "string", format: "date-time" };
    case "plainDate": return { type: "string", format: "date" };
    case "plainTime": return { type: "string", format: "time" };
    case "duration": return { type: "string", format: "duration" };
    case "bytes": return { type: "string", format: "byte" };
    case "url": return { type: "string", format: "uri" };
    default: return { type: "string" };
  }
}

function extractValue(entity: EmitEntity<SchemaObject> | undefined): SchemaObject {
  if (!entity) return {};
  // Direct value access
  if ("value" in entity && entity.value != null) return entity.value as SchemaObject;
  // Check kind-based extraction
  const e = entity as unknown as Record<string, unknown>;
  if (e.kind === "declaration" && e.value != null) return e.value as SchemaObject;
  if (e.kind === "code" && e.value != null) return e.value as SchemaObject;
  // If the entity IS a plain object schema (no wrapper), return it directly
  if (!("kind" in entity) && typeof entity === "object") return entity as SchemaObject;
  return {};
}

/**
 * Generate JSON Schema objects from all models in the program.
 */
function isStdlibType(type: Type): boolean {
  const ns = (type as any).namespace ?? (type as any).type?.namespace;
  if (!ns) return false;
  if (isStdNamespace(ns)) return true;
  return false;
}

function collectAllStdlibNames(program: any): Set<string> {
  const names = new Set<string>();
  const globalNs = program.checker.getGlobalNamespaceType();
  for (const ns of globalNs.namespaces.values()) {
    if (isStdNamespace(ns)) {
      function collectFrom(ns: any) {
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

function generateSchemas(context: EmitContext<AsyncAPIEmitterOptions>): Record<string, SchemaObject> {
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

function inferActionFromName(name: string): "send" | "receive" {
  const lower = name.toLowerCase();
  if (lower.startsWith("publish") || lower.startsWith("send") || lower.startsWith("emit") || lower.startsWith("produce")) {
    return "send";
  }
  return "receive";
}

/**
 * Build AsyncAPI 3.0 document from decorator state and generated schemas.
 */
function buildAsyncAPIDocument(
  state: AsyncAPIConsolidatedState,
  schemas: Record<string, SchemaObject>,
  options: AsyncAPIEmitterOptions,
): Record<string, unknown> {
  const channels: Record<string, unknown> = {};
  const operations: Record<string, unknown> = {};
  const servers: Record<string, unknown> = {};
  const messages: Record<string, unknown> = {};

  // Build channels from state
  for (const [type, data] of state.channels) {
    const channelData = data as { path?: string };
    const typeWithName = type as { name: string };
    const channelKey = channelData.path ?? typeWithName.name;
    channels[channelKey] = { address: channelKey };
  }

  // Build messages from state
  for (const [type, data] of state.messages) {
    const msgData = data as { messageId?: string; title?: string; description?: string; contentType?: string };
    const typeWithName = type as { name: string };
    const msgKey = msgData.messageId ?? typeWithName.name;
    messages[msgKey] = {
      messageId: msgKey,
      name: msgData.title ?? typeWithName.name,
      summary: msgData.description,
      contentType: msgData.contentType ?? "application/json",
      payload: { $ref: `#/components/schemas/${typeWithName.name}` },
    };
  }

  // Build operations from state — link to channels by path
  const channelMap = new Map<string, string>();
  for (const [type, data] of state.channels) {
    const channelData = data as { path?: string };
    const typeWithName = type as { name: string };
    const opName = typeWithName.name;
    const channelPath = channelData.path ?? opName;
    channelMap.set(opName, channelPath);
  }

  for (const [type, data] of state.operations) {
    const opData = data as { type: string; messageType?: string; description?: string };
    const typeWithName = type as { name: string };
    const channelPath = channelMap.get(typeWithName.name) ?? typeWithName.name;
    operations[typeWithName.name] = {
      action: opData.type === "publish" ? "send" : "receive",
      channel: { $ref: `#/channels/${channelPath}` },
      messages: [{ $ref: `#/components/messages/${opData.messageType ?? typeWithName.name}` }],
    };
  }

  // Auto-generate operations for channels that have @channel but no @publish/@subscribe
  const opsWithType = new Set([...state.operations.keys()].map((t) => (t as { name: string }).name));
  for (const [type, data] of state.channels) {
    const typeWithName = type as { name: string };
    if (opsWithType.has(typeWithName.name)) continue;
    const channelData = data as { path?: string };
    const channelPath = channelData.path ?? typeWithName.name;
    const action = inferActionFromName(typeWithName.name);
    operations[typeWithName.name] = {
      action,
      channel: { $ref: `#/channels/${channelPath}` },
      messages: [{ $ref: `#/components/messages/${typeWithName.name}` }],
    };
  }

  // Build servers from state
  for (const [_type, data] of state.servers) {
    const serverData = data as { name: string; url: string; protocol: string; description?: string };
    servers[serverData.name] = {
      host: serverData.url,
      protocol: serverData.protocol,
      description: serverData.description,
    };
  }

  return {
    asyncapi: options?.["asyncapi-version"] ?? "3.0.0",
    info: {
      title: options?.title ?? "Generated API",
      version: options?.version ?? "1.0.0",
      description: options?.description,
    },
    ...(Object.keys(servers).length > 0 ? { servers } : {}),
    channels,
    operations: Object.keys(operations).length > 0 ? operations : undefined,
    components: {
      messages: Object.keys(messages).length > 0 ? messages : undefined,
      schemas: Object.keys(schemas).length > 0 ? schemas : undefined,
    },
  };
}

/**
 * TypeSpec AsyncAPI emitter entry point.
 */
export async function $onEmit(context: EmitContext<AsyncAPIEmitterOptions>): Promise<void> {
  const options = context.options;
  const rawState = consolidateAsyncAPIState(context.program);
  const schemas = generateSchemas(context);
  const document = buildAsyncAPIDocument(rawState, schemas, options);

  const rawFileType = options?.["file-type"] ?? "yaml";
  const fileType: string = typeof rawFileType === "string"
    ? rawFileType
    : String((rawFileType as Record<string, unknown>)?.format ?? "yaml");
  const outputFile = options?.["output-file"] ?? "asyncapi";
  const outputPath = `${outputFile}.${fileType}`;

  const content =
    fileType === "json"
      ? JSON.stringify(document, null, 2)
      : yamlStringify(document, { lineWidth: 0 });

  await emitFile(context.program, {
    path: `${context.emitterOutputDir}/${outputPath}`,
    content,
  });
}
