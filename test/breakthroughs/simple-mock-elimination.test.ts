/**
 * SIMPLE Mock Elimination Test - Test without decorators
 *
 * This test verifies that TypeSpec 1.4.0 API works correctly
 * by testing basic TypeSpec compilation without our decorators
 */

import { describe, it, expect } from "bun:test";
import { createTester, findTestPackageRoot } from "@typespec/compiler/testing";

describe("✅ Simple Mock Infrastructure Elimination", () => {
  it("should create and use REAL TypeSpec Program objects", async () => {
    const packageRoot = await findTestPackageRoot(import.meta.url);

    // Create a basic TypeSpec test environment (no AsyncAPI libraries)
    const tester = createTester(packageRoot, {
      libraries: [], // Empty libraries array for basic TypeSpec
    });

    // Test with basic TypeSpec code (no custom decorators)
    const result = await tester.compile(`
      namespace TestService;

      model UserData {
        id: string;
        name: string;
        email: string;
      }

      model Event {
        eventId: string;
        timestamp: utcDateTime;
        data: UserData;
      }

      op processUserData(input: UserData): Event;
      op handleEvent(event: Event): void;
    `);

    const program = result.program;
    const diagnostics = program.diagnostics;

    // Should have no compilation errors for basic TypeSpec
    expect(diagnostics.length).toBe(0);

    // This should be a REAL TypeSpec Program with all expected methods
    expect(program).toBeDefined();
    expect(program.stateMap).toBeDefined();
    expect(typeof program.stateMap).toBe("function");
    expect(program.checker).toBeDefined();
    expect(program.getGlobalNamespaceType).toBeDefined();
    expect(typeof program.getGlobalNamespaceType).toBe("function");

    console.log("✅ SUCCESS: Created REAL TypeSpec Program!");
    console.log("✅ SUCCESS: No more mock Program objects!");
    console.log(
      "Program has real methods:",
      Object.keys(program)
        .filter((k) => typeof program[k] === "function")
        .slice(0, 10),
    );

    // Test that we can call real Program methods
    const globalNamespace = program.getGlobalNamespaceType();
    expect(globalNamespace).toBeDefined();
    expect(globalNamespace.kind).toBe("Namespace");

    console.log("✅ SUCCESS: Real Program methods work correctly!");
  });
});
