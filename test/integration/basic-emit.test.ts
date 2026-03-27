import { describe, expect, it } from "bun:test";
import { compileAsyncAPIWithoutErrors } from "../utils/emitter-test-helpers.js";

describe("AsyncAPI Emitter Integration", () => {
  it("should compile basic-events example and generate AsyncAPI", async () => {
    const source = `
      namespace UserEvents;

      @doc("User signup event model")
      model UserSignupEvent {
        @doc("User's unique identifier")
        userId: string;
        
        @doc("User's email address")  
        email: string;
        
        @doc("Timestamp of signup")
        timestamp: string;
        
        @doc("User's selected plan")
        plan: "free" | "premium" | "enterprise";
      }

      @channel("user.signup")
      @doc("Publish user signup events to the system")
      op publishUserSignup(): UserSignupEvent;

      @channel("user.messages")
      @doc("Subscribe to messages for users")
      op receiveUserMessage(
        @doc("User ID parameter")
        userId: string
      ): UserSignupEvent;
    `;

    const result = await compileAsyncAPIWithoutErrors(source, {
      "output-file": "test-basic",
      "file-type": "yaml",
    });

    const content = result.outputs[result.outputFile];

    // Validate AsyncAPI structure
    expect(content).toContain("asyncapi: 3.0.0");
    expect(content).toContain("publishUserSignup");
    expect(content).toContain("receiveUserMessage");
    expect(content).toContain("UserSignupEvent");
  });

  it("should validate TypeSpec models and generate schemas", async () => {
    const source = `
      namespace EventTests;

      model ComplexEvent {
        @doc("Event identifier")
        id: string;
        
        @doc("Event timestamp")
        timestamp: utcDateTime;
        
        @doc("Optional description")
        description?: string;
        
        @doc("Event status")
        status: "pending" | "processed" | "failed";
      }

      @channel("complex.events")
      op publishComplexEvent(): ComplexEvent;
    `;

    const result = await compileAsyncAPIWithoutErrors(source, {
      "output-file": "complex-test",
      "file-type": "yaml",
    });

    const asyncapiDoc = result.asyncApiDoc;

    // Validate AsyncAPI 3.0 structure
    expect(asyncapiDoc.asyncapi).toBe("3.0.0");
    expect(asyncapiDoc.info).toBeDefined();
    expect(asyncapiDoc.channels).toBeDefined();
    expect(asyncapiDoc.operations).toBeDefined();
    expect(asyncapiDoc.components.schemas).toBeDefined();

    // Validate generated schema for ComplexEvent
    const complexEventSchema = asyncapiDoc.components.schemas.ComplexEvent;
    expect(complexEventSchema).toBeDefined();
    expect(complexEventSchema.type).toBe("object");
    expect(complexEventSchema.properties).toBeDefined();

    // Validate required fields
    expect(complexEventSchema.required).toContain("id");
    expect(complexEventSchema.required).toContain("timestamp");
    expect(complexEventSchema.required).toContain("status");
    expect(complexEventSchema.required).not.toContain("description"); // optional field
  });

  it("should handle multiple operations and channels", async () => {
    const source = `
      namespace MultiOperationTest;

      model UserEvent {
        userId: string;
        action: string;
        timestamp: utcDateTime;
      }

      model SystemAlert {
        level: "info" | "warning" | "error";
        message: string;
        component: string;
      }

      @channel("user.events")
      op publishUserEvent(): UserEvent;

      @channel("system.alerts")  
      op publishSystemAlert(): SystemAlert;

      @channel("user.notifications")
      op subscribeUserNotifications(userId: string): UserEvent;
    `;

    const result = await compileAsyncAPIWithoutErrors(source, {
      "output-file": "multi-ops",
      "file-type": "yaml",
    });

    const asyncapiDoc = result.asyncApiDoc;

    // Should contain all operations
    expect(asyncapiDoc.operations.publishUserEvent).toBeDefined();
    expect(asyncapiDoc.operations.publishSystemAlert).toBeDefined();
    expect(asyncapiDoc.operations.subscribeUserNotifications).toBeDefined();

    // Should contain all channels
    expect(asyncapiDoc.channels["user.events"]).toBeDefined();
    expect(asyncapiDoc.channels["system.alerts"]).toBeDefined();
    expect(asyncapiDoc.channels["user.notifications"]).toBeDefined();

    // Should contain all schemas
    expect(asyncapiDoc.components.schemas.UserEvent).toBeDefined();
    expect(asyncapiDoc.components.schemas.SystemAlert).toBeDefined();
  });

  it("should handle TypeSpec decorators and documentation", async () => {
    const source = `
      @doc("Documentation test namespace")
      namespace DocTest;

      @doc("Well-documented event model")
      model DocumentedEvent {
        @doc("Primary key field")
        id: string;
        
        @doc("Human-readable event name")
        name: string;
        
        @doc("Event creation timestamp in UTC")
        createdAt: utcDateTime;
      }

      @channel("documented.events")
      @doc("Channel for publishing documented events with full metadata")
      op publishDocumentedEvent(): DocumentedEvent;
    `;

    const result = await compileAsyncAPIWithoutErrors(source, {
      "output-file": "doc-test",
      "file-type": "yaml",
    });

    const asyncapiDoc = result.asyncApiDoc;

    // Validate documentation is preserved
    const channel = asyncapiDoc.channels["documented.events"];
    expect(channel).toBeDefined();

    const schema = asyncapiDoc.components.schemas.DocumentedEvent;
    expect(schema).toBeDefined();
  });
});
