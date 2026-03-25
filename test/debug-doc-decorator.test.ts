import { createAsyncAPITestHost, compileAndGetAsyncAPI } from "./utils/test-helpers.js";

async function testDocDecorator() {
  console.log("🧪 TESTING DOC DECORATOR EQUIVALENT");

  try {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "doc-test.tsp",
      `
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

// Test object literal with @doc to verify {} type works
@doc("Test namespace", {
  key: "value",
  nested: {
    prop: "test"
  }
})
namespace TestNamespace;

model TestMessage {
  id: string;
}

@channel("test.topic")
@publish
op publishTest(): TestMessage;
    `,
    );

    console.log("📝 Files added, testing doc decorator...");

    // Test compilation
    const compilationResult = await host.compile("doc-test.tsp");
    console.log("✅ Compilation:", compilationResult ? "SUCCESS" : "FAILED");

    const spec = await compileAndGetAsyncAPI(host, "doc-test.tsp");

    if (spec) {
      console.log("🎉 SUCCESS: AsyncAPI spec generated!");
      console.log("📊 Version:", spec.asyncapi);
    } else {
      console.log("❌ FAILED: No AsyncAPI spec generated");
    }
  } catch (error) {
    console.log("💥 ERROR:", error.message);
  }
}

void testDocDecorator();
