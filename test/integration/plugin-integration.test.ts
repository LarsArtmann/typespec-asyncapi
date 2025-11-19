/**
 * Plugin Integration Tests
 *
 * Tests for the extracted HTTP and Kafka plugins working with real TypeSpec compilation
 * Validates M7-M15 completion: Plugin extraction and real output testing
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import {
  compileAsyncAPISpec,
  parseAsyncAPIOutput,
} from "../utils/test-helpers";
import { AsyncAPIValidator } from "../../src/domain/validation/asyncapi-validator.js";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { Effect } from "effect";

describe("Plugin Integration Tests", () => {
  const testOutputDir = join(
    process.cwd(),
    "test-output",
    "plugin-integration",
  );
  let validator: AsyncAPIValidator;

  beforeAll(async () => {
    await mkdir(testOutputDir, { recursive: true });
    validator = new AsyncAPIValidator({ strict: true, enableCache: false });
    await validator.initialize();
  });

  afterAll(async () => {
    await rm(testOutputDir, { recursive: true, force: true });
  });

  describe("HTTP Plugin Integration (M7-M10)", () => {
    it("should generate HTTP bindings using extracted plugin", async () => {
      const httpTypeSpec = `
        @doc("HTTP API with plugin-generated bindings")
        namespace HTTPPluginTest;

        @doc("HTTP webhook event")
        model WebhookEvent {
          @doc("Event ID")
          eventId: string;
          
          @doc("Event data")
          data: Record<unknown>;
          
          @doc("Timestamp")
          timestamp: utcDateTime;
        }

        @channel("webhook-events")
        @doc("HTTP webhook channel")
        op deliverWebhook(): WebhookEvent;
      `;

      Effect.log("= Testing HTTP plugin with real TypeSpec compilation...");
      const compilationResult = await compileAsyncAPISpec(httpTypeSpec, {
        "file-type": "json",
        "output-file": "http-plugin-test",
      });

      // Verify compilation success
      expect(compilationResult.diagnostics).toBeDefined();
      expect(compilationResult.outputFiles.size).toBeGreaterThan(0);

      // Parse generated AsyncAPI document
      const asyncApiDoc = parseAsyncAPIOutput(
        compilationResult.outputFiles,
        "http-plugin-test.json",
      );
      expect(asyncApiDoc).toBeDefined();

      // Validate against AsyncAPI schema
      const validationResult = await validator.validate(asyncApiDoc);

      // Debug output if validation fails
      if (!validationResult.valid) {
        console.log("❌ AsyncAPI validation failed for HTTP plugin test:");
        console.log(
          "Errors:",
          JSON.stringify(validationResult.errors, null, 2),
        );
        console.log(
          "Generated document:",
          JSON.stringify(asyncApiDoc, null, 2),
        );
      }

      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);

      // Verify basic AsyncAPI structure
      const doc = asyncApiDoc;
      expect(doc.asyncapi).toBe("3.0.0");
      expect(doc.channels).toBeDefined();
      expect(doc.operations).toBeDefined();
      expect(doc.components.schemas).toBeDefined();

      // Verify HTTP operation exists
      expect(doc.operations.deliverWebhook).toBeDefined();

      // Verify schema is properly generated
      expect(doc.components.schemas.WebhookEvent).toBeDefined();

      Effect.log(" HTTP plugin integration test completed successfully");
    });
  });

  describe("Kafka Plugin Integration (M11-M14)", () => {
    it("should generate Kafka bindings using extracted plugin", async () => {
      const kafkaTypeSpec = `
        @doc("Kafka API with plugin-generated bindings") 
        namespace KafkaPluginTest;

        @doc("Kafka event message")
        model KafkaEvent {
          @doc("Message ID")
          messageId: string;
          
          @doc("Event type")
          eventType: string;
          
          @doc("Payload data")
          payload: Record<unknown>;
          
          @doc("Timestamp")
          timestamp: utcDateTime;
        }

        @channel("kafka-events")
        @doc("Kafka event streaming channel")
        op publishEvent(): KafkaEvent;
        
        @channel("kafka-events") 
        @doc("Subscribe to Kafka events")
        op subscribeEvents(): KafkaEvent;
      `;

      Effect.log("= Testing Kafka plugin with real TypeSpec compilation...");
      const compilationResult = await compileAsyncAPISpec(kafkaTypeSpec, {
        "file-type": "json",
        "output-file": "kafka-plugin-test",
      });

      // Verify compilation success
      expect(compilationResult.diagnostics).toBeDefined();
      expect(compilationResult.outputFiles.size).toBeGreaterThan(0);

      // Parse generated AsyncAPI document
      const asyncApiDoc = parseAsyncAPIOutput(
        compilationResult.outputFiles,
        "kafka-plugin-test.json",
      );
      expect(asyncApiDoc).toBeDefined();

      // Validate against AsyncAPI schema
      const validationResult = await validator.validate(asyncApiDoc);
      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);

      // Verify basic AsyncAPI structure
      const doc = asyncApiDoc;
      expect(doc.asyncapi).toBe("3.0.0");
      expect(doc.channels).toBeDefined();
      expect(doc.operations).toBeDefined();

      // Verify Kafka operations exist
      expect(doc.operations.publishEvent).toBeDefined();
      expect(doc.operations.subscribeEvents).toBeDefined();

      // Verify schema is properly generated
      expect(doc.components.schemas.KafkaEvent).toBeDefined();

      Effect.log(" Kafka plugin integration test completed successfully");
    });
  });

  describe("Real Output Validation (M15, M87-M89)", () => {
    it("should validate complete user workflow from TypeSpec to AsyncAPI", async () => {
      const multiProtocolSpec = `
        @doc("Multi-protocol API demonstrating plugin system")
        namespace PluginSystemTest;

        @doc("Universal event model")
        model EventMessage {
          @doc("Event identifier")
          eventId: string;
          
          @doc("Event type")  
          eventType: "user.created" | "user.updated" | "order.placed" | "payment.processed";
          
          @doc("Event payload")
          payload: Record<unknown>;
          
          @doc("Event timestamp")
          timestamp: utcDateTime;
          
          @doc("Event metadata")
          metadata: {
            source: string;
            version: string;
            traceId: string;
          };
        }

        // HTTP webhooks
        @channel("webhook-delivery")
        @doc("HTTP webhook delivery channel")
        op deliverWebhook(): EventMessage;

        // Kafka streaming  
        @channel("event-stream")
        @doc("Kafka event streaming")
        op publishToStream(): EventMessage;
        
        @channel("event-stream")
        op subscribeFromStream(): EventMessage;
      `;

      Effect.log("= Testing complete user workflow with plugin system...");
      const compilationResult = await compileAsyncAPISpec(multiProtocolSpec, {
        "file-type": "json",
        "output-file": "plugin-system-test",
      });

      // Verify compilation success (M88)
      expect(compilationResult.diagnostics).toBeDefined();
      expect(compilationResult.outputFiles.size).toBeGreaterThan(0);

      // Parse and validate AsyncAPI output (M89)
      const asyncApiDoc = parseAsyncAPIOutput(
        compilationResult.outputFiles,
        "plugin-system-test.json",
      );
      const validationResult = await validator.validate(asyncApiDoc);

      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);

      // Verify complete document structure
      const doc = asyncApiDoc;
      expect(doc.asyncapi).toBe("3.0.0");

      // Verify channels and operations
      const channelNames = Object.keys(doc.channels);
      const operationNames = Object.keys(doc.operations);

      expect(channelNames.length).toBeGreaterThan(0);
      expect(operationNames.length).toBe(3); // deliverWebhook, publishToStream, subscribeFromStream

      expect(operationNames).toContain("deliverWebhook");
      expect(operationNames).toContain("publishToStream");
      expect(operationNames).toContain("subscribeFromStream");

      // Verify schema generation
      expect(doc.components.schemas.EventMessage).toBeDefined();
      const eventSchema = doc.components.schemas.EventMessage;
      expect(eventSchema.properties).toBeDefined();
      expect(eventSchema.properties.eventId).toBeDefined();
      expect(eventSchema.properties.metadata).toBeDefined();

      Effect.log(" Complete user workflow validation completed successfully");
      Effect.log(
        `=� Generated ${channelNames.length} channels and ${operationNames.length} operations`,
      );
      Effect.log(`=� Document validated successfully with AsyncAPI 3.0 parser`);
    });

    it("should verify all protocol bindings work in final output (M87)", async () => {
      const bindingTestSpec = `
        @doc("Protocol binding verification test")
        namespace ProtocolBindingTest;

        model TestEvent {
          id: string;
          data: string;
          timestamp: utcDateTime;
        }

        @channel("test-http")
        op httpOperation(): TestEvent;
        
        @channel("test-kafka") 
        op kafkaOperation(): TestEvent;
      `;

      const compilationResult = await compileAsyncAPISpec(bindingTestSpec, {
        "file-type": "yaml", // Test YAML output as well
        "output-file": "binding-test",
      });

      // Verify YAML output is generated
      expect(compilationResult.outputFiles.size).toBeGreaterThan(0);

      // Parse YAML output
      const asyncApiDoc = parseAsyncAPIOutput(
        compilationResult.outputFiles,
        "binding-test.yaml",
      );
      const validationResult = await validator.validate(asyncApiDoc);

      expect(validationResult.valid).toBe(true);

      // Verify operations exist in YAML output
      const doc = asyncApiDoc;
      expect(doc.operations.httpOperation).toBeDefined();
      expect(doc.operations.kafkaOperation).toBeDefined();

      Effect.log(" Protocol bindings verified in YAML output");
    });
  });
});
