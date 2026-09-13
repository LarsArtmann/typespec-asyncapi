/**
 * Integration tests for AsyncAPI Standard Protocol Bindings with Emitter
 *
 * Tests the integration of AsyncAPI 3.1 standard protocol bindings with the TypeSpec emitter.
 * Focuses on whole-document integration: every compiled spec must produce zero error
 * diagnostics and validate against the official AsyncAPI 3.1.0 JSON Schema.
 * Binding-field placement is covered by test/compliance/protocol-bindings.test.ts.
 */

import {
  compileAsyncAPISpec,
  parseAsyncAPIOutput,
  type ParsedAsyncAPIDocument,
} from "../utils/test-helpers";
import { validateAsyncAPIDocument } from "../utils/schema-validator.js";
import {
  PROTOCOL_LIST,
  isSupportedProtocol,
} from "../../src/constants/protocols.js";
import { LATEST_BINDING_VERSIONS } from "../../src/constants/binding-versions.js";
import { inlineObject } from "../utils/type-guards.js";

/**
 * Compile TypeSpec source, assert zero error diagnostics, and validate the
 * parsed document against the official AsyncAPI 3.1.0 schema.
 *
 * Returns the clean parsed document (without the test-only `diagnostics` /
 * `outputFiles` extras), which the strict root schema would reject.
 */
async function compileAndValidateIntegrationSpec(
  source: string,
): Promise<ParsedAsyncAPIDocument> {
  const spec = await compileAsyncAPISpec(source);
  expect(spec.diagnostics.filter((d) => d.severity === "error")).toHaveLength(
    0,
  );
  const document = await parseAsyncAPIOutput(spec.outputFiles);
  validateAsyncAPIDocument(document);
  return document;
}

