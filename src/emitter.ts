/**
 * AsyncAPI 3.0 Emitter
 *
 * Reads decorator state, generates JSON Schemas from TypeSpec models
 * via @typespec/asset-emitter, and outputs AsyncAPI 3.0 YAML/JSON.
 */

import { emitFile } from "@typespec/compiler";
import type { EmitContext } from "@typespec/compiler";
import { createAssetEmitter, TypeEmitter } from "@typespec/asset-emitter";
import type { AssetEmitter, EmitEntity, EmitterOutput, Context, SourceFile, EmittedSourceFile } from "@typespec/asset-emitter";
import { stringify as yamlStringify } from "yaml";
import type { AsyncAPIEmitterOptions } from "./infrastructure/configuration/asyncAPIEmitterOptions.js";
import { consolidateAsyncAPIState, type AsyncAPIConsolidatedState } from "./state.js";

type SchemaObject = Record<string, unknown>;

/**
 * Minimal TypeEmitter that produces JSON Schema objects from TypeSpec models.
 * These are embedded into components.schemas of the AsyncAPI document.
 */
class AsyncAPISchemaEmitter extends TypeEmitter<SchemaObject, AsyncAPIEmitterOptions> {
  modelDeclaration(model: any): EmitterOutput<SchemaObject> {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [name, prop] of model.properties) {
      const propSchema = this.emitter.emitTypeReference(prop.type);
      properties[name] = extractValue(propSchema);
      if (!prop.optional) {
        required.push(name);
      }
    }

    const schema: SchemaObject = { type: "object", properties };
    if (required.length > 0) schema.required = required;

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
      properties[name] = extractValue(propSchema);
      if (!prop.optional) required.push(name);
    }

    const schema: SchemaObject = { type: "object", properties };
    if (required.length > 0) schema.required = required;
    return schema;
  }

  modelProperties(model: any): EmitterOutput<SchemaObject> {
    const props: Record<string, unknown> = {};
    for (const [name, prop] of model.properties) {
      props[name] = this.emitter.emitModelProperty(prop);
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

  intrinsic(intrinsic: any, name: string): EmitterOutput<SchemaObject> {
    return intrinsicToSchema(intrinsic.name);
  }

  scalar(scalar: any): EmitterOutput<SchemaObject> {
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

  programContext(program: any): Context {
    const sourceFile = this.emitter.createSourceFile("schemas.json");
    return { scope: sourceFile.globalScope };
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
  if ("value" in entity && entity.value != null) return entity.value as SchemaObject;
  return {};
}

/**
 * Generate JSON Schema objects from all models in the program.
 */
function generateSchemas(context: EmitContext<AsyncAPIEmitterOptions>): Record<string, SchemaObject> {
  const schemas: Record<string, SchemaObject> = {};

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
          schemas[declaration.name] = declaration.value as SchemaObject;
        }
      }
    }
  } catch {
    // Fall back to empty schemas if asset-emitter fails
    // (e.g., no models to emit)
  }

  return schemas;
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

  // Build operations from state
  for (const [type, data] of state.operations) {
    const opData = data as { type: string; messageType?: string; description?: string };
    const typeWithName = type as { name: string };
    operations[typeWithName.name] = {
      action: opData.type === "publish" ? "receive" : "send",
      channel: { $ref: `#/channels/${typeWithName.name}` },
      messages: [{ $ref: `#/components/messages/${opData.messageType ?? typeWithName.name}` }],
    };
  }

  // Build servers from state
  for (const [type, data] of state.servers) {
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
  const fileType = typeof rawFileType === "string"
    ? rawFileType
    : (rawFileType as Record<string, unknown>)?.format ?? "yaml";
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
