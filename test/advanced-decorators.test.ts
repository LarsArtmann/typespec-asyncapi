import { describe, it, expect } from "bun:test";
import { compileTypeSpecWithDecorators } from "./utils/test-helpers.js";

describe("Advanced AsyncAPI Decorators", () => {
  it("should compile TypeSpec with @tags decorator without errors", async () => {
    const testCode = `
      import "@lars-artmann/typespec-asyncapi";
      using TypeSpec.AsyncAPI;
      
      @tags(#["user", "auth"])
      model SimpleModel {
        id: string;
      }
    `;

    const { program, diagnostics } =
      await compileTypeSpecWithDecorators(testCode);

    // Debug: Log all diagnostics
    if (diagnostics.length > 0) {
      console.log("DIAGNOSTICS for @tags test:");
      diagnostics.forEach((d) => console.log(`  ${d.severity}: ${d.message}`));
    }

    // Check compilation succeeded
    expect(program).toBeDefined();

    // Check no errors (warnings are OK)
    const errors = diagnostics.filter((d) => d.severity === "error");
    expect(errors.length).toBe(0);

    // Check tags state map exists
    const tagsMap = program.stateMap("tags");
    expect(tagsMap).toBeDefined();
  });

  it.skip("should compile TypeSpec with @correlationId decorator without errors", async () => {
    const testCode = `
      import "@lars-artmann/typespec-asyncapi";
      using TypeSpec.AsyncAPI;
      
      @correlationId("$message.header#/correlationId")
      model RequestMessage {
        id: string;
      }
    `;

    const { program, diagnostics } =
      await compileTypeSpecWithDecorators(testCode);

    expect(program).toBeDefined();
    const errors = diagnostics.filter((d) => d.severity === "error");
    if (errors.length > 0) {
      console.log(
        "@correlationId compilation errors:",
        errors.map((e) => ({
          code: e.code,
          message: e.message,
          target: e.target,
        })),
      );
    }
    expect(errors.length).toBe(0);

    const correlationMap = program.stateMap("correlationIds");
    expect(correlationMap).toBeDefined();
  });

  it.skip("should compile TypeSpec with @bindings decorator without errors", async () => {
    const testCode = `
      import "@lars-artmann/typespec-asyncapi";
      using TypeSpec.AsyncAPI;
      
      @bindings({})
      @channel("/events")
      @publish
      op publishEvent(): SimpleEvent;
      
      model SimpleEvent {
        id: string;
      }
    `;

    const { program, diagnostics } =
      await compileTypeSpecWithDecorators(testCode);

    expect(program).toBeDefined();
    const errors = diagnostics.filter((d) => d.severity === "error");
    if (errors.length > 0) {
      console.log(
        "@bindings compilation errors:",
        errors.map((e) => ({ code: e.code, message: e.message })),
      );
    }
    expect(errors.length).toBe(0);

    const bindingsMap = program.stateMap("cloudBindings");
    expect(bindingsMap).toBeDefined();
  });

  it.skip("should compile TypeSpec with @header decorator without errors", async () => {
    const testCode = `
      import "@lars-artmann/typespec-asyncapi";
      using TypeSpec.AsyncAPI;
      
      model MessageWithHeaders {
        @header("messageId") messageId: string;
        payload: string;
      }
    `;

    const { program, diagnostics } =
      await compileTypeSpecWithDecorators(testCode);

    expect(program).toBeDefined();
    const errors = diagnostics.filter((d) => d.severity === "error");
    if (errors.length > 0) {
      console.log(
        "@header compilation errors:",
        errors.map((e) => ({ code: e.code, message: e.message })),
      );
    }
    expect(errors.length).toBe(0);

    const headersMap = program.stateMap("messageHeaders");
    expect(headersMap).toBeDefined();
  });
});
