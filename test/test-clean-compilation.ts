import { compileSimpleTest } from "./test/utils/clean-test-helper.js";

async function test() {
  const sourceCode = `
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@channel("test.channel")
@publish
op publishTest(): string;
  `;

  try {
    const result = await compileSimpleTest(sourceCode);
    console.log("✅ SUCCESS: Clean compilation");
    console.log("📊 AsyncAPI version:", result?.asyncapi);
    console.log("📊 Channels:", result?.channels ? Object.keys(result.channels).length : 0);
    console.log("📊 Channel names:", result?.channels ? Object.keys(result.channels) : []);
  } catch (error) {
    console.log("❌ ERROR:", error.message);
  }
}

test().catch(console.error);
