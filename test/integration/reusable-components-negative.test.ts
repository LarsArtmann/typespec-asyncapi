/**
 * Negative Tests: Reusable Component Decorators
 *
 * Verify that definition and reference decorators produce appropriate
 * diagnostics for invalid inputs, and that undefined references are
 * silently skipped (no crash, no $ref emitted).
 */

import { compileAsyncAPISpecRaw } from "../utils/test-helpers";

const hasErrorCode = (
  diagnostics: readonly { severity: string; code: string }[],
  suffix: string,
): boolean =>
  diagnostics.some(
    (d) => d.severity === "error" && d.code.endsWith(suffix),
  );

const hasNoErrors = (
  diagnostics: readonly { severity: string }[],
): boolean =>
  diagnostics.every((d) => d.severity !== "error");

describe("negative: operationTrait", () => {
  it("reports invalid-trait-config for empty name", async () => {
    const result = await compileAsyncAPISpecRaw(`
      @operationTrait("", #{ description: "test" })
      namespace Test;
    `);
    expect(
      hasErrorCode(result.diagnostics, "invalid-trait-config"),
    ).toBe(true);
  });

  it("silently skips undefined trait reference", async () => {
    const result = await compileAsyncAPISpecRaw(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @useOperationTrait("nonexistent")
      op publish(): Event;
    `);
    expect(hasNoErrors(result.diagnostics)).toBe(true);
  });
});

describe("negative: messageTrait", () => {
  it("reports invalid-trait-config for empty name", async () => {
    const result = await compileAsyncAPISpecRaw(`
      @messageTrait("", #{ description: "test" })
      namespace Test;
    `);
    expect(
      hasErrorCode(result.diagnostics, "invalid-trait-config"),
    ).toBe(true);
  });

  it("reports invalid-trait-config for empty useMessageTrait name", async () => {
    const result = await compileAsyncAPISpecRaw(`
      namespace Test;
      @useMessageTrait("")
      model Event { id: string; }
    `);
    expect(
      hasErrorCode(result.diagnostics, "invalid-trait-config"),
    ).toBe(true);
  });
});

describe("negative: parameter", () => {
  it("reports invalid-parameter-config for empty name", async () => {
    const result = await compileAsyncAPISpecRaw(`
      @parameter("", #{ description: "test" })
      namespace Test;
    `);
    expect(
      hasErrorCode(result.diagnostics, "invalid-parameter-config"),
    ).toBe(true);
  });
});

describe("negative: reusableCorrelationId", () => {
  it("reports invalid-correlationId-config for empty name", async () => {
    const result = await compileAsyncAPISpecRaw(`
      @reusableCorrelationId("", "$message.header#/correlationId")
      namespace Test;
    `);
    expect(
      hasErrorCode(result.diagnostics, "invalid-correlationId-config"),
    ).toBe(true);
  });

  it("reports invalid-correlationId-config for empty location", async () => {
    const result = await compileAsyncAPISpecRaw(`
      @reusableCorrelationId("default", "")
      namespace Test;
    `);
    expect(
      hasErrorCode(result.diagnostics, "invalid-correlationId-config"),
    ).toBe(true);
  });

  it("silently skips undefined correlationId reference", async () => {
    const result = await compileAsyncAPISpecRaw(`
      namespace Test;
      @useCorrelationId("nonexistent")
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);
    expect(hasNoErrors(result.diagnostics)).toBe(true);
  });
});

describe("negative: reusableBinding", () => {
  it("reports invalid-bindings-config for empty name", async () => {
    const result = await compileAsyncAPISpecRaw(`
      @reusableBinding("", #{ kafka: #{ bindingVersion: "0.5.0" } })
      namespace Test;
    `);
    expect(
      hasErrorCode(result.diagnostics, "invalid-bindings-config"),
    ).toBe(true);
  });

  it("reports invalid-bindings-config for empty useBinding name", async () => {
    const result = await compileAsyncAPISpecRaw(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @useBinding("")
      op publish(): Event;
    `);
    expect(
      hasErrorCode(result.diagnostics, "invalid-bindings-config"),
    ).toBe(true);
  });

  it("silently skips undefined binding reference", async () => {
    const result = await compileAsyncAPISpecRaw(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @useBinding("nonexistent")
      op publish(): Event;
    `);
    expect(hasNoErrors(result.diagnostics)).toBe(true);
  });
});
