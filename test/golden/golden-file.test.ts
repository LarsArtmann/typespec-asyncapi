/**
 * Golden File Test
 *
 * The single most valuable test in the project.
 * Locks in verified-correct AsyncAPI 3.1 output.
 * Any change to the emitter that alters output will be caught immediately.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";
import { compileAsyncAPISpecRaw } from "../utils/test-helpers";
import type {
  MessageObject,
  ParsedAsyncAPIDocument,
} from "../../src/domain/models/asyncapi-document.js";

const GOLDEN_FILE = join(import.meta.dirname, "ecommerce.expected.yaml");

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

describe("golden File Test", () => {
  it("should produce spec-compliant AsyncAPI 3.1 output matching golden file", async () => {
    const raw = await compileAsyncAPISpecRaw(SOURCE);

    // No compilation errors
    const errors = raw.diagnostics.filter((d) => d.severity === "error");
    expect(errors).toHaveLength(0);

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
    const goldenContent = readFileSync(GOLDEN_FILE, "utf8");
    const golden = YAML.parse(goldenContent);

    // Structural comparison
    expect(actual.asyncapi).toBe(golden.asyncapi);
    expect(actual.info).toStrictEqual(golden.info);
    expect(actual.servers).toStrictEqual(golden.servers);
    expect(actual.channels).toStrictEqual(golden.channels);
    expect(actual.operations).toStrictEqual(golden.operations);
    expect(actual.components.messages).toStrictEqual(
      golden.components.messages,
    );
    expect(actual.components.schemas).toStrictEqual(golden.components.schemas);
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
    const doc = YAML.parse(output) as ParsedAsyncAPIDocument;

    // Every operation message $ref MUST go through channels, NOT directly to components
    for (const [, op] of Object.entries(doc.operations ?? {})) {
      for (const msgRef of op.messages ?? []) {
        expect(msgRef.$ref).toMatch(/^#\/channels\/[^/]+\/messages\/[^/]+$/);
      }
    }

    // Every channel message $ref MUST point to components/messages
    for (const [, channel] of Object.entries(doc.channels ?? {})) {
      for (const [, msgRef] of Object.entries(channel.messages ?? {})) {
        expect(msgRef.$ref).toMatch(/^#\/components\/messages\/.+$/);
      }
    }

    // Every component message payload MUST point to components/schemas
    for (const [, msg] of Object.entries(doc.components?.messages ?? {})) {
      expect((msg as MessageObject).payload?.$ref).toMatch(
        /^#\/components\/schemas\/.+$/,
      );
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
    const doc = YAML.parse(output) as ParsedAsyncAPIDocument;

    // Message names should be model names (OrderCreated, OrderShipped)
    // NOT operation names (publishOrderCreated, subscribeOrderShipped)
    expect(doc.components?.messages?.OrderCreated).toBeDefined();
    expect(doc.components?.messages?.OrderShipped).toBeDefined();
    expect(doc.components?.messages?.publishOrderCreated).toBeUndefined();
    expect(doc.components?.messages?.subscribeOrderShipped).toBeUndefined();
  });
});