describe("asyncAPI Protocol Binding Integration", () => {
  describe("kafka Protocol Integration", () => {
    it("should generate AsyncAPI spec with Kafka server bindings", async () => {
      const source = `
        @server("kafka-cluster", #{
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
        @protocol(#{
          protocol: "kafka",
          partitions: 6,
          replicationFactor: 3,
        })
        @subscribe
        op handleUserEvent(): UserEvent;
      `;

      const spec = await compileAndValidateIntegrationSpec(source);

      // Verify basic structure
      expect(spec.servers).toBeDefined();
      expect(spec.servers!["kafka-cluster"]).toBeDefined();
      expect(spec.servers!["kafka-cluster"].protocol).toBe("kafka");
      expect(spec.channels).toBeDefined();
      expect(spec.channels!["user-events"]).toBeDefined();

      // The @protocol config maps to the spec-correct kafka channel binding
      const bindings = inlineObject(
        spec.channels!["user-events"].bindings,
        "kafka channel bindings",
      );
      const kafka = inlineObject(bindings.kafka, "kafka binding");
      expect(kafka.partitions).toBe(6);
      expect(kafka.replicas).toBe(3);
      expect(kafka.bindingVersion).toBe(LATEST_BINDING_VERSIONS.kafka);
    });

    it("should validate generated spec follows AsyncAPI 3.1 standard", async () => {
      const source = `
        @server("kafka-broker", #{
          url: "kafka://localhost:9092",
          protocol: "kafka"
        })
        namespace AsyncAPITest;

        model TestEvent {
          id: string;
          data: string;
        }

        @channel("test-topic")
        @subscribe
        op handleTestEvent(): TestEvent;
      `;

      const spec = await compileAndValidateIntegrationSpec(source);

      // Verify AsyncAPI 3.1 compliance
      expect(spec.asyncapi).toBe("3.1.0");
      expect(spec.info).toBeDefined();
      expect(spec.servers).toBeDefined();
      expect(spec.channels).toBeDefined();
    });
  });

  describe("webSocket Protocol Integration", () => {
    it("should generate AsyncAPI spec with WebSocket channel bindings", async () => {
      const source = `
        @server("websocket-server", #{
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
        @protocol(#{
          protocol: "ws",
          headers: #{ xRoomId: "room-1" },
        })
        @subscribe
        op receiveMessage(): ChatMessage;

        @channel("chat-room")
        @publish
        op sendMessage(): ChatMessage;
      `;

      const spec = await compileAndValidateIntegrationSpec(source);

      // Verify WebSocket server configuration
      expect(spec.servers).toBeDefined();
      expect(spec.servers!["websocket-server"]).toBeDefined();
      expect(spec.servers!["websocket-server"].protocol).toBe("ws");
      expect(spec.channels).toBeDefined();
      expect(spec.channels!["chat-room"]).toBeDefined();

      const bindings = inlineObject(
        spec.channels!["chat-room"].bindings,
        "ws channel bindings",
      );
      const ws = inlineObject(bindings.ws, "ws binding");
      expect(ws.headers).toStrictEqual({ xRoomId: "room-1" });
      expect(ws.bindingVersion).toBe(LATEST_BINDING_VERSIONS.ws);
    });

    it("should handle bidirectional WebSocket communication", async () => {
      const source = `
        @server("ws-api", #{
          url: "wss://api.example.com/ws",
          protocol: "wss"
        })
        namespace WSTest;

        model Message {
          type: "ping" | "pong" | "data";
          payload: string;
        }

        @channel("messages")
        @protocol(#{
          protocol: "ws",
          queryParams: #{ debug: "1" },
        })
        @subscribe
        op receiveMessage(): Message;
        
        @channel("messages")
        @publish
        op sendMessage(): Message;
      `;

      const spec = await compileAndValidateIntegrationSpec(source);

      expect(spec.servers!["ws-api"].protocol).toBe("wss");
      expect(spec.channels!["messages"]).toBeDefined();

      const bindings = inlineObject(
        spec.channels!["messages"].bindings,
        "ws channel bindings",
      );
      const ws = inlineObject(bindings.ws, "ws binding");
      expect(ws.query).toStrictEqual({ debug: "1" });
      expect(ws.bindingVersion).toBe(LATEST_BINDING_VERSIONS.ws);
    });
  });

  describe("http Protocol Integration", () => {
    it("should generate AsyncAPI spec with HTTP operation bindings", async () => {
      const source = `
        @server("http-api", #{
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
        @protocol(#{
          protocol: "http",
          binding: #{ method: "POST" },
        })
        @publish
        op sendWebhookEvent(): WebhookEvent;
      `;

      const spec = await compileAndValidateIntegrationSpec(source);

      // Verify HTTP server configuration
      expect(spec.servers).toBeDefined();
      expect(spec.servers!["http-api"]).toBeDefined();
      expect(spec.servers!["http-api"].protocol).toBe("https");
      expect(spec.channels).toBeDefined();
      expect(spec.channels!["webhook-notifications"]).toBeDefined();

      // HTTP defines no channel binding, so the passthrough lands on the operation
      const op = spec.operations?.sendWebhookEvent;
      const bindings = inlineObject(op?.bindings, "http operation bindings");
      const http = inlineObject(bindings.http, "http binding");
      expect(http.method).toBe("POST");
      expect(http.bindingVersion).toBe(LATEST_BINDING_VERSIONS.http);
    });

    it("should support HTTP webhook patterns", async () => {
      const source = `
        @server("webhook-endpoint", #{
          url: "https://webhooks.api.example.com",
          protocol: "https"
        })
        namespace WebhookTest;

        model PaymentEvent {
          eventId: string;
          eventType: "payment.created" | "payment.completed" | "payment.failed";
          amount: float64;
          currency: string;
        }

        @channel("payment-events")
        @publish
        op sendPaymentNotification(): PaymentEvent;
      `;

      const spec = await compileAndValidateIntegrationSpec(source);

      expect(spec.servers!["webhook-endpoint"].protocol).toBe("https");
      expect(spec.channels!["payment-events"]).toBeDefined();
    });
  });

  describe("multi-Protocol Integration", () => {
    it("should handle multiple protocols in a single specification", async () => {
      const source = `
        @server("kafka-broker", #{
          url: "kafka://broker.example.com:9092",
          protocol: "kafka",
          description: "Kafka message broker"
        })
        @server("webhook-endpoint", #{
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
        @subscribe
        op receiveEvent(): Event;

        @channel("external-notifications") 
        @publish
        op sendNotification(): Event;
      `;

      const spec = await compileAndValidateIntegrationSpec(source);

      // Verify multiple servers are defined
      expect(spec.servers).toBeDefined();
      expect(Object.keys(spec.servers!)).toHaveLength(2);
      expect(spec.servers!["kafka-broker"]).toBeDefined();
      expect(spec.servers!["kafka-broker"].protocol).toBe("kafka");
      expect(spec.servers!["webhook-endpoint"]).toBeDefined();
      expect(spec.servers!["webhook-endpoint"].protocol).toBe("https");

      // Verify multiple channels are defined
      expect(spec.channels).toBeDefined();
      expect(Object.keys(spec.channels!)).toHaveLength(2);
      expect(spec.channels!["internal-events"]).toBeDefined();
      expect(spec.channels!["external-notifications"]).toBeDefined();
    });

    it("should validate supported protocols are properly handled", () => {
      // Test that supported protocols are defined correctly
      expect(PROTOCOL_LIST).toBeDefined();
      expect(PROTOCOL_LIST.length).toBeGreaterThan(0);
      expect(PROTOCOL_LIST).toContain("kafka");
      expect(PROTOCOL_LIST).toContain("http");
      expect(PROTOCOL_LIST).toContain("ws");
      // Websocket is accepted as an alias but not in the canonical list
      expect(PROTOCOL_LIST).not.toContain("websocket");
      expect(isSupportedProtocol("websocket")).toBeTruthy();
    });
  });

  describe("asyncAPI Specification Validation", () => {
    it("should generate valid AsyncAPI 3.1 documents", async () => {
      const source = `
        @server("test-server", #{
          url: "kafka://localhost:9092",
          protocol: "kafka"
        })
        namespace ValidationTest;

        model TestMessage {
          id: string;
          data: string;
        }

        @channel("test-channel")
        @subscribe
        op handleTestEvent(): TestMessage;
      `;

      const spec = await compileAndValidateIntegrationSpec(source);

      // Verify AsyncAPI 3.1 specification compliance
      expect(spec.asyncapi).toBe("3.1.0");
      expect(spec.info).toBeDefined();
      expect(spec.info.title).toBeDefined();
      expect(spec.info.version).toBeDefined();
      expect(spec.servers).toBeDefined();
      expect(spec.channels).toBeDefined();
    });

    it("should maintain protocol binding consistency", async () => {
      // Test that protocols in servers match expected formats
      const source = `
        @server("kafka-srv", #{
          url: "kafka://localhost:9092",
          protocol: "kafka"
        })
        @server("ws-srv", #{
          url: "ws://localhost:8080",
          protocol: "ws"
        })
        namespace ProtocolTest;

        model Event {
          id: string;
        }

        @channel("events")
        @subscribe
        op handleEvent(): Event;
      `;

      const spec = await compileAndValidateIntegrationSpec(source);

      expect(spec.servers!["kafka-srv"].protocol).toBe("kafka");
      expect(spec.servers!["ws-srv"].protocol).toBe("ws");
    });

    it("should handle complex multi-protocol scenarios", async () => {
      const source = `
        @server("primary", #{
          url: "kafka://broker:9092",
          protocol: "kafka"
        })
        @server("secondary", #{
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
        @subscribe
        op processBusinessEvent(): BusinessEvent;
        
        @channel("business-events")
        @publish
        op generateBusinessEvent(): BusinessEvent;
      `;

      const spec = await compileAndValidateIntegrationSpec(source);

      // Verify complex scenario handling
      expect(Object.keys(spec.servers!)).toHaveLength(2);
      expect(spec.channels!["business-events"]).toBeDefined();
    });
  });
});
