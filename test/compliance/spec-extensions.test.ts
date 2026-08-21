/**
 * AsyncAPI 3.1.0 Spec Compliance: @extension spec extensions
 *
 * `@extension("x-...", value)` attaches AsyncAPI specification extensions:
 * Namespace targets extend the document root, Operations the operation
 * object, Models the message object. Keys must start with "x-"; repeatable
 * with merge semantics. The AsyncAPI 3.1 schema ignores x- keys, so
 * extended output still validates.
 */

import { compileAndValidate, compileAndValidateOrThrow } from "../utils/schema-validator.js";

describe("spec Compliance: @extension", () => {
  it("extends the document root from a namespace target", async () => {
    const doc = await compileAndValidateOrThrow(`
      @extension("x-organization", #{ name: "Platform", team: "Events" })
      @extension("x-internal-id", "DOC-42")
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    expect(doc["x-organization"]).toStrictEqual({ name: "Platform", team: "Events" });
    expect(doc["x-internal-id"]).toBe("DOC-42");
  });

  it("extends operation objects", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @extension("x-retry-policy", #{ maxAttempts: 3, backoffMs: 500 })
      @extension("x-owner", "payments")
      op publish(): Event;
    `);

    const op = doc.operations!.publish;
    expect(op["x-retry-policy"]).toStrictEqual({ maxAttempts: 3, backoffMs: 500 });
    expect(op["x-owner"]).toBe("payments");
  });

  it("extends message objects from model targets", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @extension("x-avro-schema-id", "registry://schemas/users/3")
      model User { id: string; }
      @channel("users")
      op publish(): User;
    `);

    const message = doc.components!.messages!.User;
    expect(message["x-avro-schema-id"]).toBe("registry://schemas/users/3");
  });

  it("supports repeated applications with merge semantics", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @extension("x-a", 1)
      @extension("x-b", 2)
      op publish(): Event;
    `);

    const op = doc.operations!.publish;
    expect(op["x-a"]).toBe(1);
    expect(op["x-b"]).toBe(2);
  });

  it("warns on non-x- keys and skips them", async () => {
    const result = await compileAndValidate(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @extension("internal-only", true)
      @extension("x-valid", true)
      op publish(): Event;
    `);
    expect(result.valid).toBe(true);

    const invalid = result.diagnostics.filter(
      (d) => d.code === "@lars-artmann/typespec-asyncapi/invalid-extension-key",
    );
    expect(invalid).toHaveLength(1);

    const op = result.document.operations!.publish;
    expect(op["internal-only"]).toBeUndefined();
    expect(op["x-valid"]).toBe(true);
  });
});
