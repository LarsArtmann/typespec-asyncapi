
/**
 * AsyncAPI 3.1 Schema Validation Test
 *
 * Validates emitter output against the official AsyncAPI 3.1.0 JSON Schema
 * using @asyncapi/specs + ajv (both already dependencies).
 */

import Ajv from "ajv";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { compileAsyncAPISpecRaw } from "../utils/test-helpers";

// Load the official AsyncAPI 3.1.0 JSON Schema
const schemaPath = join(
  import.meta.dirname,
  "..",
  "..",
  "node_modules",
  "@asyncapi",
  "specs",
  "schemas",
  "3.1.0-without-$id.json",
);
const asyncApiSchema = JSON.parse(readFileSync(schemaPath, "utf8"));

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(asyncApiSchema);

async function getEmitterOutput(source: string): Promise<Record<string, unknown>> {
  const raw = await compileAsyncAPISpecRaw(source);

  const errors = raw.diagnostics.filter((d) => d.severity === "error");
  expect(errors).toHaveLength(0);

  for (const [, content] of raw.outputFiles) {
    if (typeof content === "string" && content.startsWith("asyncapi")) {
      // Parse YAML to object for schema validation
      const { parse } = await import("yaml");
      return parse(content);
    }
  }
  throw new Error("No AsyncAPI output found");
}

describe("asyncAPI 3.1 Schema Validation", () => {
  it("should validate simple event output against AsyncAPI 3.1.0 schema", async () => {
    const source = `
      namespace SimpleApp;

      model UserEvent {
        id: string;
        name: string;
      }

      @channel("user.events")
      op publishUserEvent(): UserEvent;
    `;

    const doc = await getEmitterOutput(source);
    const valid = validate(doc);

    if (!valid) {
      console.error("Validation errors:", JSON.stringify(validate.errors, null, 2));
    }
    expect(valid).toBeTruthy();
  });

  it("should validate output with servers against AsyncAPI 3.1.0 schema", async () => {
    const source = `
      @server("prod", #{
        url: "broker.example.com:9092",
        protocol: "kafka",
        description: "Production Kafka"
      })
      namespace EventApp;

      model OrderCreated {
        orderId: string;
        total: decimal;
      }

      @channel("orders.created")
      op publishOrderCreated(): OrderCreated;
    `;

    const doc = await getEmitterOutput(source);
    const valid = validate(doc);

    if (!valid) {
      console.error("Validation errors:", JSON.stringify(validate.errors, null, 2));
    }
    expect(valid).toBeTruthy();
  });

  it("should validate multi-operation output against AsyncAPI 3.1.0 schema", async () => {
    const source = `
      namespace MultiApp;

      model UserRegistered { userId: string; email: string; }
      model UserDeleted { userId: string; }

      @channel("users.registered")
      op publishUserRegistered(): UserRegistered;

      @channel("users.deleted")
      op publishUserDeleted(): UserDeleted;
    `;

    const doc = await getEmitterOutput(source);
    const valid = validate(doc);

    if (!valid) {
      console.error("Validation errors:", JSON.stringify(validate.errors, null, 2));
    }
    expect(valid).toBeTruthy();
  });
});
