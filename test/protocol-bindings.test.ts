/**
 * Comprehensive tests for Protocol Binding Foundation
 * 
 * Tests Kafka, WebSocket, and HTTP protocol bindings
 */

import { describe, it, expect } from "vitest";
import {
  KafkaProtocolBinding,
  WebSocketProtocolBinding,
  HttpProtocolBinding,
  ProtocolBindingFactory,
  ProtocolUtils,
  type ProtocolType,
} from "../src/protocol-bindings.js";

describe("Protocol Bindings Foundation", () => {
  describe("Kafka Protocol Binding", () => {
    describe("Server Binding", () => {
      it("should create kafka server binding with basic configuration", () => {
        const binding = KafkaProtocolBinding.createServerBinding({
          schemaRegistryUrl: "http://schema-registry.example.com:8081",
          schemaRegistryVendor: "confluent",
          clientId: "test-client",
          groupId: "test-group",
        });

        expect(binding).toEqual({
          bindingVersion: "0.5.0",
          schemaRegistryUrl: "http://schema-registry.example.com:8081",
          schemaRegistryVendor: "confluent",
          clientId: "test-client",
          groupId: "test-group",
        });
      });

      it("should create minimal kafka server binding", () => {
        const binding = KafkaProtocolBinding.createServerBinding({});

        expect(binding).toEqual({
          bindingVersion: "0.5.0",
        });
      });
    });

    describe("Channel Binding", () => {
      it("should create kafka channel binding with topic configuration", () => {
        const binding = KafkaProtocolBinding.createChannelBinding({
          topic: "user-events",
          partitions: 3,
          replicas: 2,
          topicConfiguration: {
            "cleanup.policy": ["delete"],
            "retention.ms": 86400000,
            "max.message.bytes": 1048576,
          },
        });

        expect(binding).toEqual({
          bindingVersion: "0.5.0",
          topic: "user-events",
          partitions: 3,
          replicas: 2,
          topicConfiguration: {
            "cleanup.policy": ["delete"],
            "retention.ms": 86400000,
            "max.message.bytes": 1048576,
          },
        });
      });
    });

    describe("Operation Binding", () => {
      it("should create kafka operation binding with group and client configuration", () => {
        const binding = KafkaProtocolBinding.createOperationBinding({
          groupId: {
            type: "string",
            enum: ["group-1", "group-2"],
            description: "Consumer group ID",
          },
          clientId: {
            type: "string",
            description: "Kafka client identifier",
          },
        });

        expect(binding).toEqual({
          bindingVersion: "0.5.0",
          groupId: {
            type: "string",
            enum: ["group-1", "group-2"],
            description: "Consumer group ID",
          },
          clientId: {
            type: "string",
            description: "Kafka client identifier",
          },
        });
      });
    });

    describe("Message Binding", () => {
      it("should create kafka message binding with key and schema configuration", () => {
        const binding = KafkaProtocolBinding.createMessageBinding({
          key: {
            type: "string",
            description: "Message key for partitioning",
          },
          schemaIdLocation: "payload",
          schemaIdPayloadEncoding: "apicurio-new",
          schemaLookupStrategy: "TopicIdStrategy",
        });

        expect(binding).toEqual({
          bindingVersion: "0.5.0",
          key: {
            type: "string",
            description: "Message key for partitioning",
          },
          schemaIdLocation: "payload",
          schemaIdPayloadEncoding: "apicurio-new",
          schemaLookupStrategy: "TopicIdStrategy",
        });
      });
    });
  });

  describe("WebSocket Protocol Binding", () => {
    describe("Channel Binding", () => {
      it("should create websocket channel binding with method and headers", () => {
        const binding = WebSocketProtocolBinding.createChannelBinding({
          method: "GET",
          query: {
            type: "object",
            properties: {
              token: { type: "string" },
            },
          },
          headers: {
            type: "object",
            properties: {
              "Authorization": { type: "string" },
            },
          },
        });

        expect(binding).toEqual({
          bindingVersion: "0.1.0",
          method: "GET",
          query: {
            type: "object",
            properties: {
              token: { type: "string" },
            },
          },
          headers: {
            type: "object",
            properties: {
              "Authorization": { type: "string" },
            },
          },
        });
      });

      it("should create websocket channel binding with POST method", () => {
        const binding = WebSocketProtocolBinding.createChannelBinding({
          method: "POST",
        });

        expect(binding).toEqual({
          bindingVersion: "0.1.0",
          method: "POST",
        });
      });
    });

    describe("Message Binding", () => {
      it("should create websocket message binding", () => {
        const binding = WebSocketProtocolBinding.createMessageBinding();

        expect(binding).toEqual({
          bindingVersion: "0.1.0",
        });
      });
    });
  });

  describe("HTTP Protocol Binding", () => {
    describe("Operation Binding", () => {
      it("should create http operation binding for request", () => {
        const binding = HttpProtocolBinding.createOperationBinding({
          type: "request",
          method: "POST",
          query: {
            type: "object",
            properties: {
              version: { type: "string" },
            },
          },
        });

        expect(binding).toEqual({
          bindingVersion: "0.3.0",
          type: "request",
          method: "POST",
          query: {
            type: "object",
            properties: {
              version: { type: "string" },
            },
          },
        });
      });

      it("should create http operation binding for response", () => {
        const binding = HttpProtocolBinding.createOperationBinding({
          type: "response",
          statusCode: 201,
        });

        expect(binding).toEqual({
          bindingVersion: "0.3.0",
          type: "response",
          statusCode: 201,
        });
      });
    });

    describe("Message Binding", () => {
      it("should create http message binding with headers and status code", () => {
        const binding = HttpProtocolBinding.createMessageBinding({
          headers: {
            type: "object",
            properties: {
              "Content-Type": { type: "string" },
              "X-Correlation-ID": { type: "string" },
            },
          },
          statusCode: 200,
        });

        expect(binding).toEqual({
          bindingVersion: "0.3.0",
          headers: {
            type: "object",
            properties: {
              "Content-Type": { type: "string" },
              "X-Correlation-ID": { type: "string" },
            },
          },
          statusCode: 200,
        });
      });
    });
  });

  describe("Protocol Binding Factory", () => {
    describe("Server Bindings", () => {
      it("should create kafka server bindings", () => {
        const bindings = ProtocolBindingFactory.createServerBindings("kafka", {
          schemaRegistryUrl: "http://localhost:8081",
          clientId: "test-app",
        });

        expect(bindings).toEqual({
          kafka: {
            bindingVersion: "0.5.0",
            schemaRegistryUrl: "http://localhost:8081",
            clientId: "test-app",
          },
        });
      });

      it("should return undefined for unsupported protocol server bindings", () => {
        const bindings = ProtocolBindingFactory.createServerBindings("ws", {});
        expect(bindings).toBeUndefined();
      });
    });

    describe("Channel Bindings", () => {
      it("should create kafka channel bindings", () => {
        const bindings = ProtocolBindingFactory.createChannelBindings("kafka", {
          topic: "events",
          partitions: 3,
        });

        expect(bindings).toEqual({
          kafka: {
            bindingVersion: "0.5.0",
            topic: "events",
            partitions: 3,
          },
        });
      });

      it("should create websocket channel bindings", () => {
        const bindings = ProtocolBindingFactory.createChannelBindings("ws", {
          method: "GET",
        });

        expect(bindings).toEqual({
          ws: {
            bindingVersion: "0.1.0",
            method: "GET",
          },
        });
      });
    });

    describe("Operation Bindings", () => {
      it("should create kafka operation bindings", () => {
        const bindings = ProtocolBindingFactory.createOperationBindings("kafka", {
          groupId: { type: "string", description: "Consumer group" },
        });

        expect(bindings).toEqual({
          kafka: {
            bindingVersion: "0.5.0",
            groupId: { type: "string", description: "Consumer group" },
          },
        });
      });

      it("should create http operation bindings", () => {
        const bindings = ProtocolBindingFactory.createOperationBindings("http", {
          method: "POST",
          type: "request",
        });

        expect(bindings).toEqual({
          http: {
            bindingVersion: "0.3.0",
            method: "POST",
            type: "request",
          },
        });
      });

      it("should create https operation bindings (mapped to http)", () => {
        const bindings = ProtocolBindingFactory.createOperationBindings("https", {
          method: "GET",
        });

        expect(bindings).toEqual({
          http: {
            bindingVersion: "0.3.0",
            method: "GET",
          },
        });
      });
    });

    describe("Message Bindings", () => {
      it("should create kafka message bindings", () => {
        const bindings = ProtocolBindingFactory.createMessageBindings("kafka", {
          key: { type: "string" },
          schemaIdLocation: "header",
        });

        expect(bindings).toEqual({
          kafka: {
            bindingVersion: "0.5.0",
            key: { type: "string" },
            schemaIdLocation: "header",
          },
        });
      });

      it("should create websocket message bindings", () => {
        const bindings = ProtocolBindingFactory.createMessageBindings("ws", {});

        expect(bindings).toEqual({
          ws: {
            bindingVersion: "0.1.0",
          },
        });
      });

      it("should create http message bindings", () => {
        const bindings = ProtocolBindingFactory.createMessageBindings("http", {
          statusCode: 202,
        });

        expect(bindings).toEqual({
          http: {
            bindingVersion: "0.3.0",
            statusCode: 202,
          },
        });
      });
    });
  });

  describe("Protocol Validation", () => {
    describe("Kafka Validation", () => {
      it("should validate kafka channel binding partitions", () => {
        const errors = ProtocolBindingFactory.validateBinding("kafka", "channel", {
          partitions: -1,
        });

        expect(errors).toContain("Kafka channel binding partitions must be a positive integer");
      });

      it("should validate kafka channel binding replicas", () => {
        const errors = ProtocolBindingFactory.validateBinding("kafka", "channel", {
          replicas: 0,
        });

        expect(errors).toContain("Kafka channel binding replicas must be a positive integer");
      });

      it("should validate kafka message binding schemaIdLocation", () => {
        const errors = ProtocolBindingFactory.validateBinding("kafka", "message", {
          schemaIdLocation: "invalid",
        });

        expect(errors).toContain("Kafka message binding schemaIdLocation must be 'header' or 'payload'");
      });

      it("should validate kafka message binding schemaLookupStrategy", () => {
        const errors = ProtocolBindingFactory.validateBinding("kafka", "message", {
          schemaLookupStrategy: "InvalidStrategy",
        });

        expect(errors).toContain("Kafka message binding schemaLookupStrategy must be valid Kafka strategy");
      });

      it("should pass validation for valid kafka configuration", () => {
        const errors = ProtocolBindingFactory.validateBinding("kafka", "channel", {
          partitions: 3,
          replicas: 2,
        });

        expect(errors).toEqual([]);
      });
    });

    describe("WebSocket Validation", () => {
      it("should validate websocket channel binding method", () => {
        const errors = ProtocolBindingFactory.validateBinding("ws", "channel", {
          method: "PUT",
        });

        expect(errors).toContain("WebSocket channel binding method must be 'GET' or 'POST'");
      });

      it("should pass validation for valid websocket configuration", () => {
        const errors = ProtocolBindingFactory.validateBinding("ws", "channel", {
          method: "GET",
        });

        expect(errors).toEqual([]);
      });
    });

    describe("HTTP Validation", () => {
      it("should validate http operation binding type", () => {
        const errors = ProtocolBindingFactory.validateBinding("http", "operation", {
          type: "invalid",
        });

        expect(errors).toContain("HTTP operation binding type must be 'request' or 'response'");
      });

      it("should validate http operation binding method", () => {
        const errors = ProtocolBindingFactory.validateBinding("http", "operation", {
          method: "INVALID",
        });

        expect(errors).toContain("HTTP operation binding method must be one of: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS, CONNECT, TRACE");
      });

      it("should validate http operation binding status code", () => {
        const errors = ProtocolBindingFactory.validateBinding("http", "operation", {
          statusCode: 999,
        });

        expect(errors).toContain("HTTP operation binding statusCode must be a valid HTTP status code (100-599)");
      });

      it("should validate http message binding status code", () => {
        const errors = ProtocolBindingFactory.validateBinding("http", "message", {
          statusCode: 50,
        });

        expect(errors).toContain("HTTP message binding statusCode must be a valid HTTP status code (100-599)");
      });

      it("should pass validation for valid http configuration", () => {
        const errors = ProtocolBindingFactory.validateBinding("http", "operation", {
          type: "request",
          method: "POST",
          statusCode: 201,
        });

        expect(errors).toEqual([]);
      });
    });
  });

  describe("Default Configuration", () => {
    it("should provide kafka default configuration", () => {
      const config = ProtocolBindingFactory.getDefaultConfig("kafka");

      expect(config).toEqual({
        server: {
          schemaRegistryVendor: "confluent",
        },
        channel: {
          partitions: 1,
          replicas: 1,
        },
        operation: {
          clientId: {
            type: "string",
            description: "Kafka client ID",
          },
        },
        message: {
          schemaIdLocation: "payload",
          schemaLookupStrategy: "TopicIdStrategy",
        },
      });
    });

    it("should provide websocket default configuration", () => {
      const config = ProtocolBindingFactory.getDefaultConfig("ws");

      expect(config).toEqual({
        channel: {
          method: "GET",
        },
        message: {},
      });
    });

    it("should provide http default configuration", () => {
      const config = ProtocolBindingFactory.getDefaultConfig("http");

      expect(config).toEqual({
        operation: {
          type: "request",
          method: "POST",
        },
        message: {
          statusCode: 200,
        },
      });
    });

    it("should provide https default configuration (same as http)", () => {
      const config = ProtocolBindingFactory.getDefaultConfig("https");

      expect(config).toEqual({
        operation: {
          type: "request",
          method: "POST",
        },
        message: {
          statusCode: 200,
        },
      });
    });

    it("should provide empty configuration for unknown protocol", () => {
      const config = ProtocolBindingFactory.getDefaultConfig("unknown" as ProtocolType);
      expect(config).toEqual({});
    });
  });

  describe("Protocol Utils", () => {
    describe("Binding Support", () => {
      it("should correctly identify kafka binding support", () => {
        expect(ProtocolUtils.supportsBinding("kafka", "server")).toBe(true);
        expect(ProtocolUtils.supportsBinding("kafka", "channel")).toBe(true);
        expect(ProtocolUtils.supportsBinding("kafka", "operation")).toBe(true);
        expect(ProtocolUtils.supportsBinding("kafka", "message")).toBe(true);
      });

      it("should correctly identify websocket binding support", () => {
        expect(ProtocolUtils.supportsBinding("ws", "server")).toBe(false);
        expect(ProtocolUtils.supportsBinding("ws", "channel")).toBe(true);
        expect(ProtocolUtils.supportsBinding("ws", "operation")).toBe(false);
        expect(ProtocolUtils.supportsBinding("ws", "message")).toBe(true);
      });

      it("should correctly identify http binding support", () => {
        expect(ProtocolUtils.supportsBinding("http", "server")).toBe(false);
        expect(ProtocolUtils.supportsBinding("http", "channel")).toBe(false);
        expect(ProtocolUtils.supportsBinding("http", "operation")).toBe(true);
        expect(ProtocolUtils.supportsBinding("http", "message")).toBe(true);
      });
    });

    describe("Protocol Extraction", () => {
      it("should extract protocol from URL", () => {
        expect(ProtocolUtils.extractProtocol("kafka://broker.example.com:9092")).toBe("kafka");
        expect(ProtocolUtils.extractProtocol("ws://websocket.example.com")).toBe("ws");
        expect(ProtocolUtils.extractProtocol("https://api.example.com")).toBe("https");
        expect(ProtocolUtils.extractProtocol("amqp://rabbitmq.example.com:5672")).toBe("amqp");
      });

      it("should extract protocol from protocol string", () => {
        expect(ProtocolUtils.extractProtocol("kafka")).toBe("kafka");
        expect(ProtocolUtils.extractProtocol("HTTPS")).toBe("https");
        expect(ProtocolUtils.extractProtocol("ws")).toBe("ws");
      });

      it("should return null for invalid protocol", () => {
        expect(ProtocolUtils.extractProtocol("invalid://example.com")).toBeNull();
        expect(ProtocolUtils.extractProtocol("ftp")).toBeNull();
      });
    });

    describe("Protocol Validation", () => {
      it("should validate valid protocols", () => {
        expect(ProtocolUtils.isValidProtocol("kafka")).toBe(true);
        expect(ProtocolUtils.isValidProtocol("ws")).toBe(true);
        expect(ProtocolUtils.isValidProtocol("http")).toBe(true);
        expect(ProtocolUtils.isValidProtocol("https")).toBe(true);
        expect(ProtocolUtils.isValidProtocol("amqp")).toBe(true);
        expect(ProtocolUtils.isValidProtocol("mqtt")).toBe(true);
      });

      it("should reject invalid protocols", () => {
        expect(ProtocolUtils.isValidProtocol("ftp")).toBe(false);
        expect(ProtocolUtils.isValidProtocol("ssh")).toBe(false);
        expect(ProtocolUtils.isValidProtocol("invalid")).toBe(false);
      });
    });

    describe("Default Ports", () => {
      it("should provide correct default ports", () => {
        expect(ProtocolUtils.getDefaultPort("kafka")).toBe(9092);
        expect(ProtocolUtils.getDefaultPort("ws")).toBe(80);
        expect(ProtocolUtils.getDefaultPort("http")).toBe(80);
        expect(ProtocolUtils.getDefaultPort("https")).toBe(443);
        expect(ProtocolUtils.getDefaultPort("amqp")).toBe(5672);
        expect(ProtocolUtils.getDefaultPort("mqtt")).toBe(1883);
      });
    });
  });
});