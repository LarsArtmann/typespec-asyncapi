/**
 * Integration tests for Protocol Bindings with AsyncAPI Emitter
 * 
 * Tests the integration of protocol bindings with the TypeSpec AsyncAPI emitter
 */

import { describe, it, expect } from "vitest";
import { compileAsyncAPISpec } from "../utils/test-helpers";
import { ProtocolBindingFactory } from "../../src/protocol-bindings";
//TODO: this file is getting to big split it up

describe("Protocol Binding Integration", () => {
  describe("Kafka Protocol Integration", () => {
    it("should generate AsyncAPI spec with Kafka server bindings", async () => {
      const source = `
        import "@typespec/asyncapi";
        using TypeSpec.AsyncAPI;

        @server("kafka-cluster", {
          url: "kafka://broker.example.com:9092", 
          protocol: "kafka",
          description: "Kafka cluster with schema registry"
        })
        namespace KafkaTest;

        model UserEvent {
          id: string;
          userId: string;
          action: string;
          timestamp: int64;
        }

        @channel("user-events") 
        model UserChannel {
          @subscribe
          userCreated: UserEvent;
        }
      `;

      const spec = await compileAsyncAPISpec(source);

      // Verify basic structure
      expect(spec.servers).toBeDefined();
      expect(spec.servers!["kafka-cluster"]).toBeDefined();
      expect(spec.servers!["kafka-cluster"].protocol).toBe("kafka");
      expect(spec.channels).toBeDefined();
      expect(spec.channels!["user-events"]).toBeDefined();
    });

    it("should create Kafka bindings programmatically", () => {
      // Test that we can generate Kafka bindings for a typical use case
      const serverBindings = ProtocolBindingFactory.createServerBindings("kafka", {
        schemaRegistryUrl: "http://schema-registry.example.com:8081",
        schemaRegistryVendor: "confluent",
        clientId: "user-service",
      });

      const channelBindings = ProtocolBindingFactory.createChannelBindings("kafka", {
        topic: "user-events",
        partitions: 3,
        replicas: 2,
        topicConfiguration: {
          "cleanup.policy": ["delete", "compact"],
          "retention.ms": 604800000, // 7 days
          "max.message.bytes": 1048576, // 1MB
        },
      });

      const operationBindings = ProtocolBindingFactory.createOperationBindings("kafka", {
        groupId: {
          type: "string",
          enum: ["user-service-consumer", "analytics-consumer"],
          description: "Consumer group for user events",
        },
        clientId: {
          type: "string",
          description: "Kafka client identifier",
        },
      });

      const messageBindings = ProtocolBindingFactory.createMessageBindings("kafka", {
        key: {
          type: "string",
          description: "User ID for partitioning",
        },
        schemaIdLocation: "payload",
        schemaLookupStrategy: "TopicIdStrategy",
      });

      // Verify all bindings are created correctly
      expect(serverBindings?.kafka).toBeDefined();
      expect(serverBindings?.kafka?.bindingVersion).toBe("0.5.0");
      expect(serverBindings?.kafka?.schemaRegistryUrl).toBe("http://schema-registry.example.com:8081");

      expect(channelBindings?.kafka).toBeDefined();
      expect(channelBindings?.kafka?.topic).toBe("user-events");
      expect(channelBindings?.kafka?.partitions).toBe(3);

      expect(operationBindings?.kafka).toBeDefined();
      expect(operationBindings?.kafka?.groupId).toBeDefined();

      expect(messageBindings?.kafka).toBeDefined();
      expect(messageBindings?.kafka?.key).toBeDefined();
    });
  });

  describe("WebSocket Protocol Integration", () => {
    it("should generate AsyncAPI spec with WebSocket channel bindings", async () => {
      const source = `
        import "@typespec/asyncapi";
        using TypeSpec.AsyncAPI;

        @server("websocket-server", {
          url: "ws://websocket.example.com:8080",
          protocol: "ws", 
          description: "WebSocket server for real-time communication"
        })
        namespace WebSocketTest;

        model ChatMessage {
          id: string;
          userId: string;
          message: string;
          timestamp: int64;
        }

        @channel("chat-room")
        model ChatChannel {
          @subscribe
          messageReceived: ChatMessage;
          
          @publish
          messageSent: ChatMessage;
        }
      `;

      const spec = await compileAsyncAPISpec(source);

      // Verify WebSocket server configuration
      expect(spec.servers).toBeDefined();
      expect(spec.servers!["websocket-server"]).toBeDefined();
      expect(spec.servers!["websocket-server"].protocol).toBe("ws");
      expect(spec.channels).toBeDefined();
      expect(spec.channels!["chat-room"]).toBeDefined();
    });

    it("should create WebSocket bindings programmatically", () => {
      const channelBindings = ProtocolBindingFactory.createChannelBindings("ws", {
        method: "GET",
        query: {
          type: "object",
          properties: {
            token: { type: "string", description: "Authentication token" },
            room: { type: "string", description: "Chat room ID" },
          },
          required: ["token"],
        },
        headers: {
          type: "object",
          properties: {
            "Authorization": { type: "string" },
            "Sec-WebSocket-Protocol": { type: "string" },
          },
        },
      });

      const messageBindings = ProtocolBindingFactory.createMessageBindings("ws", {});

      expect(channelBindings?.ws).toBeDefined();
      expect(channelBindings?.ws?.bindingVersion).toBe("0.1.0");
      expect(channelBindings?.ws?.method).toBe("GET");

      expect(messageBindings?.ws).toBeDefined();
      expect(messageBindings?.ws?.bindingVersion).toBe("0.1.0");
    });
  });

  describe("HTTP Protocol Integration", () => {
    it("should generate AsyncAPI spec with HTTP operation bindings", async () => {
      const source = `
        import "@typespec/asyncapi";
        using TypeSpec.AsyncAPI;

        @server("http-api", {
          url: "https://api.example.com",
          protocol: "https",
          description: "REST API for async operations"
        })
        namespace HttpTest;

        model WebhookEvent {
          id: string;
          type: "user.created" | "user.updated" | "user.deleted";
          data: Record<unknown>;
          timestamp: int64;
        }

        @channel("webhook-notifications")
        model WebhookChannel {
          @publish
          webhookSent: WebhookEvent;
        }
      `;

      const spec = await compileAsyncAPISpec(source);

      // Verify HTTP server configuration
      expect(spec.servers).toBeDefined();
      expect(spec.servers!["http-api"]).toBeDefined();
      expect(spec.servers!["http-api"].protocol).toMatch(/https?/);
      expect(spec.channels).toBeDefined();
      expect(spec.channels!["webhook-notifications"]).toBeDefined();
    });

    it("should create HTTP bindings programmatically", () => {
      const operationBindings = ProtocolBindingFactory.createOperationBindings("http", {
        type: "request",
        method: "POST",
        query: {
          type: "object",
          properties: {
            version: { type: "string", enum: ["v1", "v2"] },
            format: { type: "string", enum: ["json", "xml"] },
          },
        },
      });

      const messageBindings = ProtocolBindingFactory.createMessageBindings("http", {
        headers: {
          type: "object",
          properties: {
            "Content-Type": { type: "string", enum: ["application/json"] },
            "X-Webhook-Signature": { type: "string" },
            "X-Event-Type": { type: "string" },
          },
          required: ["Content-Type", "X-Event-Type"],
        },
        statusCode: 200,
      });

      expect(operationBindings?.http).toBeDefined();
      expect(operationBindings?.http?.bindingVersion).toBe("0.3.0");
      expect(operationBindings?.http?.type).toBe("request");
      expect(operationBindings?.http?.method).toBe("POST");

      expect(messageBindings?.http).toBeDefined();
      expect(messageBindings?.http?.bindingVersion).toBe("0.3.0");
      expect(messageBindings?.http?.statusCode).toBe(200);
    });
  });

  describe("Multi-Protocol Integration", () => {
    it("should handle multiple protocols in a single specification", async () => {
      const source = `
        import "@typespec/asyncapi";
        using TypeSpec.AsyncAPI;

        @server("kafka-broker", {
          url: "kafka://broker.example.com:9092",
          protocol: "kafka",
          description: "Kafka message broker"
        })
        @server("webhook-endpoint", {
          url: "https://webhooks.example.com",
          protocol: "https", 
          description: "HTTP webhook endpoint"
        })
        namespace MultiProtocolTest;

        model Event {
          id: string;
          type: string;
          payload: Record<unknown>;
          timestamp: int64;
        }

        @channel("internal-events")
        model KafkaChannel {
          @subscribe
          eventReceived: Event;
        }

        @channel("external-notifications") 
        model WebhookChannel {
          @publish
          notificationSent: Event;
        }
      `;

      const spec = await compileAsyncAPISpec(source);

      // Verify multiple servers are defined
      expect(spec.servers).toBeDefined();
      expect(Object.keys(spec.servers!)).toHaveLength(2);
      expect(spec.servers!["kafka-broker"]).toBeDefined();
      expect(spec.servers!["kafka-broker"].protocol).toBe("kafka");
      expect(spec.servers!["webhook-endpoint"]).toBeDefined();
      expect(spec.servers!["webhook-endpoint"].protocol).toMatch(/https?/);

      // Verify multiple channels are defined
      expect(spec.channels).toBeDefined();
      expect(Object.keys(spec.channels!)).toHaveLength(2);
      expect(spec.channels!["internal-events"]).toBeDefined();
      expect(spec.channels!["external-notifications"]).toBeDefined();
    });

    it("should create bindings for different protocols correctly", () => {
      // Kafka bindings for internal messaging
      const kafkaServerBindings = ProtocolBindingFactory.createServerBindings("kafka", {
        schemaRegistryUrl: "http://schema-registry:8081",
        clientId: "event-processor",
      });

      const kafkaChannelBindings = ProtocolBindingFactory.createChannelBindings("kafka", {
        topic: "internal-events",
        partitions: 6,
        replicas: 3,
      });

      // HTTP bindings for external webhooks
      const httpOperationBindings = ProtocolBindingFactory.createOperationBindings("https", {
        type: "request", 
        method: "POST",
      });

      const httpMessageBindings = ProtocolBindingFactory.createMessageBindings("https", {
        headers: {
          type: "object",
          properties: {
            "Content-Type": { type: "string" },
            "X-Signature": { type: "string" },
          },
        },
        statusCode: 202,
      });

      // Verify Kafka bindings
      expect(kafkaServerBindings?.kafka).toBeDefined();
      expect(kafkaChannelBindings?.kafka?.topic).toBe("internal-events");

      // Verify HTTP bindings (https maps to http)
      expect(httpOperationBindings?.http).toBeDefined();
      expect(httpOperationBindings?.http?.method).toBe("POST");
      expect(httpMessageBindings?.http?.statusCode).toBe(202);
    });
  });

  describe("Protocol Binding Validation Integration", () => {
    it("should validate Kafka binding configuration", () => {
      // Valid configuration should pass
      const validErrors = ProtocolBindingFactory.validateBinding("kafka", "channel", {
        topic: "valid-topic",
        partitions: 3,
        replicas: 2,
      });
      expect(validErrors).toEqual([]);

      // Invalid configuration should fail
      const invalidErrors = ProtocolBindingFactory.validateBinding("kafka", "channel", {
        partitions: -1,
        replicas: 0,
      });
      expect(invalidErrors.length).toBeGreaterThan(0);
      expect(invalidErrors.some(e => e.includes("positive integer"))).toBe(true);
    });

    it("should validate WebSocket binding configuration", () => {
      const validErrors = ProtocolBindingFactory.validateBinding("ws", "channel", {
        method: "GET",
      });
      expect(validErrors).toEqual([]);

      const invalidErrors = ProtocolBindingFactory.validateBinding("ws", "channel", {
        method: "PUT",
      });
      expect(invalidErrors).toContain("WebSocket channel binding method must be 'GET' or 'POST'");
    });

    it("should validate HTTP binding configuration", () => {
      const validErrors = ProtocolBindingFactory.validateBinding("http", "operation", {
        type: "request",
        method: "POST",
        statusCode: 201,
      });
      expect(validErrors).toEqual([]);

      const invalidErrors = ProtocolBindingFactory.validateBinding("http", "operation", {
        type: "invalid",
        method: "INVALID",
        statusCode: 999,
      });
      expect(invalidErrors.length).toBe(3);
    });
  });
});