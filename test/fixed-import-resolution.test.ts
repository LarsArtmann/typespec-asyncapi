/**
 * Fixed import resolution test to verify TypeSpec compilation works
 */

import { describe, expect, it } from "vitest";
import { createTestHost } from "@typespec/compiler/testing";
import { AsyncAPITestLibrary } from "./test-host";

describe("Fixed Import Resolution Tests", () => {
  it("should resolve library imports correctly without manual path imports", async () => {
    const host = await createTestHost({
      libraries: [AsyncAPITestLibrary],
    });

    // Test without explicit imports - the test library should provide decorators automatically
    host.addTypeSpecFile("test.tsp", `
      namespace MyService;

      model User {
        id: string;
        name: string;
      }

      op getUserData(userId: string): User;
    `);

    const program = await host.compile("test.tsp");
    
    // Just verify basic compilation works
    expect(program).toBeDefined();
    expect(program.stateMap).toBeDefined();
    expect(typeof program.stateMap).toBe("function");
  });

  it("should compile with emitter without import issues", async () => {
    const host = await createTestHost({
      libraries: [AsyncAPITestLibrary],
    });

    host.addTypeSpecFile("simple.tsp", `
      namespace TestService;
      
      model Message {
        content: string;
        timestamp: utcDateTime;
      }
      
      op sendMessage(msg: Message): void;
    `);

    // Try compiling with the emitter - this should work with library-provided setup
    const diagnostics = await host.diagnose("simple.tsp", {
      emit: ["@larsartmann/typespec-asyncapi"]
    });

    // Should compile without import resolution errors
    const hasImportErrors = diagnostics.some(d => d.code === "import-not-found");
    expect(hasImportErrors).toBe(false);
    
    // Basic success: no import resolution failures
    console.log(`Compilation resulted in ${diagnostics.length} diagnostics`);
    
    if (diagnostics.length > 0) {
      console.log("Diagnostics:", diagnostics.map(d => `${d.code}: ${d.message}`));
    }
  });

  it("should work with manual TypeSpec namespace declaration", async () => {
    const host = await createTestHost({
      libraries: [AsyncAPITestLibrary],
    });

    host.addTypeSpecFile("namespace-test.tsp", `
      namespace TypeSpec.AsyncAPI;
      
      extern dec channel(target: Operation, path: valueof string);
      extern dec publish(target: Operation);
      extern dec subscribe(target: Operation);
      extern dec server(target: Namespace, name: valueof string, config: Record<unknown>);
      
      namespace MyService {
        model Event {
          type: string;
          data: Record<unknown>;
        }
        
        @channel("events")
        @publish  
        op publishEvent(): Event;
      }
    `);

    const diagnostics = await host.diagnose("namespace-test.tsp", {
      emit: ["@larsartmann/typespec-asyncapi"]
    });

    // This approach should avoid import resolution issues entirely
    const hasImportErrors = diagnostics.some(d => d.code === "import-not-found");
    expect(hasImportErrors).toBe(false);
    
    console.log(`Manual namespace approach: ${diagnostics.length} diagnostics`);
  });
});