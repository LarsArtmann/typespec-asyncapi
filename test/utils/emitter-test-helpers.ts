import * as fs from "fs";
import * as path from "path";
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

  // FIRST: Try to find output in result.outputs (ideal path)
  const outputFile = Object.keys(result.outputs || {}).find(
    (f) => f.endsWith(".json") || f.endsWith(".yaml"),
  );

  if (outputFile) {
    const content = result.outputs[outputFile];
    const doc = outputFile.endsWith(".json") ? JSON.parse(content) : YAML.parse(content);

    return {
      asyncApiDoc: doc,
      diagnostics: result.program.diagnostics,
      program: result.program,
      outputs: result.outputs,
      outputFile,
    };
  }

  // SECOND: Bridge virtual filesystem to result.outputs
  // TypeSpec's emitFile writes to result.fs.fs but doesn't populate result.outputs
  // eslint-disable-next-line no-console
  console.log("🔧 TEST HELP: result.fs:", result.fs ? "exists" : "undefined");
  // eslint-disable-next-line no-console
  console.log("🔧 TEST HELP: result.fs.fs:", result.fs?.fs ? "exists" : "undefined");
  // eslint-disable-next-line no-console
  console.log("🔧 TEST HELP: result.fs.fs keys:", result.fs?.fs ? Object.keys(result.fs.fs) : "N/A");
  // eslint-disable-next-line no-console
  console.log("🔧 TEST HELP: result.program.host:", result.program.host ? "exists" : "undefined");
  // eslint-disable-next-line no-console
  console.log("🔧 TEST HELP: result.program.host.fs:", result.program.host?.fs ? "exists" : "undefined");
  // eslint-disable-next-line no-console
  console.log("🔧 TEST HELP: result.program.host.fs root:", result.program.host?.fs?.root ? result.program.host.fs.root : "no root");

  if (result.program.host?.fs) {
    try {
      const fs = await import("node:fs");
      const path = await import("node:path");
      // result.program.host.fs might have different API
      // eslint-disable-next-line no-console
      console.log("🔧 TEST HELP: result.program.host.fs type:", typeof result.program.host.fs);
      // eslint-disable-next-line no-console
      console.log("🔧 TEST HELP: result.program.host.fs keys:", Object.keys(result.program.host.fs));

      // Check if it has readFile, writeFile, etc. methods
      const hostFs = result.program.host.fs as Record<string, any>;
      for (const key of ['readFile', 'writeFile', 'exists', 'readdir']) {
        // eslint-disable-next-line no-console
        console.log("🔧 TEST HELP: result.program.host.fs has", key, ":", typeof hostFs[key]);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("🔧 TEST HELP: Error inspecting result.program.host.fs:", e);
    }
  }

  if (result.fs && result.fs.fs) {
    const virtualFiles = Object.entries(result.fs.fs);
    const expectedName = options["output-file"] || "asyncapi";

    // eslint-disable-next-line no-console
    console.log("🔧 TEST HELP: Virtual files count:", virtualFiles.length);
    for (const [path, content] of virtualFiles) {
      // eslint-disable-next-line no-console
      console.log("🔧 TEST HELP: Virtual file:", path, "(length:", typeof content === "string" ? content.length : "not string", ")");
    }

    // Search for AsyncAPI files by matching against expected filename patterns
    for (const [virtualPath, content] of virtualFiles) {
      const filename = virtualPath.split("/").pop() || "";
      const isAsyncAPIFile =
        (filename.includes(expectedName) || filename.includes("asyncapi")) &&
        (filename.endsWith(".yaml") || filename.endsWith(".json"));

      if (isAsyncAPIFile && typeof content === "string") {
        const relativePath = filename;

        return {
          asyncApiDoc: filename.endsWith(".json")
            ? JSON.parse(content)
            : YAML.parse(content),
          diagnostics: result.program.diagnostics,
          program: result.program,
          outputs: { [relativePath]: content },
          outputFile: relativePath,
        };
      }
    }
  } else {
    // eslint-disable-next-line no-console
    console.log("🔧 TEST HELP: No virtual filesystem available");
  }

  // THIRD: Check real filesystem (TypeSpec >=1.8.0 emits to project root!)
  // CRITICAL DISCOVERY: Emitter writes to ./asyncapi.yaml in project root, NOT to virtual FS
  // The virtual FS is empty, but real FS has the file
  const fs = await import("node:fs");
  const path = await import("node:path");
  const expectedName = options["output-file"] || "asyncapi";

  // eslint-disable-next-line no-console
  console.log("🔧 TEST HELP: Expected filename:", expectedName);

  // Check for file directly - simpler than readdir
  const possibleFiles = [
    expectedName,
    `${expectedName}.yaml`,
    `${expectedName}.json`,
    `asyncapi.yaml`,
    `asyncapi.json`,
    path.join("tsp-output", "@lars-artmann", "typespec-asyncapi", `${expectedName}.yaml`),
    path.join("tsp-output", "@lars-artmann", "typespec-asyncapi", `${expectedName}.json`),
  ];

  for (const filePath of possibleFiles) {
    const fullPath = path.resolve(filePath);
    try {
      await fs.access(fullPath); // Throws if file doesn't exist
      const content = await fs.readFile(fullPath, "utf-8");

      // eslint-disable-next-line no-console
      console.log("🔧 TEST HELP: Found and read file:", filePath, "length:", content.length);

      return {
        asyncApiDoc: filePath.endsWith(".json") ? JSON.parse(content) : YAML.parse(content),
        diagnostics: result.program.diagnostics,
        program: result.program,
        outputs: { [path.basename(filePath)]: content },
        outputFile: path.basename(filePath),
      };
    } catch {
      // File doesn't exist, continue checking
    }
  }

  throw new Error("No AsyncAPI output generated - check emitFile integration");
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
