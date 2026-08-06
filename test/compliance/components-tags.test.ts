/**
 * AsyncAPI 3.1.0 Spec Compliance: components.tags
 *
 * Tests that @tags decorator state is collected into the reusable
 * components.tags map with proper deduplication across operations,
 * models, and namespaces.
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
