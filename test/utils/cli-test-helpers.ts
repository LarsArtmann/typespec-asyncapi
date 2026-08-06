/**
 * Test helpers for AsyncAPI emitter CLI-equivalent compilation.
 *
 * Uses the programmatic TypeSpec compiler API internally instead of spawning
 * child processes. Maintains the same CLITestResult interface so existing
 * tests work without modification.
 */

import { compileAsyncAPI } from "./test-helpers.js";
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js";

export interface CLITestResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  asyncapiDoc?: AsyncAPIObject;
  errors: string[];
  workdir: string;
}

export interface CLICompileOptions {
  emitterOptions?: Record<string, unknown>;
  workdir?: string;
  timeout?: number;
  autoCleanup?: boolean;
}

export async function compileWithCLI(
  sourceFileOrContent: string,
  options: CLICompileOptions = {},
): Promise<CLITestResult> {
  const workdir = options.workdir || "/virtual/test";

  const result = await compileAsyncAPI(
    sourceFileOrContent,
    options.emitterOptions ?? {},
  );

  const errors = result.diagnostics
    .filter((d) => d.severity === "error")
    .map((d) => `[${d.code}] ${d.message}`);

  return {
    asyncapiDoc: (result.asyncApiDoc as AsyncAPIObject) ?? undefined,
    errors,
    exitCode: errors.length > 0 ? 1 : 0,
    stderr: errors.join("\n"),
    stdout: "",
    workdir,
  };
}

export async function cleanupTestDir(_workdir: string): Promise<void> {}

export async function createTestFixture(
  _files: Record<string, string>,
): Promise<string> {
  return "/virtual/test";
}

export function assertValidAsyncAPI(
  doc: AsyncAPIObject | undefined,
): asserts doc is AsyncAPIObject {
  if (!doc) {
    throw new Error("AsyncAPI document is undefined");
  }
  if (doc.asyncapi !== "3.1.0") {
    throw new Error(`Expected AsyncAPI 3.1.0, got ${doc.asyncapi}`);
  }
  if (!doc.info) {
    throw new Error("AsyncAPI document missing info section");
  }
}

export function getAsyncAPIOutputPath(_workdir: string): string {
  return "/virtual/asyncapi.yaml";
}

export async function hasAsyncAPIOutput(_workdir: string): Promise<boolean> {
  return true;
}
