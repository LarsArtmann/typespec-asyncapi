/**
 * Tests: @apiVersion decorator for info.version field
 */

import { compileAsyncAPI } from "../utils/test-helpers.js";

describe("apiVersion decorator", () => {
  it("sets info.version from @apiVersion on namespace", async () => {
    const { asyncApiDoc } = await compileAsyncAPI(`
      @service(#{title: "Versioned API"})
      @apiVersion("2.5.0")
      namespace Api;
      model Event { name: string }
      @channel("events")
      op publish(data: Event): void;
    `);

    expect(asyncApiDoc).toBeTruthy();
    expect(asyncApiDoc!.info.version).toBe("2.5.0");
  });

  it("defaults to 1.0.0 when no version specified", async () => {
    const { asyncApiDoc } = await compileAsyncAPI(`
      @service(#{title: "Default Version"})
      namespace Api;
      model Event { name: string }
      @channel("events")
      op publish(data: Event): void;
    `);

    expect(asyncApiDoc).toBeTruthy();
    expect(asyncApiDoc!.info.version).toBe("1.0.0");
  });

  it("emitter options version overrides @apiVersion", async () => {
    const { asyncApiDoc } = await compileAsyncAPI(
      `
      @service(#{title: "Override Test"})
      @apiVersion("3.0.0")
      namespace Api;
      model Event { name: string }
      @channel("events")
      op publish(data: Event): void;
    `,
      { version: "9.9.9" },
    );

    expect(asyncApiDoc).toBeTruthy();
    expect(asyncApiDoc!.info.version).toBe("9.9.9");
  });

  it("warns and keeps the first value when namespaces conflict", async () => {
    const { asyncApiDoc, diagnostics } = await compileAsyncAPI(`
      @apiVersion("1.0.0")
      namespace First;
      model EventA { id: string; }
      @channel("events-a")
      op publishA(): EventA;

      @apiVersion("2.0.0")
      namespace Second;
      model EventB { id: string; }
      @channel("events-b")
      op publishB(): EventB;
    `);

    const warning = diagnostics.find((d) => d.code === "conflicting-api-version");
    expect(warning).toBeDefined();
    expect(warning!.severity).toBe("warning");
    // The document must use exactly the value the warning says is kept
    const used = /using '([^']+)'/.exec(warning!.message)?.[1];
    expect(used).toBeDefined();
    expect(asyncApiDoc!.info.version).toBe(used);
    expect(["1.0.0", "2.0.0"]).toContain(used);
  });

  it("emits no warning when namespaces agree on the version", async () => {
    const { asyncApiDoc, diagnostics } = await compileAsyncAPI(`
      @apiVersion("2.0.0")
      namespace First;
      model EventA { id: string; }
      @channel("events-a")
      op publishA(): EventA;

      @apiVersion("2.0.0")
      namespace Second;
      model EventB { id: string; }
      @channel("events-b")
      op publishB(): EventB;
    `);

    expect(
      diagnostics.some((d) => d.code === "conflicting-api-version"),
    ).toBeFalsy();
    expect(asyncApiDoc!.info.version).toBe("2.0.0");
  });
});
