import { describe, it, expect } from "vitest";
import { compileAsyncAPI } from "../utils/test-helpers.js";

describe("debug tuple", () => {
  it("shows current tuple output", async () => {
    const result = await compileAsyncAPI(`
      namespace Test;
      model A { x: string; }
      model B { y: int32; }
      model Event {
        pair: [A, B];
        prim: [string, int32];
      }
      @channel("events")
      op publish(): Event;
    `);
    const eventSchema = result.asyncApiDoc?.components?.schemas?.Event;
    // Force fail to see output
    expect(JSON.stringify(eventSchema, null, 2)).toBe("FORCE_FAIL");
  });
});
