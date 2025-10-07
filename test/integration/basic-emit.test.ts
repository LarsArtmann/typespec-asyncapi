import {describe, expect, it} from "bun:test"
import {compileAsyncAPISpecWithoutErrors, parseAsyncAPIOutput} from "../utils/test-helpers"
import {Effect} from "effect"
import {
	DEFAULT_SERIALIZATION_FORMAT,
	SERIALIZATION_FORMAT_OPTION_JSON,
} from "../../src/domain/models/serialization-format-option.js"

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
    `

		const {outputFiles} = await compileAsyncAPISpecWithoutErrors(source, {
			"output-file": "test-asyncapi",
			"file-type": DEFAULT_SERIALIZATION_FORMAT,
		})

	// Find the generated AsyncAPI file - read raw content from Map
	const availableFiles = Array.from(outputFiles.keys())
	const yamlFiles = availableFiles.filter(f => f.toLowerCase().includes('asyncapi') && f.endsWith('.yaml'))
	if (yamlFiles.length === 0) {
		throw new Error(`No AsyncAPI YAML files found. Available: ${availableFiles.join(', ')}`)
	}
	const content = outputFiles.get(yamlFiles[0]) as string

		// Validate AsyncAPI structure
		expect(content).toContain("asyncapi: 3.0.0")
		expect(content).toContain("publishUserSignup")
		expect(content).toContain("receiveUserMessage")
		expect(content).toContain("UserSignupEvent")

		Effect.log("✅ Generated AsyncAPI content validated")
	})

	it("should validate TypeSpec models and generate schemas", async () => {
		const source = `
      namespace EventTests;

      @doc("Complex event model with nested properties")
      model ComplexEvent {
        @doc("Event identifier")
        id: string;
        
        @doc("Event timestamp")
        timestamp: utcDateTime;
        
        @doc("Event metadata")
        metadata: {
          source: string;
          version: int32;
          tags: string[];
        };
        
        @doc("Optional description")
        description?: string;
        
        @doc("Event status")
        status: "pending" | "processed" | "failed";
      }

      @channel("complex.events")
      op publishComplexEvent(): ComplexEvent;
    `

		const {outputFiles} = await compileAsyncAPISpecWithoutErrors(source, {
			"output-file": "complex-test",
			"file-type": SERIALIZATION_FORMAT_OPTION_JSON,
		})

		const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "complex-test.json")

		// Validate AsyncAPI 3.0 structure
		expect(asyncapiDoc.asyncapi).toBe("3.0.0")
		expect(asyncapiDoc.info).toBeDefined()
		expect(asyncapiDoc.channels).toBeDefined()
		expect(asyncapiDoc.operations).toBeDefined()
		expect(asyncapiDoc.components.schemas).toBeDefined()

		// Validate generated schema for ComplexEvent
		const complexEventSchema = asyncapiDoc.components.schemas.ComplexEvent
		expect(complexEventSchema).toBeDefined()
		expect(complexEventSchema.type).toBe("object")
		expect(complexEventSchema.properties).toBeDefined()
		expect(complexEventSchema.properties.id).toEqual({type: "string", description: "Event identifier"})

		// Validate required fields
		expect(complexEventSchema.required).toContain("id")
		expect(complexEventSchema.required).toContain("timestamp")
		expect(complexEventSchema.required).toContain("status")
		expect(complexEventSchema.required).not.toContain("description") // optional field

		Effect.log("✅ Complex schema validation passed")
	})

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
    `

		const {outputFiles} = await compileAsyncAPISpecWithoutErrors(source, {
			"output-file": "multi-op-test",
			"file-type": DEFAULT_SERIALIZATION_FORMAT,
		})

		// Read raw YAML content from outputFiles Map
	const availableFiles = Array.from(outputFiles.keys())
	const yamlFiles = availableFiles.filter(f => f.toLowerCase().includes('asyncapi') && f.endsWith('.yaml'))
	if (yamlFiles.length === 0) {
		throw new Error(`No AsyncAPI YAML files found. Available: ${availableFiles.join(', ')}`)
	}
	const rawContent = outputFiles.get(yamlFiles[0])
	const content = typeof rawContent === 'string' ? rawContent : (rawContent as any).content

		// Should contain all operations
		expect(content).toContain("publishUserEvent")
		expect(content).toContain("publishSystemAlert")
		expect(content).toContain("subscribeUserNotifications")

		// Should contain all channels
		expect(content).toContain("user.events")
		expect(content).toContain("system.alerts")
		expect(content).toContain("user.notifications")

		// Should contain all schemas
		expect(content).toContain("UserEvent")
		expect(content).toContain("SystemAlert")

		Effect.log("✅ Multi-operation test passed")
	})

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
    `

		const {outputFiles} = await compileAsyncAPISpecWithoutErrors(source, {
			"output-file": "doc-test",
			"file-type": SERIALIZATION_FORMAT_OPTION_JSON,
		})

		const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "doc-test.json")

		// Validate documentation is preserved
		const channel = asyncapiDoc.channels.documented.events
		expect(channel.description).toContain("Channel for publishing documented events")

		const schema = asyncapiDoc.components.schemas.DocumentedEvent
		expect(schema.description).toBe("Well-documented event model")
		expect(schema.properties.id.description).toBe("Primary key field")
		expect(schema.properties.name.description).toBe("Human-readable event name")
		expect(schema.properties.createdAt.description).toBe("Event creation timestamp in UTC")

		Effect.log("✅ Documentation preservation test passed")
	})
})
