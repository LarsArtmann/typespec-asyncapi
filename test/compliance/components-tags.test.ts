/**
 * AsyncAPI 3.1.0 Spec Compliance: components.tags and info.tags
 *
 * Tests that @tags decorator state is collected into the reusable
 * components.tags map with proper deduplication across operations,
 * models, and namespaces. Also verifies info.tags population.
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";

describe("components.tags compliance", () => {
  it("collects operation tags into components.tags", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @tags(#["important", "realtime"])
      op publish(): Event;
    `);

    expect(doc.components?.tags).toBeDefined();
    expect(doc.components!.tags!.important).toStrictEqual({
      name: "important",
    });
    expect(doc.components!.tags!.realtime).toStrictEqual({ name: "realtime" });
  });

  it("collects model tags into components.tags", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @tags(#["urgent"])
      model Alert { message: string; }
      @channel("alerts")
      op sendAlert(): Alert;
    `);

    expect(doc.components?.tags?.urgent).toStrictEqual({ name: "urgent" });
  });

  it("collects namespace tags into components.tags", async () => {
    const doc = await compileAndValidateOrThrow(`
      @tags(#["production"])
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    expect(doc.components?.tags?.production).toStrictEqual({
      name: "production",
    });
  });

  it("deduplicates overlapping tags from multiple sources", async () => {
    const doc = await compileAndValidateOrThrow(`
      @tags(#["shared", "ns-level"])
      namespace Test;
      @tags(#["shared", "model-level"])
      model Event { id: string; }
      @tags(#["shared", "op-level"])
      @channel("events")
      op publish(): Event;
    `);

    const tagNames = Object.keys(doc.components!.tags!);
    expect(tagNames).toHaveLength(4);
    expect(tagNames.toSorted()).toStrictEqual([
      "model-level",
      "ns-level",
      "op-level",
      "shared",
    ]);
  });

  it("does not emit components.tags when no tags are used", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    expect(doc.components?.tags).toBeUndefined();
  });

  it("deduplicates same tag name used as both string and rich object", async () => {
    const doc = await compileAndValidateOrThrow(`
      @tags(#["shared"])
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @tags(#[#{ name: "shared", description: "Rich description" }])
      op publish(): Event;
    `);

    // Only one "shared" entry in components.tags
    expect(Object.keys(doc.components!.tags!)).toStrictEqual(["shared"]);

    // Only one "shared" entry in info.tags
    expect(doc.info.tags).toHaveLength(1);
    expect(doc.info.tags![0].name).toBe("shared");
  });

  it("preserves inline operation tags alongside components.tags", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @tags(#["alpha", "beta"])
      op publish(): Event;
    `);

    const [op] = Object.values(doc.operations!);
    expect(op.tags).toHaveLength(2);
    expect(doc.components?.tags?.alpha).toStrictEqual({ name: "alpha" });
    expect(doc.components?.tags?.beta).toStrictEqual({ name: "beta" });
  });
});

describe("info.tags compliance", () => {
  it("populates info.tags with all unique tags", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @tags(#["alpha", "beta"])
      op publish(): Event;
    `);

    expect(doc.info.tags).toBeDefined();
    expect(doc.info.tags).toHaveLength(2);
    const names = doc.info.tags!.map((t) => t.name).toSorted();
    expect(names).toStrictEqual(["alpha", "beta"]);
  });

  it("deduplicates info.tags from multiple sources", async () => {
    const doc = await compileAndValidateOrThrow(`
      @tags(#["shared", "ns"])
      namespace Test;
      @tags(#["shared", "model"])
      model Event { id: string; }
      @channel("events")
      @tags(#["shared", "op"])
      op publish(): Event;
    `);

    expect(doc.info.tags).toBeDefined();
    const names = doc.info.tags!.map((t) => t.name).toSorted();
    expect(names).toStrictEqual(["model", "ns", "op", "shared"]);
  });

  it("omits info.tags when no tags are used", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    expect(doc.info.tags).toBeUndefined();
  });
});

describe("channel and server tags", () => {
  it("applies @tags from operation to its channel", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @tags(#["realtime"])
      op publish(): Event;
    `);

    const channel = doc.channels?.events;
    expect(channel?.tags).toBeDefined();
    expect(channel?.tags?.[0]?.name).toBe("realtime");
  });

  it("applies @tags from namespace to servers", async () => {
    const doc = await compileAndValidateOrThrow(`
      @tags(#["production"])
      @server("prod", #{
        url: "broker.example.com",
        protocol: "kafka"
      })
      namespace Test;
      model Event { id: string; }
      @channel("events") op publish(): Event;
    `);

    const server = doc.servers?.prod;
    expect(server?.tags).toBeDefined();
    expect(server?.tags?.[0]?.name).toBe("production");
  });
});

describe("rich tag objects with description and externalDocs", () => {
  it("accepts tag objects with name and description", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @tags(#[#{ name: "orders", description: "Order management" }])
      op publish(): Event;
    `);

    expect(doc.components?.tags?.orders).toStrictEqual({
      name: "orders",
      description: "Order management",
    });
  });

  it("accepts tag objects with externalDocs", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @tags(#[#{
        name: "docs",
        externalDocs: #{
          url: "https://example.com/docs",
          description: "External documentation"
        }
      }])
      op publish(): Event;
    `);

    expect(doc.components?.tags?.docs).toStrictEqual({
      name: "docs",
      externalDocs: {
        url: "https://example.com/docs",
        description: "External documentation",
      },
    });
  });

  it("accepts mixed string and object tags", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @tags(#["simple", #{ name: "rich", description: "Rich tag" }])
      op publish(): Event;
    `);

    expect(doc.components?.tags?.simple).toStrictEqual({ name: "simple" });
    expect(doc.components?.tags?.rich).toStrictEqual({
      name: "rich",
      description: "Rich tag",
    });
  });

  it("propagates mixed string/object tags to info.tags and operation.tags", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @tags(#["basic", #{ name: "detailed", description: "Detailed", externalDocs: #{ url: "https://example.com" } }])
      op publish(): Event;
    `);

    // Info tags should contain both
    expect(doc.info.tags).toHaveLength(2);
    const infoNames = doc.info.tags!.map((t) => t.name).toSorted();
    expect(infoNames).toStrictEqual(["basic", "detailed"]);

    // Operation tags should contain both
    const [op] = Object.values(doc.operations!);
    expect(op.tags).toHaveLength(2);
    const opTagNames = op.tags!.map((t) => t.name).toSorted();
    expect(opTagNames).toStrictEqual(["basic", "detailed"]);

    // The rich tag should have full structure in components
    expect(doc.components?.tags?.detailed).toStrictEqual({
      name: "detailed",
      description: "Detailed",
      externalDocs: { url: "https://example.com" },
    });
  });
});
