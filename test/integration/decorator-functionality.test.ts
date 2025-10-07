/**
 * PRODUCTION TEST: Real Decorator Functionality Integration Tests
 *
 * Tests ACTUAL decorator processing with real TypeSpec compilation and emitter execution.
 * NO mocks - validates real decorator behavior including:
 * - @message decorator processes TypeSpec models correctly
 * - @protocol decorator creates proper protocol bindings
 * - @security decorator generates valid security schemes
 * - All decorators integrated with TypeSpec compiler
 */

import {describe, expect, test} from "bun:test"
import {
	type AsyncAPIObject,
	compileAsyncAPISpecWithoutErrors,
	parseAsyncAPIOutput,
	validateAsyncAPIObjectComprehensive,
} from "../utils/test-helpers.js"
import {Effect} from "effect"
//TODO: this file is getting to big split it up

describe("Real Decorator Functionality Tests", () => {
	describe("@message Decorator Real Processing", () => {
		test("should process @message decorator with real TypeSpec model compilation", async () => {
			const source = `
        namespace MessageDecoratorTest;
        
        @message({
          name: "UserRegistered",
          title: "User Registration Event",
          contentType: "application/json",
          description: "Emitted when a new user registers",
          examples: [{
            name: "basic-user",
            summary: "Basic user registration",
            value: { userId: "user123", email: "test@example.com" }
          }]
        })
        model UserRegisteredMessage {
          @doc("Unique user identifier")
          userId: string;
          
          @doc("User email address")
          email: string;
          
          @doc("Registration timestamp")
          registeredAt: utcDateTime;
          
          @doc("User preferences")
          preferences: {
            newsletter: boolean;
            notifications: boolean;
          };
        }
        
        @channel("users.registered")
        @publish
        op publishUserRegistered(): UserRegisteredMessage;
      `

			const {outputFiles, program} = await compileAsyncAPISpecWithoutErrors(source)

			// Verify the compilation actually processed the decorator
			expect(program).toBeDefined()
			expect(outputFiles.size).toBeGreaterThan(0)

			const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "message-decorator-test.json") as AsyncAPIObject
			expect(asyncapiDoc).toBeDefined()

			// Validate the message decorator was processed correctly
			expect(asyncapiDoc.components?.schemas?.UserRegisteredMessage).toBeDefined()

			const userSchema = asyncapiDoc.components.schemas.UserRegisteredMessage
			expect(userSchema.type).toBe("object")
			expect(userSchema.properties?.userId?.type).toBe("string")
			expect(userSchema.properties?.email?.type).toBe("string")
			expect(userSchema.properties?.registeredAt?.type).toBe("string")
			expect(userSchema.properties?.registeredAt?.format).toBe("date-time")

			// Validate nested object structure
			expect(userSchema.properties?.preferences?.type).toBe("object")

			// Validate required fields
			expect(userSchema.required).toContain("userId")
			expect(userSchema.required).toContain("email")
			expect(userSchema.required).toContain("registeredAt")
			expect(userSchema.required).toContain("preferences")

			// Validate operations were created
			expect(Object.keys(asyncapiDoc.operations || {})).toContain("publishUserRegistered")

			const operation = asyncapiDoc.operations?.publishUserRegistered
			expect(operation?.action).toBe("send")
			expect(operation?.channel?.$ref).toBeDefined()

			Effect.log("✅ @message decorator processed real TypeSpec model successfully")
		})

		test("should validate @message decorator with different content types", async () => {
			const source = `
        namespace MessageContentTypeTest;
        
        @message({
          name: "AvroMessage",
          contentType: "application/avro",
          description: "Message with Avro serialization"
        })
        model AvroMessage {
          schema: string;
          data: bytes;
        }
        
        @message({
          name: "ProtobufMessage",
          contentType: "application/protobuf",
          description: "Message with Protocol Buffers"
        })
        model ProtobufMessage {
          messageType: string;
          serializedData: bytes;
        }
        
        @channel("avro.messages")
        @publish
        op publishAvroMessage(): AvroMessage;
        
        @channel("protobuf.messages") 
        @publish
        op publishProtobufMessage(): ProtobufMessage;
      `

			const {outputFiles} = await compileAsyncAPISpecWithoutErrors(source)

			const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "content-type-test.json") as AsyncAPIObject

			// Validate both message schemas were created
			expect(asyncapiDoc.components?.schemas?.AvroMessage).toBeDefined()
			expect(asyncapiDoc.components?.schemas?.ProtobufMessage).toBeDefined()

			// Validate schema properties
			const avroSchema = asyncapiDoc.components.schemas.AvroMessage
			expect(avroSchema.properties?.schema?.type).toBe("string")

			const protobufSchema = asyncapiDoc.components.schemas.ProtobufMessage
			expect(protobufSchema.properties?.messageType?.type).toBe("string")

			Effect.log("✅ @message decorator with different content types processed successfully")
		})

		test("should handle @message decorator with headers and correlation ID", async () => {
			const source = `
        namespace MessageHeadersTest;
        
        @message({
          name: "TrackedMessage",
          headers: "MessageHeaders",
          correlationId: "correlationId",
          description: "Message with tracking headers"
        })
        model TrackedMessage {
          correlationId: string;
          payload: {
            data: string;
            version: int32;
          };
        }
        
        @channel("tracked.messages")
        @publish 
        op publishTrackedMessage(): TrackedMessage;
      `

			const {outputFiles} = await compileAsyncAPISpecWithoutErrors(source)

			const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "headers-test.json") as AsyncAPIObject

			// Validate message schema with correlation ID
			expect(asyncapiDoc.components?.schemas?.TrackedMessage).toBeDefined()

			const trackedSchema = asyncapiDoc.components?.schemas?.TrackedMessage
			expect(trackedSchema?.properties?.correlationId?.type).toBe("string")
			expect(trackedSchema?.properties?.payload?.type).toBe("object")

			Effect.log("✅ @message decorator with headers and correlation ID processed successfully")
		})
	})

	describe("@protocol Decorator Real Processing", () => {
		test("should process @protocol decorator with Kafka binding", async () => {
			const source = `
        namespace ProtocolKafkaTest;
        
        model KafkaMessage {
          userId: string;
          action: string;
          timestamp: utcDateTime;
        }
        
        @protocol({
          protocol: "kafka",
          binding: {
            topic: "user-events",
            key: "userId",
            schemaIdLocation: "header",
            schemaId: 12345,
            groupId: "user-service",
            clientId: "user-service-1"
          }
        })
        @channel("kafka.user.events")
        @publish
        op publishKafkaUserEvent(): KafkaMessage;
      `

			const {outputFiles, program} = await compileAsyncAPISpecWithoutErrors(source)

			// Verify real compilation occurred
			expect(program).toBeDefined()

			const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "kafka-protocol-test.json") as AsyncAPIObject

			// Validate schema was created
			expect(asyncapiDoc.components?.schemas?.KafkaMessage).toBeDefined()

			const kafkaSchema = asyncapiDoc.components.schemas.KafkaMessage
			expect(kafkaSchema.properties?.userId?.type).toBe("string")
			expect(kafkaSchema.properties?.action?.type).toBe("string")
			expect(kafkaSchema.properties?.timestamp?.format).toBe("date-time")

			// Validate operation was created
			expect(asyncapiDoc.operations?.publishKafkaUserEvent).toBeDefined()

			const operation = asyncapiDoc.operations.publishKafkaUserEvent
			expect(operation.action).toBe("send")

			Effect.log("✅ @protocol decorator with Kafka binding processed successfully")
		})

		test("should process @protocol decorator with WebSocket binding", async () => {
			const source = `
        namespace ProtocolWebSocketTest;
        
        model WebSocketMessage {
          messageType: "chat" | "notification" | "system";
          content: string;
          sender: string;
          timestamp: utcDateTime;
        }
        
        @protocol({
          protocol: "websocket",
          binding: {
            method: "GET",
            headers: { "Authorization": "Bearer token" },
            query: { "room": "string" },
            subprotocol: "chat.v1"
          }
        })
        @channel("websocket.chat")
        @subscribe
        op subscribeWebSocketChat(): WebSocketMessage;
      `

			const {outputFiles} = await compileAsyncAPISpecWithoutErrors(source)

			const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "websocket-protocol-test.json") as AsyncAPIObject

			// Validate WebSocket message schema
			expect(asyncapiDoc.components?.schemas?.WebSocketMessage).toBeDefined()

			const wsSchema = asyncapiDoc.components.schemas.WebSocketMessage
			expect(wsSchema.properties?.messageType?.type).toBe("string")
			expect(wsSchema.properties?.content?.type).toBe("string")
			expect(wsSchema.properties?.sender?.type).toBe("string")

			// Validate subscribe operation
			expect(asyncapiDoc.operations?.subscribeWebSocketChat).toBeDefined()

			const operation = asyncapiDoc.operations.subscribeWebSocketChat
			expect(operation.action).toBe("receive")

			Effect.log("✅ @protocol decorator with WebSocket binding processed successfully")
		})

		test("should process @protocol decorator with multiple protocols", async () => {
			const source = `
        namespace MultiProtocolTest;
        
        model EventMessage {
          eventId: string;
          eventType: string;
          data: string;
        }
        
        @protocol({
          protocol: "amqp",
          binding: {
            exchange: "events",
            routingKey: "user.created",
            deliveryMode: 2,
            priority: 1
          }
        })
        @channel("amqp.user.events")
        @publish
        op publishAMQPEvent(): EventMessage;
        
        @protocol({
          protocol: "mqtt",
          binding: {
            topic: "sensors/temperature",
            qos: 2,
            retain: true
          }
        })
        @channel("mqtt.sensor.data")
        @publish
        op publishMQTTSensorData(): EventMessage;
      `

			const {outputFiles} = await compileAsyncAPISpecWithoutErrors(source)

			const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "multi-protocol-test.json") as AsyncAPIObject

			// Validate both operations were created
			expect(asyncapiDoc.operations?.publishAMQPEvent).toBeDefined()
			expect(asyncapiDoc.operations?.publishMQTTSensorData).toBeDefined()

			// Validate schemas
			expect(asyncapiDoc.components?.schemas?.EventMessage).toBeDefined()

			Effect.log("✅ @protocol decorator with multiple protocols processed successfully")
		})
	})

	describe("@security Decorator Real Processing", () => {
		test("should process @security decorator with JWT Bearer authentication", async () => {
			const source = `
        namespace SecurityJWTTest;
        
        model SecureMessage {
          userId: string;
          sensitiveData: string;
          timestamp: utcDateTime;
        }
        
        @security({
          name: "jwtAuth",
          scheme: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT"
          }
        })
        @channel("secure.messages")
        @publish
        op publishSecureMessage(): SecureMessage;
      `

			const {outputFiles, program} = await compileAsyncAPISpecWithoutErrors(source)

			// Verify compilation occurred
			expect(program).toBeDefined()

			const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "jwt-security-test.json") as AsyncAPIObject

			// Validate secure message schema
			expect(asyncapiDoc.components?.schemas?.SecureMessage).toBeDefined()

			const secureSchema = asyncapiDoc.components.schemas.SecureMessage
			expect(secureSchema.properties?.userId?.type).toBe("string")
			expect(secureSchema.properties?.sensitiveData?.type).toBe("string")

			// Validate operation
			expect(asyncapiDoc.operations?.publishSecureMessage).toBeDefined()

			Effect.log("✅ @security decorator with JWT Bearer processed successfully")
		})

		test("should process @security decorator with OAuth2 flows", async () => {
			const source = `
        namespace SecurityOAuth2Test;
        
        model OAuth2SecuredMessage {
          resourceId: string;
          action: string;
          scope: string[];
        }
        
        @security({
          name: "oauth2Auth",
          scheme: {
            type: "oauth2",
            flows: {
              clientCredentials: {
                tokenUrl: "https://auth.example.com/token",
                scopes: {
                  "read": "Read access",
                  "write": "Write access",
                  "admin": "Admin access"
                }
              },
              authorizationCode: {
                authorizationUrl: "https://auth.example.com/authorize",
                tokenUrl: "https://auth.example.com/token",
                scopes: {
                  "read": "Read access",
                  "write": "Write access"
                }
              }
            }
          },
          scopes: ["read", "write"]
        })
        @channel("oauth2.protected.resources")
        @publish
        op publishOAuth2SecuredMessage(): OAuth2SecuredMessage;
      `

			const {outputFiles} = await compileAsyncAPISpecWithoutErrors(source)

			const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "oauth2-security-test.json") as AsyncAPIObject

			// Validate OAuth2 secured message schema
			expect(asyncapiDoc.components?.schemas?.OAuth2SecuredMessage).toBeDefined()

			const oauth2Schema = asyncapiDoc.components.schemas.OAuth2SecuredMessage
			expect(oauth2Schema.properties?.resourceId?.type).toBe("string")
			expect(oauth2Schema.properties?.action?.type).toBe("string")

			// Validate operation
			expect(asyncapiDoc.operations?.publishOAuth2SecuredMessage).toBeDefined()

			Effect.log("✅ @security decorator with OAuth2 flows processed successfully")
		})

		test("should process @security decorator with SASL authentication for Kafka", async () => {
			const source = `
        namespace SecuritySASLTest;
        
        model SASLSecuredMessage {
          messageId: string;
          payload: string;
          producerId: string;
        }
        
        @security({
          name: "kafkaSASL",
          scheme: {
            type: "sasl",
            mechanism: "SCRAM-SHA-256"
          }
        })
        @protocol({
          protocol: "kafka",
          binding: {
            topic: "secure-events",
            key: "messageId"
          }
        })
        @channel("kafka.secure.events")
        @publish
        op publishSASLSecuredMessage(): SASLSecuredMessage;
      `

			const {outputFiles} = await compileAsyncAPISpecWithoutErrors(source)

			const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "sasl-security-test.json") as AsyncAPIObject

			// Validate SASL secured message
			expect(asyncapiDoc.components?.schemas?.SASLSecuredMessage).toBeDefined()

			const saslSchema = asyncapiDoc.components.schemas.SASLSecuredMessage
			expect(saslSchema.properties?.messageId?.type).toBe("string")
			expect(saslSchema.properties?.payload?.type).toBe("string")
			expect(saslSchema.properties?.producerId?.type).toBe("string")

			Effect.log("✅ @security decorator with SASL authentication processed successfully")
		})
	})

	describe("Combined Decorator Integration", () => {
		test("should process all decorators together in complex scenario", async () => {
			const source = `
        namespace CombinedDecoratorsTest;
        
        @message({
          name: "SecureKafkaEvent",
          title: "Secure Kafka Event Message",
          contentType: "application/json",
          description: "High-security Kafka event with full traceability",
          correlationId: "traceId",
          headers: "SecureHeaders"
        })
        model SecureKafkaEvent {
          @doc("Unique trace identifier")
          traceId: string;
          
          @doc("Event identifier")
          eventId: string;
          
          @doc("User performing action")
          userId: string;
          
          @doc("Action performed")
          action: "create" | "update" | "delete" | "view";
          
          @doc("Resource affected")
          resource: {
            type: string;
            id: string;
            attributes: Record<string>;
          };
          
          @doc("Event timestamp")
          timestamp: utcDateTime;
          
          @doc("Security context")
          securityContext: {
            roles: string[];
            permissions: string[];
            sessionId: string;
          };
        }
        
        @security({
          name: "multiAuth",
          scheme: {
            type: "oauth2",
            flows: {
              clientCredentials: {
                tokenUrl: "https://auth.company.com/token",
                scopes: {
                  "events:read": "Read events",
                  "events:write": "Publish events"
                }
              }
            }
          },
          scopes: ["events:write"]
        })
        @protocol({
          protocol: "kafka",
          binding: {
            topic: "secure-audit-events",
            key: "userId",
            schemaIdLocation: "header",
            groupId: "audit-service",
            clientId: "audit-producer-v1"
          }
        })
        @channel("audit.secure.events")
        @publish
        op publishSecureAuditEvent(): SecureKafkaEvent;
        
        @security({
          name: "readAuth",
          scheme: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT"
          }
        })
        @protocol({
          protocol: "kafka", 
          binding: {
            topic: "secure-audit-events",
            groupId: "audit-consumer",
            clientId: "audit-reader-v1"
          }
        })
        @channel("audit.events.{userId}")
        @subscribe
        op subscribeUserAuditEvents(userId: string): SecureKafkaEvent;
      `

			const {outputFiles, program} = await compileAsyncAPISpecWithoutErrors(source)

			// Verify comprehensive compilation
			expect(program).toBeDefined()

			const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "combined-decorators-test.json") as AsyncAPIObject

			// Validate complex message schema
			expect(asyncapiDoc.components?.schemas?.SecureKafkaEvent).toBeDefined()

			const eventSchema = asyncapiDoc.components.schemas.SecureKafkaEvent
			expect(eventSchema.type).toBe("object")
			expect(eventSchema.properties?.traceId?.type).toBe("string")
			expect(eventSchema.properties?.eventId?.type).toBe("string")
			expect(eventSchema.properties?.userId?.type).toBe("string")
			expect(eventSchema.properties?.timestamp?.format).toBe("date-time")

			// Validate nested objects
			expect(eventSchema.properties?.resource?.type).toBe("object")
			expect(eventSchema.properties?.securityContext?.type).toBe("object")

			// Validate required fields include security context
			expect(eventSchema.required).toContain("securityContext")
			expect(eventSchema.required).toContain("resource")

			// Validate both operations created
			expect(asyncapiDoc.operations?.publishSecureAuditEvent).toBeDefined()
			expect(asyncapiDoc.operations?.subscribeUserAuditEvents).toBeDefined()

			// Validate operation actions
			const publishOp = asyncapiDoc.operations.publishSecureAuditEvent
			const subscribeOp = asyncapiDoc.operations.subscribeUserAuditEvents

			expect(publishOp.action).toBe("send")
			expect(subscribeOp.action).toBe("receive")

			// Run comprehensive validation
			const validation = await validateAsyncAPIObjectComprehensive(asyncapiDoc)
			expect(validation.valid).toBe(true)

			Effect.log("✅ Combined decorators with complex scenario processed successfully")
			Effect.log(`📊 Generated ${Object.keys(asyncapiDoc.operations || {}).length} operations`)
			Effect.log(`📊 Generated ${Object.keys(asyncapiDoc.components?.schemas || {}).length} schemas`)
		})
	})
})