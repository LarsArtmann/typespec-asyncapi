/**
 * Idempotency Tests
 *
 * Verifies that compiling the same TypeSpec source twice produces
 * byte-for-byte identical output. Non-deterministic output would
 * break golden files, CI caching, and consumer diffing.
 */

import { compileAsyncAPI } from "../utils/test-helpers.js";

const complexSpec = `
  @service(#{title: "E-Commerce Events"})
  @server("production", #{url: "kafka://broker:9092", protocol: "kafka"})
  namespace Test;

  model OrderCreated {
    orderId: string;
    customerId: string;
    items: string[];
    total: decimal;
    timestamp: utcDateTime;
  }

  model OrderItem {
    sku: string;
    quantity: int32;
    price: float64;
  }

  model OrderUpdated {
    orderId: string;
    status: "pending" | "shipped" | "delivered";
    updatedAt: utcDateTime;
  }

  @channel("orders/created")
  @publish
  op publishOrderCreated(): OrderCreated;

  @channel("orders/updated")
  @publish
  op publishOrderUpdated(): OrderUpdated;

  @channel("orders/items")
  @subscribe
  op subscribeOrderItems(): OrderItem;
`;

describe("idempotency: same input produces same output", () => {
  it("produces identical YAML output on repeated compilation", async () => {
    const result1 = await compileAsyncAPI(complexSpec);
    const result2 = await compileAsyncAPI(complexSpec);

    const errors1 = result1.diagnostics.filter((d) => d.severity === "error");
    expect(errors1).toHaveLength(0);

    const output1 = result1.outputs[result1.outputFile!];
    const output2 = result2.outputs[result2.outputFile!];

    expect(output1).toBeDefined();
    expect(output2).toBeDefined();
    expect(output1).toBe(output2);
  });

  it("produces identical JSON output on repeated compilation", async () => {
    const result1 = await compileAsyncAPI(complexSpec, {
      "file-type": "json",
    });
    const result2 = await compileAsyncAPI(complexSpec, {
      "file-type": "json",
    });

    const errors1 = result1.diagnostics.filter((d) => d.severity === "error");
    expect(errors1).toHaveLength(0);

    const output1 = result1.outputs[result1.outputFile!];
    const output2 = result2.outputs[result2.outputFile!];

    expect(output1).toBeDefined();
    expect(output2).toBeDefined();
    expect(output1).toBe(output2);
  });

  it("produces deterministic key ordering in components", async () => {
    const result1 = await compileAsyncAPI(complexSpec);
    const result2 = await compileAsyncAPI(complexSpec);

    const doc1 = result1.asyncApiDoc!;
    const doc2 = result2.asyncApiDoc!;

    expect(Object.keys(doc1.components?.schemas ?? {})).toStrictEqual(
      Object.keys(doc2.components?.schemas ?? {}),
    );
    expect(Object.keys(doc1.components?.messages ?? {})).toStrictEqual(
      Object.keys(doc2.components?.messages ?? {}),
    );
    expect(Object.keys(doc1.channels)).toStrictEqual(Object.keys(doc2.channels));
    expect(Object.keys(doc1.operations ?? {})).toStrictEqual(Object.keys(doc2.operations ?? {}));
  });

  it("produces identical output for a spec with security schemes", async () => {
    const spec = `
      @server("api", #{url: "api.example.com", protocol: "https"})
      namespace Secure;

      model Event { id: string; }

      @security(#{name: "bearer", scheme: #{type: "http", scheme: "bearer"}})
      @channel("secure/events")
      op getEvents(): Event;
    `;

    const result1 = await compileAsyncAPI(spec);
    const result2 = await compileAsyncAPI(spec);

    const errors1 = result1.diagnostics.filter((d) => d.severity === "error");
    expect(errors1).toHaveLength(0);

    const output1 = result1.outputs[result1.outputFile!];
    const output2 = result2.outputs[result2.outputFile!];

    expect(output1).toBe(output2);
  });
});
