import { createAssetEmitter } from "@typespec/asset-emitter";
import type { EmitContext } from "@typespec/compiler";
import type { AsyncAPIEmitterOptions } from "./infrastructure/configuration/asyncAPIEmitterOptions.js";
import type { JsonSchema } from "./domain/models/asyncapi-document.js";
import { $lib } from "./lib.js";
import { collectAllStdlibNames } from "./stdlib-helpers.js";
import { AsyncAPISchemaEmitter } from "./schema-emitter.js";

export function generateSchemas(
  context: EmitContext<AsyncAPIEmitterOptions>,
): Record<string, JsonSchema> {
  const schemas: Record<string, JsonSchema> = {};
  const stdlibNames = collectAllStdlibNames(context.program);

  try {
    const assetEmitter = createAssetEmitter<JsonSchema, AsyncAPIEmitterOptions>(
      context.program,
      AsyncAPISchemaEmitter,
      context,
    );

    assetEmitter.emitProgram({ emitGlobalNamespace: true });

    for (const sourceFile of assetEmitter.getSourceFiles()) {
      const scope = sourceFile.globalScope;
      for (const declaration of scope.declarations) {
        if (
          !declaration.name ||
          !declaration.value ||
          stdlibNames.has(declaration.name)
        ) {
          continue;
        }
        schemas[declaration.name] = declaration.value as JsonSchema;
      }
    }
  } catch (error) {
    $lib.reportDiagnostic(context.program, {
      code: "schema-generation-failed",
      messageId: "default",
      target: context.program.getGlobalNamespaceType(),
      format: { error: String(error) },
    });
  }

  return schemas;
}
