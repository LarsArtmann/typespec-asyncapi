/**
 * Round-Trip Verification: Comprehensive Feature Integration
 *
 * Verifies that a representative AsyncAPI document exercising ALL emitter
 * features compiles, validates against the AsyncAPI 3.1 JSON Schema, and has
 * structurally sound $ref chains — the same checks @asyncapi/parser performs.
 *
 * The @asyncapi/parser (v3.6.0) crashes under Bun due to AJV new Function()
 * codegen. This test provides equivalent verification:
 *   1. AsyncAPI 3.1 JSON Schema validation (via AJV)
 *   2. All $ref values resolve to existing targets
 *   3. Operation → Channel → Message → Schema chain is coherent
 *   4. Reply messages reference valid schemas
 *   5. Servers, security schemes, and bindings are structurally valid
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";
import type { ParsedAsyncAPIDocument } from "../../src/domain/models/asyncapi-document.js";

const COMPREHENSIVE_SPEC = `
  @service(#{ title: "Round-Trip Verification API", version: "1.0.0" })
  @defaultContentType("application/json")
  @server("kafka-prod", #{
    url: "kafka://broker.example.com:9092",
    protocol: "kafka"
  })
  @server("ws-gateway", #{
    url: "ws://gateway.example.com:8080",
    protocol: "ws"
  })
  @security(#{ name: "api-key", scheme: #{ type: "httpApiKey", in: "header", name: "X-API-Key" } })
  namespace RoundTrip;

  @doc("User account lifecycle events")
  model UserCreated {
    userId: string;
    email: string;
    createdAt: utcDateTime;
    profile: UserProfile;
  }

  @doc("Embedded user profile")
  model UserProfile {
    displayName: string;
    avatarUrl?: url;
    preferences: string[];
  }

  @correlationId("$message.header#/correlationId")
  @header("x-request-id", "string")
  model OrderPlaced {
    orderId: string;
    userId: string;
    items: OrderItem[];
    total: decimal;
    status: "pending" | "confirmed" | "cancelled";
  }

  model OrderItem {
    sku: string;
    quantity: int32;
    price: float64;
  }

  model OrderConfirmed {
    orderId: string;
    confirmedAt: utcDateTime;
  }

  model PaymentFailed {
    orderId: string;
    reason: string;
    retryAfter?: int32;
  }

  @channel("users.created")
  @tags(#["user", "lifecycle"])
  op publishUserCreated(): UserCreated;

  @channel("orders")
  @protocol(#{
    protocol: "kafka",
    binding: #{ topic: "orders-topic", partitions: 6 }
  })
  op publishOrder(): OrderPlaced;

  @channel("orders")
  @reply(#{ messages: [OrderConfirmed] })
  op submitOrder(): OrderPlaced;

  @channel("orders.events")
  op publishOrderEvents(): OrderConfirmed | PaymentFailed;
`;

/** Resolve a JSON Pointer $ref against a document. Returns the target or undefined. */
function resolveRef(doc: unknown, ref: string): unknown {
  if (!ref.startsWith("#/")) return undefined;
  const parts = ref.slice(2).split("/");
  let current: unknown = doc;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    const decoded = part.replaceAll("~1", "/").replaceAll("~0", "~");
    current = (current as Record<string, unknown>)[decoded];
  }
  return current;
}

/** Recursively collect all $ref strings in an object tree. */
function collectRefs(obj: unknown, refs: string[] = []): string[] {
  if (obj == null || typeof obj !== "object") return refs;
  if (Array.isArray(obj)) {
    for (const item of obj) collectRefs(item, refs);
    return refs;
  }
  const record = obj as Record<string, unknown>;
  if (typeof record.$ref === "string") refs.push(record.$ref);
  for (const value of Object.values(record)) collectRefs(value, refs);
  return refs;
}

