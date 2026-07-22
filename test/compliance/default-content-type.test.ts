/**
 * AsyncAPI 3.1.0 Spec Compliance: defaultContentType
 *
 * Validates that @defaultContentType decorator output conforms to
 * the AsyncAPI 3.1.0 specification.
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";

describe("spec Compliance: defaultContentType", () => {
  it("emits defaultContentType when @defaultContentType is set", async () => {
    const doc = await compileAndValidateOrThrow(`
      @defaultContentType("application/avro")
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    expect(doc.defaultContentType).toBe("application/avro");
  });

  it("does not emit defaultContentType when decorator is absent", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    expect(doc.defaultContentType).toBeUndefined();
  });
});
