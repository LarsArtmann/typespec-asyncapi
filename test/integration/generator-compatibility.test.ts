/**
 * Tests: AsyncAPI Generator Compatibility
 *
 * The @asyncapi/generator cannot run under Bun (requires npm CLI internals).
 * These tests verify that our emitter output is STRUCTURALLY COMPATIBLE
 * with what the generator expects, so users can feed our output to the
 * generator via Node.js:
 *
 *   npx @asyncapi/generator ./output.json @asyncapi/html-template
 */

import { compileAsyncAPI } from "../../test/utils/test-helpers.js";
import type { ParsedAsyncAPIDocument } from "../../src/domain/models/asyncapi-document.js";

function resolveRef(doc: ParsedAsyncAPIDocument, ref: string): unknown {
  if (!ref.startsWith("#/")) {
    return undefined;
  }
  const parts = ref.slice(2).split("/");
  let current: unknown = doc;
  for (const part of parts) {
    if (current && typeof current === "object") {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function collectRefs(obj: unknown, refs: string[] = []): string[] {
  if (!obj || typeof obj !== "object") {
    return refs;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      collectRefs(item, refs);
    }
    return refs;
  }
  const record = obj as Record<string, unknown>;
  if (typeof record.$ref === "string") {
    refs.push(record.$ref);
  }
  for (const v of Object.values(record)) {
    collectRefs(v, refs);
  }
  return refs;
}

describe("generator compatibility", () => {
  it("produces all required top-level fields for the generator", async () => {
    const { asyncApiDoc } = await compileAsyncAPI(`
      @server("prod", #{ url: "kafka://broker:9092", protocol: "kafka" })
      @service(#{title: "Gen Compat"})
      @defaultContentType("application/json")
      namespace Api;

      model Event { name: string }
      @channel("events")
      op publish(data: Event): void;
    `);

    expect(asyncApiDoc).toBeTruthy();
    expect(asyncApiDoc!.asyncapi).toBe("3.1.0");
    expect(asyncApiDoc!.info).toBeTruthy();
    expect(asyncApiDoc!.info.title).toBe("Gen Compat");
    expect(asyncApiDoc!.info.version).toBeTruthy();
    expect(asyncApiDoc!.channels).toBeTruthy();
    expect(Object.keys(asyncApiDoc!.channels!).length).toBeGreaterThan(0);
  });

  it("channels have address and messages for the generator", async () => {
    const { asyncApiDoc } = await compileAsyncAPI(`
      @service(#{title: "Channel Test"})
      namespace Api;
      model Order { orderId: string }
      @channel("orders")
      op publishOrder(data: Order): void;
    `);

    const channel = asyncApiDoc!.channels!["orders"];
    expect(channel).toBeTruthy();
    expect(channel.address).toBe("orders");
    expect(channel.messages).toBeTruthy();
    expect(Object.keys(channel.messages!).length).toBeGreaterThan(0);
  });

  it("operations reference channels and messages correctly", async () => {
    const { asyncApiDoc } = await compileAsyncAPI(`
      @service(#{title: "Op Test"})
      namespace Api;
      model User { id: string }
      @channel("users")
      op publishUser(data: User): void;
    `);

    const ops = asyncApiDoc!.operations!;
    const opKey = Object.keys(ops)[0]!;
    const op = ops[opKey];
    expect(op.channel).toBeTruthy();
    expect(op.channel.$ref).toMatch(/^#\/channels\//);
    expect(op.messages).toBeTruthy();
    expect(op.messages!.length).toBeGreaterThan(0);
  });

  it("all $ref values resolve to actual objects in the document", async () => {
    const { asyncApiDoc } = await compileAsyncAPI(`
      @service(#{title: "Ref Test"})
      @defaultContentType("application/json")
      namespace Api;
      model Order { id: string; customer: Customer }
      model Customer { name: string; }
      @channel("orders")
      op publish(data: Order): void;
    `);

    const refs = collectRefs(asyncApiDoc).filter((r) => !r.endsWith("/void"));
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) {
      const target = resolveRef(asyncApiDoc!, ref);
      expect(target, `Unresolved $ref: ${ref}`).toBeDefined();
    }
  });

  it("servers have host and protocol for the generator", async () => {
    const { asyncApiDoc } = await compileAsyncAPI(`
      @server("mqtt-broker", #{ url: "mqtt://broker:1883", protocol: "mqtt" })
      @service(#{title: "Server Test"})
      namespace Api;
      model Msg { text: string }
      @channel("events")
      op publish(data: Msg): void;
    `);

    const servers = asyncApiDoc!.servers!;
    expect(servers).toBeTruthy();
    const server = Object.values(servers)[0]!;
    expect(server.host).toBeTruthy();
    expect(server.protocol).toBeTruthy();
  });

  it("messages have payload $ref pointing to schemas", async () => {
    const { asyncApiDoc } = await compileAsyncAPI(`
      @service(#{title: "Msg Test"})
      namespace Api;
      model Event { type: string; data: string; }
      @channel("events")
      op publish(data: Event): void;
    `);

    const messages = asyncApiDoc!.components!.messages!;
    const msg = Object.values(messages)[0] as { payload?: { $ref?: string } };
    expect(msg).toBeTruthy();
    expect(msg.payload).toBeTruthy();
    expect(msg.payload?.$ref).toMatch(/^#\/components\/schemas\//);
  });

  it("produces valid schema objects with type information", async () => {
    const { asyncApiDoc } = await compileAsyncAPI(`
      @service(#{title: "Schema Test"})
      namespace Api;
      model User {
        id: string;
        age: int32;
        active: boolean;
        tags: string[];
      }
      @channel("users")
      op publish(data: User): void;
    `);

    const schema = asyncApiDoc!.components!.schemas!.User;
    expect(schema.type).toBe("object");
    expect(schema.properties?.id?.type).toBe("string");
    expect(schema.properties?.age?.type).toBe("integer");
    expect(schema.properties?.active?.type).toBe("boolean");
    expect(schema.properties?.tags?.type).toBe("array");
  });

  it("produces a complete round-trippable document", async () => {
    const { asyncApiDoc } = await compileAsyncAPI(`
      @server("kafka", #{ url: "kafka://broker:9092", protocol: "kafka" })
      @server("ws", #{ url: "ws://localhost:8080", protocol: "ws" })
      @service(#{title: "Round-trip"})
      @defaultContentType("application/json")
      namespace Api;
      model Order { id: string; total: float64; }
      @channel("orders")
      op publishOrder(data: Order): void;
      @channel("returns")
      op submitReturn(data: Order): void;
    `);

    expect(asyncApiDoc!.asyncapi).toBe("3.1.0");
    expect(asyncApiDoc!.info.title).toBe("Round-trip");
    expect(asyncApiDoc!.defaultContentType).toBe("application/json");
    expect(Object.keys(asyncApiDoc!.servers!)).toHaveLength(2);
    expect(Object.keys(asyncApiDoc!.channels!)).toHaveLength(2);
    expect(Object.keys(asyncApiDoc!.operations!)).toHaveLength(2);
    expect(asyncApiDoc!.components!.schemas!.Order).toBeTruthy();

    const refs = collectRefs(asyncApiDoc).filter((r) => !r.endsWith("/void"));
    for (const ref of refs) {
      expect(resolveRef(asyncApiDoc!, ref), `Unresolved: ${ref}`).toBeDefined();
    }
  });
});
