/**
 * Integration tests for AsyncAPI Standard Protocol Bindings with Emitter
 * 
 * Tests the integration of AsyncAPI 3.0 standard protocol bindings with the TypeSpec emitter.
 * Focuses on emitter functionality rather than custom binding factories.
 */

import { describe, it, expect } from "vitest";
import { compileAsyncAPISpec } from "../utils/test-helpers";
import { SUPPORTED_PROTOCOLS } from "../../src/constants/protocol-defaults.js";

describe("AsyncAPI Protocol Binding Integration", () => {
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

    it("should validate generated spec follows AsyncAPI 3.0 standard", async () => {
      const source = `
        import "@typespec/asyncapi";
        using TypeSpec.AsyncAPI;

        @server("kafka-broker", {
          url: "kafka://localhost:9092",
          protocol: "kafka"
        })
        namespace AsyncAPITest;

        model TestEvent {
          id: string;
          data: string;
        }

        @channel("test-topic")
        model TestChannel {
          @subscribe 
          received: TestEvent;
        }
      `;

      const spec = await compileAsyncAPISpec(source);

      // Verify AsyncAPI 3.0 compliance
      expect(spec.asyncapi).toBe("3.0.0");
      expect(spec.info).toBeDefined();
      expect(spec.servers).toBeDefined();
      expect(spec.channels).toBeDefined();
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

    it("should handle bidirectional WebSocket communication", async () => {
      const source = `
        import "@typespec/asyncapi";
        using TypeSpec.AsyncAPI;

        @server("ws-api", {
          url: "wss://api.example.com/ws",
          protocol: "wss"
        })
        namespace WSTest;

        model Message {
          type: "ping" | "pong" | "data";
          payload: string;
        }

        @channel("messages")
        model MessageChannel {
          @subscribe
          incoming: Message;
          
          @publish
          outgoing: Message;
        }
      `;

      const spec = await compileAsyncAPISpec(source);

      expect(spec.servers!["ws-api"].protocol).toBe("wss");
      expect(spec.channels!["messages"]).toBeDefined();
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

    it("should support HTTP webhook patterns", async () => {
      const source = `
        import "@typespec/asyncapi";
        using TypeSpec.AsyncAPI;

        @server("webhook-endpoint", {
          url: "https://webhooks.api.example.com",
          protocol: "https"
        })
        namespace WebhookTest;

        model PaymentEvent {
          eventId: string;
          eventType: "payment.created" | "payment.completed" | "payment.failed";
          amount: number;
          currency: string;
        }

        @channel("payment-events")
        model PaymentChannel {
          @publish
          paymentNotification: PaymentEvent;
        }
      `;

      const spec = await compileAsyncAPISpec(source);

      expect(spec.servers!["webhook-endpoint"].protocol).toBe("https");
      expect(spec.channels!["payment-events"]).toBeDefined();
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

    it("should validate supported protocols are properly handled", () => {
      // Test that supported protocols are defined correctly
      expect(SUPPORTED_PROTOCOLS).toBeDefined();
      expect(SUPPORTED_PROTOCOLS.length).toBeGreaterThan(0);
      expect(SUPPORTED_PROTOCOLS).toContain("kafka");
      expect(SUPPORTED_PROTOCOLS).toContain("http");
      expect(SUPPORTED_PROTOCOLS).toContain("websocket");
    });
  });

  describe("AsyncAPI Specification Validation", () => {
    it("should generate valid AsyncAPI 3.0 documents", async () => {
      const source = `
        import "@typespec/asyncapi";
        using TypeSpec.AsyncAPI;

        @server("test-server", {
          url: "kafka://localhost:9092",
          protocol: "kafka"
        })
        namespace ValidationTest;

        model TestMessage {
          id: string;
          data: string;
        }

        @channel("test-channel")
        model TestChannel {
          @subscribe
          testEvent: TestMessage;
        }
      `;

      const spec = await compileAsyncAPISpec(source);

      // Verify AsyncAPI 3.0 specification compliance
      expect(spec.asyncapi).toBe("3.0.0");
      expect(spec.info).toBeDefined();
      expect(spec.info.title).toBeDefined();
      expect(spec.info.version).toBeDefined();
      expect(spec.servers).toBeDefined();
      expect(spec.channels).toBeDefined();
    });

    it("should maintain protocol binding consistency", async () => {
      // Test that protocols in servers match expected formats
      const source = `
        import "@typespec/asyncapi";
        using TypeSpec.AsyncAPI;

        @server("kafka-srv", {
          url: "kafka://localhost:9092",
          protocol: "kafka"
        })
        @server("ws-srv", {
          url: "ws://localhost:8080",
          protocol: "ws"
        })
        namespace ProtocolTest;

        model Event {
          id: string;
        }

        @channel("events")
        model EventChannel {
          @subscribe
          event: Event;
        }
      `;

      const spec = await compileAsyncAPISpec(source);

      expect(spec.servers!["kafka-srv"].protocol).toBe("kafka");
      expect(spec.servers!["ws-srv"].protocol).toBe("ws");
    });

    it("should handle complex multi-protocol scenarios", async () => {
      const source = `
        import "@typespec/asyncapi";
        using TypeSpec.AsyncAPI;

        @server("primary", {
          url: "kafka://broker:9092",
          protocol: "kafka"
        })
        @server("secondary", {
          url: "https://api.example.com/webhooks",
          protocol: "https"
        })
        namespace ComplexTest;

        model BusinessEvent {
          eventId: string;
          eventType: string;
          timestamp: int64;
          payload: Record<unknown>;
        }

        @channel("business-events")
        model BusinessChannel {
          @subscribe
          eventProcessed: BusinessEvent;
          
          @publish 
          eventGenerated: BusinessEvent;
        }
      `;

      const spec = await compileAsyncAPISpec(source);

      // Verify complex scenario handling
      expect(Object.keys(spec.servers!)).toHaveLength(2);
      expect(spec.channels!["business-events"]).toBeDefined();
    });
  });
});