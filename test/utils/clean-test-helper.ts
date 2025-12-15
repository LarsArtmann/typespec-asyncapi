/**
 * Clean, minimal AsyncAPI test helper
 * Single responsibility: compile and parse AsyncAPI documents
 * No fallbacks, no complex logic - direct TypeSpec framework usage
 */

import { createTestHost, createTestWrapper, runBasicCompiler } from "@typespec/compiler/testing";
import { Effect } from "effect";
import * as yaml from "yaml";

/**
 * Simple test compilation with direct framework usage
 */
export async function compileSimpleTest(source: string): Promise<any> {
  const host = await createTestHost();

  const runner = createTestWrapper(host, {
    // Use direct import instead of auto-usage
  });

  try {
    // Compile with emitter directly
    const [result, diagnostics] = await runner.compileAndDiagnose(source, {
      emit: ["@lars-artmann/typespec-asyncapi"],
    });

    // Check for compilation errors
    const errors = diagnostics.filter((d) => d.severity === "error");
    if (errors.length > 0) {
      throw new Error(`Compilation failed: ${errors.map((d) => d.message).join(", ")}`);
    }

    // Simple output file parsing
    const outputFiles = result.fs?.fs || new Map();
    console.log(`🔍 Output files count: ${outputFiles.size}`);

    for (const [fileName, content] of outputFiles) {
      if (fileName.includes("asyncapi")) {
        console.log(`✅ Found AsyncAPI file: ${fileName} (${content.length} chars)`);

        // Simple parsing based on file extension
        const parsed = fileName.endsWith(".yaml")
          ? yaml.parse(content as string)
          : JSON.parse(content as string);

        console.log(`✅ Parsed AsyncAPI version: ${parsed.asyncapi}`);
        return parsed;
      }
    }

    throw new Error("No AsyncAPI file found in output");
  } catch (error) {
    Effect.log(`❌ Clean test helper failed: ${error}`);
    throw error;
  }
}
