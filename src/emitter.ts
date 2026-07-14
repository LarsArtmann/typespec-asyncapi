/**
 * AsyncAPI 3.0 Emitter
 *
 * Reads decorator state, generates JSON Schemas from TypeSpec models
 * via @typespec/asset-emitter, and outputs AsyncAPI 3.0 YAML/JSON.
 */

import { emitFile } from "@typespec/compiler";
import type { EmitContext, Namespace, Type, Program } from "@typespec/compiler";
import { createAssetEmitter, TypeEmitter } from "@typespec/asset-emitter";
import type {
  EmitEntity,
  EmitterOutput,
  Context,
  SourceFile,
  EmittedSourceFile,
} from "@typespec/asset-emitter";
import { stringify as yamlStringify } from "yaml";
import { isStdNamespace, getDoc } from "@typespec/compiler";
import type { AsyncAPIEmitterOptions } from "./infrastructure/configuration/asyncAPIEmitterOptions.js";
import {
  consolidateAsyncAPIState,
  type AsyncAPIConsolidatedState,
} from "./state.js";

type SchemaObject = Record<string, unknown>;

/**
 * Minimal TypeEmitter that produces JSON Schema objects from TypeSpec models.
 * These are embedded into components.schemas of the AsyncAPI document.
 */
class AsyncAPISchemaEmitter extends TypeEmitter<
  SchemaObject,
  AsyncAPIEmitterOptions
