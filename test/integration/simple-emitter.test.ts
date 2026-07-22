/**
 * Test AsyncAPI emitter without decorators - basic functionality
 */

import { describe, expect, it } from "vitest";
import { compileAsyncAPISpecWithoutErrors, parseAsyncAPIOutput } from "../utils/test-helpers.js";

describe("Simple AsyncAPI Emitter (No Decorators)", () => {
  it("should generate basic AsyncAPI from simple TypeSpec", async () => {
    const source = `
      namespace SimpleTest;

      model SimpleEvent {
        id: string;
        message: string;
        timestamp: utcDateTime;
      }

      op publishSimpleEvent(): SimpleEvent;
    `;

    const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source);

    for (const [path, file] of outputFiles.entries()) {
      if (path.includes("simple-test") || path.includes("asyncapi")) {
        if (file.content) {
        }
      }
    }

    // Should have generated an output file
    const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "simple-test.json");

    // Should be a valid AsyncAPI document structure
    expect(typeof asyncapiDoc).toBe("object");
    expect(asyncapiDoc.asyncapi).toBe("3.1.0");
    expect(asyncapiDoc.info).toBeDefined();
    expect(asyncapiDoc.channels).toBeDefined();
    expect(asyncapiDoc.operations).toBeDefined();
    expect(asyncapiDoc.components).toBeDefined();
  });

  it("should handle multiple operations", async () => {
    const source = `
      namespace MultiOp;

      model UserEvent {
        userId: string;
        action: string;
      }

      model SystemEvent {
        component: string;
        level: string;
      }

      op publishUserEvent(): UserEvent;
      op publishSystemEvent(): SystemEvent;
    `;

    const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source);

    const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "multi-op.json");

    expect(asyncapiDoc.asyncapi).toBe("3.1.0");
    // Should have processed the operations and models
    expect(asyncapiDoc.info.title).toBeDefined();
  });

  it("should generate YAML output", async () => {
    const source = `
      namespace YamlTest;

      model TestEvent {
        id: string;
        data: string;
      }

      op publishTest(): TestEvent;
    `;

    const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source);

    const asyncapiDoc = await parseAsyncAPIOutput(outputFiles);
    expect(asyncapiDoc.asyncapi).toBe("3.1.0");
    expect(asyncapiDoc.info).toBeDefined();
  });
});
