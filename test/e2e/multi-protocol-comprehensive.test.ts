/**
 * E2E Test 1: Multi-Protocol Comprehensive AsyncAPI Generation
 *
 * Tests all major protocols (Kafka, WebSocket, HTTP, MQTT) in a single spec
 * with proper bindings, security schemes, and message flows.
 */

import { createAsyncAPITestHost } from "../utils/test-helpers.js";
import YAML from "yaml";
import { LATEST_BINDING_VERSIONS } from "../../src/constants/binding-versions.js";

describe("e2E: Multi-Protocol Comprehensive Test", () => {
  it("should generate AsyncAPI 3.1 with all protocols", async () => {
    const host = await createAsyncAPITestHost();

    host.addTypeSpecFile(
      "main.tsp",
      `
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
			@protocol(#{
				protocol: "kafka",
				binding: #{
					topic: "user-events",
					key: "userId",
					groupId: "user-service",
					bindingVersion: "${LATEST_BINDING_VERSIONS.kafka}"				}
			})
			@security(#{
				name: "kafkaAuth",
				scheme: #{
					type: "scramSha256",
					username: "user",
					password: "pass"
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
			@protocol(#{
				protocol: "websocket",
				binding: #{
					method: "GET",
					query: #{
						type: "object",
						properties: #{
							token: #{ type: "string" }
						}
					},
					bindingVersion: "${LATEST_BINDING_VERSIONS.ws}"				}
			})
			@security(#{
				name: "bearerAuth",
				scheme: #{
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
			@protocol(#{
				protocol: "http",
				binding: #{
					type: "request",
					method: "POST",
					bindingVersion: "${LATEST_BINDING_VERSIONS.http}"				}
			})
			@security(#{
				name: "apiKeyAuth",
				scheme: #{
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
			@protocol(#{
				protocol: "mqtt",
				binding: #{
					qos: 1,
					retain: true,
					bindingVersion: "${LATEST_BINDING_VERSIONS.mqtt}"				}
			})
			@publish
			op publishDeviceStatus(): DeviceStatus;
		`,
    );

    // Compile
    await host.compile("./main.tsp");

    // Emit AsyncAPI
    const diagnostics = await host.diagnose("./main.tsp");

    expect(diagnostics).toHaveLength(0);

    // Find generated AsyncAPI file
    const outputFiles = [...host.fs.keys()];
    const asyncApiFile = outputFiles.find(
      (f) =>
        f.includes("asyncapi") && (f.endsWith(".json") || f.endsWith(".yaml")),
    );

    expect(asyncApiFile).toBeDefined();

    const content = host.fs.get(asyncApiFile!) as string;
    const spec = content.startsWith("{")
      ? JSON.parse(content)
      : YAML.parse(content);

    // Validate AsyncAPI 3.1
    expect(spec.asyncapi).toBe("3.1.0");

    // Validate all 4 channels exist
    expect(Object.keys(spec.channels || {}).length).toBeGreaterThanOrEqual(4);

    // Validate all 4 operations exist
    expect(Object.keys(spec.operations || {}).length).toBeGreaterThanOrEqual(4);

    // Validate all 4 message schemas exist
    const schemas = spec.components?.schemas || {};
    expect(schemas.UserCreatedEvent).toBeDefined();
    expect(schemas.LiveNotification).toBeDefined();
    expect(schemas.WebhookPayload).toBeDefined();
    expect(schemas.DeviceStatus).toBeDefined();

    // Validate union types are converted to enums
    expect(schemas.UserCreatedEvent.properties.accountType.enum).toStrictEqual([
      "free",
      "premium",
      "enterprise",
    ]);
    expect(schemas.DeviceStatus.properties.status.enum).toStrictEqual([
      "online",
      "offline",
      "error",
    ]);

    // Validate optional fields
    expect(schemas.DeviceStatus.properties.batteryLevel).toBeDefined();
    expect(schemas.DeviceStatus.required).not.toContain("batteryLevel");

    // Validate nested objects
    expect(schemas.DeviceStatus.properties.location.type).toBe("object");
    expect(schemas.WebhookPayload.properties.data.type).toBe("object");

    // Validate security schemes (all 4 different auth types)
    const securitySchemes = spec.components?.securitySchemes || {};
    expect(Object.keys(securitySchemes).length).toBeGreaterThanOrEqual(3);

    // Validate protocol bindings are emitted
    const channels = spec.channels || {};
    expect(channels["user.lifecycle.created"]?.bindings?.kafka).toBeDefined();
    expect(channels["user.lifecycle.created"].bindings.kafka.topic).toBe(
      "user-events",
    );
    expect(channels["user.lifecycle.created"].bindings.kafka.groupId).toBe(
      "user-service",
    );

    expect(channels["notifications.{userId}.live"]?.bindings?.ws).toBeDefined();
    expect(channels["notifications.{userId}.live"].bindings.ws.method).toBe(
      "GET",
    );

    // HTTP and MQTT only define operation-level bindings in this spec.
    const operations = spec.operations || {};
    expect(operations.receiveWebhookEvents?.bindings?.http).toBeDefined();
    expect(operations.receiveWebhookEvents.bindings.http.type).toBe("request");
    expect(operations.receiveWebhookEvents.bindings.http.method).toBe("POST");

    expect(operations.publishDeviceStatus?.bindings?.mqtt).toBeDefined();
    expect(operations.publishDeviceStatus.bindings.mqtt.qos).toBe(1);
    expect(operations.publishDeviceStatus.bindings.mqtt.retain).toBe(true);
  });
});
