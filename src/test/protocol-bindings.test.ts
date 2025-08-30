/**
 * Protocol Binding Tests
 * 
 * Tests for the type-safe protocol binding system
 */
import { test, expect } from "bun:test";
import { 
  ProtocolBindingFactory, 
  ProtocolUtils, 
  KafkaProtocolBinding,
  WebSocketProtocolBinding,
  HttpProtocolBinding 
} from "../protocol-bindings.js";
import type { ProtocolType } from "../types/protocol-bindings.js";

test("Protocol binding factory creates Kafka server bindings safely", () => {
  const serverBindings = ProtocolBindingFactory.createServerBindings("kafka", {
    schemaRegistryUrl: "http://localhost:8081",
    clientId: "test-client",
  });

  expect(serverBindings).toBeDefined();
  expect(serverBindings?.kafka).toBeDefined();
  expect(serverBindings?.kafka?.schemaRegistryUrl).toBe("http://localhost:8081");
  expect(serverBindings?.kafka?.clientId).toBe("test-client");
  expect(serverBindings?.kafka?.bindingVersion).toBe("0.5.0");
});

test("Protocol binding factory handles undefined config safely", () => {
  const serverBindings = ProtocolBindingFactory.createServerBindings("kafka", undefined);

  expect(serverBindings).toBeDefined();
  expect(serverBindings?.kafka).toBeDefined();
  expect(serverBindings?.kafka?.bindingVersion).toBe("0.5.0");
});

test("Protocol binding factory creates channel bindings with type safety", () => {
  const channelBindings = ProtocolBindingFactory.createChannelBindings("kafka", {
    topic: "user-events",
    partitions: 3,
    replicas: 2,
  });

  expect(channelBindings).toBeDefined();
  expect(channelBindings?.kafka).toBeDefined();
  expect(channelBindings?.kafka?.topic).toBe("user-events");
  expect(channelBindings?.kafka?.partitions).toBe(3);
  expect(channelBindings?.kafka?.replicas).toBe(2);
});

test("Protocol binding factory creates WebSocket channel bindings", () => {
  const channelBindings = ProtocolBindingFactory.createChannelBindings("ws", {
    method: "GET",
    headers: { type: "object" },
  });

  expect(channelBindings).toBeDefined();
  expect(channelBindings?.ws).toBeDefined();
  expect(channelBindings?.ws?.method).toBe("GET");
  expect(channelBindings?.ws?.bindingVersion).toBe("0.1.0");
});

test("Protocol binding validation works correctly", () => {
  const result = ProtocolBindingFactory.validateBinding("kafka", "channel", {
    channel: {
      partitions: 0, // Invalid - should be positive
      replicas: -1,   // Invalid - should be positive
    },
  });

  expect(result.isValid).toBe(false);
  expect(result.errors.length).toBeGreaterThan(0);
  
  // Check that we get validation errors for invalid values
  const partitionsError = result.errors.find(e => e.property === "partitions");
  const replicasError = result.errors.find(e => e.property === "replicas");
  
  // At least one should be present
  expect(partitionsError || replicasError).toBeDefined();
  
  if (partitionsError) {
    expect(partitionsError.protocol).toBe("kafka");
    expect(partitionsError.bindingType).toBe("channel");
    expect(partitionsError.severity).toBe("error");
  }
});

test("Protocol utils correctly identifies protocol support", () => {
  expect(ProtocolUtils.supportsBinding("kafka", "server")).toBe(true);
  expect(ProtocolUtils.supportsBinding("kafka", "channel")).toBe(true);
  expect(ProtocolUtils.supportsBinding("kafka", "operation")).toBe(true);
  expect(ProtocolUtils.supportsBinding("kafka", "message")).toBe(true);

  expect(ProtocolUtils.supportsBinding("ws", "server")).toBe(false);
  expect(ProtocolUtils.supportsBinding("ws", "channel")).toBe(true);
  expect(ProtocolUtils.supportsBinding("ws", "message")).toBe(true);

  expect(ProtocolUtils.supportsBinding("http", "operation")).toBe(true);
  expect(ProtocolUtils.supportsBinding("http", "message")).toBe(true);
  expect(ProtocolUtils.supportsBinding("http", "server")).toBe(false);
});

test("Protocol utils extracts protocol from URLs correctly", () => {
  expect(ProtocolUtils.extractProtocol("kafka://localhost:9092")).toBe("kafka");
  expect(ProtocolUtils.extractProtocol("ws://localhost:8080")).toBe("ws");
  expect(ProtocolUtils.extractProtocol("https://api.example.com")).toBe("https");
  expect(ProtocolUtils.extractProtocol("invalid://unknown")).toBe(null);
});

test("Kafka protocol binding builder creates valid bindings", () => {
  const serverBinding = KafkaProtocolBinding.createServerBinding({
    schemaRegistryUrl: "http://localhost:8081",
    clientId: "test-client",
  });

  expect(serverBinding.bindingVersion).toBe("0.5.0");
  expect(serverBinding.schemaRegistryUrl).toBe("http://localhost:8081");
  expect(serverBinding.clientId).toBe("test-client");
});

test("Protocol binding factory gets default configurations", () => {
  const kafkaDefaults = ProtocolBindingFactory.getDefaultConfig("kafka");
  
  expect(kafkaDefaults).toBeDefined();
  // Type assertion is safe here for testing purposes
  const kafkaConfig = kafkaDefaults as any;
  expect(kafkaConfig.server?.schemaRegistryVendor).toBe("confluent");
  expect(kafkaConfig.channel?.partitions).toBe(1);
  expect(kafkaConfig.channel?.replicas).toBe(1);
});