/**
 * Verification test for TypeSpec 1.4.0 EmitterTester API
 *
 * This test verifies that:
 * 1. New test helpers work correctly
 * 2. Options are properly passed to the emitter
 * 3. Output files are generated with correct names
 */

import { describe, expect, it } from "bun:test";
import {
  compileAsyncAPI,
  compileAsyncAPIWithoutErrors,
} from "../utils/emitter-test-helpers.js";
import { SERIALIZATION_FORMAT_OPTION_JSON } from "../../src/domain/models/serialization-format-option.js";

describe("EmitterTester API Verification", () => {
  const simpleSource = `
    namespace TestNamespace;

    model SimpleEvent {
      id: string;
      message: string;
    }

    @channel("simple-events")
    op publishSimple(): SimpleEvent;
  `;

  it("should compile TypeSpec to AsyncAPI", async () => {
    const result = await compileAsyncAPIWithoutErrors(simpleSource);

    expect(result.asyncApiDoc).toBeDefined();
    expect(result.asyncApiDoc.asyncapi).toBe("3.0.0");
    expect(result.asyncApiDoc.info).toBeDefined();
  });

  it("should pass file-type option correctly (JSON)", async () => {
    const result = await compileAsyncAPI(simpleSource, {
      "file-type": SERIALIZATION_FORMAT_OPTION_JSON,
    });

    // Should generate .json file
    expect(result.outputFile).toContain(".json");
    expect(result.asyncApiDoc).toBeDefined();
  });

  it("should pass file-type option correctly (YAML)", async () => {
    const result = await compileAsyncAPI(simpleSource, {
      "file-type": "yaml",
    });

    // Should generate .yaml file
    expect(result.outputFile).toContain(".yaml");
    expect(result.asyncApiDoc).toBeDefined();
  });

  it("should pass output-file option correctly", async () => {
    const result = await compileAsyncAPI(simpleSource, {
      "output-file": "custom-name",
      "file-type": SERIALIZATION_FORMAT_OPTION_JSON,
    });

    // Should generate custom-name.json
    expect(result.outputFile).toBe("custom-name.json");
    expect(result.asyncApiDoc).toBeDefined();
  });

  it("should provide direct access to outputs", async () => {
    const result = await compileAsyncAPI(simpleSource, {
      "output-file": "test-output",
    });

    // Outputs should be directly accessible (no filesystem search needed)
    expect(Object.keys(result.outputs).length).toBeGreaterThan(0);
    expect(result.outputs[result.outputFile]).toBeDefined();
  });

  it("should parse AsyncAPI document correctly", async () => {
    const result = await compileAsyncAPIWithoutErrors(simpleSource);

    expect(result.asyncApiDoc.components).toBeDefined();
    expect(result.asyncApiDoc.components.schemas).toBeDefined();
    expect(result.asyncApiDoc.components.schemas.SimpleEvent).toBeDefined();
  });

  it("should handle compilation errors gracefully", async () => {
    const invalidSource = `
      namespace Invalid;

      model BrokenEvent {
        id: NonexistentType;  // This should cause an error
      }
    `;

    await expect(compileAsyncAPIWithoutErrors(invalidSource)).rejects.toThrow(
      "Unexpected diagnostics",
    ); // TypeSpec 1.4.0 uses different error message
  });

  it("CRITICAL: should pass options to emitter (OPTIONS PASSING VERIFICATION)", async () => {
    // This is THE critical test that verifies options are actually passed
    const result = await compileAsyncAPI(simpleSource, {
      "output-file": "options-test",
      "file-type": "json",
    });

    // If options are passed correctly:
    // 1. Output file should be named "options-test.json" (not "asyncapi.yaml")
    expect(result.outputFile).toBe("options-test.json");

    // 2. Content should be JSON (not YAML)
    const content = result.outputs["options-test.json"];
    expect(content).toBeDefined();
    expect(() => JSON.parse(content)).not.toThrow();

    // 3. Should be valid AsyncAPI document
    expect(result.asyncApiDoc.asyncapi).toBe("3.0.0");

    console.log("✅ OPTIONS PASSING VERIFIED - Options reached the emitter!");
  });
});
