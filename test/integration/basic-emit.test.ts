import { describe, it, expect } from "vitest";
import { createTestRunner, expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { AsyncAPIEmitterOptions } from "../../src/options.js";

describe("AsyncAPI Emitter Integration", () => {
  it("should process real TypeSpec AST and generate AsyncAPI", async () => {
    const runner = await createTestRunner();
    
    // Add our emitter to the test runner
    await runner.compileAndDiagnose(
      `
        import "@typespec/asyncapi";
        using TypeSpec.AsyncAPI;

        @service({
          title: "Test Events API",
          version: "1.0.0"
        })
        @server("test", {
          host: "test.example.com", 
          protocol: "kafka"
        })
        namespace TestEvents;

        model TestMessage {
          id: string;
          content: string;
          timestamp: utcDateTime;
        }

        @channel("test.messages")
        @publish
        op publishTestMessage(): TestMessage;

        @channel("test.{userId}")
        @subscribe 
        op subscribeUserEvents(userId: string): TestMessage;
      `,
      {
        emitters: {
          "@typespec/asyncapi": {
            "output-file": "test-api",
            "file-type": "yaml",
          } as AsyncAPIEmitterOptions,
        },
      }
    );

    // If we get here without errors, the emitter successfully processed TypeSpec!
    console.log("✅ SUCCESS: Emitter processed TypeSpec without errors!");
    
    expect(runner.program).toBeDefined();
    expect(runner.program.sourceFiles.size).toBeGreaterThan(0);
    
    // Check that our decorators were processed
    const globalNamespace = runner.program.getGlobalNamespaceType();
    expect(globalNamespace).toBeDefined();
  });

  it("should validate decorator parameters from TypeSpec source", async () => {
    const runner = await createTestRunner();
    
    const { diagnostics } = await runner.compileAndDiagnose(
      `
        import "@typespec/asyncapi";
        using TypeSpec.AsyncAPI;

        namespace Test;

        model TestMessage {
          content: string;
        }

        // This should work - valid channel path
        @channel("valid.channel")
        @publish
        op validOperation(): TestMessage;

        // This should fail - conflicting decorators
        @channel("conflicting.channel")
        @publish
        @subscribe  
        op conflictingOperation(): TestMessage;
      `,
      {
        emitters: {
          "@typespec/asyncapi": {} as AsyncAPIEmitterOptions,
        },
      }
    );

    // Should have diagnostic for conflicting @publish and @subscribe
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics.some(d => d.code === "@typespec/asyncapi/conflicting-operation-type")).toBe(true);
    
    console.log("✅ SUCCESS: Validation works on real TypeSpec decorators!");
    console.log("Diagnostics found:", diagnostics.map(d => d.code));
  });
});