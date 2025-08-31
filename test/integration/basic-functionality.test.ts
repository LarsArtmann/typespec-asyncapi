/**
 * Basic functionality integration tests for AsyncAPI emitter
 * Tests the actual working decorators and emitter functionality
 */

import { describe, it, expect } from "vitest";
import { 
  compileAsyncAPISpecWithoutErrors, 
  compileAsyncAPISpec,
  parseAsyncAPIOutput 
} from "../utils/test-helpers";

describe("AsyncAPI Basic Functionality", () => {
  it("should compile simple TypeSpec to AsyncAPI using @channel decorator", async () => {
    const source = `
      namespace BasicTest;

      model SimpleEvent {
        id: string;
        message: string;
        timestamp: utcDateTime;
      }

      @channel("simple.events")
      op publishSimpleEvent(): SimpleEvent;
    `;

    const { outputFiles, diagnostics } = await compileAsyncAPISpecWithoutErrors(source, {
      "output-file": "basic-test",
      "file-type": "yaml",
    });

    // Should have output files
    expect(outputFiles.size).toBeGreaterThan(0);
    
    // Get the generated file content
    const content = parseAsyncAPIOutput(outputFiles, "basic-test.yaml");
    
    // Validate basic AsyncAPI structure
    expect(content).toContain("asyncapi: 3.0.0");
    expect(content).toContain("publishSimpleEvent");
    expect(content).toContain("SimpleEvent");
    
    Effect.log("✅ Basic TypeSpec to AsyncAPI compilation works");
  });

  it("should generate JSON format output", async () => {
    const source = `
      namespace JsonTest;

      model JsonEvent {
        eventId: string;
        data: string;
      }

      @channel("json.test")
      op publishJsonEvent(): JsonEvent;
    `;

    const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source, {
      "output-file": "json-test",
      "file-type": "json",
    });

    const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "json-test.json");
    
    // Should be valid JSON object
    expect(typeof asyncapiDoc).toBe("object");
    expect(asyncapiDoc.asyncapi).toBe("3.0.0");
    expect(asyncapiDoc.operations).toBeDefined();
    expect(asyncapiDoc.channels).toBeDefined();
    expect(asyncapiDoc.components).toBeDefined();
    
    Effect.log("✅ JSON output generation works");
  });

  it("should handle multiple operations with different channels", async () => {
    const source = `
      namespace MultiChannel;

      model UserEvent {
        userId: string;
        action: string;
      }

      model OrderEvent {
        orderId: string;
        status: string;
      }

      @channel("users.events")
      op publishUserEvent(): UserEvent;

      @channel("orders.events")
      op publishOrderEvent(): OrderEvent;
    `;

    const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source, {
      "output-file": "multi-channel",
      "file-type": "json",
    });

    const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "multi-channel.json");
    
    // Should have both operations
    expect(asyncapiDoc.operations.publishUserEvent).toBeDefined();
    expect(asyncapiDoc.operations.publishOrderEvent).toBeDefined();
    
    // Should have both channels
    expect(asyncapiDoc.channels.channel_publishUserEvent).toBeDefined();
    expect(asyncapiDoc.channels.channel_publishOrderEvent).toBeDefined();
    
    // Should have both schemas
    expect(asyncapiDoc.components.schemas.UserEvent).toBeDefined();
    expect(asyncapiDoc.components.schemas.OrderEvent).toBeDefined();
    
    Effect.log("✅ Multiple operations and channels work");
  });

  it("should handle different TypeSpec data types", async () => {
    const source = `
      namespace DataTypes;

      model TypedEvent {
        stringField: string;
        intField: int32;
        boolField: boolean;
        dateField: utcDateTime;
        optionalField?: string;
        arrayField: string[];
        unionField: "option1" | "option2" | "option3";
      }

      @channel("typed.events")
      op publishTypedEvent(): TypedEvent;
    `;

    const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source, {
      "output-file": "typed-test",
      "file-type": "json",
    });

    const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "typed-test.json");
    const schema = asyncapiDoc.components.schemas.TypedEvent;
    
    // Validate type mappings
    expect(schema.properties.stringField.type).toBe("string");
    expect(schema.properties.intField.type).toBe("number");
    expect(schema.properties.boolField.type).toBe("boolean");
    expect(schema.properties.dateField.type).toBe("string");
    expect(schema.properties.dateField.format).toBe("date-time");
    
    // Validate required vs optional fields
    expect(schema.required).toContain("stringField");
    expect(schema.required).toContain("intField");
    expect(schema.required).toContain("boolField");
    expect(schema.required).not.toContain("optionalField");
    
    Effect.log("✅ TypeSpec data type mapping works");
  });

  it("should preserve @doc annotations", async () => {
    const source = `
      namespace DocTest;

      @doc("A well-documented event model")
      model DocumentedEvent {
        @doc("Unique identifier for the event")
        id: string;
        
        @doc("Human-readable description")
        description: string;
      }

      @channel("documented.events")
      op publishDocumentedEvent(): DocumentedEvent;
    `;

    const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source, {
      "output-file": "doc-test",
      "file-type": "json",
    });

    const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "doc-test.json");
    const schema = asyncapiDoc.components.schemas.DocumentedEvent;
    
    // Validate documentation is preserved
    expect(schema.description).toBe("A well-documented event model");
    expect(schema.properties.id.description).toBe("Unique identifier for the event");
    expect(schema.properties.description.description).toBe("Human-readable description");
    
    Effect.log("✅ Documentation preservation works");
  });

  it("should handle operations with parameters", async () => {
    const source = `
      namespace ParamTest;

      model ParameterizedEvent {
        content: string;
        timestamp: utcDateTime;
      }

      @channel("parameterized.events")
      op publishParameterizedEvent(
        userId: string,
        category?: string
      ): ParameterizedEvent;
    `;

    const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source, {
      "output-file": "param-test",
      "file-type": "json",
    });

    const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "param-test.json");
    
    // Should have operation with parameters
    expect(asyncapiDoc.operations.publishParameterizedEvent).toBeDefined();
    
    // Verify operation references the correct schema
    expect(asyncapiDoc.components.schemas.ParameterizedEvent).toBeDefined();
    
    Effect.log("✅ Operations with parameters work");
  });

  it("should generate unique operation and channel names", async () => {
    const source = `
      namespace UniqueName;

      model Event1 { id: string; }
      model Event2 { id: string; }

      @channel("events.type1")
      op publishEvent1(): Event1;

      @channel("events.type2")
      op publishEvent2(): Event2;

      @channel("events.type3")
      op publishEvent3(): Event1; // Same model, different operation
    `;

    const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source, {
      "output-file": "unique-names",
      "file-type": "json",
    });

    const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "unique-names.json");
    
    // Should have unique operation names
    const operationNames = Object.keys(asyncapiDoc.operations);
    expect(operationNames).toContain("publishEvent1");
    expect(operationNames).toContain("publishEvent2");
    expect(operationNames).toContain("publishEvent3");
    expect(operationNames.length).toBe(3);
    
    // Should have unique channel names
    const channelNames = Object.keys(asyncapiDoc.channels);
    expect(channelNames.length).toBe(3);
    expect(new Set(channelNames).size).toBe(3); // All unique
    
    Effect.log("✅ Unique naming works");
  });
});