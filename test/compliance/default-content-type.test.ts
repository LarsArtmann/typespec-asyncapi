/**
 * AsyncAPI 3.1.0 Spec Compliance: defaultContentType
 *
 * Validates that @defaultContentType decorator output conforms to
 * the AsyncAPI 3.1.0 specification.
 */

import { compileAsyncAPI } from "../utils/test-helpers.js";
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

  it("warns and keeps the first value when namespaces conflict", async () => {
    const { asyncApiDoc, diagnostics } = await compileAsyncAPI(`
      namespace Root;

      @defaultContentType("application/json")
      namespace First {
        model EventA { id: string; }
        @channel("events-a")
        op publishA(): EventA;
      }

      @defaultContentType("application/avro")
      namespace Second {
        model EventB { id: string; }
        @channel("events-b")
        op publishB(): EventB;
      }
    `);

    const warning = diagnostics.find((d) =>
      d.code?.endsWith("conflicting-default-content-type"),
    );
    expect(warning).toBeDefined();
    expect(warning!.severity).toBe("warning");
    // The document must use exactly the value the warning says is kept
    const used = /using '([^']+)'/.exec(warning!.message)?.[1];
    expect(used).toBeDefined();
    expect(asyncApiDoc!.defaultContentType).toBe(used);
    expect(["application/json", "application/avro"]).toContain(used);
  });

  it("emits no warning when namespaces agree on the value", async () => {
    const { asyncApiDoc, diagnostics } = await compileAsyncAPI(`
      namespace Root;

      @defaultContentType("application/json")
      namespace First {
        model EventA { id: string; }
        @channel("events-a")
        op publishA(): EventA;
      }

      @defaultContentType("application/json")
      namespace Second {
        model EventB { id: string; }
        @channel("events-b")
        op publishB(): EventB;
      }
    `);

    expect(
      diagnostics.some((d) =>
        d.code?.endsWith("conflicting-default-content-type"),
      ),
    ).toBeFalsy();
    expect(asyncApiDoc!.defaultContentType).toBe("application/json");
  });

  it("rejects a non-MIME defaultContentType with invalid-default-content-type", async () => {
    const { asyncApiDoc, diagnostics } = await compileAsyncAPI(`
      @defaultContentType("not-a-mime-type")
      namespace Demo;

      model Broken { id: string; }
      @channel("events")
      op publish(): Broken;
    `);

    expect(
      diagnostics.some((d) =>
        d.code?.endsWith("invalid-default-content-type"),
      ),
    ).toBeTruthy();
    expect(asyncApiDoc?.defaultContentType).toBeUndefined();
  });

  it("accepts a MIME type with parameters", async () => {
    const doc = await compileAndValidateOrThrow(`
      @defaultContentType("application/json; charset=utf-8")
      namespace Demo;

      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    expect(doc.defaultContentType).toBe("application/json; charset=utf-8");
  });
});
