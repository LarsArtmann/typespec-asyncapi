/**
 * SIMPLE DEBUG TEST - Avoid @server to isolate output capture issue
 */
import { compileAsyncAPI } from "./test/utils/emitter-test-helpers.js";

async function simpleDebugTest() {
  console.log("🔍 SIMPLE DEBUG: Testing without @server decorator");

  const source = `
namespace TestService {
  @publish
  op publishEvent(): void;
}
`;

  try {
    console.log("🔍 SIMPLE DEBUG: Compiling...");
    const result = await compileAsyncAPI(source, {
      "output-file": "simple-test",
      "file-type": "json",
    });

    console.log("🔍 SIMPLE DEBUG: SUCCESS!");
    console.log("🔍 SIMPLE DEBUG: Output files:", Object.keys(result.outputs || {}));
    console.log("🔍 SIMPLE DEBUG: Output file:", result.outputFile);
    console.log("🔍 SIMPLE DEBUG: Document has keys:", Object.keys(result.asyncApiDoc || {}));

    // Check actual content
    if (result.asyncApiDoc) {
      console.log("🔍 SIMPLE DEBUG: Document title:", result.asyncApiDoc.info?.title || "NO TITLE");
      console.log(
        "🔍 SIMPLE DEBUG: Document version:",
        result.asyncApiDoc.asyncapi || "NO VERSION",
      );
    }
  } catch (error) {
    console.log("🔍 SIMPLE DEBUG: FAILED!");
    console.log("🔍 SIMPLE DEBUG: Error:", error.message);
  }
}

void simpleDebugTest();
