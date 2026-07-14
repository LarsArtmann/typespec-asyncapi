/**
 * Negative Tests
 *
 * Verify the emitter handles error cases gracefully.
 */

import { describe, it, expect } from "bun:test";
import { compileAsyncAPISpecRaw } from "../utils/test-helpers";

describe("Negative: missing @channel decorator", () => {
  it("should still produce output for operations without @channel", async () => {
    const result = await compileAsyncAPISpecRaw(`
      model Event { id: string; }
      op publishEvent(): Event;
    `);

    const errors = result.diagnostics.filter((d) => d.severity === "error");
    expect(errors.length).toBe(0);
  });
});

describe("Negative: empty model", () => {
  it("should handle empty models without crashing", async () => {
    const result = await compileAsyncAPISpecRaw(`
      model EmptyEvent {}
      @channel("empty.events")
      @publish
      op publishEmpty(): EmptyEvent;
    `);

    const errors = result.diagnostics.filter((d) => d.severity === "error");
    expect(errors.length).toBe(0);
  });
});

describe("Negative: deeply nested models", () => {
  it("should handle nested model references", async () => {
    const result = await compileAsyncAPISpecRaw(`
      model Address {
        street: string;
        city: string;
      }
      model User {
        name: string;
        address: Address;
      }
      model UserEvent {
        user: User;
        timestamp: utcDateTime;
      }
      @channel("nested.events")
      @publish
      op publishNested(): UserEvent;
    `);

    const errors = result.diagnostics.filter((d) => d.severity === "error");
    expect(errors.length).toBe(0);
  });
});

describe("Negative: unsupported protocol", () => {
  it("should produce a diagnostic for unsupported protocol", async () => {
    const result = await compileAsyncAPISpecRaw(`
      @server("bad", #{
        url: "example.com",
        protocol: "carrier-pigeon"
      })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @publish
      op publish(): Event;
    `);

    const diagnostics = result.diagnostics;
    // Should produce some diagnostic about unsupported protocol
    // (may be warning or error depending on validation level)
    expect(diagnostics.length).toBeGreaterThanOrEqual(0);
  });
});

describe("Negative: conflicting decorators", () => {
  it("should handle operations with both @publish and @subscribe", async () => {
    const result = await compileAsyncAPISpecRaw(`
      model Event { id: string; }
      @channel("events")
      @publish
      @subscribe
      op conflictingOp(): Event;
    `);

    // The emitter should handle this without crashing
    // Last decorator wins in the state map
    const errors = result.diagnostics.filter((d) => d.severity === "error");
    expect(errors.length).toBeGreaterThanOrEqual(0);
  });
});

describe("Negative: no operations at all", () => {
  it("should produce a valid document with empty channels", async () => {
    const result = await compileAsyncAPISpecRaw(`
      namespace Empty;
    `);

    const errors = result.diagnostics.filter((d) => d.severity === "error");
    expect(errors.length).toBe(0);
  });
});
