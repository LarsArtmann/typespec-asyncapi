import { createTestHost } from "@typespec/compiler/testing";

async function testFrameworkPattern() {
  const host = await createTestHost({
    libEmit: ["@lars-artmann/typespec-asyncapi"],
  });

  const sourceCode = `
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@channel("test.channel")
@publish
op publishTest(): string;
  `;

  try {
    // Use the Tester.emit approach that accesses outputs directly
    const tester = host.tester.emit("@lars-artmann/typespec-asyncapi");
    const result = await tester.compile(sourceCode);

    console.log("✅ Test framework integration SUCCESS");
    console.log("📊 Result type:", typeof result);
    console.log("📊 Has outputs:", !!result.outputs);
    console.log("📊 Output keys:", result.outputs ? Object.keys(result.outputs) : "none");
    console.log("📊 Has fs:", !!result.program);

    // Check outputs (the correct property!)
    if (result.outputs) {
      for (const [key, value] of Object.entries(result.outputs)) {
        console.log(`✅ Found output: ${key} (${value.length} chars)`);
        if (key.includes("asyncapi")) {
          const yaml = await import("yaml");
          const parsed = yaml.parse(value);
          console.log(`✅ AsyncAPI version: ${parsed.asyncapi}`);
          console.log(`✅ Channels: ${parsed.channels ? Object.keys(parsed.channels).length : 0}`);
        }
      }
    }
  } catch (error) {
    console.log("❌ ERROR:", error.message);
  }
}

void testFrameworkPattern();
