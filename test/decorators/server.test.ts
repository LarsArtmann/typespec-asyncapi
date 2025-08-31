/**
 * Unit tests for @server decorator in TypeSpec AsyncAPI emitter
 */

import { describe, it, expect } from "vitest";
import { compileAsyncAPISpec } from "../utils/test-helpers.js";

//TODO: this file is getting to big split it up

describe("@server decorator", () => {
  describe("basic functionality", () => {
    it("should accept valid server configuration", async () => {
      const source = `
        @server("production", {
          url: "kafka://broker.example.com:9092",
          protocol: "kafka",
          description: "Production Kafka cluster"
        })
        namespace ServerTest;
        
        model Event { id: string; }
        
        @channel("events")
        op publishEvent(): Event;
      `;
      
      const { diagnostics } = await compileAsyncAPISpec(source, {
        "output-file": "server-valid",
        "file-type": "json"
      });
      
      const errors = diagnostics.filter(d => d.severity === "error");
      expect(errors).toHaveLength(0);
    });

    it("should handle multiple server configurations", async () => {
      const source = `
        @server("production", {
          url: "kafka://prod-broker:9092",
          protocol: "kafka",
          description: "Production environment"
        })
        @server("development", {
          url: "ws://localhost:3000",
          protocol: "websocket",
          description: "Development WebSocket server"
        })
        @server("staging", {
          url: "amqp://staging-rabbit:5672",
          protocol: "amqp"
        })
        namespace MultiServerTest;
        
        model Event { id: string; }
        
        @channel("events")
        op publishEvent(): Event;
      `;
      
      const { diagnostics, outputFiles } = await compileAsyncAPISpec(source, {
        "output-file": "multi-server",
        "file-type": "json"
      });
      
      const errors = diagnostics.filter(d => d.severity === "error");
      expect(errors).toHaveLength(0);
      
      // Should generate output with multiple servers
      expect(outputFiles.size).toBeGreaterThan(0);
    });

    it("should validate required server configuration fields", async () => {
      const source = `
        @server("invalid-missing-url", {
          protocol: "kafka",
          description: "Missing URL"
        })
        namespace MissingUrlTest;
        
        model Event { id: string; }
        
        @channel("events")
        op publishEvent(): Event;
      `;
      
      const { diagnostics } = await compileAsyncAPISpec(source, {
        "output-file": "missing-url",
        "file-type": "json"
      });
      
      // Should have error for missing URL
      const urlErrors = diagnostics.filter(d => 
        d.message?.includes("Server URL is required")
      );
      expect(urlErrors.length).toBeGreaterThan(0);
    });

    it("should validate protocol field is required", async () => {
      const source = `
        @server("invalid-missing-protocol", {
          url: "kafka://broker:9092",
          description: "Missing protocol"
        })
        namespace MissingProtocolTest;
        
        model Event { id: string; }
        
        @channel("events")
        op publishEvent(): Event;
      `;
      
      const { diagnostics } = await compileAsyncAPISpec(source, {
        "output-file": "missing-protocol",
        "file-type": "json"
      });
      
      // Should have error for missing protocol
      const protocolErrors = diagnostics.filter(d => 
        d.message?.includes("Server protocol is required")
      );
      expect(protocolErrors.length).toBeGreaterThan(0);
    });
  });

  describe("protocol validation", () => {
    it("should accept supported protocols", async () => {
      const supportedProtocols = [
        { name: "kafka", url: "kafka://broker:9092" },
        { name: "amqp", url: "amqp://rabbit:5672" },
        { name: "websocket", url: "ws://localhost:3000" },
        { name: "http", url: "http://api.example.com" },
        { name: "https", url: "https://api.example.com" },
        { name: "ws", url: "ws://localhost:3000" },
        { name: "wss", url: "wss://secure.example.com" }
      ];
      
      for (const protocol of supportedProtocols) {
        const source = `
          @server("test-${protocol.name}", {
            url: "${protocol.url}",
            protocol: "${protocol.name}",
            description: "Test ${protocol.name} server"
          })
          namespace Protocol${protocol.name.charAt(0).toUpperCase() + protocol.name.slice(1)}Test;
          
          model Event { id: string; }
          
          @channel("events")
          op publishEvent(): Event;
        `;
        
        const { diagnostics } = await compileAsyncAPISpec(source, {
          "output-file": `protocol-${protocol.name}`,
          "file-type": "json"
        });
        
        const errors = diagnostics.filter(d => d.severity === "error");
        expect(errors, `Protocol ${protocol.name} should be supported`).toHaveLength(0);
      }
    });

    it("should reject unsupported protocols", async () => {
      const source = `
        @server("invalid-protocol", {
          url: "ftp://files.example.com",
          protocol: "ftp",
          description: "Unsupported FTP server"
        })
        namespace UnsupportedProtocolTest;
        
        model Event { id: string; }
        
        @channel("events")
        op publishEvent(): Event;
      `;
      
      const { diagnostics } = await compileAsyncAPISpec(source, {
        "output-file": "unsupported-protocol",
        "file-type": "json"
      });
      
      // Should have error for unsupported protocol
      const protocolErrors = diagnostics.filter(d => 
        d.code === "@typespec/asyncapi/unsupported-protocol"
      );
      expect(protocolErrors.length).toBeGreaterThan(0);
    });
  });

  describe("target validation", () => {
    it("should only accept namespace targets", async () => {
      const source = `
        namespace InvalidTargetTest;
        
        model Event { id: string; }
        
        @server("invalid", {
          url: "kafka://broker:9092",
          protocol: "kafka"
        })
        @channel("events")
        op publishEvent(): Event;
      `;
      
      const { diagnostics } = await compileAsyncAPISpec(source, {
        "output-file": "invalid-target",
        "file-type": "json"
      });
      
      // Should have error for applying @server to operation instead of namespace
      const targetErrors = diagnostics.filter(d => 
        d.message?.includes("@server can only be applied to namespaces")
      );
      expect(targetErrors.length).toBeGreaterThan(0);
    });
  });

  describe("configuration extraction", () => {
    it("should handle minimal server configuration", async () => {
      const source = `
        @server("minimal", {
          url: "kafka://broker:9092",
          protocol: "kafka"
        })
        namespace MinimalServerTest;
        
        model Event { id: string; }
        
        @channel("events")
        op publishEvent(): Event;
      `;
      
      const { diagnostics, outputFiles } = await compileAsyncAPISpec(source, {
        "output-file": "minimal-server",
        "file-type": "json"
      });
      
      const errors = diagnostics.filter(d => d.severity === "error");
      expect(errors).toHaveLength(0);
      
      // Should generate valid AsyncAPI spec
      expect(outputFiles.size).toBeGreaterThan(0);
      
      const outputFile = outputFiles.get("/minimal-server.json");
      if (outputFile) {
        const asyncapiDoc = JSON.parse(outputFile.content);
        expect(asyncapiDoc.servers).toBeDefined();
        expect(asyncapiDoc.servers.minimal).toBeDefined();
        expect(asyncapiDoc.servers.minimal.url).toBe("kafka://broker:9092");
        expect(asyncapiDoc.servers.minimal.protocol).toBe("kafka");
      }
    });

    it("should preserve server descriptions", async () => {
      const source = `
        @server("documented", {
          url: "kafka://broker:9092",
          protocol: "kafka",
          description: "Main production Kafka cluster with high availability"
        })
        namespace DocumentedServerTest;
        
        model Event { id: string; }
        
        @channel("events")
        op publishEvent(): Event;
      `;
      
      const { diagnostics, outputFiles } = await compileAsyncAPISpec(source, {
        "output-file": "documented-server",
        "file-type": "json"
      });
      
      const errors = diagnostics.filter(d => d.severity === "error");
      expect(errors).toHaveLength(0);
      
      const outputFile = outputFiles.get("/documented-server.json");
      if (outputFile) {
        const asyncapiDoc = JSON.parse(outputFile.content);
        const server = asyncapiDoc.servers?.documented;
        expect(server?.description).toBe("Main production Kafka cluster with high availability");
      }
    });
  });

  describe("integration with other decorators", () => {
    it("should work with @channel and @publish/@subscribe decorators", async () => {
      const source = `
        @server("integration", {
          url: "kafka://broker:9092",
          protocol: "kafka",
          description: "Integration test server"
        })
        namespace IntegrationTest;
        
        model UserEvent {
          userId: string;
          action: string;
          timestamp: utcDateTime;
        }
        
        @channel("user.events")
        @publish
        op publishUserEvent(): UserEvent;
        
        @channel("user.notifications")
        @subscribe
        op subscribeUserNotifications(): UserEvent;
        
        @channel("system.alerts")
        op handleSystemAlert(): UserEvent;
      `;
      
      const { diagnostics, outputFiles } = await compileAsyncAPISpec(source, {
        "output-file": "integration-test",
        "file-type": "json"
      });
      
      const errors = diagnostics.filter(d => d.severity === "error");
      expect(errors).toHaveLength(0);
      
      // Should generate complete AsyncAPI spec with servers, channels, and operations
      expect(outputFiles.size).toBeGreaterThan(0);
      
      const outputFile = outputFiles.get("/integration-test.json");
      if (outputFile) {
        const asyncapiDoc = JSON.parse(outputFile.content);
        
        // Validate server configuration
        expect(asyncapiDoc.servers?.integration).toBeDefined();
        expect(asyncapiDoc.servers.integration.protocol).toBe("kafka");
        
        // Validate channels are present
        expect(asyncapiDoc.channels).toBeDefined();
        
        // Should have operations defined
        expect(asyncapiDoc.operations || asyncapiDoc.channels).toBeDefined();
      }
    });
  });
});