describe("round-Trip Verification", () => {
  let doc: ParsedAsyncAPIDocument;

  it("compiles and validates against AsyncAPI 3.1 JSON Schema", async () => {
    doc = await compileAndValidateOrThrow(COMPREHENSIVE_SPEC);
    expect(doc.asyncapi).toBe("3.1.0");
  });

  it("emits correct info with title and version", () => {
    expect(doc.info.title).toBe("Round-Trip Verification API");
    expect(doc.info.version).toBe("1.0.0");
  });

  it("emits defaultContentType", () => {
    expect(doc.defaultContentType).toBe("application/json");
  });

  it("emits multiple servers", () => {
    expect(Object.keys(doc.servers!)).toHaveLength(2);
    expect(doc.servers!["kafka-prod"].protocol).toBe("kafka");
    expect(doc.servers!["ws-gateway"].protocol).toBe("ws");
  });

  it("emits security scheme", () => {
    const scheme = doc.components!.securitySchemes!["api-key"];
    expect(scheme.type).toBe("httpApiKey");
    expect(scheme.in).toBe("header");
    expect(scheme.name).toBe("X-API-Key");
  });

  it("emits channels for all operations", () => {
    const channels = doc.channels!;
    expect(channels["users.created"]).toBeDefined();
    expect(channels["orders"]).toBeDefined();
    expect(channels["orders.events"]).toBeDefined();
  });

  it("emits operations with correct actions", () => {
    const ops = doc.operations!;
    expect(ops.publishUserCreated.action).toBe("send");
    expect(ops.submitOrder.action).toBe("send");
    expect(ops.publishOrderEvents.action).toBe("send");
  });

  it("emits operation with reply", () => {
    const op = doc.operations!.submitOrder;
    expect(op.reply).toBeDefined();
    expect(op.reply!.messages).toBeDefined();
    expect(op.reply!.messages!.length).toBeGreaterThan(0);
  });

  it("emits multi-message operation (union return type)", () => {
    const op = doc.operations!.publishOrderEvents;
    expect(op.messages).toBeDefined();
    expect(op.messages!.length).toBe(2);
  });

  it("emits tags on operations", () => {
    const op = doc.operations!.publishUserCreated;
    expect(op.tags).toBeDefined();
    expect(op.tags!.length).toBe(2);
    expect(op.tags![0].name).toBe("user");
  });

  it("emits all schemas in components", () => {
    const schemas = doc.components!.schemas!;
    expect(schemas.UserCreated).toBeDefined();
    expect(schemas.UserProfile).toBeDefined();
    expect(schemas.OrderPlaced).toBeDefined();
    expect(schemas.OrderItem).toBeDefined();
    expect(schemas.OrderConfirmed).toBeDefined();
    expect(schemas.PaymentFailed).toBeDefined();
  });

  it("emits @doc descriptions on schemas", () => {
    expect(doc.components!.schemas!.UserCreated.description).toBe(
      "User account lifecycle events",
    );
    expect(doc.components!.schemas!.UserProfile.description).toBe(
      "Embedded user profile",
    );
  });

  it("emits nested model $ref in properties", () => {
    const userProps = doc.components!.schemas!.UserCreated.properties!;
    expect(userProps.profile.$ref).toBe("#/components/schemas/UserProfile");
  });

  it("emits array of named models with $ref items", () => {
    const orderProps = doc.components!.schemas!.OrderPlaced.properties!;
    expect(orderProps.items.type).toBe("array");
    expect(orderProps.items.items!.$ref).toBe("#/components/schemas/OrderItem");
  });

  it("emits enum union types", () => {
    const orderProps = doc.components!.schemas!.OrderPlaced.properties!;
    expect(orderProps.status.enum).toStrictEqual([
      "pending",
      "confirmed",
      "cancelled",
    ]);
  });

  it("emits optional fields in required array", () => {
    const failedProps = doc.components!.schemas!.PaymentFailed.properties!;
    expect(doc.components!.schemas!.PaymentFailed.required).toStrictEqual([
      "orderId",
      "reason",
    ]);
    expect(failedProps.retryAfter).toBeDefined();
  });

  it("all $ref values resolve to existing targets", () => {
    const allRefs = collectRefs(doc);
    expect(allRefs.length).toBeGreaterThan(10);

    const dangling = allRefs.filter((ref) => resolveRef(doc, ref) === undefined);
    expect(dangling).toStrictEqual([]);
  });

  it("operation → channel → message chain is coherent", () => {
    const { operations, channels } = doc;

    for (const [, op] of Object.entries(operations!)) {
      const channelRef = op.channel.$ref;
      expect(channelRef).toMatch(/^#\/channels\//);
      const channelId = channelRef.replace("#/channels/", "");
      expect(channels![channelId]).toBeDefined();

      for (const msg of op.messages ?? []) {
        expect(msg.$ref.startsWith(`${channelRef}/messages/`)).toBe(true);
      }
    }
  });

  it("channel messages → component messages → schemas chain is coherent", () => {
    const { channels, components } = doc;
    const componentMessages = components!.messages ?? {};
    const componentSchemas = components!.schemas ?? {};

    for (const [, channel] of Object.entries(channels!)) {
      for (const [, msgRef] of Object.entries(channel.messages ?? {})) {
        expect(msgRef.$ref).toMatch(/^#\/components\/messages\//);
        const msgId = msgRef.$ref.replace("#/components/messages/", "");
        expect(componentMessages[msgId]).toBeDefined();
      }
    }

    for (const [, msg] of Object.entries(componentMessages)) {
      if ("payload" in msg && msg.payload?.$ref) {
        const schemaId = msg.payload.$ref.replace(
          "#/components/schemas/",
          "",
        );
        expect(componentSchemas[schemaId]).toBeDefined();
      }
    }
  });

  it("reply messages reference valid component messages", () => {
    const ops = doc.operations!;
    const componentMessages = doc.components!.messages ?? {};

    for (const [, op] of Object.entries(ops)) {
      if (!op.reply?.messages) continue;
      for (const replyMsg of op.reply.messages) {
        expect(replyMsg.$ref).toMatch(/^#\/channels\/.+\/messages\//);
        const resolved = resolveRef(doc, replyMsg.$ref);
        expect(resolved).toBeDefined();
        const asRef = resolved as { $ref?: string };
        if (asRef?.$ref) {
          const msgId = asRef.$ref.replace("#/components/messages/", "");
          expect(componentMessages[msgId]).toBeDefined();
        }
      }
    }
  });

  it("protocol bindings are structurally valid", () => {
    const channels = doc.channels!;

    for (const [, channel] of Object.entries(channels)) {
      if (!channel.bindings) continue;
      for (const [protocol, binding] of Object.entries(channel.bindings)) {
        expect(typeof binding).toBe("object");
        expect((binding as Record<string, unknown>).bindingVersion).toBeDefined();
        expect(protocol).toMatch(/^(kafka|amqp|mqtt|ws|http)$/);
      }
    }
  });
});
