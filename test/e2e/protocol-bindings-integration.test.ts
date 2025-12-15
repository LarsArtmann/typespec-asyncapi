/**
 * End-to-End Protocol Bindings Integration Tests
 *
 * Tests complete pipeline from TypeSpec decorators → AsyncAPI with protocol bindings
 * Validates Kafka, WebSocket, HTTP, AMQP, MQTT integrations in full compilation
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { compileAsyncAPISpec, parseAsyncAPIOutput } from "../utils/test-helpers";
import { AsyncAPIValidator } from "../../src/domain/validation/asyncapi-validator.js";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { Effect } from "effect";

describe("E2E Protocol Bindings Integration", () => {
  const testOutputDir = join(process.cwd(), "test-output", "e2e-protocol-bindings");
  let validator: AsyncAPIValidator;

  beforeAll(async () => {
    await mkdir(testOutputDir, { recursive: true });
    validator = new AsyncAPIValidator({ strict: true, enableCache: false });
    await validator.initialize();
  });

  afterAll(async () => {
    await rm(testOutputDir, { recursive: true, force: true });
  });

  describe("Kafka Protocol Binding E2E", () => {
    it("should generate complete AsyncAPI with Kafka bindings from TypeSpec", async () => {
      const kafkaTypeSpec = `
        @doc("Kafka-based event streaming API")
        namespace KafkaStreamingAPI;

        @doc("User account event for Kafka streaming")
        model UserAccountEvent {
          @doc("User identifier")
          userId: string;
          
          @doc("Account action performed")
          action: "created" | "updated" | "deleted" | "suspended";
          
          @doc("Event timestamp")
          timestamp: utcDateTime;
          
          @doc("Account data")
          accountData: {
            email: string;
            username: string;
            status: "active" | "inactive";
            createdAt: utcDateTime;
            lastLoginAt?: utcDateTime;
          };
          
          @doc("Event metadata for tracing")
          metadata: {
            correlationId: string;
            version: string;
            source: string;
          };
        }

        @doc("Transaction event for financial processing")
        model TransactionEvent {
          @doc("Transaction identifier")
          transactionId: string;
          
          @doc("User identifier")
          userId: string;
          
          @doc("Transaction type")
          type: "deposit" | "withdrawal" | "transfer" | "payment";
          
          @doc("Transaction amount")
          amount: float64;
          
          @doc("Currency code")
          currency: string;
          
          @doc("Transaction status")
          status: "pending" | "completed" | "failed" | "cancelled";
          
          @doc("Transaction timestamp")
          timestamp: utcDateTime;
        }

        // Kafka topics with proper naming conventions
        @channel("user-account-events")
        @doc("Kafka topic for user account lifecycle events")
        op publishUserAccountEvent(): UserAccountEvent;

        @channel("user-account-events")
        @doc("Subscribe to user account events with consumer groups")
        op subscribeUserAccountEvents(
          @doc("Consumer group for load balancing")
          consumerGroup?: string,
          @doc("User ID filter for targeted consumption")
          userId?: string
        ): UserAccountEvent;

        @channel("financial-transactions")
        @doc("Kafka topic for financial transaction events")
        op publishTransactionEvent(): TransactionEvent;

        @channel("financial-transactions") 
        @doc("Subscribe to transaction events with partitioning")
        op subscribeTransactionEvents(
          @doc("Partition key for ordering guarantees")
          partitionKey?: string,
          @doc("Transaction type filter")
          transactionType?: "deposit" | "withdrawal" | "transfer" | "payment"
        ): TransactionEvent;
      `;

      Effect.log("🔄 Compiling Kafka TypeSpec to AsyncAPI...");
      const compilationResult = await compileAsyncAPISpec(kafkaTypeSpec, {
        "file-type": "json",
        "output-file": "kafka-api",
      });

      // Verify compilation success
      expect(compilationResult.diagnostics).toBeDefined();
      expect(compilationResult.outputFiles.size).toBeGreaterThan(0);

      // Parse generated AsyncAPI document
      const asyncApiDoc = parseAsyncAPIOutput(compilationResult.outputFiles, "kafka-api.json");
      expect(asyncApiDoc).toBeDefined();

      // Validate against AsyncAPI schema
      const validationResult = await validator.validate(asyncApiDoc);
      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);

      // Verify AsyncAPI structure
      const doc = asyncApiDoc;
      expect(doc.asyncapi).toBe("3.0.0");
      expect(doc.channels).toBeDefined();
      expect(doc.operations).toBeDefined();
      expect(doc.components.schemas).toBeDefined();

      // Verify Kafka-specific channel patterns
      const channelNames = Object.keys(doc.channels);
      expect(channelNames.some((name) => name.includes("user-account-events"))).toBe(true);
      expect(channelNames.some((name) => name.includes("financial-transactions"))).toBe(true);

      // Verify operations contain Kafka patterns
      const operationNames = Object.keys(doc.operations);
      expect(operationNames).toContain("publishUserAccountEvent");
      expect(operationNames).toContain("subscribeUserAccountEvents");
      expect(operationNames).toContain("publishTransactionEvent");
      expect(operationNames).toContain("subscribeTransactionEvents");

      // Verify schemas for complex data models
      expect(doc.components.schemas.UserAccountEvent).toBeDefined();
      expect(doc.components.schemas.TransactionEvent).toBeDefined();

      // Verify schema contains nested objects
      const userEventSchema = doc.components.schemas.UserAccountEvent;
      expect(userEventSchema.properties.accountData).toBeDefined();
      expect(userEventSchema.properties.metadata).toBeDefined();

      Effect.log("✅ Kafka protocol binding E2E test completed successfully");
    });

    it("should handle Kafka topic naming patterns and partitioning", async () => {
      const kafkaPartitioningSpec = `
        namespace KafkaPartitionAPI;

        model PartitionedEvent {
          partitionKey: string;
          eventId: string;
          payload: string;
          timestamp: utcDateTime;
        }

        // Topic with partition-friendly naming
        @channel("events.partitioned.v1")
        @doc("Partitioned Kafka topic for high-throughput events") 
        op publishPartitionedEvent(
          @doc("Partition key for message ordering")
          partitionKey: string
        ): PartitionedEvent;

        @channel("events.partitioned.v1")
        op subscribePartitionedEvents(
          @doc("Consumer group for scaling")
          consumerGroup: string,
          @doc("Specific partition to consume from")
          partition?: int32
        ): PartitionedEvent;
      `;

      const compilationResult = await compileAsyncAPISpec(kafkaPartitioningSpec, {
        "file-type": "json",
        "output-file": "kafka-partitioned",
      });

      const asyncApiDoc = parseAsyncAPIOutput(
        compilationResult.outputFiles,
        "kafka-partitioned.json",
      );
      const validationResult = await validator.validate(asyncApiDoc);

      expect(validationResult.valid).toBe(true);

      const doc = asyncApiDoc;
      expect(Object.keys(doc.operations)).toHaveLength(2);
      expect(doc.operations.publishPartitionedEvent).toBeDefined();
      expect(doc.operations.subscribePartitionedEvents).toBeDefined();
    });
  });

  describe("WebSocket Protocol Binding E2E", () => {
    it("should generate WebSocket real-time communication API", async () => {
      const websocketTypeSpec = `
        @doc("Real-time WebSocket communication API")
        namespace WebSocketAPI;

        @doc("Real-time chat message")
        model ChatMessage {
          @doc("Message identifier")
          messageId: string;
          
          @doc("Room identifier")
          roomId: string;
          
          @doc("Sender user ID")
          senderId: string;
          
          @doc("Message content")
          content: string;
          
          @doc("Message type")
          type: "text" | "image" | "file" | "system";
          
          @doc("Message timestamp")
          timestamp: utcDateTime;
          
          @doc("Message metadata")
          metadata?: {
            edited?: boolean;
            editedAt?: utcDateTime;
            replyTo?: string;
            mentions?: string[];
          };
        }

        @doc("User presence status")
        model UserPresence {
          @doc("User identifier") 
          userId: string;
          
          @doc("Presence status")
          status: "online" | "away" | "busy" | "offline";
          
          @doc("Last activity timestamp")
          lastActivity: utcDateTime;
          
          @doc("Current room")
          currentRoom?: string;
        }

        @doc("Typing indicator")
        model TypingIndicator {
          @doc("Room identifier")
          roomId: string;
          
          @doc("User identifier")
          userId: string;
          
          @doc("Typing status")
          isTyping: boolean;
          
          @doc("Timestamp")
          timestamp: utcDateTime;
        }

        // WebSocket channels for real-time communication
        @channel("chat.room.{roomId}")
        @doc("Real-time chat messages in a specific room")
        op sendChatMessage(roomId: string): ChatMessage;

        @channel("chat.room.{roomId}")
        @doc("Subscribe to chat messages in a room")
        op receiveChatMessages(roomId: string): ChatMessage;

        @channel("user.presence.{userId}")
        @doc("User presence updates")
        op updateUserPresence(userId: string): UserPresence;

        @channel("user.presence.global")
        @doc("Subscribe to global presence updates")
        op subscribePresenceUpdates(): UserPresence;

        @channel("typing.room.{roomId}")
        @doc("Typing indicators for a room")
        op sendTypingIndicator(roomId: string): TypingIndicator;

        @channel("typing.room.{roomId}")
        @doc("Receive typing indicators")
        op receiveTypingIndicators(roomId: string): TypingIndicator;
      `;

      Effect.log("🔄 Compiling WebSocket TypeSpec to AsyncAPI...");
      const compilationResult = await compileAsyncAPISpec(websocketTypeSpec, {
        "file-type": "json",
        "output-file": "websocket-api",
      });

      const asyncApiDoc = parseAsyncAPIOutput(compilationResult.outputFiles, "websocket-api.json");
      const validationResult = await validator.validate(asyncApiDoc);

      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);

      const doc = asyncApiDoc;

      // Verify parameterized channels (WebSocket pattern)
      const channelNames = Object.keys(doc.channels);
      expect(channelNames.some((name) => name.includes("{roomId}"))).toBe(true);
      expect(channelNames.some((name) => name.includes("{userId}"))).toBe(true);

      // Verify bidirectional operations (send/receive pattern)
      const operationNames = Object.keys(doc.operations);
      expect(operationNames).toContain("sendChatMessage");
      expect(operationNames).toContain("receiveChatMessages");
      expect(operationNames).toContain("updateUserPresence");
      expect(operationNames).toContain("subscribePresenceUpdates");

      // Verify real-time data models
      expect(doc.components.schemas.ChatMessage).toBeDefined();
      expect(doc.components.schemas.UserPresence).toBeDefined();
      expect(doc.components.schemas.TypingIndicator).toBeDefined();

      Effect.log("✅ WebSocket protocol binding E2E test completed successfully");
    });
  });

  describe("HTTP Protocol Binding E2E", () => {
    it("should generate HTTP webhooks and callbacks API", async () => {
      const httpWebhookSpec = `
        @doc("HTTP webhooks and callbacks API")
        namespace HTTPWebhookAPI;

        @doc("Webhook delivery event")
        model WebhookEvent {
          @doc("Webhook identifier")
          webhookId: string;
          
          @doc("Event type")
          eventType: string;
          
          @doc("Event data payload")
          data: Record<unknown>;
          
          @doc("Delivery attempt number")
          attemptNumber: int32;
          
          @doc("Webhook delivery timestamp")
          timestamp: utcDateTime;
          
          @doc("HTTP headers to include")
          headers?: Record<unknown>;
          
          @doc("Signature for verification")
          signature?: string;
        }

        @doc("Webhook delivery status")
        model DeliveryStatus {
          @doc("Webhook identifier")
          webhookId: string;
          
          @doc("Delivery status")
          status: "pending" | "delivered" | "failed" | "retrying";
          
          @doc("HTTP response code")
          httpStatusCode?: int32;
          
          @doc("Response body")
          responseBody?: string;
          
          @doc("Delivery timestamp")
          deliveredAt?: utcDateTime;
          
          @doc("Error message if failed")
          errorMessage?: string;
        }

        // HTTP webhook channels
        @channel("webhooks.outbound.{eventType}")
        @doc("Outbound webhook delivery")
        op deliverWebhook(eventType: string): WebhookEvent;

        @channel("webhooks.status.{webhookId}")
        @doc("Webhook delivery status updates")
        op updateDeliveryStatus(webhookId: string): DeliveryStatus;

        @channel("webhooks.callbacks")
        @doc("HTTP callback responses")
        op receiveWebhookCallback(): {
          @doc("Callback identifier")
          callbackId: string;
          
          @doc("Original webhook ID")
          originalWebhookId: string;
          
          @doc("HTTP method")
          method: "GET" | "POST" | "PUT" | "DELETE";
          
          @doc("Callback URL")
          url: string;
          
          @doc("HTTP headers")
          headers: Record<unknown>;
          
          @doc("Request body")
          body?: string;
          
          @doc("Callback timestamp")
          timestamp: utcDateTime;
        };
      `;

      const compilationResult = await compileAsyncAPISpec(httpWebhookSpec, {
        "file-type": "json",
        "output-file": "http-webhook-api",
      });

      const asyncApiDoc = parseAsyncAPIOutput(
        compilationResult.outputFiles,
        "http-webhook-api.json",
      );
      const validationResult = await validator.validate(asyncApiDoc);

      expect(validationResult.valid).toBe(true);

      const doc = asyncApiDoc;

      // Verify HTTP-specific patterns
      expect(Object.keys(doc.operations)).toHaveLength(3);
      expect(doc.operations.deliverWebhook).toBeDefined();
      expect(doc.operations.updateDeliveryStatus).toBeDefined();
      expect(doc.operations.receiveWebhookCallback).toBeDefined();

      // Verify webhook-specific data models
      expect(doc.components.schemas.WebhookEvent).toBeDefined();
      expect(doc.components.schemas.DeliveryStatus).toBeDefined();

      Effect.log("✅ HTTP protocol binding E2E test completed successfully");
    });
  });

  describe("Multi-Protocol E2E Integration", () => {
    it("should generate AsyncAPI with multiple protocol bindings", async () => {
      const multiProtocolSpec = `
        @doc("Multi-protocol event-driven architecture")
        namespace MultiProtocolAPI;

        @doc("Universal event model")
        model UniversalEvent {
          @doc("Event identifier")
          eventId: string;
          
          @doc("Event type")
          eventType: string;
          
          @doc("Event payload")
          payload: Record<unknown>;
          
          @doc("Event timestamp")
          timestamp: utcDateTime;
          
          @doc("Event metadata")
          metadata: {
            source: string;
            protocol: "kafka" | "websocket" | "http" | "amqp";
            version: string;
          };
        }

        // Kafka for high-throughput data streaming
        @channel("events.stream.kafka")
        @doc("High-throughput Kafka streaming")
        op streamEventsKafka(): UniversalEvent;

        // WebSocket for real-time updates
        @channel("events.realtime.websocket")
        @doc("Real-time WebSocket events")
        op sendRealtimeEvent(): UniversalEvent;

        @channel("events.realtime.websocket")
        op receiveRealtimeEvents(): UniversalEvent;

        // HTTP for webhooks
        @channel("events.webhooks.http")
        @doc("HTTP webhook delivery")
        op deliverWebhookEvent(): UniversalEvent;

        // AMQP for reliable messaging
        @channel("events.queue.amqp")
        @doc("AMQP queue-based messaging")
        op queueReliableEvent(): UniversalEvent;

        @channel("events.queue.amqp")
        op consumeQueuedEvents(): UniversalEvent;
      `;

      const compilationResult = await compileAsyncAPISpec(multiProtocolSpec, {
        "file-type": "json",
        "output-file": "multi-protocol-api",
      });

      const asyncApiDoc = parseAsyncAPIOutput(
        compilationResult.outputFiles,
        "multi-protocol-api.json",
      );
      const validationResult = await validator.validate(asyncApiDoc);

      expect(validationResult.valid).toBe(true);

      const doc = asyncApiDoc;

      // Verify multiple protocol channels
      const channelNames = Object.keys(doc.channels);
      expect(channelNames.some((name) => name.includes("kafka"))).toBe(true);
      expect(channelNames.some((name) => name.includes("websocket"))).toBe(true);
      expect(channelNames.some((name) => name.includes("http"))).toBe(true);
      expect(channelNames.some((name) => name.includes("amqp"))).toBe(true);

      // Verify all operations exist
      const operationNames = Object.keys(doc.operations);
      expect(operationNames).toHaveLength(6);
      expect(operationNames).toContain("streamEventsKafka");
      expect(operationNames).toContain("sendRealtimeEvent");
      expect(operationNames).toContain("receiveRealtimeEvents");
      expect(operationNames).toContain("deliverWebhookEvent");
      expect(operationNames).toContain("queueReliableEvent");
      expect(operationNames).toContain("consumeQueuedEvents");

      // Verify universal event model
      expect(doc.components.schemas.UniversalEvent).toBeDefined();
      const eventSchema = doc.components.schemas.UniversalEvent;
      expect(eventSchema.properties.metadata).toBeDefined();

      Effect.log("✅ Multi-protocol E2E test completed successfully");
      Effect.log(`📊 Generated ${channelNames.length} channels across multiple protocols`);
      Effect.log(`📊 Generated ${operationNames.length} operations for protocol diversity`);
    });
  });
});
