/**
 * @subscribe Decorator Integration Tests
 * 
 * Tests the @subscribe decorator functionality with real TypeSpec compilation and emitter execution.
 * Validates that @subscribe operations create proper 'receive' actions in AsyncAPI output.
 */

import {describe, expect, test} from "bun:test"
import {
	type AsyncAPIObject,
	compileAsyncAPISpecWithoutErrors,
	parseAsyncAPIOutput,
	validateAsyncAPIObjectComprehensive,
} from "../utils/test-helpers.js"

describe("@subscribe Decorator Tests", () => {
	test("should compile @subscribe decorator successfully", async () => {
		const testSource = `
			import "@larsartmann/typespec-asyncapi";
			using TypeSpec.AsyncAPI;
			
			namespace TestApi;
			
			model UserEvent {
				userId: string;
				email: string;
			}

			@channel("user.events")  
			@subscribe
			op handleUserSignup(): UserEvent;
		`

		const {outputFiles, program, diagnostics} = await compileAsyncAPISpecWithoutErrors(testSource, {
			"output-file": "test-subscribe",
			"file-type": "json",
		})

		// Verify compilation succeeded
		expect(program).toBeDefined()
		expect(outputFiles.size).toBeGreaterThan(0)
		
		// Validate no errors occurred
		const errors = diagnostics.filter(d => d.severity === "error")
		expect(errors).toHaveLength(0)

		// Parse AsyncAPI output
		const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "test-subscribe.json") as AsyncAPIObject
		expect(asyncapiDoc).toBeDefined()

		// Validate AsyncAPI structure
		expect(asyncapiDoc.asyncapi).toBe("3.0.0")
		expect(asyncapiDoc.info).toBeDefined()
		expect(asyncapiDoc.channels).toBeDefined()
		expect(asyncapiDoc.operations).toBeDefined()

		// Validate UserEvent schema was created
		expect(asyncapiDoc.components?.schemas?.UserEvent).toBeDefined()
		const userEventSchema = asyncapiDoc.components.schemas.UserEvent
		expect(userEventSchema.type).toBe("object")
		expect(userEventSchema.properties?.userId?.type).toBe("string")
		expect(userEventSchema.properties?.email?.type).toBe("string")
		expect(userEventSchema.required).toContain("userId")
		expect(userEventSchema.required).toContain("email")

		// Validate channel was created
		expect(asyncapiDoc.channels["user.events"]).toBeDefined()

		// Validate @subscribe operation was created with correct action
		expect(asyncapiDoc.operations?.handleUserSignup).toBeDefined()
		const operation = asyncapiDoc.operations.handleUserSignup
		expect(operation.action).toBe("receive") // @subscribe should create 'receive' action
		expect(operation.channel?.$ref).toBe("#/channels/user.events")

		// Run comprehensive AsyncAPI validation
		const validation = await validateAsyncAPIObjectComprehensive(asyncapiDoc)
		expect(validation.valid).toBe(true)
	})

	test("should handle multiple @subscribe operations", async () => {
		const testSource = `
			namespace MultiSubscribeTest;
			
			model UserEvent {
				userId: string;
				action: string;
			}
			
			model SystemEvent {
				component: string;
				level: "info" | "warning" | "error";
			}

			@channel("user.events")
			@subscribe
			op handleUserEvent(): UserEvent;
			
			@channel("system.events") 
			@subscribe
			op handleSystemEvent(): SystemEvent;
		`

		const {outputFiles} = await compileAsyncAPISpecWithoutErrors(testSource, {
			"output-file": "multi-subscribe-test",
			"file-type": "json",
		})

		const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "multi-subscribe-test.json") as AsyncAPIObject

		// Validate both schemas were created
		expect(asyncapiDoc.components?.schemas?.UserEvent).toBeDefined()
		expect(asyncapiDoc.components?.schemas?.SystemEvent).toBeDefined()

		// Validate both channels were created
		expect(asyncapiDoc.channels["user.events"]).toBeDefined()
		expect(asyncapiDoc.channels["system.events"]).toBeDefined()

		// Validate both subscribe operations were created
		expect(asyncapiDoc.operations?.handleUserEvent).toBeDefined()
		expect(asyncapiDoc.operations?.handleSystemEvent).toBeDefined()

		// Validate both operations have 'receive' action
		expect(asyncapiDoc.operations.handleUserEvent.action).toBe("receive")
		expect(asyncapiDoc.operations.handleSystemEvent.action).toBe("receive")
	})

	test("should handle @subscribe with complex message types", async () => {
		const testSource = `
			namespace ComplexSubscribeTest;
			
			model ComplexUserEvent {
				@doc("Primary user identifier")
				userId: string;
				
				@doc("User email address")
				email: string;
				
				@doc("Event timestamp")
				timestamp: utcDateTime;
				
				@doc("User metadata")
				metadata: {
					source: string;
					version: int32;
					tags: string[];
				};
				
				@doc("Event status")
				status: "pending" | "processed" | "failed";
			}

			@channel("complex.user.events")
			@subscribe
			op handleComplexUserEvent(): ComplexUserEvent;
		`

		const {outputFiles} = await compileAsyncAPISpecWithoutErrors(testSource, {
			"output-file": "complex-subscribe-test",
			"file-type": "json",
		})

		const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "complex-subscribe-test.json") as AsyncAPIObject

		// Validate complex schema structure
		expect(asyncapiDoc.components?.schemas?.ComplexUserEvent).toBeDefined()
		const complexSchema = asyncapiDoc.components.schemas.ComplexUserEvent

		expect(complexSchema.properties?.userId?.type).toBe("string")
		expect(complexSchema.properties?.email?.type).toBe("string") 
		expect(complexSchema.properties?.timestamp?.format).toBe("date-time")
		expect(complexSchema.properties?.metadata?.type).toBe("object")
		expect(complexSchema.properties?.status?.type).toBe("string")

		// Validate nested metadata object
		const metadataProps = complexSchema.properties?.metadata?.properties
		expect(metadataProps?.source?.type).toBe("string")
		expect(metadataProps?.version?.type).toBe("integer")
		expect(metadataProps?.tags?.type).toBe("array")

		// Validate subscribe operation
		expect(asyncapiDoc.operations?.handleComplexUserEvent).toBeDefined()
		expect(asyncapiDoc.operations.handleComplexUserEvent.action).toBe("receive")

		// Run comprehensive validation
		const validation = await validateAsyncAPIObjectComprehensive(asyncapiDoc)
		expect(validation.valid).toBe(true)
	})

	test("should handle @subscribe with parameterized channels", async () => {
		const testSource = `
			namespace ParameterizedSubscribeTest;
			
			model UserNotification {
				notificationId: string;
				userId: string;
				message: string;
				priority: "low" | "medium" | "high";
			}

			@channel("user.notifications.{userId}")
			@subscribe  
			op subscribeUserNotifications(userId: string): UserNotification;
		`

		const {outputFiles} = await compileAsyncAPISpecWithoutErrors(testSource, {
			"output-file": "parameterized-subscribe-test",
			"file-type": "json",
		})

		const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "parameterized-subscribe-test.json") as AsyncAPIObject

		// Validate schema
		expect(asyncapiDoc.components?.schemas?.UserNotification).toBeDefined()
		const notificationSchema = asyncapiDoc.components.schemas.UserNotification
		expect(notificationSchema.properties?.userId?.type).toBe("string")
		expect(notificationSchema.properties?.message?.type).toBe("string")
		expect(notificationSchema.properties?.priority?.type).toBe("string")

		// Validate parameterized channel
		expect(asyncapiDoc.channels["user.notifications.{userId}"]).toBeDefined()

		// Validate subscribe operation with parameters
		expect(asyncapiDoc.operations?.subscribeUserNotifications).toBeDefined()
		const operation = asyncapiDoc.operations.subscribeUserNotifications
		expect(operation.action).toBe("receive")
		expect(operation.channel?.$ref).toBe("#/channels/user.notifications.{userId}")
	})
})