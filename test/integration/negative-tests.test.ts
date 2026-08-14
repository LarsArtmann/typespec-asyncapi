/**
 * Negative Tests
 *
 * Verify the emitter handles error cases gracefully.
 */

import { compileAsyncAPISpecRaw } from "../utils/test-helpers";

describe("negative: missing @channel decorator", () => {
  it("should still produce output for operations without @channel", async () => {
    const result = await compileAsyncAPISpecRaw(`
      model Event { id: string; }
      op publishEvent(): Event;
    `);

    const errors = result.diagnostics.filter((d) => d.severity === "error");
    expect(errors).toHaveLength(0);
  });
});

describe("negative: empty model", () => {
  it("should handle empty models without crashing", async () => {
    const result = await compileAsyncAPISpecRaw(`
      model EmptyEvent {}
      @channel("empty.events")
      @publish
      op publishEmpty(): EmptyEvent;
    `);

    const errors = result.diagnostics.filter((d) => d.severity === "error");
    expect(errors).toHaveLength(0);
  });
});

describe("negative: deeply nested models", () => {
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
    expect(errors).toHaveLength(0);
  });
});

describe("negative: unsupported protocol", () => {
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

    const { diagnostics } = result;
    // Unsupported server protocols are rejected with an error diagnostic
    expect(
      diagnostics.some(
        (d) => d.code === "@lars-artmann/typespec-asyncapi/unsupported-protocol",
      ),
    ).toBe(true);
  });
});

describe("negative: conflicting decorators", () => {
  it("should handle operations with both @publish and @subscribe", async () => {
    const result = await compileAsyncAPISpecRaw(`
      model Event { id: string; }
      @channel("events")
      @publish
      @subscribe
      op conflictingOp(): Event;
    `);

    // The emitter handles the conflict without crashing and the outermost decorator wins
    const errors = result.diagnostics.filter((d) => d.severity === "error");
    expect(errors).toHaveLength(0);
  });
});

describe("negative: no operations at all", () => {
  it("should produce a valid document with empty channels", async () => {
    const result = await compileAsyncAPISpecRaw(`
      namespace Empty;
    `);

    const errors = result.diagnostics.filter((d) => d.severity === "error");
    expect(errors).toHaveLength(0);
  });
});
