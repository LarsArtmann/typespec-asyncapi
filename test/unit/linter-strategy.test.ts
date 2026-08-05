/**
 * Linter Strategy Verification
 *
 * Documents and verifies the dual-linter strategy:
 * - ESLint: type-aware rules on src/ only (floating promises, unsafe operations, type assertions)
 * - oxlint: non-type-aware rules on ALL files (style, perf, complexity, suspicious patterns)
 *
 * This test ensures the strategy remains consistent by verifying that
 * both linters pass cleanly on the current codebase.
 */

import { execSync } from "node:child_process";

describe("linter strategy: ESLint + oxlint dual-linter", () => {
  it("eslint passes with zero errors on src/", () => {
    expect(() => {
      execSync("bun run lint:eslint", {
        encoding: "utf8",
        timeout: 30_000,
        stdio: "pipe",
      });
    }).not.toThrow();
  });

  it("oxlint passes with zero errors and zero warnings on all files", () => {
    expect(() => {
      execSync("bun run lint:ox", {
        encoding: "utf8",
        timeout: 30_000,
        stdio: "pipe",
      });
    }).not.toThrow();
  });

  it("full lint (eslint + oxlint) passes via bun run lint", () => {
    expect(() => {
      execSync("bun run lint", {
        encoding: "utf8",
        timeout: 30_000,
        stdio: "pipe",
      });
    }).not.toThrow();
  });
});
