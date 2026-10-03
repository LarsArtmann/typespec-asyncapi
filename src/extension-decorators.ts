/**
 * Extension Decorators
 *
 * Decorators that attach user-defined extensions to emitted output:
 * `@jsonSchemaExtension(key, value)` (arbitrary JSON Schema keywords) and
 * `@extension("x-...", value)` (AsyncAPI spec extensions).
 */

import type { DecoratorContext, Program, Type } from "@typespec/compiler";
import type {
  Enum,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Scalar,
  Union,
} from "@typespec/compiler";
import { reportDiagnostic } from "./decorator-helpers.js";
import {
  storeJsonSchemaExtension,
  storeObjectExtension,
} from "./state-writers.js";

const JSON_SCHEMA_EXTENSION_KEY = /^[A-Za-z_][A-Za-z0-9_.-]*$/u;

type ExtensionWriter = (
  context: DecoratorContext,
  target: Type,
  key: unknown,
  value: unknown,
) => void;

/** Shared validate-key-then-store body for the two extension decorators. */
function makeExtensionWriter(
  isValidKey: (key: string) => boolean,
  invalidCode: "invalid-json-schema-extension-key" | "invalid-extension-key",
  store: (program: Program, target: Type, key: string, value: unknown) => void,
): ExtensionWriter {
  return (context, target, key, value) => {
    if (typeof key !== "string" || !isValidKey(key)) {
      reportDiagnostic(context, invalidCode, target, { key: String(key) });
      return;
    }
    store(context.program, target, key, value);
  };
}

const writeJsonSchemaExtension = makeExtensionWriter(
  (key) => JSON_SCHEMA_EXTENSION_KEY.test(key),
  "invalid-json-schema-extension-key",
  storeJsonSchemaExtension,
);

const writeObjectExtension = makeExtensionWriter(
  (key) => key.startsWith("x-"),
  "invalid-extension-key",
  storeObjectExtension,
);

/**
 * Attach an arbitrary JSON Schema keyword (`@jsonSchemaExtension(key, value)`).
 * Repeatable: entries merge, the outermost same-key application wins.
 */
export const $jsonSchemaExtension = (
  context: DecoratorContext,
  target: Model | ModelProperty | Union | Enum | Scalar,
  key: unknown,
  value: unknown,
): void => {
  writeJsonSchemaExtension(context, target, key, value);
};

/**
 * Attach an AsyncAPI specification extension (`@extension("x-...", value)`).
 * Namespace targets extend the document root, Operations the operation
 * object, Models the message object. Repeatable; entries merge.
 */
export const $extension = (
  context: DecoratorContext,
  target: Namespace | Operation | Model,
  key: unknown,
  value: unknown,
): void => {
  writeObjectExtension(context, target, key, value);
};
