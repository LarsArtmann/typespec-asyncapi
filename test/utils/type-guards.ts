/**
 * Type Guards for Test Assertions
 *
 * Provides type-safe assertion functions that narrow types at compile-time
 * and throw errors at runtime if conditions aren't met.
 *
 * Benefits:
 * - Removes optional chaining noise (?. operators)
 * - Catches type errors at compile time
 * - Better error messages than generic assertions
 * - TypeScript knows types are narrowed after assertions
 *
 * @example
 * ```typescript
 * // Before (unsafe, lots of ?. operators):
 * expect(result.asyncapiDoc?.channels).toBeDefined()
 * expect(Object.keys(result.asyncapiDoc?.channels || {})).toContain('events')
 *
 * // After (type-safe, clean):
 * assertAsyncAPIDoc(result.asyncapiDoc)
 * // TypeScript now knows asyncapiDoc is AsyncAPIObject
 * expect(Object.keys(result.asyncapiDoc.channels)).toContain('events')
 * ```
 */

import { expect } from "bun:test";
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js";

/**
 * Type guard: Asserts value is AsyncAPI 3.0 document
 *
 * Validates required AsyncAPI 3.0 properties exist with correct structure.
 * After this assertion, TypeScript knows the value is AsyncAPIObject.
 *
 * @param value - Value to check
 * @throws {Error} If value is not valid AsyncAPI document
 *
 * @example
 * ```typescript
 * const doc: unknown = await parseAsyncAPIFile()
 * assertAsyncAPIDoc(doc)
 * // Now TypeScript knows doc is AsyncAPIObject
 * console.log(doc.asyncapi) // No error, no optional chaining needed
 * ```
 */
export function assertAsyncAPIDoc(value: unknown): asserts value is AsyncAPIObject {
  // Check value exists and is object
  if (!value || typeof value !== "object") {
    throw new Error(`Expected AsyncAPI document to be an object, got ${typeof value}`);
  }

  const doc = value as Partial<AsyncAPIObject>;

  // Check AsyncAPI version
  if (doc.asyncapi !== "3.0.0") {
    throw new Error(`Expected AsyncAPI version "3.0.0", got "${doc.asyncapi}"`);
  }

  // Check required info section
  if (!doc.info || typeof doc.info !== "object") {
    throw new Error('AsyncAPI document missing required "info" section');
  }

  if (!doc.info.title || typeof doc.info.title !== "string") {
    throw new Error('AsyncAPI info section missing required "title" field');
  }

  if (!doc.info.version || typeof doc.info.version !== "string") {
    throw new Error('AsyncAPI info section missing required "version" field');
  }

  // Check channels section exists (can be empty object)
  if (doc.channels === undefined) {
    throw new Error('AsyncAPI document missing "channels" section');
  }

  // All checks passed - TypeScript now knows value is AsyncAPIObject
}

/**
 * Type guard: Asserts value is defined (not null/undefined)
 *
 * Generic assertion that value exists. After this, TypeScript removes
 * undefined/null from the type.
 *
 * @param value - Value to check
 * @param message - Custom error message
 * @throws {Error} If value is null or undefined
 *
 * @example
 * ```typescript
 * const doc: AsyncAPIObject | undefined = getDoc()
 * assertDefined(doc, 'AsyncAPI document not generated')
 * // Now TypeScript knows doc is AsyncAPIObject (not undefined)
 * ```
 */
export function assertDefined<T>(
  value: T,
  message = "Expected value to be defined",
): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

/**
 * Type guard: Asserts object has specific property
 *
 * Validates property exists on object. After this, TypeScript knows
 * the property exists.
 *
 * @param obj - Object to check
 * @param key - Property key to verify
 * @param message - Custom error message
 * @throws {Error} If property doesn't exist
 *
 * @example
 * ```typescript
 * const channels: Record<string, unknown> = doc.channels
 * assertHasProperty(channels, 'user.events')
 * // Property exists, can safely access it
 * const channel = channels['user.events']
 * ```
 */
export function assertHasProperty<T extends object>(
  obj: T | undefined | null,
  key: string,
  message?: string,
): void {
  if (!obj || typeof obj !== "object") {
    throw new Error(`Cannot check property "${key}" on non-object`);
  }

  const keys = Object.keys(obj);
  if (!keys.includes(key)) {
    throw new Error(
      message ||
        `Expected object to have property "${key}". Available properties: ${keys.join(", ") || "(none)"}`,
    );
  }
}

/**
 * Asserts object has all specified properties
 *
 * Batch version of assertHasProperty for checking multiple keys at once.
 * More efficient and provides better error messages.
 *
 * @param obj - Object to check
 * @param keys - Property keys to verify
 * @throws {Error} If any property is missing
 *
 * @example
 * ```typescript
 * assertHasProperties(
 *   doc.operations,
 *   'publishUserEvent',
 *   'subscribeUserEvent',
 *   'publishSystemEvent'
 * )
 * // All three operations exist
 * ```
 */
export function assertHasProperties<T extends object>(
  obj: T | undefined | null,
  ...keys: string[]
): void {
  if (!obj || typeof obj !== "object") {
    throw new Error(`Cannot check properties on non-object`);
  }

  const objectKeys = Object.keys(obj);
  const missing = keys.filter((k) => !objectKeys.includes(k));

  if (missing.length > 0) {
    throw new Error(
      `Missing properties: ${missing.join(", ")}. Available properties: ${objectKeys.join(", ") || "(none)"}`,
    );
  }
}

