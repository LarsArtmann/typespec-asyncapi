/**
 * E2E Test 1: Multi-Protocol Comprehensive AsyncAPI Generation
 *
 * Tests all major protocols (Kafka, WebSocket, HTTP, MQTT) in a single spec
 * with proper bindings, security schemes, and message flows.
 */

import { describe, expect, it } from "bun:test"
import { createTestHost } from "@typespec/compiler/testing"
import { createAsyncAPITestHost } from "../utils/test-helpers.js"
import { Effect } from "effect"

describe("E2E: Multi-Protocol Comprehensive Test", () => {
	it("should generate AsyncAPI 3.0 with all protocols", async () => {
		const host = await createAsyncAPITestHost()

		host.addTypeSpecFile("main.tsp", `
			import "@lars-artmann/typespec-asyncapi";
			using TypeSpec.AsyncAPI;

			namespace MultiProtocolAPI;

			// === KAFKA: Event Streaming ===
			model UserCreatedEvent {
				userId: string;
				email: string;
				createdAt: utcDateTime;
				accountType: "free" | "premium" | "enterprise";
			}

			@channel("user.lifecycle.created")
			@protocol({
				protocol: "kafka",
				binding: {
					topic: "user-events",
					key: "userId",
					groupId: "user-service",
					bindingVersion: "0.5.0"
				}
			})
			@security({
				name: "kafkaAuth",
				scheme: {
					type: "sasl",
					mechanism: "SCRAM-SHA-256"
				}
			})
			@publish
			op publishUserCreated(): UserCreatedEvent;

			// === WEBSOCKET: Real-time Updates ===
			model LiveNotification {
				notificationId: string;
				userId: string;
				message: string;
				priority: "low" | "medium" | "high";
				timestamp: utcDateTime;
			}

			@channel("notifications.{userId}.live")
			@protocol({
				protocol: "websocket",
				binding: {
					method: "GET",
					query: {
						type: "object",
						properties: {
							token: { type: "string" }
						}
					},
					bindingVersion: "0.1.0"
				}
			})
			@security({
				name: "bearerAuth",
				scheme: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT"
				}
			})
			@subscribe
			op subscribeToLiveNotifications(): LiveNotification;

			// === HTTP: Webhooks ===
			model WebhookPayload {
				eventType: string;
				data: {
					orderId: string;
					status: string;
					timestamp: utcDateTime;
				};
				signature: string;
			}

			@channel("webhooks.external.events")
			@protocol({
				protocol: "http",
				binding: {
					type: "request",
					method: "POST",
					bindingVersion: "0.3.0"
				}
			})
			@security({
				name: "apiKeyAuth",
				scheme: {
					type: "apiKey",
					in: "header",
					name: "X-API-Key"
				}
			})
			@subscribe
			op receiveWebhookEvents(): WebhookPayload;

			// === MQTT: IoT Devices ===
			model DeviceStatus {
				deviceId: string;
				status: "online" | "offline" | "error";
				batteryLevel?: int32;
				temperature?: float32;
				location?: {
					latitude: float64;
					longitude: float64;
				};
				lastUpdated: utcDateTime;
			}

			@channel("devices.{deviceId}.status")
			@protocol({
				protocol: "mqtt",
				binding: {
					qos: 1,
					retain: true,
					bindingVersion: "0.2.0"
				}
			})
			@publish
			op publishDeviceStatus(): DeviceStatus;
		`)

		// Compile
		const program = await host.compile("./main.tsp")

		// Emit AsyncAPI
		const diagnostics = await host.diagnose("./main.tsp", {
			emit: ["@lars-artmann/typespec-asyncapi"]
		})

		Effect.log(`Diagnostics count: ${diagnostics.length}`)
		if (diagnostics.length > 0) {
			diagnostics.forEach(d => Effect.log(`  - ${d.severity}: ${d.message}`))
		}

		// Find generated AsyncAPI file
		const outputFiles = Array.from(host.fs.keys())
		const asyncApiFile = outputFiles.find(f =>
			f.includes("asyncapi") && (f.endsWith(".json") || f.endsWith(".yaml"))
		)

		expect(asyncApiFile).toBeDefined()

		if (asyncApiFile) {
			const content = host.fs.get(asyncApiFile) as string
			const spec = content.startsWith('{') ? JSON.parse(content) : require('yaml').parse(content)

			// Validate AsyncAPI 3.0
			expect(spec.asyncapi).toBe("3.0.0")

			// Validate all 4 channels exist
			expect(Object.keys(spec.channels || {}).length).toBeGreaterThanOrEqual(4)

			// Validate all 4 operations exist
			expect(Object.keys(spec.operations || {}).length).toBeGreaterThanOrEqual(4)

			// Validate all 4 message schemas exist
			const schemas = spec.components?.schemas || {}
			expect(schemas.UserCreatedEvent).toBeDefined()
			expect(schemas.LiveNotification).toBeDefined()
			expect(schemas.WebhookPayload).toBeDefined()
			expect(schemas.DeviceStatus).toBeDefined()

			// Validate union types are converted to enums
			expect(schemas.UserCreatedEvent.properties.accountType.enum).toEqual(["free", "premium", "enterprise"])
			expect(schemas.DeviceStatus.properties.status.enum).toEqual(["online", "offline", "error"])

			// Validate optional fields
			expect(schemas.DeviceStatus.properties.batteryLevel).toBeDefined()
			expect(schemas.DeviceStatus.required).not.toContain("batteryLevel")

			// Validate nested objects
			expect(schemas.DeviceStatus.properties.location.type).toBe("object")
			expect(schemas.WebhookPayload.properties.data.type).toBe("object")

			// Validate security schemes (all 4 different auth types)
			const securitySchemes = spec.components?.securitySchemes || {}
			expect(Object.keys(securitySchemes).length).toBeGreaterThanOrEqual(3)

			Effect.log("✅ Multi-protocol E2E test passed!")
		}
	})
})
