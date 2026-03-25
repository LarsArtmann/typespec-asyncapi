import { createAsyncAPITestHost, compileAndGetAsyncAPI } from "../test/utils/test-helpers.js";

async function testFixedFramework() {
  const sourceCode = `
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@channel("test.channel")
@publish
op publishTest(): string;
  `;

  try {
    // Use the working compileAndGetAsyncAPI function from our test helper
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile("main.tsp", sourceCode); // Add file first!
    const result = await compileAndGetAsyncAPI(host, "main.tsp"); // Then reference it

    console.log("🎉 FRAMEWORK FIX SUCCESS!");
    console.log("📊 AsyncAPI version:", result?.asyncapi);
    console.log("📊 Channels:", result?.channels ? Object.keys(result.channels).length : 0);
    console.log("📊 Channel names:", result?.channels ? Object.keys(result.channels) : []);

    if (result?.channels) {
      const channelName = Object.keys(result.channels)[0];
      console.log("📊 Channel details:", result.channels[channelName]);
    }
  } catch (error) {
    console.log("❌ ERROR:", error.message);
    console.log("❌ STACK:", error.stack);
  }
}

void testFixedFramework();
