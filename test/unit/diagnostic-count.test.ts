/**
 * Locks the diagnostic registry counts in src/lib.ts.
 *
 * AGENTS.md documents "38 codes (22 error + 16 warning)" — count them there,
 * never trust a hardcoded number in docs. This test fails when a diagnostic is
 * added or removed without updating the documented count, killing the
 * doc-count drift class.
 */

import { $lib } from "../../src/lib.js";

const codes = Object.keys($lib.diagnostics);
const errors = codes.filter((code) => $lib.diagnostics[code]?.severity === "error");
const warnings = codes.filter((code) => $lib.diagnostics[code]?.severity === "warning");

describe("diagnostic registry lock", () => {
  it("declares exactly the documented total (38)", () => {
    expect(codes).toHaveLength(38);
  });

  it("keeps the documented severity split (22 error + 16 warning)", () => {
    expect(errors).toHaveLength(22);
    expect(warnings).toHaveLength(16);
  });

  it("uses unique dash-delimited codes", () => {
    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) {
      expect(code).toMatch(/^[a-z][a-zA-Z0-9-]*$/);
    }
  });
});
