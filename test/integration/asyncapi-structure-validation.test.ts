/**
 * AsyncAPI Output Structure Validation Test
 *
 * Validates that generated AsyncAPI output has the correct structure
 * without using the official parser (which has compatibility issues).
 */

import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import YAML from "yaml";

const execAsync = promisify(exec);

describe("AsyncAPI Output Structure Validation", () => {
  const testDir = join(process.cwd(), "test-structure-validation");
  const tspFile = join(testDir, "structure-test.tsp");
  const outputDir = join(process.cwd(), "tsp-test", "@lars-artmann", "typespec-asyncapi");
  const asyncapiFile = join(outputDir, "AsyncAPI.yaml");

  beforeAll(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });

    // Create test TypeSpec file with all features
    const tspContent = `
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

namespace StructureTest;

@server({
  name: "production",
  url: "kafka.prod.example.com:9092",
  protocol: "kafka",
  description: "Production Kafka cluster",
})
namespace TestService {
  @protocol({
    protocol: "kafka",
    partitions: 3,
    replicationFactor: 2,
  })
  @tags(#["orders", "ecommerce"])
  @correlationId("$message.header#/correlation-id")
  @message({
    title: "Order Created",
    description: "Order created event",
  })
  model OrderCreated {
    orderId: string;
    @header("X-Correlation-ID", "Correlation ID")
    correlationId: string;
    customerId: string;
    amount: decimal;
  }

  @channel("orders/{orderId}")
  @security({
    name: "bearerAuth",
    scheme: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  })
  @publish
  op publishOrderCreated(): OrderCreated;

  @channel("orders/{orderId}")
  @subscribe
  op subscribeOrderCreated(): OrderCreated;
}
`;
    await fs.writeFile(tspFile, tspContent, "utf-8");

    // Compile
    await execAsync(
      `npx tsp compile ${tspFile} --emit @lars-artmann/typespec-asyncapi`,
      { cwd: testDir },
    );
  });

  afterAll(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn("Failed to clean up", testDir, error);
    }
  });

  it("should have valid AsyncAPI 3.0 structure", async () => {
    const content = await fs.readFile(asyncapiFile, "utf-8");
    const asyncapi = YAML.parse(content);

    // Required fields
    expect(asyncapi.asyncapi).toBe("3.0.0");
    expect(asyncapi.info).toBeDefined();
    expect(asyncapi.info.title).toBeDefined();
    expect(asyncapi.info.version).toBeDefined();
    expect(asyncapi.channels).toBeDefined();
    expect(Object.keys(asyncapi.channels).length).toBeGreaterThan(0);
    expect(asyncapi.operations).toBeDefined();
    expect(Object.keys(asyncapi.operations).length).toBeGreaterThan(0);
    expect(asyncapi.components).toBeDefined();
    expect(asyncapi.components.messages).toBeDefined();
    expect(asyncapi.components.schemas).toBeDefined();

    console.log("✅ AsyncAPI structure validation PASSED!");
  });

  it("should have valid channels structure", async () => {
    const content = await fs.readFile(asyncapiFile, "utf-8");
    const asyncapi = YAML.parse(content);

    for (const [name, channel] of Object.entries(asyncapi.channels)) {
      const ch = channel as Record<string, unknown>;
      expect(ch).toHaveProperty("address");
      expect(ch).toHaveProperty("messages");
      expect(typeof ch.address).toBe("string");
      expect(typeof ch.messages).toBe("object");
    }

    console.log("✅ Channels structure validation PASSED!");
  });

  it("should have valid operations structure", async () => {
    const content = await fs.readFile(asyncapiFile, "utf-8");
    const asyncapi = YAML.parse(content);

    for (const [name, operation] of Object.entries(asyncapi.operations)) {
      const op = operation as Record<string, unknown>;
      expect(op).toHaveProperty("action");
      expect(op).toHaveProperty("channel");
      expect(op).toHaveProperty("messages");
      expect(["send", "receive"]).toContain(op.action);
      expect(op.channel).toHaveProperty("$ref");
      expect(Array.isArray(op.messages)).toBe(true);
    }

    console.log("✅ Operations structure validation PASSED!");
  });

  it("should have valid messages structure", async () => {
    const content = await fs.readFile(asyncapiFile, "utf-8");
    const asyncapi = YAML.parse(content);

    for (const [name, message] of Object.entries(asyncapi.components.messages)) {
      const msg = message as Record<string, unknown>;
      expect(msg).toHaveProperty("name");
      expect(msg).toHaveProperty("payload");
      expect(msg.payload).toHaveProperty("$ref");
    }

    console.log("✅ Messages structure validation PASSED!");
  });

  it("should have valid security schemes", async () => {
    const content = await fs.readFile(asyncapiFile, "utf-8");
    const asyncapi = YAML.parse(content);

    expect(asyncapi.components.securitySchemes).toBeDefined();
    expect(asyncapi.components.securitySchemes.bearerAuth).toBeDefined();
    expect(asyncapi.components.securitySchemes.bearerAuth.type).toBe("http");
    expect(asyncapi.components.securitySchemes.bearerAuth.scheme).toBe("bearer");

    console.log("✅ Security schemes validation PASSED!");
  });

  it("should have operation security references", async () => {
    const content = await fs.readFile(asyncapiFile, "utf-8");
    const asyncapi = YAML.parse(content);

    const publishOp = asyncapi.operations.publishOrderCreated;
    expect(publishOp).toBeDefined();
    expect(publishOp.security).toBeDefined();
    expect(Array.isArray(publishOp.security)).toBe(true);
    expect(publishOp.security[0]).toHaveProperty("bearerAuth");

    console.log("✅ Operation security references validation PASSED!");
  });

  it("should have message tags", async () => {
    const content = await fs.readFile(asyncapiFile, "utf-8");
    const asyncapi = YAML.parse(content);

    const message = asyncapi.components.messages.OrderCreated;
    expect(message).toBeDefined();
    expect(message.tags).toBeDefined();
    expect(Array.isArray(message.tags)).toBe(true);
    expect(message.tags.length).toBe(2);
    expect(message.tags[0]).toHaveProperty("name");
    expect(message.tags[0].name).toBe("orders");

    console.log("✅ Message tags validation PASSED!");
  });

  it("should have correlation ID in message", async () => {
    const content = await fs.readFile(asyncapiFile, "utf-8");
    const asyncapi = YAML.parse(content);

    const message = asyncapi.components.messages.OrderCreated;
    expect(message).toBeDefined();
    expect(message.correlationId).toBeDefined();
    expect(message.correlationId.location).toBe("$message.header#/correlation-id");

    console.log("✅ Correlation ID validation PASSED!");
  });

  it("should have headers in message", async () => {
    const content = await fs.readFile(asyncapiFile, "utf-8");
    const asyncapi = YAML.parse(content);

    const message = asyncapi.components.messages.OrderCreated;
    expect(message).toBeDefined();
    expect(message.headers).toBeDefined();
    expect(message.headers.type).toBe("object");
    expect(message.headers.properties).toBeDefined();
    expect(message.headers.properties["X-Correlation-ID"]).toBeDefined();

    console.log("✅ Message headers validation PASSED!");
  });
});
