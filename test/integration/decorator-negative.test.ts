/**
 * Decorator Negative Tests
 *
 * Tests that decorators correctly report diagnostics when given invalid input.
 * Covers error paths that were previously untested:
 * - invalid-security-scheme-type
 * - invalid-server-url
 * - missing-channel-path
 * - server-url-required
 * - server-protocol-required
 * - unsupported-protocol (on @protocol decorator)
 *
 * Also tests the emitter `description` option.
 */

import { compileAsyncAPI } from "../utils/test-helpers.js";

const LIB_PREFIX = "@lars-artmann/typespec-asyncapi";

function hasDiagnostic(
  diagnostics: readonly { code: string; severity: string }[],
  code: string,
): boolean {
  return diagnostics.some((d) => d.code === `${LIB_PREFIX}/${code}`);
}

describe("decorator negative tests: @security", () => {
  it("reports invalid-security-scheme-type for 'sasl'", async () => {
    const result = await compileAsyncAPI(`
      namespace Test;
      model Event { id: string; }

      @security(#{name: "bad", scheme: #{type: "sasl"}})
      @channel("events")
      op secureEvent(): Event;
    `);
    expect(
      hasDiagnostic(result.diagnostics, "invalid-security-scheme-type"),
    ).toBeTruthy();
  });

  it("reports invalid-security-scheme-type for 'mutualTLS'", async () => {
    const result = await compileAsyncAPI(`
      namespace Test;
      model Event { id: string; }

      @security(#{name: "bad", scheme: #{type: "mutualTLS"}})
      @channel("events")
      op secureEvent(): Event;
    `);
    expect(
      hasDiagnostic(result.diagnostics, "invalid-security-scheme-type"),
    ).toBeTruthy();
  });

  it("accepts valid security scheme type 'apiKey'", async () => {
    const result = await compileAsyncAPI(`
      namespace Test;
      model Event { id: string; }

      @security(#{
        name: "key",
        scheme: #{type: "httpApiKey", name: "X-API-Key", "in": "header"}
      })
      @channel("events")
      op secureEvent(): Event;
    `);
    expect(
      hasDiagnostic(result.diagnostics, "invalid-security-scheme-type"),
    ).toBeFalsy();
  });
});

describe("decorator negative tests: @server", () => {
  it("reports invalid-server-url for URL with spaces", async () => {
    const result = await compileAsyncAPI(`
      @server("bad", #{url: "not a valid url", protocol: "kafka"})
      namespace Test;
      model Event { id: string; }
      @channel("events") op publish(): Event;
    `);
    expect(
      hasDiagnostic(result.diagnostics, "invalid-server-url"),
    ).toBeTruthy();
  });

  it("reports server-url-required when url is missing", async () => {
    const result = await compileAsyncAPI(`
      @server("bad", #{protocol: "kafka"})
      namespace Test;
      model Event { id: string; }
      @channel("events") op publish(): Event;
    `);
    expect(
      hasDiagnostic(result.diagnostics, "server-url-required"),
    ).toBeTruthy();
  });

  it("reports server-protocol-required when protocol is missing", async () => {
    const result = await compileAsyncAPI(`
      @server("bad", #{url: "localhost:9092"})
      namespace Test;
      model Event { id: string; }
      @channel("events") op publish(): Event;
    `);
    expect(
      hasDiagnostic(result.diagnostics, "server-protocol-required"),
    ).toBeTruthy();
  });
});

describe("decorator negative tests: @channel", () => {
  it("reports missing-channel-path for empty string", async () => {
    const result = await compileAsyncAPI(`
      namespace Test;
      model Event { id: string; }
      @channel("") op publish(): Event;
    `);
    expect(
      hasDiagnostic(result.diagnostics, "missing-channel-path"),
    ).toBeTruthy();
  });

  it("does not report missing-channel-path for valid path", async () => {
    const result = await compileAsyncAPI(`
      namespace Test;
      model Event { id: string; }
      @channel("events") op publish(): Event;
    `);
    expect(
      hasDiagnostic(result.diagnostics, "missing-channel-path"),
    ).toBeFalsy();
  });
});

describe("decorator negative tests: @protocol", () => {
  it("reports unsupported-protocol for unknown protocol", async () => {
    const result = await compileAsyncAPI(`
      namespace Test;
      model Event { id: string; }
      @protocol(#{protocol: "carrier-pigeon"})
      @channel("events") op publish(): Event;
    `);
    expect(
      hasDiagnostic(result.diagnostics, "unsupported-protocol"),
    ).toBeTruthy();
  });

  it("accepts valid protocol 'kafka'", async () => {
    const result = await compileAsyncAPI(`
      namespace Test;
      model Event { id: string; }
      @protocol(#{protocol: "kafka"})
      @channel("events") op publish(): Event;
    `);
    expect(
      hasDiagnostic(result.diagnostics, "unsupported-protocol"),
    ).toBeFalsy();
  });
});

describe("emitter description option", () => {
  it("sets info.description from emitter option", async () => {
    const result = await compileAsyncAPI(
      `
        namespace Test;
        model Event { id: string; }
        @channel("events") op publish(): Event;
      `,
      { description: "My custom API description" },
    );
    expect(result.asyncApiDoc?.info?.description).toBe(
      "My custom API description",
    );
  });

  it("omits info.description when option not provided", async () => {
    const result = await compileAsyncAPI(
      `
        namespace Test;
        model Event { id: string; }
        @channel("events") op publish(): Event;
      `,
    );
    expect(result.asyncApiDoc?.info?.description).toBeUndefined();
  });
});
