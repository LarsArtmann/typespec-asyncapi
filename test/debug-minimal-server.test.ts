import {
  createAsyncAPITestHost,
  compileAndGetAsyncAPI,
} from "./utils/test-helpers.js";

async function testMinimalServer() {
  console.log("🧪 TESTING MINIMAL @server REPRODUCTION");

  try {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "minimal.tsp",
      `
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@server({
  name: "test-server",
  url: "kafka://localhost:9092",
  protocol: "kafka",
  description: "Test server"
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

    console.log("📝 Files added, attempting compilation...");

    // Test compilation first
    const compilationResult = await host.compile("minimal.tsp");
    console.log("✅ Compilation:", compilationResult ? "SUCCESS" : "FAILED");

    // Test diagnostics
    const diagnostics = await host.diagnose("minimal.tsp", {
      emit: ["@lars-artmann/typespec-asyncapi"],
    });

    console.log("📊 Diagnostics count:", diagnostics.length);
    diagnostics.forEach((d, i) => {
      console.log(`  ${i + 1}. [${d.severity}] ${d.code}: ${d.message}`);
      console.log(`     Full diagnostic:`, JSON.stringify(d, null, 2));
      if (d.target) {
        console.log(`     Target: ${d.target.kind} at ${d.target.name}`);
      }
    });

    // Try to get AsyncAPI spec
    console.log("🔄 Attempting AsyncAPI generation...");
    const spec = await compileAndGetAsyncAPI(host, "minimal.tsp");

    if (spec) {
      console.log("🎉 SUCCESS: AsyncAPI spec generated!");
      console.log("📊 Version:", spec.asyncapi);
      console.log(
        "📊 Servers:",
        spec.servers ? Object.keys(spec.servers).length : 0,
      );
    } else {
      console.log("❌ FAILED: No AsyncAPI spec generated");
    }
  } catch (error) {
    console.log("💥 ERROR:", error.message);
    console.log("📋 Stack:", error.stack);
  }
}

testMinimalServer();