> {
  namespaceDeclaration(_namespace: Namespace): EmitterOutput<SchemaObject> {
    return this.emitter.result.none();
  }

  modelDeclaration(model: any): EmitterOutput<SchemaObject> {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    // Collect properties from base models (inheritance chain)
    const collectProperties = (m: any) => {
      if (m.baseModel) collectProperties(m.baseModel);
      for (const [name, prop] of m.properties) {
        if (properties[name] !== undefined) continue; // derived overrides base
        const propSchema = this.emitter.emitTypeReference(prop.type);
        const extracted = extractValue(propSchema);
        if (Object.keys(extracted).length === 0) {
          properties[name] = this.typeToSchema(prop.type);
        } else {
          properties[name] = extracted;
        }
        const propDoc = getDoc(this.emitter.getProgram(), prop);
        if (
          propDoc &&
          typeof properties[name] === "object" &&
          properties[name] !== null
        ) {
          (properties[name] as SchemaObject).description = propDoc;
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

  modelLiteral(model: any): EmitterOutput<SchemaObject> {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [name, prop] of model.properties) {
      const propSchema = this.emitter.emitTypeReference(prop.type);
      const extracted = extractValue(propSchema);
      if (Object.keys(extracted).length === 0) {
        properties[name] = this.typeToSchema(prop.type);
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
    const variants = [...union.variants.values()].map((v: any) => {
      const extracted = extractValue(this.emitter.emitTypeReference(v.type));
      if (Object.keys(extracted).length === 0) {
        const t = v.type as { kind: string; name?: string; value?: string };
        if (t.kind === "String" && t.value !== undefined)
          return { const: t.value };
        return intrinsicToSchema(t.name ?? "string");
      }
      return extracted;
    });
    // If all variants are string literals, use enum instead of anyOf
    const allConst = variants.every((v: any) => "const" in v);
    if (allConst) {
      return { type: "string", enum: variants.map((v: any) => v.const) };
    }
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
    return this.emitter.result.declaration(
      name,
      intrinsicToSchema(scalar.name),
    );
  }

  scalarInstantiation(
    scalar: any,
    name: string | undefined,
  ): EmitterOutput<SchemaObject> {
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
    const items = tuple.values.map((v: any) =>
      extractValue(this.emitter.emitTypeReference(v)),
    );
    return { type: "array", items };
  }

  arrayDeclaration(
    array: any,
    name: string,
    elementType: any,
  ): EmitterOutput<SchemaObject> {
    const extracted = extractValue(this.emitter.emitTypeReference(elementType));
    return {
      type: "array",
      items:
        Object.keys(extracted).length > 0
          ? extracted
          : intrinsicToSchema(elementType.name ?? "string"),
    };
  }

  arrayLiteral(array: any, elementType: any): EmitterOutput<SchemaObject> {
    const extracted = extractValue(this.emitter.emitTypeReference(elementType));
    return {
      type: "array",
      items:
        Object.keys(extracted).length > 0
          ? extracted
          : intrinsicToSchema(elementType.name ?? "string"),
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

  private typeToSchema(t: any): SchemaObject {
    const kind = t.kind;
    if (kind === "Union") {
      const variants = [...t.variants.values()].map((v: any) => {
        const inner = v.type;
        if (inner.kind === "String" && inner.value !== undefined)
          return inner.value;
        const s = this.typeToSchema(inner);
        return Object.keys(s).length > 0 ? s : { type: "string" };
      });
      const allStrings = variants.every((v: any) => typeof v === "string");
      if (allStrings) return { type: "string", enum: variants };
      return {
        anyOf: variants.map((v: any) =>
          typeof v === "string" ? { const: v } : v,
        ),
      };
    }
    if (kind === "Model" && t.indexer) {
      return { type: "array", items: this.typeToSchema(t.indexer.value) };
    }
    if (kind === "Model" && t.name === "Array") {
      return { type: "array", items: { type: "string" } };
    }
    if (kind === "Scalar" || kind === "Intrinsic")
      return intrinsicToSchema(t.name);
    if (kind === "String") return { const: t.value };
    if (kind === "Number") return { const: t.value };
    if (kind === "Boolean") return { const: t.value };
    if (kind === "Tuple")
      return {
        type: "array",
        items: t.values.map((v: any) => this.typeToSchema(v)),
      };
    if (kind === "Model") return { type: "object", properties: {} };
    return { type: "string" };
  }
}

function intrinsicToSchema(typeName: string): SchemaObject {
  switch (typeName) {
    case "string":
      return { type: "string" };
    case "int8":
    case "int16":
    case "int32":
    case "integer":
      return {
        type: "integer",
        format: typeName === "integer" ? undefined : typeName,
      };
    case "int64":
      return { type: "integer", format: "int64" };
    case "uint8":
    case "uint16":
    case "uint32":
      return { type: "integer" };
    case "uint64":
      return { type: "integer" };
    case "safeint":
      return { type: "integer" };
    case "float":
    case "float32":
      return { type: "number", format: "float" };
    case "float64":
      return { type: "number", format: "double" };
    case "numeric":
      return { type: "number" };
    case "decimal":
    case "decimal128":
      return { type: "string", format: "decimal" };
    case "boolean":
      return { type: "boolean" };
    case "utcDateTime":
    case "offsetDateTime":
      return { type: "string", format: "date-time" };
    case "unixTimestamp32":
      return { type: "integer", format: "unix-timestamp" };
    case "plainDate":
      return { type: "string", format: "date" };
    case "plainTime":
      return { type: "string", format: "time" };
    case "duration":
      return { type: "string", format: "duration" };
    case "bytes":
      return { type: "string", format: "byte" };
    case "url":
      return { type: "string", format: "uri" };
    default:
      return { type: "string" };
  }
}

function extractValue(
  entity: EmitEntity<SchemaObject> | undefined,
): SchemaObject {
  if (!entity) return {};
  // Direct value access
  if ("value" in entity && entity.value != null)
    return entity.value as SchemaObject;
  // Check kind-based extraction
  const e = entity as unknown as Record<string, unknown>;
  if (e.kind === "declaration" && e.value != null)
    return e.value as SchemaObject;
  if (e.kind === "code" && e.value != null) return e.value as SchemaObject;
  // If the entity IS a plain object schema (no wrapper), return it directly
  if (!("kind" in entity) && typeof entity === "object")
    return entity as SchemaObject;
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
  const globalNs = (program.checker as any).getGlobalNamespaceType();
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

function generateSchemas(
  context: EmitContext<AsyncAPIEmitterOptions>,
): Record<string, SchemaObject> {
  const schemas: Record<string, SchemaObject> = {};
  const stdlibNames = collectAllStdlibNames(context.program);

  try {
    const assetEmitter = createAssetEmitter<
      SchemaObject,
      AsyncAPIEmitterOptions
    >(context.program, AsyncAPISchemaEmitter, context);

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
  if (
    lower.startsWith("publish") ||
    lower.startsWith("send") ||
    lower.startsWith("emit") ||
    lower.startsWith("produce")
  ) {
    return "send";
  }
  return "receive";
}

/**
 * Build AsyncAPI 3.0 document from decorator state and generated schemas.
 *
 * AsyncAPI 3.0 $ref chain (MUST follow this):
 *   operations.{opId}.messages[] → #/channels/{channelId}/messages/{messageId}
 *   channels.{channelId}.messages.{messageId} → #/components/messages/{messageId}
 *   components.messages.{messageId}.payload → #/components/schemas/{schemaName}
 */
function buildAsyncAPIDocument(
  state: AsyncAPIConsolidatedState,
  schemas: Record<string, SchemaObject>,
  options: AsyncAPIEmitterOptions,
  program: Program,
): Record<string, unknown> {
  const channels: Record<string, unknown> = {};
  const operations: Record<string, unknown> = {};
  const servers: Record<string, unknown> = {};
  const messages: Record<string, unknown> = {};
  const securitySchemes: Record<string, unknown> = {};

  // Helper: extract return type model name from a TypeSpec operation type
  function getReturnModelName(type: unknown): string | undefined {
    const t = type as {
      returnType?:
        | { name?: string; model?: { name?: string }; kind?: string }
        | undefined;
    };
    const rt = t?.returnType;
    if (!rt) return undefined;
    // returnType is directly a Model for `op foo(): Bar`
    if (rt.name && rt.kind !== "Operation") return rt.name;
    // Some template/wrapper cases may nest under .model
    return rt.model?.name;
  }

  // === Step 1: Discover all operations into a unified list ===

  interface DiscoveredOp {
    opName: string;
    channelKey: string;
    action: "send" | "receive";
    messageName: string;
  }

  const discoveredOps: DiscoveredOp[] = [];
  const channelKeys = new Set<string>();

  // Helper: ensure a channel exists in the channels map
  function ensureChannel(channelKey: string): Record<string, unknown> {
    if (!channels[channelKey]) {
      channels[channelKey] = { address: channelKey, messages: {} };
    }
    channelKeys.add(channelKey);
    return channels[channelKey] as Record<string, unknown>;
  }

  // Helper: register a message in components and link it to a channel
  function registerMessage(
    messageName: string,
    channelKey: string,
    msgData?: { title?: string; description?: string; contentType?: string },
  ): void {
    if (!messages[messageName]) {
      messages[messageName] = {
        name: msgData?.title ?? messageName,
        contentType: msgData?.contentType ?? "application/json",
        ...(msgData?.description ? { summary: msgData.description } : {}),
        payload: { $ref: `#/components/schemas/${messageName}` },
      };
    }
    const channel = ensureChannel(channelKey);
    const channelMsgs = (channel.messages ?? {}) as Record<string, unknown>;
    channelMsgs[messageName] = { $ref: `#/components/messages/${messageName}` };
    channel.messages = channelMsgs;
  }

  // 1a. Operations from @publish/@subscribe + @channel decorators
  // Build channel map from @channel decorator state
  const opToChannel = new Map<string, string>();
  for (const [type, data] of state.channels) {
    const channelData = data as { path?: string };
    const typeWithName = type as { name: string };
    const channelPath = channelData.path ?? typeWithName.name;
    opToChannel.set(typeWithName.name, channelPath);
  }

  for (const [type, data] of state.operations) {
    const opData = data as {
      type: string;
      messageType?: string;
    };
    const typeWithName = type as { name: string };
    const channelKey = opToChannel.get(typeWithName.name) ?? typeWithName.name;
    const messageName =
      opData.messageType ?? getReturnModelName(type) ?? typeWithName.name;

    discoveredOps.push({
      opName: typeWithName.name,
      channelKey,
      action: opData.type === "publish" ? "send" : "receive",
      messageName,
    });
  }

  // 1b. Channels with @channel but no @publish/@subscribe — auto-generate operations
  const opsWithType = new Set(
    [...state.operations.keys()].map((t) => (t as { name: string }).name),
  );
  for (const [type, data] of state.channels) {
    const typeWithName = type as { name: string };
    if (opsWithType.has(typeWithName.name)) continue;
    const channelData = data as { path?: string };
    const channelKey = channelData.path ?? typeWithName.name;
    const messageName = getReturnModelName(type) ?? typeWithName.name;
    discoveredOps.push({
      opName: typeWithName.name,
      channelKey,
      action: inferActionFromName(typeWithName.name),
      messageName,
    });
  }

  // 1c. Bare operations (no decorators at all) — auto-discover
  const allKnownOps = new Set(
    [...state.operations.keys(), ...state.channels.keys()].map(
      (t) => (t as { name: string }).name,
    ),
  );
  const globalNs = (program.checker as any).getGlobalNamespaceType();
  const namespaces = [globalNs, ...globalNs.namespaces.values()];
  for (const ns of namespaces) {
    if (ns.name && isStdNamespace(ns)) continue;
    for (const [opName, op] of ns.operations) {
      if (allKnownOps.has(opName)) continue;
      const returnType = op.returnType as
        | { model?: { name?: string } }
        | undefined;
      const messageName = returnType?.model?.name ?? opName;
      discoveredOps.push({
        opName,
        channelKey: opName,
        action: inferActionFromName(opName),
        messageName,
      });
    }
  }

  // === Step 2: Build channels, operations, and messages from discovered ops ===

  for (const op of discoveredOps) {
    // Register the message (auto-creates channel + components.messages entry)
    registerMessage(op.messageName, op.channelKey);

    // Build the operation with spec-compliant $ref chain
    operations[op.opName] = {
      action: op.action,
      channel: { $ref: `#/channels/${op.channelKey}` },
      messages: [
        {
          $ref: `#/channels/${op.channelKey}/messages/${op.messageName}`,
        },
      ],
    };
  }

  // 2b. Merge in explicit @message decorator data (overrides auto-generated)
  for (const [type, data] of state.messages) {
    const msgData = data as {
      messageId?: string;
      title?: string;
      description?: string;
      contentType?: string;
    };
    const typeWithName = type as { name: string };
    const msgKey = msgData.messageId ?? typeWithName.name;
    // Update existing message or create new one
    messages[msgKey] = {
      name: msgData.title ?? typeWithName.name,
      contentType: msgData.contentType ?? "application/json",
      ...(msgData.description ? { summary: msgData.description } : {}),
      payload: { $ref: `#/components/schemas/${typeWithName.name}` },
    };
  }

  // 2c. Attach protocol bindings to channels
  for (const [type, data] of state.protocolConfigs) {
    const typeWithName = type as { name: string };
    const channelKey = opToChannel.get(typeWithName.name) ?? typeWithName.name;
    const protoConfig = data as { protocol?: string; [k: string]: unknown };
    if (protoConfig?.protocol && channels[channelKey]) {
      const channel = channels[channelKey] as Record<string, unknown>;
      channel.bindings = {
        [protoConfig.protocol]: protoConfig.binding ?? {},
      };
    }
  }

  // Build servers from state
  for (const [_type, data] of state.servers) {
    const serverEntries = Array.isArray(data) ? data : [data];
    for (const entry of serverEntries) {
      const serverData = entry as {
        name: string;
        url: string;
        protocol: string;
        description?: string;
      };
      servers[serverData.name] = {
        host: serverData.url,
        protocol: serverData.protocol,
        description: serverData.description,
      };
    }
  }

  // Build security schemes from state
  for (const [_type, data] of state.securityConfigs) {
    const secData = data as { name: string; scheme: Record<string, unknown> };
    securitySchemes[secData.name] = secData.scheme;
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
      securitySchemes:
        Object.keys(securitySchemes).length > 0 ? securitySchemes : undefined,
    },
  };
}

/**
 * TypeSpec AsyncAPI emitter entry point.
 */
export async function $onEmit(
  context: EmitContext<AsyncAPIEmitterOptions>,
): Promise<void> {
  const options = context.options;
  const rawState = consolidateAsyncAPIState(context.program);
  const schemas = generateSchemas(context);
  const document = buildAsyncAPIDocument(
    rawState,
    schemas,
    options,
    context.program,
  );

  const rawFileType = options?.["file-type"] ?? "yaml";
  const fileType: string =
    typeof rawFileType === "string"
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
