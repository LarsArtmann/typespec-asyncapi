import { compileAsyncAPI } from "./utils/emitter-test-helpers.js";

/**
 * MINIMAL DEBUG TEST - Isolate emitFile issue
 *
 * Goal: Understand exactly what's happening with emitFile API
 * - Does emitter actually write files?
 * - Does test framework capture them?
 * - Where is the disconnect?
 */
async function debugEmitFile() {
  console.log("🔍 DEBUG: Starting minimal emitFile test");

  const source = `
using TypeSpec.AsyncAPI;

@server({
  url: "http://localhost:3000",
  protocol: "http"
})
namespace TestService {
  @publish
  op publishEvent(): void;
}
`;

  try {
    console.log("🔍 DEBUG: Compiling with test framework...");
    const result = await compileAsyncAPI(source, {
      "output-file": "debug-test",
      "file-type": "json",
    });

    console.log("🔍 DEBUG: Compilation completed");
    console.log(
      "🔍 DEBUG: Output files found:",
      Object.keys(result.outputs || {}),
    );
    console.log("🔍 DEBUG: Output file:", result.outputFile);
    console.log(
      "🔍 DEBUG: Document keys:",
      Object.keys(result.asyncApiDoc || {}),
    );
    console.log("🔍 DEBUG: Success - AsyncAPI document generated!");
  } catch (error) {
    console.log("🔍 DEBUG: Error caught:", error.message);
    console.log("🔍 DEBUG: Error stack:", error.stack);
  }
}

debugEmitFile();
