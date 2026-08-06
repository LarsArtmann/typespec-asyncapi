/**
 * Unit tests for normalizeTagItem
 *
 * Exhaustively tests all branches of the tag normalization logic:
 * - String inputs (valid, empty, whitespace)
 * - Object inputs (valid, missing name, empty name, non-string name)
 * - Rich objects (description, externalDocs with/without description)
 * - Invalid inputs (null, undefined, number, array, boolean)
 */

import { normalizeTagItem } from "../../src/decorator-helpers.js";

describe("normalizeTagItem: string inputs", () => {
  it("returns a Tag for a non-empty string", () => {
    expect(normalizeTagItem("production")).toStrictEqual({
      name: "production",
    });
  });

  it("returns null for an empty string", () => {
    expect(normalizeTagItem("")).toBeNull();
  });

  it("returns a Tag for a whitespace-only string", () => {
    expect(normalizeTagItem(" ")).toStrictEqual({ name: " " });
  });

  it("returns a Tag for a single-character string", () => {
    expect(normalizeTagItem("x")).toStrictEqual({ name: "x" });
  });
});

describe("normalizeTagItem: object inputs", () => {
  it("returns a Tag for object with valid name", () => {
    expect(normalizeTagItem({ name: "orders" })).toStrictEqual({
      name: "orders",
    });
  });

  it("returns null for object with empty name", () => {
    expect(normalizeTagItem({ name: "" })).toBeNull();
  });

  it("returns null for object with non-string name", () => {
    expect(normalizeTagItem({ name: 42 })).toBeNull();
  });

  it("returns null for object without name field", () => {
    expect(normalizeTagItem({ description: "no name" })).toBeNull();
  });

  it("preserves description when present", () => {
    expect(
      normalizeTagItem({ name: "orders", description: "Order management" }),
    ).toStrictEqual({
      name: "orders",
      description: "Order management",
    });
  });

  it("ignores non-string description", () => {
    expect(
      normalizeTagItem({ name: "orders", description: 123 }),
    ).toStrictEqual({
      name: "orders",
    });
  });

  it("preserves externalDocs with url and description", () => {
    expect(
      normalizeTagItem({
        name: "docs",
        externalDocs: {
          url: "https://example.com",
          description: "External docs",
        },
      }),
    ).toStrictEqual({
      name: "docs",
      externalDocs: {
        url: "https://example.com",
        description: "External docs",
      },
    });
  });

  it("preserves externalDocs with url only", () => {
    expect(
      normalizeTagItem({
        name: "docs",
        externalDocs: { url: "https://example.com" },
      }),
    ).toStrictEqual({
      name: "docs",
      externalDocs: { url: "https://example.com" },
    });
  });

  it("omits externalDocs when url is missing", () => {
    expect(
      normalizeTagItem({
        name: "docs",
        externalDocs: { description: "no url" },
      }),
    ).toStrictEqual({ name: "docs" });
  });

  it("omits externalDocs when it is not an object", () => {
    expect(
      normalizeTagItem({ name: "docs", externalDocs: "not-an-object" }),
    ).toStrictEqual({
      name: "docs",
    });
  });
});

describe("normalizeTagItem: invalid inputs", () => {
  it("returns null for null", () => {
    expect(normalizeTagItem(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    const undef: unknown = {}.missing;
    expect(normalizeTagItem(undef)).toBeNull();
  });

  it("returns null for number", () => {
    expect(normalizeTagItem(42)).toBeNull();
  });

  it("returns null for boolean", () => {
    expect(normalizeTagItem(true)).toBeNull();
  });

  it("returns null for array", () => {
    expect(normalizeTagItem(["not", "valid"])).toBeNull();
  });
});
