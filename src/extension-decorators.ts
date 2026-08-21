/**
 * Extension Decorators
 *
 * Decorators that attach user-defined extensions to emitted output:
 * `@jsonSchemaExtension(key, value)` (arbitrary JSON Schema keywords) here;
 * `@extension("x-...", value)` (AsyncAPI spec extensions) joins this module.
 */

import type {
  DecoratorContext,
  Enum,
  Model,
  ModelProperty,
  Scalar,
  Union,
} from "@typespec/compiler";
import { reportDiagnostic } from "./decorator-helpers.js";
import { storeJsonSchemaExtension } from "./state-writers.js";

const JSON_SCHEMA_EXTENSION_KEY = /^[A-Za-z_][A-Za-z0-9_.-]*$/u;

/**
 * Attach an arbitrary JSON Schema keyword (`@jsonSchemaExtension(key, value)`).
 * Repeatable: entries merge, later applications of the same key win.
 */
export function $jsonSchemaExtension(
  context: DecoratorContext,
  target: Model | ModelProperty | Union | Enum | Scalar,
  key: unknown,
  value: unknown,
): void {
  if (typeof key !== "string" || !JSON_SCHEMA_EXTENSION_KEY.test(key)) {
    reportDiagnostic(context, "invalid-json-schema-extension-key", target, {
      key: String(key),
    });
    return;
  }
  storeJsonSchemaExtension(context.program, target, key, value);
}
