import { createAssetEmitter } from "@typespec/asset-emitter";
import type { EmitContext } from "@typespec/compiler";
import type {
  AsyncAPIEmitterOptions,
  JsonSchema,
} from "./domain/models/asyncapi-document.js";
import { reportProgramDiagnostic } from "./decorator-helpers.js";
import { collectAllStdlibNames } from "./stdlib-helpers.js";
import { AsyncAPISchemaEmitter } from "./schema-emitter.js";

export function generateSchemas(
  context: EmitContext<AsyncAPIEmitterOptions>,
): Record<string, JsonSchema> {
  const schemas: Record<string, JsonSchema> = {};
  const stdlibNames = collectAllStdlibNames(context.program);

  const report = (
    code: "duplicate-schema-name" | "schema-generation-failed",
    format: Record<string, string>,
  ): void => {
    reportProgramDiagnostic(context.program, {
      code,
      target: context.program.getGlobalNamespaceType(),
      format,
    });
  };

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
          !(declaration.value as object | undefined) ||
          stdlibNames.has(declaration.name)
        ) {
          continue;
        }
        if (schemas[declaration.name] !== undefined) {
          report("duplicate-schema-name", { name: declaration.name });
        }
        schemas[declaration.name] = declaration.value as JsonSchema;
      }
    }
  } catch (error) {
    report("schema-generation-failed", { error: String(error) });
  }

  return schemas;
}