/**
 * Type guard: Asserts value is non-empty string
 *
 * @param value - Value to check
 * @param name - Name of value for error message
 * @throws {Error} If value is not a non-empty string
 *
 * @example
 * ```typescript
 * const title: unknown = doc.info.title
 * assertNonEmptyString(title, 'title')
 * // Now TypeScript knows title is string (not unknown)
 * console.log(title.toUpperCase())
 * ```
 */
export function assertNonEmptyString(value: unknown, name = "value"): asserts value is string {
  if (typeof value !== "string") {
    throw new Error(`Expected ${name} to be a string, got ${typeof value}`);
  }

  if (value.trim().length === 0) {
    throw new Error(`Expected ${name} to be non-empty string`);
  }
}

/**
 * Type guard: Asserts value is object with keys
 *
 * Validates value is a non-null object with at least one key.
 *
 * @param value - Value to check
 * @param name - Name of value for error message
 * @throws {Error} If value is not object or is empty
 *
 * @example
 * ```typescript
 * assertNonEmptyObject(doc.channels, 'channels')
 * // channels is object with at least one property
 * ```
 */
export function assertNonEmptyObject(
  value: unknown,
  name = "object",
): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object") {
    throw new Error(`Expected ${name} to be an object, got ${typeof value}`);
  }

  if (Array.isArray(value)) {
    throw new Error(`Expected ${name} to be an object, got array`);
  }

  const keys = Object.keys(value);
  if (keys.length === 0) {
    throw new Error(`Expected ${name} to have at least one property`);
  }
}

/**
 * Type guard: Asserts compilation succeeded
 *
 * Validates CLITestResult indicates successful compilation.
 * Checks exit code, errors, and AsyncAPI document presence.
 *
 * @param result - CLI test result to validate
 * @throws {Error} If compilation failed
 *
 * @example
 * ```typescript
 * const result = await compileWithCLI(source)
 * assertCompilationSuccess(result)
 * // Compilation succeeded, asyncapiDoc is guaranteed to exist
 * ```
 */
export function assertCompilationSuccess(result: {
  exitCode: number;
  errors?: string[];
  asyncapiDoc?: unknown;
}): asserts result is { exitCode: 0; errors: []; asyncapiDoc: AsyncAPIObject } {
  if (result.exitCode !== 0) {
    throw new Error(
      `Compilation failed with exit code ${result.exitCode}. Errors: ${result.errors?.join(", ") || "none"}`,
    );
  }

  if (result.errors && result.errors.length > 0) {
    throw new Error(`Compilation reported errors: ${result.errors.join(", ")}`);
  }

  if (!result.asyncapiDoc) {
    throw new Error("Compilation succeeded but AsyncAPI document not generated");
  }

  // Validate it's a proper AsyncAPI document
  assertAsyncAPIDoc(result.asyncapiDoc);
}

/**
 * Utility: Get property keys safely with type narrowing
 *
 * Returns empty array for null/undefined instead of throwing.
 * Useful for optional objects.
 *
 * @param obj - Object to get keys from
 * @returns Array of property keys (empty if obj is null/undefined)
 *
 * @example
 * ```typescript
 * // Safe even if channels might be undefined
 * const keys = getPropertyKeys(doc.channels)
 * expect(keys).toContain('user.events')
 * ```
 */
export function getPropertyKeys<T extends object>(obj: T | undefined | null): string[] {
  return Object.keys(obj || {});
}

/**
 * Utility: Safe property access with type narrowing
 *
 * Returns property value if exists, undefined otherwise.
 * Avoids optional chaining and provides type safety.
 *
 * @param obj - Object to access
 * @param key - Property key
 * @returns Property value or undefined
 *
 * @example
 * ```typescript
 * const channel = getProperty(doc.channels, 'user.events')
 * if (channel) {
 *   // TypeScript knows channel is defined here
 *   console.log(channel.address)
 * }
 * ```
 */
export function getProperty<T extends object, K extends string>(
  obj: T | undefined | null,
  key: K,
): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  return (obj as Record<string, unknown>)[key];
}

/**
 * Assertion: Verify array contains expected items
 *
 * Bun-compatible assertion using Object.keys() + toContain() pattern.
 * Better error messages than raw expect().toContain().
 *
 * @param obj - Object to check
 * @param keys - Expected property keys
 *
 * @example
 * ```typescript
 * assertContainsKeys(doc.channels, ['user.events', 'system.events'])
 * // Both channels exist
 * ```
 */
export function assertContainsKeys<T extends object>(
  obj: T | undefined | null,
  keys: string[],
): void {
  const actualKeys = getPropertyKeys(obj);

  for (const key of keys) {
    expect(actualKeys).toContain(key);
  }
}

/**
 * Assertion: Verify object contains exactly specified keys
 *
 * Checks for exact match (no extra keys, no missing keys).
 *
 * @param obj - Object to check
 * @param expectedKeys - Expected property keys
 *
 * @example
 * ```typescript
 * assertExactKeys(doc.info, ['title', 'version', 'description'])
 * // info has exactly these 3 properties
 * ```
 */
export function assertExactKeys<T extends object>(
  obj: T | undefined | null,
  expectedKeys: string[],
): void {
  const actualKeys = getPropertyKeys(obj).sort();
  const expected = [...expectedKeys].sort();

  expect(actualKeys).toEqual(expected);
}
