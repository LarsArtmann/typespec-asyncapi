import { createAsyncAPITestHost, compileAndGetAsyncAPI } from "../test/utils/test-helpers.js";

async function testWorkingFramework() {
  const sourceCode = `
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@channel("test.channel")
@publish
op publishTest(): string;
  `;

  try {
    // Use working test helper that properly loads library
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile("main.tsp", sourceCode);

    // Use working compilation pattern
    const result = await compileAndGetAsyncAPI(host, "main.tsp");

    console.log("✅ Working framework SUCCESS");
    console.log("📊 AsyncAPI version:", result?.asyncapi);
    console.log("📊 Channels:", result?.channels ? Object.keys(result.channels).length : 0);
    console.log("📊 Channel names:", result?.channels ? Object.keys(result.channels) : []);
  } catch (error) {
    console.log("❌ ERROR:", error.message);
    console.log("❌ STACK:", error.stack);
  }
}

void testWorkingFramework();
