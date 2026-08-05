/**
 * AsyncAPI Studio Compatibility Tests
 *
 * Verifies that emitter output can be parsed by @asyncapi/parser (the same parser
 * used by AsyncAPI Studio). The parser validates:
 * - Document structure and $ref resolution
 * - AsyncAPI 3.1.0 spec compliance (semantic, beyond JSON Schema validation)
 * - Cross-references between channels, operations, messages, and schemas
 *
 * These tests run via vitest on Node.js/V8, which handles the AJV codegen
 * in @asyncapi/parser correctly (Bun has documented issues with AJV's
 * new Function() calls — see AGENTS.md Gotchas).
 */

import { Parser } from "@asyncapi/parser";
import { compileAsyncAPI } from "../utils/test-helpers.js";
import type { ParsedAsyncAPIDocument } from "../../src/domain/models/asyncapi-document.js";

async function parseWithAsyncAPIParser(source: string): Promise<{
  document: ReturnType<ReturnType<InstanceType<typeof Parser>["parse"]>["then"]>["document"];
  diagnostics: ReturnType<ReturnType<InstanceType<typeof Parser>["parse"]>["then"]>["diagnostics"];
}> {
  const result = await compileAsyncAPI(source);
  if (!result.asyncApiDoc) {
    throw new Error("Emitter produced no output document");
  }
  const parser = new Parser();
  const parsed = await parser.parse(JSON.stringify(result.asyncApiDoc));
  return {
    document: parsed.document,
    diagnostics: parsed.diagnostics,
  };
}

function expectZeroErrors(
  diagnostics: Awaited<ReturnType<typeof parseWithAsyncAPIParser>>["diagnostics"],
) {
  const errors = diagnostics?.filter((d) => d.severity === "error") ?? [];
  if (errors.length > 0) {
    const messages = errors.map((e) => `${e.code}: ${e.message}`).join("\n");
    throw new Error(`AsyncAPI parser reported ${errors.length} error(s):\n${messages}`);
  }
}

describe("asyncAPI Studio compatibility (@asyncapi/parser)", () => {
  it("parses a minimal document with zero errors", async () => {
    const { document, diagnostics } = await parseWithAsyncAPIParser(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);
    expectZeroErrors(diagnostics);
    expect(document).toBeDefined();
    expect(document?.version()).toBe("3.1.0");
  });

  it("resolves channel and operation $ref chain", async () => {
    const { document, diagnostics } = await parseWithAsyncAPIParser(`
      namespace Test;
      model UserEvent { id: string; type: string; }
      @channel("users/events")
      op publish(): UserEvent;
    `);
    expectZeroErrors(diagnostics);

    const channels = document?.channels().all() ?? [];
    expect(channels).toHaveLength(1);

    const operations = document?.operations().all() ?? [];
    expect(operations).toHaveLength(1);
    expect(operations[0]?.action()).toBe("send");
  });

  it("resolves schema and message $ref chain", async () => {
    const { document, diagnostics } = await parseWithAsyncAPIParser(`
      namespace Test;
      model UserEvent { id: string; type: string; timestamp: utcDateTime; }
      @channel("users")
      op publish(): UserEvent;
    `);
    expectZeroErrors(diagnostics);

    const messages = document?.messages().all() ?? [];
    expect(messages.length).toBeGreaterThan(0);

    const schemas = document?.components()?.schemas().all() ?? [];
    const schemaIds = schemas.map((s) => s.id());
    expect(schemaIds).toContain("UserEvent");
  });

  it("parses document with servers and security", async () => {
    const { document, diagnostics } = await parseWithAsyncAPIParser(`
      @server("broker", #{
        url: "mqtt://broker.example.com:1883",
        protocol: "mqtt",
      })
      @security(#{ name: "api-key", scheme: #{ type: "httpApiKey", in: "header", name: "X-API-Key" } })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);
    expectZeroErrors(diagnostics);

    const servers = document?.servers().all() ?? [];
    expect(servers).toHaveLength(1);
    expect(servers[0]?.protocol()).toBe("mqtt");
  });

  it("parses document with Kafka bindings", async () => {
    const { document, diagnostics } = await parseWithAsyncAPIParser(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @protocol(#{
        protocol: "kafka",
        topic: "test-topic",
      })
      op publish(): Event;
    `);
    expectZeroErrors(diagnostics);

    const channels = document?.channels().all() ?? [];
    expect(channels).toHaveLength(1);
  });

  it("parses document with reply operations", async () => {
    const { document, diagnostics } = await parseWithAsyncAPIParser(`
      namespace Test;
      model Request { id: string; }
      model Response { id: string; result: string; }
      @channel("requests")
      @reply(Response)
      op process(): Request;
    `);
    expectZeroErrors(diagnostics);

    const operations = document?.operations().all() ?? [];
    expect(operations).toHaveLength(1);
  });

  it("parses document with multiple channels and messages", async () => {
    const { document, diagnostics } = await parseWithAsyncAPIParser(`
      namespace Test;
      model UserCreated { id: string; }
      model UserDeleted { id: string; }
      @channel("users/created")
      op createUser(): UserCreated;
      @channel("users/deleted")
      op deleteUser(): UserDeleted;
    `);
    expectZeroErrors(diagnostics);

    const channels = document?.channels().all() ?? [];
    expect(channels).toHaveLength(2);

    const operations = document?.operations().all() ?? [];
    expect(operations).toHaveLength(2);
  });

  it("parses document with namespace bindings (server bindings)", async () => {
    const { document, diagnostics } = await parseWithAsyncAPIParser(`
      @server("broker", #{
        url: "mqtt://broker.example.com:1883",
        protocol: "mqtt",
      })
      @bindings(#{
        mqtt: #{ clientId: "my-client", cleanSession: true },
      })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);
    expectZeroErrors(diagnostics);

    const doc = document as { _json?: ParsedAsyncAPIDocument } | null;
    expect(doc).toBeDefined();
  });

  it("emits zero diagnostics for a complex multi-feature document", async () => {
    const { document, diagnostics } = await parseWithAsyncAPIParser(`
      @defaultContentType("application/json")
      @server("kafka-prod", #{
        url: "kafka://prod.kafka.example.com:9092",
        protocol: "kafka",
      })
      @server("kafka-staging", #{
        url: "kafka://staging.kafka.example.com:9092",
        protocol: "kafka",
      })
      @security(#{ name: "sasl", scheme: #{ type: "scramSha256" } })
      namespace ECommerce;

      model OrderCreated {
        orderId: string;
        customerId: string;
        total: decimal128;
        timestamp: utcDateTime;
      }

      model OrderShipped {
        orderId: string;
        trackingNumber: string;
        carrier: string;
      }

      @message(#{title: "Order Created", description: "Emitted when an order is placed"})
      @channel("orders/created")
      @tags(["orders", "events"])
      op publishOrderCreated(): OrderCreated;

      @message(#{title: "Order Shipped", description: "Emitted when an order ships"})
      @channel("orders/shipped")
      @tags(["orders", "shipping"])
      op publishOrderShipped(): OrderShipped;
    `);
    expectZeroErrors(diagnostics);

    const channels = document?.channels().all() ?? [];
    expect(channels).toHaveLength(2);
    const operations = document?.operations().all() ?? [];
    expect(operations).toHaveLength(2);
    const servers = document?.servers().all() ?? [];
    expect(servers).toHaveLength(2);
  });
});
