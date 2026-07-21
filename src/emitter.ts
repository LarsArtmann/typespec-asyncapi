/**
 * AsyncAPI 3.1 Emitter Entry Point
 *
 * Reads decorator state, generates JSON Schemas from TypeSpec models
 * via @typespec/asset-emitter, and outputs AsyncAPI 3.1 YAML/JSON.
 */

import { emitFile } from "@typespec/compiler";
import type { EmitContext } from "@typespec/compiler";
import { stringify as yamlStringify } from "yaml";
import type { AsyncAPIEmitterOptions } from "./infrastructure/configuration/asyncAPIEmitterOptions.js";
import { consolidateAsyncAPIState } from "./state.js";
import { generateSchemas } from "./schema-emitter.js";
import { buildAsyncAPIDocument } from "./document-builder.js";

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
