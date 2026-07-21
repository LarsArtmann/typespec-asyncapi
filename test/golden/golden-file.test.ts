/**
 * Golden File Test
 *
 * The single most valuable test in the project.
 * Locks in verified-correct AsyncAPI 3.1 output.
 * Any change to the emitter that alters output will be caught immediately.
 */

import { describe, it, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import YAML from "yaml";
import { compileAsyncAPISpecRaw } from "../utils/test-helpers";

const GOLDEN_FILE = join(import.meta.dir, "ecommerce.expected.yaml");

const SOURCE = `
@server("production", #{
  url: "api.example.com",
  protocol: "https",
  description: "Production server"
})
namespace ECommerce;

/**
 * Event published when a new order is created.
 */
model OrderCreated {
  @doc("Unique order identifier")
  orderId: string;
  customerId: string;
  total: decimal;
  items: string[];
}

model OrderShipped {
  orderId: string;
  trackingNumber: string;
}

@channel("orders.created")
@publish
op publishOrderCreated(): OrderCreated;

@channel("orders.shipped")
@subscribe
op subscribeOrderShipped(): OrderShipped;
`;

describe("Golden File Test", () => {
  it("should produce spec-compliant AsyncAPI 3.1 output matching golden file", async () => {
    const raw = await compileAsyncAPISpecRaw(SOURCE);

    // No compilation errors
    const errors = raw.diagnostics.filter((d) => d.severity === "error");
    expect(errors.length).toBe(0);

    // Find the asyncapi output
    let output = "";
    for (const [path, content] of raw.outputFiles) {
      if (
        path.includes("asyncapi") &&
        typeof content === "string" &&
        content.startsWith("asyncapi")
      ) {
        output = content;
        break;
      }
    }
    expect(output.length).toBeGreaterThan(0);

    const actual = YAML.parse(output);

    // Load golden file
    const goldenContent = readFileSync(GOLDEN_FILE, "utf-8");
    const golden = YAML.parse(goldenContent);

    // Structural comparison
    expect(actual.asyncapi).toBe(golden.asyncapi);
    expect(actual.info).toEqual(golden.info);
    expect(actual.servers).toEqual(golden.servers);
    expect(actual.channels).toEqual(golden.channels);
    expect(actual.operations).toEqual(golden.operations);
    expect(actual.components.messages).toEqual(golden.components.messages);
    expect(actual.components.schemas).toEqual(golden.components.schemas);
  });

  it("should use spec-compliant $ref chain (operation → channel → components)", async () => {
    const raw = await compileAsyncAPISpecRaw(SOURCE);
    let output = "";
    for (const [path, content] of raw.outputFiles) {
      if (
        path.includes("asyncapi") &&
        typeof content === "string" &&
        content.startsWith("asyncapi")
      ) {
        output = content;
        break;
      }
    }
    const doc = YAML.parse(output) as any;

    // Every operation message $ref MUST go through channels, NOT directly to components
    for (const [opName, op] of Object.entries<any>(doc.operations ?? {})) {
      for (const msgRef of op.messages ?? []) {
        expect(msgRef.$ref).toMatch(/^#\/channels\/[^/]+\/messages\/[^/]+$/);
      }
    }

    // Every channel message $ref MUST point to components/messages
    for (const [, channel] of Object.entries<any>(doc.channels ?? {})) {
      for (const [, msgRef] of Object.entries<any>(channel.messages ?? {})) {
        expect(msgRef.$ref).toMatch(/^#\/components\/messages\/.+$/);
      }
    }

    // Every component message payload MUST point to components/schemas
    for (const [, msg] of Object.entries<any>(doc.components?.messages ?? {})) {
      expect(msg.payload.$ref).toMatch(/^#\/components\/schemas\/.+$/);
    }
  });

  it("should use model names for messages, not operation names", async () => {
    const raw = await compileAsyncAPISpecRaw(SOURCE);
    let output = "";
    for (const [path, content] of raw.outputFiles) {
      if (
        path.includes("asyncapi") &&
        typeof content === "string" &&
        content.startsWith("asyncapi")
      ) {
        output = content;
        break;
      }
    }
    const doc = YAML.parse(output) as any;

    // Message names should be model names (OrderCreated, OrderShipped)
    // NOT operation names (publishOrderCreated, subscribeOrderShipped)
    expect(doc.components.messages.OrderCreated).toBeDefined();
    expect(doc.components.messages.OrderShipped).toBeDefined();
    expect(doc.components.messages.publishOrderCreated).toBeUndefined();
    expect(doc.components.messages.subscribeOrderShipped).toBeUndefined();
  });
});
