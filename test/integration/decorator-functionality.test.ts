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

import {
  compileAsyncAPISpecWithoutErrors,
  parseAsyncAPIOutput,
} from "../utils/test-helpers.js";
import { validateAsyncAPIDocument } from "../utils/schema-validator.js";
import { LATEST_BINDING_VERSIONS } from "../../src/constants/binding-versions.js";
import { inlineObject } from "../utils/type-guards.js";

describe("real Decorator Functionality Tests", () => {
  describe("@message Decorator Real Processing", () => {
    it("should process @message decorator with real TypeSpec model compilation", async () => {
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
      `;

      const { outputFiles, program } =
        await compileAsyncAPISpecWithoutErrors(source);

      // Verify the compilation actually processed the decorator
      expect(program).toBeDefined();
      expect(outputFiles.size).toBeGreaterThan(0);

      const asyncapiDoc = await parseAsyncAPIOutput(
        outputFiles,
        "message-decorator-test.json",
      );
      expect(asyncapiDoc).toBeDefined();

      // Validate the message decorator was processed correctly
      expect(
        asyncapiDoc.components?.schemas?.UserRegisteredMessage,
      ).toBeDefined();

      const userSchema = asyncapiDoc.components.schemas.UserRegisteredMessage;
      expect(userSchema.type).toBe("object");
      expect(userSchema.properties?.userId?.type).toBe("string");
      expect(userSchema.properties?.email?.type).toBe("string");
      expect(userSchema.properties?.registeredAt?.type).toBe("string");
      expect(userSchema.properties?.registeredAt?.format).toBe("date-time");

      // Validate nested object structure
      expect(userSchema.properties?.preferences?.type).toBe("object");

      // Validate required fields
      expect(userSchema.required).toContain("userId");
      expect(userSchema.required).toContain("email");
      expect(userSchema.required).toContain("registeredAt");
      expect(userSchema.required).toContain("preferences");

      // Validate operations were created
      expect(Object.keys(asyncapiDoc.operations || {})).toContain(
        "publishUserRegistered",
      );

      const operation = asyncapiDoc.operations?.publishUserRegistered;
      expect(operation?.action).toBe("send");
      expect(operation?.channel?.$ref).toBeDefined();

      // @message config values propagate to the emitted message object
      const message = inlineObject(
        asyncapiDoc.components!.messages!.UserRegisteredMessage,
        "message",
      );
      expect(message.title).toBe("User Registration Event");
      expect(message.contentType).toBe("application/json");
      expect(message.summary).toBe("Emitted when a new user registers");
    });

    it("should validate @message decorator with different content types", async () => {
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
      `;

      const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source);

      const asyncapiDoc = await parseAsyncAPIOutput(
        outputFiles,
        "content-type-test.json",
      );

      // Validate both message schemas were created
      expect(asyncapiDoc.components?.schemas?.AvroMessage).toBeDefined();
      expect(asyncapiDoc.components?.schemas?.ProtobufMessage).toBeDefined();

      // Validate schema properties
      const avroSchema = asyncapiDoc.components.schemas.AvroMessage;
      expect(avroSchema.properties?.schema?.type).toBe("string");

      const protobufSchema = asyncapiDoc.components.schemas.ProtobufMessage;
      expect(protobufSchema.properties?.messageType?.type).toBe("string");

      // Per-message contentTypes propagate to the emitted messages
      const avroMessage = inlineObject(
        asyncapiDoc.components!.messages!.AvroMessage,
        "avro message",
      );
      expect(avroMessage.contentType).toBe("application/avro");
      const protobufMessage = inlineObject(
        asyncapiDoc.components!.messages!.ProtobufMessage,
        "protobuf message",
      );
      expect(protobufMessage.contentType).toBe("application/protobuf");
    });

    it("should handle @message decorator with headers and correlation ID", async () => {
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
      `;

      const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source);

      const asyncapiDoc = await parseAsyncAPIOutput(
        outputFiles,
        "headers-test.json",
      );

      // Validate message schema with correlation ID
      expect(asyncapiDoc.components?.schemas?.TrackedMessage).toBeDefined();

      const trackedSchema = asyncapiDoc.components?.schemas?.TrackedMessage;
      expect(trackedSchema?.properties?.correlationId?.type).toBe("string");
      expect(trackedSchema?.properties?.payload?.type).toBe("object");
    });
  });

  describe("@protocol Decorator Real Processing", () => {
    it("should process @protocol decorator with Kafka binding", async () => {
      const source = `
        namespace ProtocolKafkaTest;

        @bindings(#{
          kafka: #{
            key: #{ type: "string" },
            schemaIdLocation: "header"
          }
        })
        model KafkaMessage {
          userId: string;
          action: string;
          timestamp: utcDateTime;
        }
        
        @protocol(#{
          protocol: "kafka",
          binding: #{
            topic: "user-events",
            partitions: 3
          }
        })
        @bindings(#{
          kafka: #{
            groupId: #{ type: "string" },
            clientId: #{ type: "string" }
          }
        })
        @channel("kafka.user.events")
        @publish
        op publishKafkaUserEvent(): KafkaMessage;
      `;

      const { outputFiles, program } =
        await compileAsyncAPISpecWithoutErrors(source);

      // Verify real compilation occurred
      expect(program).toBeDefined();

      const asyncapiDoc = await parseAsyncAPIOutput(
        outputFiles,
        "kafka-protocol-test.json",
      );

      // Validate schema was created
      expect(asyncapiDoc.components?.schemas?.KafkaMessage).toBeDefined();

      const kafkaSchema = asyncapiDoc.components.schemas.KafkaMessage;
      expect(kafkaSchema.properties?.userId?.type).toBe("string");
      expect(kafkaSchema.properties?.action?.type).toBe("string");
      expect(kafkaSchema.properties?.timestamp?.format).toBe("date-time");

      // Validate operation was created
      expect(asyncapiDoc.operations?.publishKafkaUserEvent).toBeDefined();

      const operation = asyncapiDoc.operations.publishKafkaUserEvent;
      expect(operation.action).toBe("send");

      // Kafka binding fields land at their spec-correct placements:
      // Topic/partitions on the channel binding, groupId/clientId (schemas)
      // On the operation binding, key/schemaIdLocation on the message binding.
      const channelBinding = inlineObject(
        asyncapiDoc.channels!["kafka.user.events"].bindings,
        "channel bindings",
      );
      expect(channelBinding.kafka.topic).toBe("user-events");
      expect(channelBinding.kafka.partitions).toBe(3);
      expect(channelBinding.kafka.bindingVersion).toBe(
        LATEST_BINDING_VERSIONS.kafka,
      );
      expect(
        inlineObject(operation.bindings, "operation bindings").kafka.groupId,
      ).toMatchObject({ type: "string" });
      const message = inlineObject(
        asyncapiDoc.components!.messages!.KafkaMessage,
        "message",
      );
      expect(
        inlineObject(message.bindings, "message bindings").kafka
          .schemaIdLocation,
      ).toBe("header");

      validateAsyncAPIDocument(asyncapiDoc);
    });

    it("should process @protocol decorator with WebSocket binding", async () => {
      const source = `
        namespace ProtocolWebSocketTest;
        
        model WebSocketMessage {
          messageType: "chat" | "notification" | "system";
          content: string;
          sender: string;
          timestamp: utcDateTime;
        }
        
        @protocol(#{
          protocol: "websocket",
          binding: #{
            method: "GET",
            query: #{ room: #{ type: "string" } }
          }
        })
        @channel("websocket.chat")
        @subscribe
        op subscribeWebSocketChat(): WebSocketMessage;
      `;

      const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source);

      const asyncapiDoc = await parseAsyncAPIOutput(
        outputFiles,
        "websocket-protocol-test.json",
      );

      // Validate WebSocket message schema
      expect(asyncapiDoc.components?.schemas?.WebSocketMessage).toBeDefined();

      const wsSchema = asyncapiDoc.components.schemas.WebSocketMessage;
      expect(wsSchema.properties?.messageType?.type).toBe("string");
      expect(wsSchema.properties?.content?.type).toBe("string");
      expect(wsSchema.properties?.sender?.type).toBe("string");

      // Validate subscribe operation
      expect(asyncapiDoc.operations?.subscribeWebSocketChat).toBeDefined();

      const operation = asyncapiDoc.operations.subscribeWebSocketChat;
      expect(operation.action).toBe("receive");

      // "websocket" alias normalizes to the ws binding key with config values
      const wsBinding = inlineObject(
        asyncapiDoc.channels!["websocket.chat"].bindings,
        "channel bindings",
      ).ws;
      expect(wsBinding.method).toBe("GET");
      expect(wsBinding.query).toStrictEqual({ room: { type: "string" } });
      expect(wsBinding.bindingVersion).toBe(LATEST_BINDING_VERSIONS.ws);

      validateAsyncAPIDocument(asyncapiDoc);
    });

    it("should process @protocol decorator with multiple protocols", async () => {
      const source = `
        namespace MultiProtocolTest;
        
        model EventMessage {
          eventId: string;
          eventType: string;
          data: string;
        }
        
        @protocol(#{
          protocol: "amqp",
          binding: #{
            exchange: "events",
            routingKey: "user.created",
            deliveryMode: 2,
            priority: 1
          }
        })
        @channel("amqp.user.events")
        @publish
        op publishAMQPEvent(): EventMessage;
        
        @protocol(#{
          protocol: "mqtt",
          binding: #{
            topic: "sensors/temperature",
            qos: 2,
            retain: true
          }
        })
        @channel("mqtt.sensor.data")
        @publish
        op publishMQTTSensorData(): EventMessage;
      `;

      const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source);

      const asyncapiDoc = await parseAsyncAPIOutput(
        outputFiles,
        "multi-protocol-test.json",
      );

      // Validate both operations were created
      expect(asyncapiDoc.operations?.publishAMQPEvent).toBeDefined();
      expect(asyncapiDoc.operations?.publishMQTTSensorData).toBeDefined();

      // Validate schemas
      expect(asyncapiDoc.components?.schemas?.EventMessage).toBeDefined();

      // AMQP defines a channel binding, so the passthrough lands there
      const amqpChannel = asyncapiDoc.channels?.["amqp.user.events"];
      const amqpBindings = inlineObject(amqpChannel?.bindings, "amqp channel bindings");
      const amqp = inlineObject(amqpBindings.amqp, "amqp binding");
      expect(amqp.exchange).toBe("events");
      expect(amqp.routingKey).toBe("user.created");
      expect(amqp.deliveryMode).toBe(2);
      expect(amqp.bindingVersion).toBe(LATEST_BINDING_VERSIONS.amqp);

      // MQTT has no channel binding, so the passthrough lands on the operation
      const mqttOp = asyncapiDoc.operations?.publishMQTTSensorData;
      const mqttBindings = inlineObject(mqttOp?.bindings, "mqtt operation bindings");
      const mqtt = inlineObject(mqttBindings.mqtt, "mqtt binding");
      expect(mqtt.topic).toBe("sensors/temperature");
      expect(mqtt.qos).toBe(2);
      expect(mqtt.retain).toBe(true);
      expect(mqtt.bindingVersion).toBe(LATEST_BINDING_VERSIONS.mqtt);
    });
  });

  describe("@security Decorator Real Processing", () => {
    it("should process @security decorator with JWT Bearer authentication", async () => {
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
        @operationSecurity(#{ name: "jwtAuth" })
        @channel("secure.messages")
        @publish
        op publishSecureMessage(): SecureMessage;
      `;

      const { outputFiles, program } =
        await compileAsyncAPISpecWithoutErrors(source);

      // Verify compilation occurred
      expect(program).toBeDefined();

      const asyncapiDoc = await parseAsyncAPIOutput(
        outputFiles,
        "jwt-security-test.json",
      );

      // Validate secure message schema
      expect(asyncapiDoc.components?.schemas?.SecureMessage).toBeDefined();

      const secureSchema = asyncapiDoc.components.schemas.SecureMessage;
      expect(secureSchema.properties?.userId?.type).toBe("string");
      expect(secureSchema.properties?.sensitiveData?.type).toBe("string");

      // Validate operation
      expect(asyncapiDoc.operations?.publishSecureMessage).toBeDefined();

      const scheme = inlineObject(
        asyncapiDoc.components?.securitySchemes?.jwtAuth,
        "jwt security scheme",
      );
      expect(scheme.type).toBe("http");
      expect(scheme.scheme).toBe("bearer");
      expect(scheme.bearerFormat).toBe("JWT");
      const security = asyncapiDoc.operations?.publishSecureMessage?.security;
      expect(security).toStrictEqual([
        { $ref: "#/components/securitySchemes/jwtAuth" },
      ]);
    });

    it("should process @security decorator with OAuth2 flows", async () => {
      const source = `
        namespace SecurityOAuth2Test;
        
        model OAuth2SecuredMessage {
          resourceId: string;
          action: string;
          scope: string[];
        }
        
        @security(#{
          name: "oauth2Auth",
          scheme: #{
            type: "oauth2",
            flows: #{
              clientCredentials: #{
                tokenUrl: "https://auth.example.com/token",
                scopes: #{
                  read: "Read access",
                  write: "Write access",
                  admin: "Admin access"
                }
              },
              authorizationCode: #{
                authorizationUrl: "https://auth.example.com/authorize",
                tokenUrl: "https://auth.example.com/token",
                scopes: #{
                  read: "Read access",
                  write: "Write access"
                }
              }
            }
          },
          scopes: #["read", "write"]
        })
        @channel("oauth2.protected.resources")
        @publish
        op publishOAuth2SecuredMessage(): OAuth2SecuredMessage;
      `;

      const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source);

      const asyncapiDoc = await parseAsyncAPIOutput(
        outputFiles,
        "oauth2-security-test.json",
      );

      // Validate OAuth2 secured message schema
      expect(
        asyncapiDoc.components?.schemas?.OAuth2SecuredMessage,
      ).toBeDefined();

      const oauth2Schema = asyncapiDoc.components.schemas.OAuth2SecuredMessage;
      expect(oauth2Schema.properties?.resourceId?.type).toBe("string");
      expect(oauth2Schema.properties?.action?.type).toBe("string");

      // Validate operation
      expect(asyncapiDoc.operations?.publishOAuth2SecuredMessage).toBeDefined();

      const scheme = inlineObject(
        asyncapiDoc.components?.securitySchemes?.oauth2Auth,
        "oauth2 security scheme",
      );
      expect(scheme.type).toBe("oauth2");
      const flows = inlineObject(scheme.flows, "oauth2 flows");
      const clientCredentials = inlineObject(
        flows.clientCredentials,
        "clientCredentials flow",
      );
      expect(clientCredentials.tokenUrl).toBe("https://auth.example.com/token");
      expect(clientCredentials.availableScopes?.read).toBe("Read access");
      expect(clientCredentials.availableScopes?.admin).toBe("Admin access");
      const authorizationCode = inlineObject(
        flows.authorizationCode,
        "authorizationCode flow",
      );
      expect(authorizationCode.authorizationUrl).toBe(
        "https://auth.example.com/authorize",
      );
      expect(authorizationCode.availableScopes?.write).toBe("Write access");
    });

    it("should process @security decorator with SASL authentication for Kafka", async () => {
      const source = `
        namespace SecuritySASLTest;
        
        model SASLSecuredMessage {
          messageId: string;
          payload: string;
          producerId: string;
        }
        
        @security(#{
          name: "kafkaSASL",
          scheme: #{
            type: "scramSha256",
            username: "user",
            password: "pass"
          }
        })
        @protocol(#{
          protocol: "kafka",
          binding: #{
            topic: "secure-events",
            key: "messageId"
          }
        })
        @channel("kafka.secure.events")
        @publish
        op publishSASLSecuredMessage(): SASLSecuredMessage;
      `;

      const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source);

      const asyncapiDoc = await parseAsyncAPIOutput(
        outputFiles,
        "sasl-security-test.json",
      );

      // Validate SASL secured message
      expect(asyncapiDoc.components?.schemas?.SASLSecuredMessage).toBeDefined();

      const saslSchema = asyncapiDoc.components.schemas.SASLSecuredMessage;
      expect(saslSchema.properties?.messageId?.type).toBe("string");
      expect(saslSchema.properties?.payload?.type).toBe("string");
      expect(saslSchema.properties?.producerId?.type).toBe("string");
    });
  });

  describe("combined Decorator Integration", () => {
    it("should process all decorators together in complex scenario", async () => {
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
        
        @security(#{
          name: "multiAuth",
          scheme: #{
            type: "oauth2",
            flows: #{
              clientCredentials: #{
                tokenUrl: "https://auth.company.com/token",
                scopes: #{
                  eventsRead: "Read events",
                  eventsWrite: "Publish events"
                }
              }
            }
          },
          scopes: #["events:write"]
        })
        @protocol(#{
          protocol: "kafka",
          binding: #{
            topic: "secure-audit-events",
            partitions: 6,
            replicas: 3
          }
        })
        @bindings(#{
          kafka: #{
            groupId: #{ type: "string" },
            clientId: #{ type: "string" }
          }
        })
        @channel("audit.secure.events")
        @publish
        op publishSecureAuditEvent(): SecureKafkaEvent;
        
        @security(#{
          name: "readAuth",
          scheme: #{
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT"
          }
        })
        @protocol(#{
          protocol: "kafka", 
          binding: #{
            topic: "secure-audit-events",
            partitions: 6
          }
        })
        @bindings(#{
          kafka: #{
            groupId: #{ type: "string" },
            clientId: #{ type: "string" }
          }
        })
        @channel("audit.events.{userId}")
        @subscribe
        op subscribeUserAuditEvents(userId: string): SecureKafkaEvent;
      `;

      const { outputFiles, program } =
        await compileAsyncAPISpecWithoutErrors(source);

      // Verify comprehensive compilation
      expect(program).toBeDefined();

      const asyncapiDoc = await parseAsyncAPIOutput(
        outputFiles,
        "combined-decorators-test.json",
      );

      // Validate complex message schema
      expect(asyncapiDoc.components?.schemas?.SecureKafkaEvent).toBeDefined();

      const eventSchema = asyncapiDoc.components.schemas.SecureKafkaEvent;
      expect(eventSchema.type).toBe("object");
      expect(eventSchema.properties?.traceId?.type).toBe("string");
      expect(eventSchema.properties?.eventId?.type).toBe("string");
      expect(eventSchema.properties?.userId?.type).toBe("string");
      expect(eventSchema.properties?.timestamp?.format).toBe("date-time");

      // Validate nested objects
      expect(eventSchema.properties?.resource?.type).toBe("object");
      expect(eventSchema.properties?.securityContext?.type).toBe("object");

      // Validate required fields include security context
      expect(eventSchema.required).toContain("securityContext");
      expect(eventSchema.required).toContain("resource");

      // Validate both operations created
      expect(asyncapiDoc.operations?.publishSecureAuditEvent).toBeDefined();
      expect(asyncapiDoc.operations?.subscribeUserAuditEvents).toBeDefined();

      // Validate operation actions
      const publishOp = asyncapiDoc.operations.publishSecureAuditEvent;
      const subscribeOp = asyncapiDoc.operations.subscribeUserAuditEvents;

      expect(publishOp.action).toBe("send");
      expect(subscribeOp.action).toBe("receive");

      // Kafka binding fields land at spec-correct placements
      const channelBinding = inlineObject(
        asyncapiDoc.channels!["audit.secure.events"].bindings,
        "channel bindings",
      );
      expect(channelBinding.kafka.topic).toBe("secure-audit-events");
      expect(channelBinding.kafka.partitions).toBe(6);
      expect(
        inlineObject(publishOp.bindings, "operation bindings").kafka.groupId,
      ).toMatchObject({ type: "string" });

      // Full AsyncAPI 3.1.0 schema compliance
      validateAsyncAPIDocument(asyncapiDoc);
    });
  });
});
