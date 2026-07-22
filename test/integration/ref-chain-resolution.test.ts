/**
 * $ref Chain Resolution Test
 *
 * Verifies the core AsyncAPI 3.1 $ref chain works end-to-end:
 *   operations.{opId}.messages[] -> #/channels/{channelId}/messages/{messageId}
 *   channels.{channelId}.messages.{messageId} -> #/components/messages/{messageId}
 *   components.messages.{messageId}.payload -> #/components/schemas/{schemaName}
 *
 * This test proves the emitted document is internally consistent
 * and every $ref resolves to a real target.
 */

import { compileAsyncAPIWithoutErrors } from "../utils/test-helpers.js";

function unescapeToken(token: string): string {
  return token.replaceAll("~1", "/").replaceAll("~0", "~");
}

const source = `
  model OrderCreated {
    orderId: string;
    amount: int32;
    customerId: string;
  }

  @channel("orders/events")
  @publish
  op publishOrder(): OrderCreated;
`;

describe("$ref Chain Resolution", () => {
  it("operation.messages[0].$ref should point to #/channels/{channel}/messages/{message}", async () => {
    const result = await compileAsyncAPIWithoutErrors(source);
    const spec = result.asyncApiDoc;

    expect(spec).toBeDefined();
    expect(spec?.operations).toBeDefined();

    const ops = Object.values(spec!.operations!);
    expect(ops.length).toBeGreaterThan(0);

    const op = ops[0] as { messages: { $ref: string }[] };
    expect(op.messages).toBeDefined();
    expect(op.messages).toHaveLength(1);

    const ref = op.messages[0].$ref;
    expect(ref).toBe("#/channels/orders~1events/messages/OrderCreated");
  });

  it("channel.messages[ref] should resolve to #/components/messages/{messageId}", async () => {
    const result = await compileAsyncAPIWithoutErrors(source);
    const spec = result.asyncApiDoc;

    expect(spec?.channels).toBeDefined();
    const channel = spec!.channels!["orders/events"];
    expect(channel).toBeDefined();
    expect(channel.messages).toBeDefined();

    const channelMsgRef = channel.messages!["OrderCreated"];
    expect(channelMsgRef).toBeDefined();
    expect(channelMsgRef.$ref).toBe("#/components/messages/OrderCreated");
  });

  it("components.messages[ref].payload should point to #/components/schemas/{schemaName}", async () => {
    const result = await compileAsyncAPIWithoutErrors(source);
    const spec = result.asyncApiDoc;

    expect(spec?.components?.messages).toBeDefined();
    const msg = spec!.components!.messages!["OrderCreated"];
    expect(msg).toBeDefined();
    expect(msg.payload).toBeDefined();
    expect(msg.payload!.$ref).toBe("#/components/schemas/OrderCreated");
  });

  it("components.schemas[ref] should contain the actual model properties", async () => {
    const result = await compileAsyncAPIWithoutErrors(source);
    const spec = result.asyncApiDoc;

    expect(spec?.components?.schemas).toBeDefined();
    const schema = spec!.components!.schemas!["OrderCreated"] as {
      type: string;
      properties: Record<string, { type: string }>;
      required: string[];
    };
    expect(schema).toBeDefined();
    expect(schema.type).toBe("object");
    expect(schema.properties.orderId.type).toBe("string");
    expect(schema.properties.amount.type).toBe("integer");
    expect(schema.properties.customerId.type).toBe("string");
    expect(schema.required).toContain("orderId");
    expect(schema.required).toContain("amount");
    expect(schema.required).toContain("customerId");
  });

  it("operation.channel.$ref should point to #/channels/{channelId}", async () => {
    const result = await compileAsyncAPIWithoutErrors(source);
    const spec = result.asyncApiDoc;

    expect(spec?.operations).toBeDefined();
    const ops = Object.values(spec!.operations!);
    const op = ops[0] as { channel: { $ref: string } };
    expect(op.channel).toBeDefined();
    expect(op.channel.$ref).toBe("#/channels/orders~1events");
  });

  it("every $ref in a document with slash-free channel names should resolve", async () => {
    const flatSource = `
      model OrderCreated {
        orderId: string;
        amount: int32;
      }

      @channel("orders")
      @publish
      op publishOrder(): OrderCreated;
    `;
    const result = await compileAsyncAPIWithoutErrors(flatSource);
    const spec = result.asyncApiDoc;
    const doc = spec as Record<string, unknown>;

    expect(doc).toBeDefined();
    if (!doc) {
      return;
    }
    const unresolved: string[] = [];

    function resolveRef(refPath: string): unknown | null {
      if (!refPath.startsWith("#/")) {
        return null;
      }
      const parts = refPath.slice(2).split("/").map(unescapeToken);
      let current: unknown = doc;
      for (const part of parts) {
        if (current && typeof current === "object") {
          current = (current as Record<string, unknown>)[part];
        } else {
          return null;
        }
      }
      return current;
    }

    const seen = new WeakSet();
    function walk(obj: unknown) {
      if (!obj || typeof obj !== "object") {
        return;
      }
      if (seen.has(obj)) {
        return;
      }
      seen.add(obj);
      if (Array.isArray(obj)) {
        for (const item of obj) {
          walk(item);
        }
        return;
      }
      const record = obj as Record<string, unknown>;
      for (const [key, value] of Object.entries(record)) {
        if (key === "$ref" && typeof value === "string") {
          const target = resolveRef(value);
          if (target === null || target === undefined) {
            unresolved.push(value);
          }
        } else {
          walk(value);
        }
      }
    }

    walk(doc);
    expect(unresolved).toStrictEqual([]);
  });

  it("channel addresses containing slashes produce JSON-pointer-escaped $refs that resolve correctly", async () => {
    const result = await compileAsyncAPIWithoutErrors(source);
    const spec = result.asyncApiDoc;

    // The channel key "orders/events" works as a JSON object key
    expect(spec?.channels?.["orders/events"]).toBeDefined();

    // The $ref must escape "/" as "~1" per RFC 6901
    const ref = spec!.operations!.publishOrder.channel.$ref;
    expect(ref).toBe("#/channels/orders~1events");

    function resolveByJsonPointer(refPath: string): unknown | null {
      if (!refPath.startsWith("#/")) {
        return null;
      }
      const parts = refPath.slice(2).split("/").map(unescapeToken);
      let current: unknown = spec;
      for (const part of parts) {
        if (current && typeof current === "object") {
          current = (current as Record<string, unknown>)[part];
        } else {
          return null;
        }
      }
      return current;
    }

    // The escaped ref NOW resolves via standard JSON pointer
    expect(resolveByJsonPointer(ref)).toBeDefined();
    expect(resolveByJsonPointer(ref)).toBe(spec!.channels!["orders/events"]);
  });
});
