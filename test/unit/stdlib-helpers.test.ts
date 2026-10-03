/**
 * Tests: Stdlib Helpers — behavioral effect on emitter output
 *
 * Verifies the effect of stdlib type handling through real TypeSpec compilation:
 * stdlib types (string, int32, Record, array) emit inline schemas, while
 * user-defined models, enums, and scalars emit `$ref` pointers.
 */

import { compileAsyncAPI } from "../utils/test-helpers.js";

describe("stdlib-helpers via compilation", () => {
  it("emits inline schema for stdlib types (string is not a $ref)", async () => {
    const { asyncApiDoc } = await compileAsyncAPI(`
      namespace Test;
      model Event { name: string; }
      @channel("events")
      op publish(): Event;
    `);
    const nameProp = asyncApiDoc?.components?.schemas?.Event?.properties?.name;
    expect(nameProp?.type).toBe("string");
    expect(nameProp?.$ref).toBeUndefined();
  });

  it("emits $ref for user-defined models (not stdlib)", async () => {
    const { asyncApiDoc } = await compileAsyncAPI(`
      namespace Test;
      model Address { street: string; }
      model Event { address: Address; }
      @channel("events")
      op publish(): Event;
    `);
    const addrProp =
      asyncApiDoc?.components?.schemas?.Event?.properties?.address;
    expect(addrProp?.$ref).toBe("#/components/schemas/Address");
  });

  it("emits inline schema for stdlib numeric types", async () => {
    const { asyncApiDoc } = await compileAsyncAPI(`
      namespace Test;
      model Event { age: int32; }
      @channel("events")
      op publish(): Event;
    `);
    const ageProp = asyncApiDoc?.components?.schemas?.Event?.properties?.age;
    expect(ageProp?.type).toBe("integer");
    expect(ageProp?.format).toBe("int32");
    expect(ageProp?.$ref).toBeUndefined();
  });

  it("emits inline schema for stdlib Record type", async () => {
    const { asyncApiDoc } = await compileAsyncAPI(`
      namespace Test;
      model Event { tags: Record<string>; }
      @channel("events")
      op publish(): Event;
    `);
    const tagsProp = asyncApiDoc?.components?.schemas?.Event?.properties?.tags;
    expect(tagsProp?.type).toBe("object");
    expect(tagsProp?.additionalProperties).toStrictEqual({ type: "string" });
  });

  it("emits $ref for user-defined enum (not stdlib)", async () => {
    const { asyncApiDoc } = await compileAsyncAPI(`
      namespace Test;
      enum Status { Active, Inactive }
      model Event { status: Status; }
      @channel("events")
      op publish(): Event;
    `);
    const statusProp =
      asyncApiDoc?.components?.schemas?.Event?.properties?.status;
    expect(statusProp?.$ref).toBe("#/components/schemas/Status");
  });

  it("emits inline schema for stdlib array type", async () => {
    const { asyncApiDoc } = await compileAsyncAPI(`
      namespace Test;
      model Event { tags: string[]; }
      @channel("events")
      op publish(): Event;
    `);
    const tagsProp = asyncApiDoc?.components?.schemas?.Event?.properties?.tags;
    expect(tagsProp?.type).toBe("array");
    expect(tagsProp?.items).toStrictEqual({ type: "string" });
  });

  it("does not treat user-defined scalar as stdlib", async () => {
    const { asyncApiDoc } = await compileAsyncAPI(`
      namespace Test;
      scalar Currency extends string;
      model Event { amount: Currency; }
      @channel("events")
      op publish(): Event;
    `);
    const amountProp =
      asyncApiDoc?.components?.schemas?.Event?.properties?.amount;
    expect(amountProp?.$ref).toBe("#/components/schemas/Currency");
  });
});
