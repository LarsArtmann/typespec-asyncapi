/**
 * Unit tests for @server decorator in TypeSpec AsyncAPI emitter
 */

import { compileAsyncAPI, compileAsyncAPISpecRaw } from "../utils/test-helpers";
import { PROTOCOL_LIST } from "../../src/constants/protocols.js";

describe("@server decorator", () => {
  describe("basic functionality", () => {
    it("should accept valid server configuration", async () => {
      const source = `
        @server("production", #{
          url: "kafka://broker.example.com:9092",
          protocol: "kafka",
          description: "Production Kafka cluster"
        })
        namespace ServerTest;
        
        model Event { id: string; }
        
        @channel("events")
        op publishEvent(): Event;
      `;

      const { diagnostics } = await compileAsyncAPISpecRaw(source, {
        "file-type": "json",
        "output-file": "server-valid",
      });

      const errors = diagnostics.filter((d) => d.severity === "error");
      expect(errors).toHaveLength(0);
    });

    it("should handle multiple server configurations", async () => {
      const source = `
        @server("production", #{
          url: "kafka://prod-broker:9092",
          protocol: "kafka",
          description: "Production environment"
        })
        @server("development", #{
          url: "ws://localhost:3000",
          protocol: "websocket",
          description: "Development WebSocket server"
        })
        @server("staging", #{
          url: "amqp://staging-rabbit:5672",
          protocol: "amqp"
        })
        namespace MultiServerTest;
        
        model Event { id: string; }
        
        @channel("events")
        op publishEvent(): Event;
      `;

      const { diagnostics, outputFiles } = await compileAsyncAPISpecRaw(
        source,
        {
          "file-type": "json",
          "output-file": "multi-server",
        },
      );

      const errors = diagnostics.filter((d) => d.severity === "error");
      expect(errors).toHaveLength(0);

      // Should generate output with multiple servers
      expect(outputFiles.size).toBeGreaterThan(0);
    });

    it("should validate required server configuration fields", async () => {
      const source = `
        @server("invalid-missing-url", #{
          protocol: "kafka",
          description: "Missing URL"
        })
        namespace MissingUrlTest;
        
        model Event { id: string; }
        
        @channel("events")
        op publishEvent(): Event;
      `;

      const { diagnostics } = await compileAsyncAPISpecRaw(source, {
        "file-type": "json",
        "output-file": "missing-url",
      });

      // Should have error for missing URL
      const urlErrors = diagnostics.filter((d) =>
        d.message?.includes("Server URL is required"),
      );
      expect(urlErrors.length).toBeGreaterThan(0);
    });

    it("should validate protocol field is required", async () => {
      const source = `
        @server("invalid-missing-protocol", #{
          url: "kafka://broker:9092",
          description: "Missing protocol"
        })
        namespace MissingProtocolTest;
        
        model Event { id: string; }
        
        @channel("events")
        op publishEvent(): Event;
      `;

      const { diagnostics } = await compileAsyncAPISpecRaw(source, {
        "file-type": "json",
        "output-file": "missing-protocol",
      });

      // Should have error for missing protocol
      const protocolErrors = diagnostics.filter((d) =>
        d.message?.includes("Server protocol is required"),
      );
      expect(protocolErrors.length).toBeGreaterThan(0);
    });
  });

  describe("protocol validation", () => {
    it("should accept every protocol in PROTOCOL_LIST", async () => {
      // Sanity: the canonical list must stay comprehensive (22 today)
      expect(PROTOCOL_LIST.length).toBeGreaterThanOrEqual(22);

      for (const protocol of PROTOCOL_LIST) {
        const source = `
          @server("test-server", #{
            url: "${protocol}://example.com",
            protocol: "${protocol}",
            description: "Test ${protocol} server"
          })
          namespace ProtocolTest;

          model Event { id: string; }

          @channel("events")
          op publishEvent(): Event;
        `;

        const { diagnostics } = await compileAsyncAPISpecRaw(source, {
          "file-type": "json",
          "output-file": `protocol-${protocol}`,
        });

        const errors = diagnostics.filter((d) => d.severity === "error");
        expect(
          errors,
          `Protocol ${protocol} should be supported`,
        ).toHaveLength(0);
      }
    });

    it("should normalize protocol aliases to canonical names", async () => {
      const aliasCases = [
        { input: "websocket", normalized: "ws" },
        { input: "websockets", normalized: "wss" },
        { input: "Kafka", normalized: "kafka" },
      ];

      for (const { input, normalized } of aliasCases) {
        const { asyncApiDoc } = await compileAsyncAPI(`
          @server("alias-server", #{
            url: "${normalized}://example.com",
            protocol: "${input}"
          })
          namespace AliasTest;

          model Event { id: string; }

          @channel("events")
          op publishEvent(): Event;
        `);

        expect(
          asyncApiDoc?.servers?.["alias-server"]?.protocol,
          `Alias ${input} should normalize to ${normalized}`,
        ).toBe(normalized);
      }
    });

    it("should reject unsupported protocols", async () => {
      const source = `
        @server("invalid-protocol", #{
          url: "ftp://files.example.com",
          protocol: "ftp",
          description: "Unsupported FTP server"
        })
        namespace UnsupportedProtocolTest;
        
        model Event { id: string; }
        
        @channel("events")
        op publishEvent(): Event;
      `;

      const { diagnostics } = await compileAsyncAPISpecRaw(source, {
        "file-type": "json",
        "output-file": "unsupported-protocol",
      });

      // Should have error for unsupported protocol
      const protocolErrors = diagnostics.filter(
        (d) =>
          d.code === "@lars-artmann/typespec-asyncapi/unsupported-protocol",
      );
      expect(protocolErrors.length).toBeGreaterThan(0);
    });
  });

  describe("target validation", () => {
    it("should only accept namespace targets", async () => {
      const source = `
        namespace InvalidTargetTest;
        
        model Event { id: string; }
        
        @server("invalid", #{
          url: "kafka://broker:9092",
          protocol: "kafka"
        })
        @channel("events")
        op publishEvent(): Event;
      `;

      const { diagnostics } = await compileAsyncAPISpecRaw(source, {
        "file-type": "json",
        "output-file": "invalid-target",
      });

      // Should have error for applying @server to operation instead of namespace
      // TypeSpec's built-in decorator target validation produces this error
      const targetErrors = diagnostics.filter(
        (d) =>
          d.code === "decorator-wrong-target" ||
          d.message?.includes("not assignable to Namespace") ||
          d.message?.includes("@server can only be applied to namespaces"),
      );
      expect(targetErrors.length).toBeGreaterThan(0);
    });
  });

  describe("configuration extraction", () => {
    it("should handle minimal server configuration", async () => {
      const source = `
        @server("minimal", #{
          url: "kafka://broker:9092",
          protocol: "kafka"
        })
        namespace MinimalServerTest;
        
        model Event { id: string; }
        
        @channel("events")
        op publishEvent(): Event;
      `;

      const { diagnostics, outputFiles } = await compileAsyncAPISpecRaw(
        source,
        {
          "file-type": "json",
          "output-file": "minimal-server",
        },
      );

      const errors = diagnostics.filter((d) => d.severity === "error");
      expect(errors).toHaveLength(0);

      // Should generate valid AsyncAPI spec
      expect(outputFiles.size).toBeGreaterThan(0);

      const outputFile = outputFiles.get("minimal-server.json");
      expect(outputFile).toBeDefined();
      const asyncapiDoc = JSON.parse(outputFile!);
      expect(asyncapiDoc.servers).toBeDefined();
      expect(asyncapiDoc.servers.minimal).toBeDefined();
      expect(asyncapiDoc.servers.minimal.host).toBe("kafka://broker:9092");
      expect(asyncapiDoc.servers.minimal.protocol).toBe("kafka");
    });

    it("should preserve server descriptions", async () => {
      const source = `
        @server("documented", #{
          url: "kafka://broker:9092",
          protocol: "kafka",
          description: "Main production Kafka cluster with high availability"
        })
        namespace DocumentedServerTest;
        
        model Event { id: string; }
        
        @channel("events")
        op publishEvent(): Event;
      `;

      const { diagnostics, outputFiles } = await compileAsyncAPISpecRaw(
        source,
        {
          "file-type": "json",
          "output-file": "documented-server",
        },
      );

      const errors = diagnostics.filter((d) => d.severity === "error");
      expect(errors).toHaveLength(0);

      const outputFile = outputFiles.get("documented-server.json");
      expect(outputFile).toBeDefined();
      const asyncapiDoc = JSON.parse(outputFile!);
      const server = asyncapiDoc.servers?.documented;
      expect(server?.description).toBe(
        "Main production Kafka cluster with high availability",
      );
    });
  });

  describe("integration with other decorators", () => {
    it("should work with @channel and @publish/@subscribe decorators", async () => {
      const source = `
        @server("integration", #{
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

      const { diagnostics, outputFiles } = await compileAsyncAPISpecRaw(
        source,
        {
          "file-type": "json",
          "output-file": "integration-test",
        },
      );

      const errors = diagnostics.filter((d) => d.severity === "error");
      expect(errors).toHaveLength(0);

      // Should generate complete AsyncAPI spec with servers, channels, and operations
      expect(outputFiles.size).toBeGreaterThan(0);

      const outputFile = outputFiles.get("integration-test.json");
      expect(outputFile).toBeDefined();
      const asyncapiDoc = JSON.parse(outputFile!);

      // Validate server configuration
      expect(asyncapiDoc.servers?.integration).toBeDefined();
      expect(asyncapiDoc.servers.integration.protocol).toBe("kafka");

      // Validate channels are present
      expect(asyncapiDoc.channels).toBeDefined();

      // Should have operations defined
      expect(asyncapiDoc.operations || asyncapiDoc.channels).toBeDefined();
    });
  });

  describe("uRL validation", () => {
    it("should accept well-formed URLs with scheme and host", async () => {
      const source = `
        @server("valid", #{
          url: "kafka://broker.example.com:9092",
          protocol: "kafka"
        })
        namespace ValidUrlTest;

        model Event { id: string; }

        @channel("events")
        op publishEvent(): Event;
      `;

      const { diagnostics } = await compileAsyncAPISpecRaw(source, {
        "file-type": "json",
        "output-file": "valid-url",
      });

      const urlErrors = diagnostics.filter(
        (d) => d.code === "@lars-artmann/typespec-asyncapi/invalid-server-url",
      );
      expect(urlErrors).toHaveLength(0);
    });

    it("should accept schemeless hostnames (valid AsyncAPI pattern)", async () => {
      const source = `
        @server("no-scheme", #{
          url: "broker.example.com:9092",
          protocol: "kafka"
        })
        namespace NoSchemeTest;

        model Event { id: string; }

        @channel("events")
        op publishEvent(): Event;
      `;

      const { diagnostics } = await compileAsyncAPISpecRaw(source, {
        "file-type": "json",
        "output-file": "no-scheme-url",
      });

      const urlErrors = diagnostics.filter(
        (d) => d.code === "@lars-artmann/typespec-asyncapi/invalid-server-url",
      );
      expect(urlErrors).toHaveLength(0);
    });

    it("should reject URLs containing spaces", async () => {
      const source = `
        @server("malformed", #{
          url: "not a url at all",
          protocol: "kafka"
        })
        namespace MalformedUrlTest;

        model Event { id: string; }

        @channel("events")
        op publishEvent(): Event;
      `;

      const { diagnostics } = await compileAsyncAPISpecRaw(source, {
        "file-type": "json",
        "output-file": "malformed-url",
      });

      const urlErrors = diagnostics.filter(
        (d) => d.code === "@lars-artmann/typespec-asyncapi/invalid-server-url",
      );
      expect(urlErrors.length).toBeGreaterThan(0);
    });

    it("should accept URLs with template variables", async () => {
      const source = `
        @server("templated", #{
          url: "kafka://{host}:{port}",
          protocol: "kafka"
        })
        namespace TemplatedUrlTest;

        model Event { id: string; }

        @channel("events")
        op publishEvent(): Event;
      `;

      const { diagnostics } = await compileAsyncAPISpecRaw(source, {
        "file-type": "json",
        "output-file": "templated-url",
      });

      const urlErrors = diagnostics.filter(
        (d) => d.code === "@lars-artmann/typespec-asyncapi/invalid-server-url",
      );
      expect(urlErrors).toHaveLength(0);
    });
  });
});
