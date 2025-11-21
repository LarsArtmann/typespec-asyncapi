import { describe, it, expect } from "bun:test";
import { compileTypeSpec } from "./helpers/compile-typespec.js";

describe("DEBUG: AsyncAPI File Generation", () => {
  it("should verify emitFile file generation issue", async () => {
    console.log("🔍 DEBUG: Testing basic AsyncAPI generation");
    
    const typespecCode = `
      namespace TestService {
        @channel("test.topic")
        @publish
        op testMessage(): void;
      }
    `;

    const result = await compileTypeSpec({
      code: typespecCode,
      emitAsyncAPI: true,
    });

    console.log("🔍 DEBUG: Program diagnostics:", result.program.diagnostics);
    console.log("🔍 DEBUG: Result outputs count:", result.outputs.size);
    console.log("🔍 DEBUG: Result outputs keys:", Array.from(result.outputs.keys()));
    console.log("🔍 DEBUG: Has asyncapi field:", 'asyncapi' in result);

    if (result.outputs.size === 0) {
      console.log("🚨 DEBUG: No outputs in result - this is the issue!");
    } else {
      for (const [filename, content] of result.outputs.entries()) {
        console.log(`📄 DEBUG: Output file: ${filename}`);
        console.log(`📄 DEBUG: Content length: ${content.length} characters`);
        console.log(`📄 DEBUG: Content preview: ${content.substring(0, 100)}...`);
      }
    }

    // This test will help identify the exact issue
    expect(result.outputs.size).toBeGreaterThan(0);
  });
});