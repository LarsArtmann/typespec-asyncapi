/**
 * Basic functionality integration tests for AsyncAPI emitter
 * Tests the actual working decorators and emitter functionality
 * Using CLI compilation approach that bypasses test framework issues
 */

//TODO: TEST INFRASTRUCTURE ANTI-PATTERN HELL - THIS FILE REPRESENTS EVERYTHING WRONG WITH TEST ARCHITECTURE!
//TODO: CLI DEPENDENCY DISASTER - Tests depend on external TypeSpec CLI instead of programmatic API!
//TODO: FILE SYSTEM CHAOS - Raw fs operations scattered everywhere without abstraction!
//TODO: CHILD PROCESS SPAWNING ANTI-PATTERN - Using raw spawn() instead of proper test utilities!
//TODO: IMPORT CHAOS - 6 different imports mixing testing, Effect, fs, and child_process!
import { describe, it, expect } from "vitest";
import { compileAsyncAPISpecWithoutErrors, parseAsyncAPIOutput } from "../utils/test-helpers";

describe("AsyncAPI Basic Functionality", () => {
  async function compileAndParse(source: string) {
    const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source);
    return await parseAsyncAPIOutput(outputFiles);
  }

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

    const doc = (await compileAndParse(source)) as any;

    expect(doc.asyncapi).toBe("3.1.0");
    expect(doc.operations.publishSimpleEvent).toBeDefined();
    expect(doc.components.schemas.SimpleEvent).toBeDefined();
    expect(doc.channels["simple.events"]).toBeDefined();
  });

  it("should generate valid AsyncAPI with multiple operations", async () => {
    const source = `
      namespace MultiTest;

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

    const doc = (await compileAndParse(source)) as any;

    expect(doc.asyncapi).toBe("3.1.0");
    expect(doc.operations.publishUserEvent).toBeDefined();
    expect(doc.operations.publishOrderEvent).toBeDefined();
    expect(doc.channels["users.events"]).toBeDefined();
    expect(doc.channels["orders.events"]).toBeDefined();
    expect(doc.components.schemas.UserEvent).toBeDefined();
    expect(doc.components.schemas.OrderEvent).toBeDefined();
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

    const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source);

    const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "multi-channel.json");
    const doc = asyncapiDoc as any;

    // Should have both operations
    expect(doc.operations.publishUserEvent).toBeDefined();
    expect(doc.operations.publishOrderEvent).toBeDefined();

    // Should have both channels
    expect(doc.channels["users.events"]).toBeDefined();
    expect(doc.channels["orders.events"]).toBeDefined();

    // Should have both schemas
    expect(doc.components.schemas.UserEvent).toBeDefined();
    expect(doc.components.schemas.OrderEvent).toBeDefined();
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

    const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source);

    const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "typed-test.json");
    const doc = asyncapiDoc as any;
    const schema = doc.components.schemas.TypedEvent;

    // Validate type mappings
    expect(schema.properties.stringField.type).toBe("string");
    expect(schema.properties.intField.type).toBe("integer");
    expect(schema.properties.intField.format).toBe("int32");
    expect(schema.properties.boolField.type).toBe("boolean");
    expect(schema.properties.dateField.type).toBe("string");
    expect(schema.properties.dateField.format).toBe("date-time");

    // Validate required vs optional fields
    expect(schema.required).toContain("stringField");
    expect(schema.required).toContain("intField");
    expect(schema.required).toContain("boolField");
    expect(schema.required).not.toContain("optionalField");
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

    const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source);

    const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "doc-test.json");
    const doc = asyncapiDoc as any;
    const schema = doc.components.schemas.DocumentedEvent;

    // Validate documentation is preserved
    expect(schema.description).toBe("A well-documented event model");
    expect(schema.properties.id.description).toBe("Unique identifier for the event");
    expect(schema.properties.description.description).toBe("Human-readable description");
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

    const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source);

    const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "param-test.json");
    const doc = asyncapiDoc as any;

    // Should have operation with parameters
    expect(doc.operations.publishParameterizedEvent).toBeDefined();

    // Verify operation references the correct schema
    expect(doc.components.schemas.ParameterizedEvent).toBeDefined();
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
      op publishEvent3(): Event1;
    `;

    const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source);
    const asyncapiDoc = await parseAsyncAPIOutput(outputFiles);
    const doc = asyncapiDoc as any;

    expect(doc.asyncapi).toBe("3.1.0");
    expect(doc.channels).toBeDefined();
    expect(doc.components?.schemas).toBeDefined();

    const operationNames = Object.keys(doc.operations);
    expect(operationNames.length).toBe(3);
    expect(new Set(operationNames).size).toBe(3);

    const channelNames = Object.keys(doc.channels);
    expect(channelNames.length).toBe(3);
    expect(new Set(channelNames).size).toBe(3);
  });
});
