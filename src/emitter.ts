/**
 * AsyncAPI 3.0 Emitter
 *
 * Reads decorator state, generates JSON Schemas from TypeSpec models
 * via @typespec/asset-emitter, and outputs AsyncAPI 3.0 YAML/JSON.
 */

import { emitFile } from "@typespec/compiler";
import type {
  EmitContext,
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
import { stringify as yamlStringify } from "yaml";
import { isStdNamespace, getDoc } from "@typespec/compiler";
import type { AsyncAPIEmitterOptions } from "./infrastructure/configuration/asyncAPIEmitterOptions.js";
import { consolidateAsyncAPIState, type AsyncAPIConsolidatedState } from "./state.js";
import type {
  AsyncAPIDocument,
  ChannelObject,
  ComponentsObject,
  MessageObject,
  OperationObject,
  ParameterObject,
  SchemaObject,
  ServerObject,
} from "./domain/models/asyncapi-document.js";

const ASYNCAPI_SPEC_VERSION = "3.0.0";

/**
 * Minimal TypeEmitter that produces JSON Schema objects from TypeSpec models.
 * These are embedded into components.schemas of the AsyncAPI document.
 */
class AsyncAPISchemaEmitter extends TypeEmitter<SchemaObject, AsyncAPIEmitterOptions> {
  namespaceDeclaration(_namespace: Namespace): EmitterOutput<SchemaObject> {
    return this.emitter.result.none();
  }

  modelDeclaration(model: Model): EmitterOutput<SchemaObject> {
    const properties: Record<string, SchemaObject> = {};
    const required: string[] = [];

    // Collect properties from base models (inheritance chain)
    const collectProperties = (m: Model) => {
      if (m.baseModel) collectProperties(m.baseModel);
      for (const [name, prop] of m.properties) {
        if (properties[name] !== undefined) continue; // derived overrides base
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
    // If all variants are string literals, use enum instead of anyOf
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
    const extracted = extractValue(this.emitter.emitTypeReference(elementType));
    return {
      type: "array",
      items:
        Object.keys(extracted).length > 0
          ? extracted
          : intrinsicToSchema((elementType as { name?: string }).name ?? "string"),
    };
  }

  arrayLiteral(array: Type, elementType: Type): EmitterOutput<SchemaObject> {
    const extracted = extractValue(this.emitter.emitTypeReference(elementType));
    return {
      type: "array",
      items:
        Object.keys(extracted).length > 0
          ? extracted
          : intrinsicToSchema((elementType as { name?: string }).name ?? "string"),
    };
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

  /**
   * Convert a ModelProperty to a JSON Schema.
   * Uses $ref for named user-defined models, enums, and scalars.
   * Inlines primitives, arrays, unions, and anonymous types.
   */
  private propertyToSchema(prop: ModelProperty): SchemaObject {
    const t = prop.type;
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
    if (kind === "Model" && (t as { indexer?: unknown }).indexer) {
      return {
        type: "array",
        items: this.typeToSchema((t as { indexer: { value: Type } }).indexer.value),
      };
    }
    if (kind === "Model" && (t as { name?: string }).name === "Array") {
      return { type: "array", items: { type: "string" } };
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

function extractValue(entity: EmitEntity<SchemaObject> | undefined): SchemaObject {
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

/**
 * Generate JSON Schema objects from all models in the program.
 */
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

function generateSchemas(
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
): AsyncAPIDocument {
  const channels: Record<string, ChannelObject> = {};
  const operations: Record<string, OperationObject> = {};
  const servers: Record<string, ServerObject> = {};
  const messages: Record<string, MessageObject> = {};
  const securitySchemes: Record<string, unknown> = {};

  // Helper: extract return type model name from a TypeSpec operation type
  function getReturnModelName(type: unknown): string | undefined {
    const t = type as {
      returnType?: { name?: string; model?: { name?: string }; kind?: string } | undefined;
    };
    const rt = t?.returnType;
    if (!rt) return undefined;
    // returnType is directly a Model for `op foo(): Bar`
    if (rt.name && rt.kind !== "Operation") return rt.name;
    // Some template/wrapper cases may nest under .model
    return rt.model?.name;
  }

  // === Step 1: Discover all operations into a unified list ===

  type DiscoveredOp = {
    opName: string;
    channelKey: string;
    action: "send" | "receive";
    messageName: string;
  };

  const discoveredOps: DiscoveredOp[] = [];

  // Helper: extract {param} expressions from a channel address
  function extractChannelParameters(address: string): Record<string, ParameterObject> | undefined {
    const matches = address.match(/\{([^}]+)\}/g);
    if (!matches || matches.length === 0) return undefined;
    const params: Record<string, ParameterObject> = {};
    for (const match of matches) {
      const paramName = match.slice(1, -1);
      params[paramName] = { description: `Channel parameter: ${paramName}` };
    }
    return params;
  }

  // Helper: ensure a channel exists in the channels map
  function ensureChannel(channelKey: string): ChannelObject {
    if (!channels[channelKey]) {
      const params = extractChannelParameters(channelKey);
      channels[channelKey] = {
        address: channelKey,
        messages: {},
        ...(params ? { parameters: params } : {}),
      };
    }
    return channels[channelKey];
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
    const channelMsgs = channel.messages ?? {};
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
    const messageName = opData.messageType ?? getReturnModelName(type) ?? typeWithName.name;

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
      (t) => (t as Type & { name: string }).name,
    ),
  );
  const globalNs = program.getGlobalNamespaceType();
  const namespaces = [globalNs, ...globalNs.namespaces.values()];
  for (const ns of namespaces) {
    if (ns.name && isStdNamespace(ns)) continue;
    for (const [opName, op] of ns.operations) {
      if (allKnownOps.has(opName)) continue;
      const returnType = op.returnType as { model?: { name?: string } } | undefined;
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
    const operationObj: OperationObject = {
      action: op.action,
      channel: { $ref: `#/channels/${op.channelKey}` },
      messages: [
        {
          $ref: `#/channels/${op.channelKey}/messages/${op.messageName}`,
        },
      ],
    };

    // Attach tags from state if this operation has them
    const opType = [...state.operations.keys(), ...state.channels.keys()].find(
      (t) => (t as { name: string }).name === op.opName,
    );
    if (opType) {
      const tags = state.tags.get(opType);
      if (tags && tags.length > 0) {
        operationObj.tags = tags;
      }

      const bindings = state.protocolBindings.get(opType);
      if (bindings && Object.keys(bindings).length > 0) {
        operationObj.bindings = bindings;
      }
    }

    operations[op.opName] = operationObj;
  }

  // 2b. Merge in explicit @message decorator data (overrides auto-generated)
  // Also wire @correlationId and @header data into messages
  for (const [type, data] of state.messages) {
    const msgData = data;
    const typeWithName = type as { name: string };
    const msgKey = msgData.messageId ?? typeWithName.name;
    const msgObj: MessageObject = {
      name: msgData.title ?? typeWithName.name,
      contentType: msgData.contentType ?? "application/json",
      ...(msgData.description ? { summary: msgData.description } : {}),
      payload: { $ref: `#/components/schemas/${typeWithName.name}` },
    };

    // Wire correlationId from state
    const correlation = state.correlationIds.get(type);
    if (correlation) {
      msgObj.correlationId = { location: correlation.location };
    }

    // Wire headers from state
    const headers = state.messageHeaders.get(type);
    if (headers && headers.length > 0) {
      const headerProps: Record<string, SchemaObject> = {};
      for (const h of headers) {
        headerProps[h.name] = {
          type: h.type ?? "string",
          ...(h.description ? { description: h.description } : {}),
        };
      }
      msgObj.headers = {
        type: "object",
        properties: headerProps,
      };
    }

    // Wire message bindings from state
    const msgBindings = state.protocolBindings.get(type);
    if (msgBindings && Object.keys(msgBindings).length > 0) {
      msgObj.bindings = msgBindings;
    }

    messages[msgKey] = msgObj;
  }

  // 2c. Apply decorators to auto-registered messages (models without @message)
  for (const [type] of [
    ...state.correlationIds,
    ...state.messageHeaders,
    ...state.protocolBindings,
    ...state.tags,
  ]) {
    const typeName = (type as { name?: string }).name;
    if (!typeName || !messages[typeName]) continue;

    const msg = messages[typeName];

    // Apply correlationId if not already set
    const correlation = state.correlationIds.get(type);
    if (correlation && !msg.correlationId) {
      msg.correlationId = { location: correlation.location };
    }

    // Apply headers if not already set
    const headers = state.messageHeaders.get(type);
    if (headers && headers.length > 0 && !msg.headers) {
      const headerProps: Record<string, SchemaObject> = {};
      for (const h of headers) {
        headerProps[h.name] = {
          type: h.type ?? "string",
          ...(h.description ? { description: h.description } : {}),
        };
      }
      msg.headers = { type: "object", properties: headerProps };
    }

    // Apply message bindings if not already set
    const msgBindings = state.protocolBindings.get(type);
    if (msgBindings && Object.keys(msgBindings).length > 0 && !msg.bindings) {
      msg.bindings = msgBindings;
    }

    // Apply tags if not already set
    const msgTags = state.tags.get(type);
    if (msgTags && msgTags.length > 0 && !msg.tags) {
      msg.tags = msgTags;
    }
  }

  // 2d. Attach protocol bindings to channels
  for (const [type, data] of state.protocolConfigs) {
    const typeWithName = type as { name: string };
    const channelKey = opToChannel.get(typeWithName.name) ?? typeWithName.name;
    const protoConfig = data as {
      protocol?: string;
      binding?: Record<string, unknown>;
      [k: string]: unknown;
    };
    if (protoConfig?.protocol && channels[channelKey]) {
      const channel = channels[channelKey];
      channel.bindings = {
        [protoConfig.protocol]: protoConfig.binding ?? {},
      };
    }
  }

  // Build servers from state
  for (const [_type, data] of state.servers) {
    const serverEntries = Array.isArray(data) ? data : [data];
    for (const entry of serverEntries) {
      const serverData = entry;
      const server: ServerObject = {
        host: serverData.url,
        protocol: serverData.protocol,
        description: serverData.description,
      };

      // Extract {var} from host as server variables
      const varMatches = serverData.url?.match(/\{([^}]+)\}/g);
      if (varMatches && varMatches.length > 0) {
        const vars: Record<string, { default?: string; description?: string }> = {};
        for (const match of varMatches) {
          const varName = match.slice(1, -1);
          vars[varName] = { description: `Server variable: ${varName}` };
        }
        server.variables = vars;
      }

      servers[serverData.name] = server;
    }
  }

  // Build security schemes from state
  for (const [_type, data] of state.securityConfigs) {
    const secData = data;
    securitySchemes[secData.name] = secData.scheme;
  }

  const components: ComponentsObject = {};
  if (Object.keys(messages).length > 0) components.messages = messages;
  if (Object.keys(schemas).length > 0) components.schemas = schemas;
  if (Object.keys(securitySchemes).length > 0)
    components.securitySchemes = securitySchemes as ComponentsObject["securitySchemes"];

  const document: AsyncAPIDocument = {
    asyncapi: ASYNCAPI_SPEC_VERSION,
    info: {
      title: options?.title ?? "Generated API",
      version: options?.version ?? "1.0.0",
      description: options?.description,
    },
    ...(Object.keys(servers).length > 0 ? { servers } : {}),
    channels,
    operations: Object.keys(operations).length > 0 ? operations : undefined,
    components: Object.keys(components).length > 0 ? components : undefined,
  };

  return document;
}

/**
 * TypeSpec AsyncAPI emitter entry point.
 */
export async function $onEmit(context: EmitContext<AsyncAPIEmitterOptions>): Promise<void> {
  const options = context.options;
  const rawState = consolidateAsyncAPIState(context.program);
  const schemas = generateSchemas(context);
  const document = buildAsyncAPIDocument(rawState, schemas, options, context.program);

  const rawFileType = options?.["file-type"] ?? "yaml";
  const fileType: string =
    typeof rawFileType === "string"
      ? rawFileType
      : (((rawFileType as Record<string, unknown>)?.format as string) ?? "yaml");
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
