import { createTester, findTestPackageRoot } from "@typespec/compiler/testing";
import type { AsyncAPIEmitterOptions } from "../../src/infrastructure/configuration/options.js";
import YAML from "yaml";

/**
 * TypeSpec 1.6.0 EmitterTester-based test helpers
 *
 * This replaces the old createTestWrapper approach with the proper
 * EmitterTester API that correctly passes options to emitters.
 */

/**
 * Create an EmitterTester configured for AsyncAPI emitter testing
 *
 * Uses TypeSpec 1.4.0's .emit() API which properly passes options to the emitter.
 *
 * @param options - AsyncAPI emitter options (file-type, output-file, etc.)
 * @returns Configured EmitterTester instance
 */
export async function createAsyncAPIEmitterTester(options: AsyncAPIEmitterOptions = {}) {
  const packageRoot = await findTestPackageRoot(import.meta.url);

  return createTester(packageRoot, {
    libraries: ["@lars-artmann/typespec-asyncapi"],
  })
    .importLibraries() // Auto-import all configured libraries
    .using("TypeSpec.AsyncAPI") // Add using statement for TypeSpec.AsyncAPI namespace
    .emit("@lars-artmann/typespec-asyncapi", options);
}

/**
 * Compile TypeSpec source with AsyncAPI emitter
 *
 * Key insight: TypeSpec's emitFile() writes to program.host.writeFile() which
 * populates the virtual filesystem (result.fs.fs), but doesn't auto-populate
 * result.outputs. This function bridges that gap.
 *
 * Answer to "How to design TestEmitterFile mock":
 * - NO MOCK NEEDED! TypeSpec's emitFile delegates to program.host.writeFile()
 * - The test framework already provides a virtual filesystem through program.host
 * - The solution is to bridge virtual FS to result.outputs, NOT to mock emitFile
 *
 * @param source - TypeSpec source code to compile
 * @param options - AsyncAPI emitter options
 * @returns AsyncAPI document, diagnostics, program, and outputs
 */
export async function compileAsyncAPI(source: string, options: AsyncAPIEmitterOptions = {}) {
  const tester = await createAsyncAPIEmitterTester(options);
  const result = await tester.compile(source);

  const virtualFs: Map<string, string> = result.fs?.fs ?? new Map();

  for (const [virtualPath, content] of virtualFs) {
    const filename = virtualPath.split("/").pop() || "";
    const isOutputFile =
      !virtualPath.includes("node_modules") &&
      (filename.endsWith(".yaml") || filename.endsWith(".json") || filename.endsWith(".yml"));

    if (isOutputFile && typeof content === "string") {
      let doc: any;
      try {
        doc = JSON.parse(content);
      } catch {
        doc = YAML.parse(content);
      }
      if (doc && typeof doc === "object" && ("asyncapi" in doc || "channels" in doc)) {
        return {
          asyncApiDoc: doc,
          diagnostics: result.program.diagnostics,
          program: result.program,
          outputs: { [filename]: content },
          outputFile: filename,
        };
      }
    }
  }

  return {
    asyncApiDoc: null,
    diagnostics: result.program.diagnostics,
    program: result.program,
    outputs: {},
    outputFile: null,
  };
}

/**
 * Compile TypeSpec source and assert no errors (warnings OK)
 *
 * Equivalent to compileAsyncAPISpecWithoutErrors but using new API.
 *
 * @param source - TypeSpec source code
 * @param options - AsyncAPI emitter options
 * @returns AsyncAPI document and diagnostics
 */
export async function compileAsyncAPIWithoutErrors(
  source: string,
  options: AsyncAPIEmitterOptions = {},
) {
  const result = await compileAsyncAPI(source, options);

  const errors = result.diagnostics.filter((d) => d.severity === "error");
  if (errors.length > 0) {
    const errorMessages = errors.map((e) => `${e.code}: ${e.message}`).join("\n");
    throw new Error(`Compilation failed with errors:\n${errorMessages}`);
  }

  return result;
}
