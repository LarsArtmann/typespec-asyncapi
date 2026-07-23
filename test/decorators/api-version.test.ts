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
});
