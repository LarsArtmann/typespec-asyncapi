/**
 * Tests: extractNestedConfig
 *
 * Unit tests for recursive extraction of TypeSpec value-tree shapes
 * (Model properties, literals, tuples, arrays) into plain JSON values.
 */

import { extractNestedConfig } from "../../src/extract-nested-config.js";

describe("extractNestedConfig", () => {
  it("returns primitives as-is", () => {
    expect(extractNestedConfig(null)).toBeNull();
    expect(extractNestedConfig("text")).toBe("text");
    expect(extractNestedConfig(42)).toBe(42);
    expect(extractNestedConfig(true)).toBe(true);
  });

  it("unwraps String/Number/Boolean literal nodes to their values", () => {
    expect(extractNestedConfig({ kind: "String", value: "prod" })).toBe("prod");
    expect(extractNestedConfig({ kind: "Number", value: 3 })).toBe(3);
    expect(extractNestedConfig({ kind: "Boolean", value: false })).toBeFalsy();
  });

  it("extracts a Model node into a plain record", () => {
    const modelNode = {
      kind: "Model",
      properties: new Map([
        ["environment", { type: { kind: "String", value: "production" } }],
        ["port", { type: { kind: "Number", value: 9092 } }],
      ]),
    };
    expect(extractNestedConfig(modelNode)).toStrictEqual({
      environment: "production",
      port: 9092,
    });
  });

  it("recurses into nested Model nodes", () => {
    const inner = {
      kind: "Model",
      properties: new Map([["scopes", { type: { kind: "String", value: "read" } }]]),
    };
    const outer = {
      kind: "Model",
      properties: new Map([["scheme", { type: inner }]]),
    };
    expect(extractNestedConfig(outer)).toStrictEqual({ scheme: { scopes: "read" } });
  });

  it("extracts a Tuple node into an array", () => {
    const tupleNode = {
      kind: "Tuple",
      values: [{ kind: "String", value: "canary" }, { kind: "String", value: "beta" }],
    };
    expect(extractNestedConfig(tupleNode)).toStrictEqual(["canary", "beta"]);
  });

  it("maps plain arrays recursively", () => {
    const input = [{ kind: "String", value: "a" }, "b", 3];
    expect(extractNestedConfig(input)).toStrictEqual(["a", "b", 3]);
  });

  it("returns non-Model objects untouched", () => {
    const plain = { some: "shape" };
    expect(extractNestedConfig(plain)).toBe(plain);
  });

  it("treats a Model without properties as an opaque value", () => {
    const opaque = { kind: "Model" };
    expect(extractNestedConfig(opaque)).toBe(opaque);
  });

  it("treats a Tuple without values as an opaque value", () => {
    const opaque = { kind: "Tuple" };
    expect(extractNestedConfig(opaque)).toBe(opaque);
  });
});
