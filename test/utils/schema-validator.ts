/**
 * AsyncAPI 3.1.0 Schema Validation Test Harness
 *
 * Reusable utility for validating emitter output against the official
 * AsyncAPI 3.1.0 JSON Schema using AJV.
 *
 * Usage:
 *   const result = await compileAndValidate(source);
 *   if (!result.valid) {
 *     console.log(result.errors);
 *   }
 *   expect(result.valid).toBe(true);
 */

import Ajv, { type ErrorObject } from "ajv";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYAML } from "yaml";
import { compileAsyncAPISpecRaw } from "./test-helpers.js";

const schemaPath = join(
  import.meta.dirname,
  "..",
  "..",
  "node_modules",
  "@asyncapi",
  "specs",
  "schemas",
  "3.1.0-without-$id.json",
);

const asyncApiSchema = JSON.parse(readFileSync(schemaPath, "utf8"));

const ajv = new Ajv({ allErrors: true, strict: false });
const validateSchema = ajv.compile(asyncApiSchema);

export interface ValidationResult {
  valid: boolean;
  errors: ErrorObject[] | null;
  document: Record<string, unknown>;
  diagnostics: { severity: string; code: string; message: string }[];
}

/**
 * Compile TypeSpec source through the emitter and validate the output
 * against the official AsyncAPI 3.1.0 JSON Schema.
 *
 * Throws if no AsyncAPI output file is produced by the emitter.
 */
export async function compileAndValidate(
  source: string,
): Promise<ValidationResult> {
  const raw = await compileAsyncAPISpecRaw(source);

  const diagnostics = raw.diagnostics.map((d) => ({
    code: String(d.code),
    message: String(d.message),
    severity: String(d.severity),
  }));

  const errorDiagnostics = diagnostics.filter((d) => d.severity === "error");

  let document: Record<string, unknown> | undefined;
  for (const [, content] of raw.outputFiles) {
    if (typeof content === "string" && content.startsWith("asyncapi")) {
      document = parseYAML(content) as Record<string, unknown>;
      break;
    }
  }

  if (!document) {
    throw new Error(
      `No AsyncAPI output found. Diagnostics: ${JSON.stringify(diagnostics, null, 2)}`,
    );
  }

  const valid = validateSchema(document);

  return {
    diagnostics,
    document,
    errors: validateSchema.errors,
    valid: valid && errorDiagnostics.length === 0,
  };
}

/**
 * Assert that a TypeSpec source compiles and validates successfully.
 * Returns the parsed AsyncAPI document for further assertions.
 *
 * Throws with a detailed error message if validation fails.
 */
export async function compileAndValidateOrThrow(
  source: string,
): Promise<Record<string, unknown>> {
  const result = await compileAndValidate(source);

  if (!result.valid) {
    const errorDetails = result.errors
      ? result.errors.map((e) => `  ${e.instancePath}: ${e.message}`).join("\n")
      : "No schema errors";
    const diagDetails = result.diagnostics
      .filter((d) => d.severity === "error")
      .map((d) => `  [${d.code}] ${d.message}`)
      .join("\n");
    throw new Error(
      `AsyncAPI 3.1.0 validation failed:\nSchema errors:\n${errorDetails}\n\nCompiler diagnostics:\n${diagDetails || "  (none)"}`,
    );
  }

  return result.document;
}

/**
 * Format AJV errors into a human-readable string for test output.
 */
export function formatValidationErrors(errors: ErrorObject[] | null): string {
  if (!errors || errors.length === 0) {
    return "(no errors)";
  }
  return errors
    .map(
      (e) =>
        `  Path '${e.instancePath || "/"}': ${e.message ?? "unknown error"}`,
    )
    .join("\n");
}
