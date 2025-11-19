import { createAsyncAPITestHost } from "./utils/test-helpers.js";

async function testSimpleChannel() {
  console.log("🧪 TESTING SIMPLE @channel DECORATOR");

  try {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "simple-channel-test.tsp",
      `
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@channel("/test/simple")
op testOp(): void;
      `,
    );

    console.log("📝 Files added, testing simple @channel decorator...");

    const diagnostics = await host.diagnose("simple-channel-test.tsp", {
      emit: ["@lars-artmann/typespec-asyncapi"],
    });

    console.log(`📊 Simple channel diagnostics count: ${diagnostics.length}`);

    if (diagnostics.length > 0) {
      console.log("=== Simple Channel Diagnostics ===");
      diagnostics.forEach((d, i) => {
        console.log(`${i + 1}. Code: ${d.code}`);
        console.log(`   Severity: ${d.severity}`);
        console.log(`   Message: ${d.message}`);
      });
    }

    return diagnostics;
  } catch (error) {
    console.log("💥 ERROR:", error);
    throw error;
  }
}

testSimpleChannel()
  .then((diagnostics) => {
    const missingImpl = diagnostics.filter(
      (d) => d.code === "missing-implementation",
    );
    console.log(`🔍 Missing implementation count: ${missingImpl.length}`);

    if (missingImpl.length === 0) {
      console.log("✅ @channel decorator implementation found!");
    } else {
      console.log("❌ @channel decorator implementation NOT found");
    }
  })
  .catch((error) => {
    console.log("💥 Test failed:", error);
  });
