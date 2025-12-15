import { createTestHost } from "@typespec/compiler/testing";

async function testCorrectFrameworkPattern() {
  const host = await createTestHost({
    libEmit: ["@lars-artmann/typespec-asyncapi"],
  });

  // Add the source file to the virtual filesystem first!
  const sourceCode = `
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@channel("test.channel")
@publish
op publishTest(): string;
  `;

  host.addTypeSpecFile("main.tsp", sourceCode);

  try {
    // CORRECT PATTERN: Use TestHost with emitFile API and proper file path
    const [result, diagnostics] = await host.compileAndDiagnose("main.tsp", {
      emit: ["@lars-artmann/typespec-asyncapi"],
    });

    console.log("✅ Test framework integration SUCCESS");
    console.log("📊 Result type:", typeof result);
    console.log("📊 Has program:", !!result.program);
    console.log("📊 Has fs:", !!result.fs);
    console.log("📊 TestFileSystem size:", result.fs?.size || 0);

    // CORRECT PROPERTY: Use result.fs (TestFileSystem Map)
    if (result.fs) {
      for (const [key, value] of result.fs.entries()) {
        console.log(`✅ Found file: ${key} (${value.length} chars)`);
        if (key.includes("asyncapi")) {
          const yaml = await import("yaml");
          const parsed = yaml.parse(value);
          console.log(`✅ AsyncAPI version: ${parsed.asyncapi}`);
          console.log(`✅ Channels: ${parsed.channels ? Object.keys(parsed.channels).length : 0}`);
          console.log(`✅ Channel names:`, parsed.channels ? Object.keys(parsed.channels) : []);
        }
      }
    }

    console.log("📊 Errors:", diagnostics.filter((d) => d.severity === "error").length);
    console.log("📊 Warnings:", diagnostics.filter((d) => d.severity === "warning").length);

    // Show actual errors for debugging
    const errors = diagnostics.filter((d) => d.severity === "error");
    for (const error of errors) {
      console.log(`❌ ERROR: ${error.message}`);
      console.log(`   CODE: ${error.code}`);
      console.log(`   FILE: ${error.file?.target?.uri}`);
    }
  } catch (error) {
    console.log("❌ ERROR:", error.message);
    console.log("❌ STACK:", error.stack);
  }
}

testCorrectFrameworkPattern();
