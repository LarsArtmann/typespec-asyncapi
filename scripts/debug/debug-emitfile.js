/**
 * MINIMAL DEBUG TEST - Fix duplicate using issue
 */
import { compileAsyncAPI } from "./test/utils/emitter-test-helpers.js";

async function debugEmitFile() {
  console.log("🔍 DEBUG: Starting minimal emitFile test");

  const source = `
// No duplicate using - test infrastructure adds it automatically

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
    console.log("🔍 DEBUG: Output files found:", Object.keys(result.outputs || {}));
    console.log("🔍 DEBUG: Output file:", result.outputFile);
    console.log("🔍 DEBUG: Document keys:", Object.keys(result.asyncApiDoc || {}));
    console.log("🔍 DEBUG: Success - AsyncAPI document generated!");
  } catch (error) {
    console.log("🔍 DEBUG: Error caught:", error.message);
    console.log("🔍 DEBUG: Error stack:", error.stack);
  }
}

void debugEmitFile();
