/**
 * Test AsyncAPI emitter without decorators - basic functionality
 */

import { describe, it, expect } from "vitest";
import { 
  compileAsyncAPISpecWithoutErrors, 
  parseAsyncAPIOutput 
} from "./utils/test-helpers.js";

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

    const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source, {
      "output-file": "simple-test",
      "file-type": "json",
    });

    console.log("Available output files:");
    for (const [path, file] of outputFiles.entries()) {
      if (path.includes('simple-test') || path.includes('asyncapi')) {
        console.log(`  📄 ${path} (${file.content?.length || 0} chars)`);
        if (file.content) {
          console.log(`     Preview: ${file.content.substring(0, 150)}...`);
        }
      }
    }

    // Should have generated an output file
    const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "simple-test.json");
    
    // Should be a valid AsyncAPI document structure
    expect(typeof asyncapiDoc).toBe("object");
    expect(asyncapiDoc.asyncapi).toBe("3.0.0");
    expect(asyncapiDoc.info).toBeDefined();
    expect(asyncapiDoc.channels).toBeDefined();
    expect(asyncapiDoc.operations).toBeDefined();
    expect(asyncapiDoc.components).toBeDefined();
    
    console.log("✅ Basic AsyncAPI generation works without decorators");
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

    const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source, {
      "output-file": "multi-op",
      "file-type": "json",
    });

    const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "multi-op.json");
    
    expect(asyncapiDoc.asyncapi).toBe("3.0.0");
    // Should have processed the operations and models
    expect(asyncapiDoc.info.title).toContain("Generated from REAL TypeSpec AST");
    
    console.log(`✅ Generated AsyncAPI with title: ${asyncapiDoc.info.title}`);
    console.log(`✅ Info description: ${asyncapiDoc.info.description}`);
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

    const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source, {
      "output-file": "yaml-test",
      "file-type": "yaml",
    });

    // Should be YAML content (string)
    const yamlContent = parseAsyncAPIOutput(outputFiles, "yaml-test.yaml");
    expect(typeof yamlContent).toBe("string");
    expect(yamlContent).toContain("asyncapi: 3.0.0");
    expect(yamlContent).toContain("Generated from TypeSpec");
    
    console.log("✅ YAML generation works");
  });
});