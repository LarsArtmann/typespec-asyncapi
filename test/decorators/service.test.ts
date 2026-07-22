

import { compileAsyncAPI } from "../utils/test-helpers.js";

describe("@service decorator (core TypeSpec compatibility)", () => {
  it("should use @service title in the document when no emitter title option is set", async () => {
    const source = `
      @service(#{title: "My Event-Driven API"})
      @server("prod", #{ url: "kafka://broker:9092", protocol: "kafka" })
      namespace MyApi;

      model Event { id: string; }

      @channel("events")
      @publish
      op publishEvent(): Event;
    `;

    const { asyncApiDoc, diagnostics } = await compileAsyncAPI(source, {
      "file-type": "json",
      "output-file": "service-title",
    });

    const errors = diagnostics.filter((d) => d.severity === "error");
    expect(errors).toHaveLength(0);
    expect(asyncApiDoc).not.toBeNull();
    expect(asyncApiDoc?.info?.title).toBe("My Event-Driven API");
  });

  it("should still produce AsyncAPI output when @service is used", async () => {
    const source = `
      @service(#{title: "Migration API"})
      @server("prod", #{ url: "kafka://broker:9092", protocol: "kafka" })
      namespace MyApi;

      model Event { id: string; }

      @channel("events")
      @publish
      op publishEvent(): Event;
    `;

    const { asyncApiDoc } = await compileAsyncAPI(source, {
      "file-type": "json",
      "output-file": "service-output",
    });

    expect(asyncApiDoc).not.toBeNull();
    expect(asyncApiDoc?.asyncapi).toBe("3.1.0");
    expect(asyncApiDoc?.channels).toBeDefined();
  });

  it("emitter title option should take precedence over @service title", async () => {
    const source = `
      @service(#{title: "Service Title"})
      @server("prod", #{ url: "kafka://broker:9092", protocol: "kafka" })
      namespace MyApi;

      model Event { id: string; }

      @channel("events")
      @publish
      op publishEvent(): Event;
    `;

    const { asyncApiDoc } = await compileAsyncAPI(source, {
      "file-type": "json",
      "output-file": "service-precedence",
      title: "Emitter Option Title",
    });

    expect(asyncApiDoc?.info?.title).toBe("Emitter Option Title");
  });

  it("should fall back to default title when neither @service nor emitter option is set", async () => {
    const source = `
      @server("prod", #{ url: "kafka://broker:9092", protocol: "kafka" })
      namespace MyApi;

      model Event { id: string; }

      @channel("events")
      @publish
      op publishEvent(): Event;
    `;

    const { asyncApiDoc } = await compileAsyncAPI(source, {
      "file-type": "json",
      "output-file": "service-default",
    });

    expect(asyncApiDoc?.info?.title).toBe("Generated API");
  });

  it("should not produce error diagnostics when @service is used correctly", async () => {
    const source = `
      @service(#{title: "Clean Migration"})
      @server("prod", #{ url: "kafka://broker:9092", protocol: "kafka" })
      namespace MyApi;

      model Event { id: string; }

      @channel("events")
      @publish
      op publishEvent(): Event;
    `;

    const { diagnostics } = await compileAsyncAPI(source, {
      "file-type": "json",
      "output-file": "service-no-errors",
    });

    const errors = diagnostics.filter((d) => d.severity === "error");
    expect(errors).toHaveLength(0);
  });

  it("should accept @service with no arguments", async () => {
    const source = `
      @service
      @server("prod", #{ url: "kafka://broker:9092", protocol: "kafka" })
      namespace MyApi;

      model Event { id: string; }

      @channel("events")
      @publish
      op publishEvent(): Event;
    `;

    const { asyncApiDoc } = await compileAsyncAPI(source, {
      "file-type": "json",
      "output-file": "service-no-args",
    });

    expect(asyncApiDoc).not.toBeNull();
  });
});
