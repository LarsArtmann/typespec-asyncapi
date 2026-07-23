/**
 * AsyncAPI 3.1 Emitter Entry Point
 *
 * Reads decorator state, generates JSON Schemas from TypeSpec models
 * via @typespec/asset-emitter, and outputs AsyncAPI 3.1 YAML/JSON.
 */

import { type EmitContext, type Program, emitFile } from "@typespec/compiler";
import type { AsyncAPIEmitterOptions } from "./infrastructure/configuration/asyncAPIEmitterOptions.js";
import { buildAsyncAPIDocument } from "./document-builder.js";
import { consolidateAsyncAPIState } from "./state.js";
import { generateSchemas } from "./schema-generator.js";
import { splitSchemas } from "./schema-splitter.js";
import { stringify as yamlStringify } from "yaml";

export async function $onEmit(
  context: EmitContext<AsyncAPIEmitterOptions>,
): Promise<void> {
  const { options } = context;
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
      : (((rawFileType as Record<string, unknown>)?.format as string) ??
        "yaml");
  const outputFile = options?.["output-file"] ?? "asyncapi";
  const outputPath = `${outputFile}.${fileType}`;
  const splitSchemasEnabled = options?.["split-schemas"] === true;

  if (splitSchemasEnabled) {
    const { mainDocument, schemaFiles } = splitSchemas(document, fileType);
    const writePromises: Promise<void>[] = [
      writeDocument(
        context.program,
        mainDocument,
        fileType,
        outputPath,
        context.emitterOutputDir,
      ),
    ];
    for (const [filename, schema] of schemaFiles) {
      writePromises.push(
        writeDocument(
          context.program,
          schema,
          fileType,
          `schemas/${filename}`,
          context.emitterOutputDir,
        ),
      );
    }
    await Promise.all(writePromises);
    return;
  }

  await writeDocument(
    context.program,
    document,
    fileType,
    outputPath,
    context.emitterOutputDir,
  );
}

function writeDocument(
  program: Program,
  data: unknown,
  fileType: string,
  relativePath: string,
  emitterOutputDir: string,
): Promise<void> {
  const content =
    fileType === "json"
      ? JSON.stringify(data, null, 2)
      : yamlStringify(data, { lineWidth: 0 });

  return emitFile(program, {
    content,
    path: `${emitterOutputDir}/${relativePath}`,
  });
}
