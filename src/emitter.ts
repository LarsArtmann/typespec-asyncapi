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

  const format = resolveFileFormat(options["file-type"]);
  const outputFile = options["output-file"] ?? "asyncapi";
  const outputPath = `${outputFile}.${format.extension}`;

  if (options["split-schemas"] === true) {
    const { mainDocument, schemaFiles } = splitSchemas(
      document,
      format.extension,
    );
    const writePromises: Promise<void>[] = [
      writeDocument(
        context.program,
        mainDocument,
        format,
        outputPath,
        context.emitterOutputDir,
      ),
    ];
    for (const [filename, schema] of schemaFiles) {
      writePromises.push(
        writeDocument(
          context.program,
          schema,
          format,
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
    format,
    outputPath,
    context.emitterOutputDir,
  );
}

/** Fully resolved output format: extension plus serialization settings. */
interface ResolvedFileFormat {
  extension: string;
  indent: number;
  pretty: boolean;
}

function resolveFileFormat(
  raw: AsyncAPIEmitterOptions["file-type"],
): ResolvedFileFormat {
  if (typeof raw === "object") {
    return {
      extension: raw.format,
      indent: raw.indent ?? 2,
      pretty: raw.pretty ?? true,
    };
  }
  return { extension: raw ?? "yaml", indent: 2, pretty: true };
}

function writeDocument(
  program: Program,
  data: unknown,
  format: ResolvedFileFormat,
  relativePath: string,
  emitterOutputDir: string,
): Promise<void> {
  const content =
    format.extension === "json"
      ? format.pretty
        ? JSON.stringify(data, null, format.indent)
        : JSON.stringify(data)
      : yamlStringify(data, { indent: format.indent, lineWidth: 0 });

  return emitFile(program, {
    content,
    path: `${emitterOutputDir}/${relativePath}`,
  });
}
