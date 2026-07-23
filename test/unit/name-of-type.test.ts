/**
 * Tests: nameOfType utility function from builders/types.ts
 */

import { nameOfType } from "../../src/builders/types.js";

describe("nameOfType", () => {
  it("returns the name for a type with a string name property", () => {
    const type = { kind: "Model", name: "User" } as never;
    expect(nameOfType(type)).toBe("User");
  });

  it("returns undefined for a type without a name property", () => {
    const type = { kind: "String" } as never;
    expect(nameOfType(type)).toBeUndefined();
  });

  it("returns undefined for a type with a non-string name property", () => {
    const type = { kind: "Model", name: 42 } as never;
    expect(nameOfType(type)).toBeUndefined();
  });

  it("returns undefined for a type with null name", () => {
    const type = { kind: "Model", name: null } as never;
    expect(nameOfType(type)).toBeUndefined();
  });
});
