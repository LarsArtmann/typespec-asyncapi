import { describe, it, expect } from "bun:test";
import { createAsyncAPIEmitterTester } from "./utils/emitter-test-helpers";
import { emitFile } from "@typespec/compiler";
import type { EmitFileOptions } from "@typespec/compiler";

describe("Minimal emitFile Test", () => {
  it("should test emitFile directly", async () => {
    // Create tester but don't run emitter
    const tester = await createAsyncAPIEmitterTester();

    // Access program directly and try emitFile
    const compilation = await tester.compile(`
      @service
      namespace Test {}
    `);

    console.log("🔍 Compilation result:", {
      hasProgram: !!compilation.program,
      hasFs: !!compilation.fs,
      fsKeys: compilation.fs ? Object.keys(compilation.fs) : [],
    });

    // Try direct emitFile call
    try {
      const testContent = "test: value\nfile: true";
      const testPath = "test-emit.yaml";

      await emitFile(compilation.program, {
        path: testPath,
        content: testContent,
      } as EmitFileOptions);

      console.log("✅ Direct emitFile call succeeded");

      // Check virtual filesystem
      if (compilation.fs && compilation.fs.fs) {
        const files = Object.entries(compilation.fs.fs);
        console.log(`🔍 Virtual filesystem now has ${files.length} files:`);
        for (const [path, content] of files) {
          console.log(
            `  📄 ${path}: ${typeof content === "string" ? content.length + " chars" : typeof content}`,
          );
        }
      }

      expect(compilation.fs?.fs).toBeDefined();
    } catch (error) {
      console.error("❌ Direct emitFile call failed:", error);
      throw error;
    }
  }, 15000);
});
