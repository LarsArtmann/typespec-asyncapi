/**
 * Helper functions for decorators: diagnostic reporting and model property extraction.
 */

import type {
  DecoratorContext,
  DiagnosticTarget,
  Model,
} from "@typespec/compiler";
import { $lib } from "./lib.js";

// === DIAGNOSTIC HELPERS ===

/**
 * Report a decorator diagnostic using the library's registered diagnostic codes.
 * The code must be declared in $lib.diagnostics (src/lib.ts) — TypeScript enforces this at compile time.
 * The library name is auto-prefixed to the code by the TypeSpec runtime.
 */
export const reportDiagnostic = (
  context: DecoratorContext,
  code: keyof typeof $lib.diagnostics,
  target: unknown,
  format?: Record<string, unknown>,
  messageId?: string,
): void => {
  $lib.reportDiagnostic(context.program, {
    code,
    format,
    messageId: messageId as "default",
    target: target as DiagnosticTarget,
  });
};

/**
 * If `valid` is false, report the given diagnostic and return false; else return true.
 * Shared body used by `validateConfig` and `validateNonEmptyString`.
 */
function reportAndReturnFalse(
  valid: boolean,
  context: DecoratorContext,
  diagnosticCode: keyof typeof $lib.diagnostics,
  target: unknown,
  format?: Record<string, unknown>,
): boolean {
  if (!valid) {
    reportDiagnostic(context, diagnosticCode, target, format);
    return false;
  }
  return true;
}

/**
 * Validate that a config value is present; if not, report the given diagnostic and return false.
 */
export const validateConfig = (
  config: unknown,
  context: DecoratorContext,
  target: unknown,
  diagnosticCode: keyof typeof $lib.diagnostics,
  format?: Record<string, unknown>,
): boolean =>
  reportAndReturnFalse(Boolean(config), context, diagnosticCode, target, format);

/**
 * Validate that a value is a non-empty string; if not, report the given diagnostic and return false.
 *
 * Used by string-argument decorators (`@operationId`, `@messageId`, `@header`,
 * `@correlationId`) to eliminate the repeated `typeof !== "string" || length === 0`
 * guard + `reportDiagnostic` + `return` boilerplate.
 */
export const validateNonEmptyString = (
  value: unknown,
  context: DecoratorContext,
  target: unknown,
  diagnosticCode: keyof typeof $lib.diagnostics,
  format?: Record<string, unknown>,
): value is string =>
  reportAndReturnFalse(
    typeof value === "string" && value.length > 0,
    context,
    diagnosticCode,
    target,
    format,
  );

/**
 * Higher-order decorator factory: validate config presence, then if valid, invoke `run`.
 * Returns `true` if validation passed (and `run` ran), `false` if validation failed.
 *
 * Used by `@protocol`, `@security`, `@message`, and `@bindings` to eliminate
 * the repeated `validateConfig → ... → storeXxx` boilerplate.
 */
export function validatedDecorator(
  context: DecoratorContext,
  target: unknown,
  config: unknown,
  options: {
    code: keyof typeof $lib.diagnostics;
    format?: Record<string, unknown>;
    run: () => void;
  },
): boolean {
  if (!validateConfig(config, context, target, options.code, options.format)) {
    return false;
  }
  options.run();
  return true;
}

// === URL VALIDATION ===

/**
 * Validate a server URL for obvious malformation.
 *
 * AsyncAPI server URLs are host/path strings, NOT full RFC 3986 URLs —
 * the protocol is specified separately via the `protocol` field.
 * Template variables like `{host}` are valid AsyncAPI patterns.
 *
 * Returns false only for clearly broken values:
 * - Empty or whitespace-only strings
 * - Strings containing spaces or control characters
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }
  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return false;
  }
  if (/\s/u.test(trimmed)) {
    return false;
  }
  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.codePointAt(i);
    if (code === undefined) {
      return false;
    }
    if (code < 32 || code === 127) {
      return false;
    }
  }
  return true;
}

// === MODEL HELPERS ===

export function getModelPropertyStringValue(
  model: Model,
  propertyName: string,
): string | undefined {
  return readModelProperty(model, propertyName) as string | undefined;
}

export function getModelPropertyValue(
  model: Model,
  propertyName: string,
): unknown {
  return readModelProperty(model, propertyName);
}

/** Read a `Model` property's underlying value if it exists, else `undefined`. */
function readModelProperty(model: Model, propertyName: string): unknown {
  const property = model.properties.get(propertyName);
  if (!property) {
    return undefined;
  }
  const type = property.type as { kind: string; value?: unknown };
  return type.kind === "String" && type.value !== undefined ? type.value : type;
}

export function modelToRecord(model: Model): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  for (const [key, prop] of model.properties) {
    const propType = prop.type as { kind: string; value?: unknown };
    record[key] = propType.kind === "String" ? propType.value : propType;
  }
  return record;
}

export function extractConfigRecord(config: unknown): Record<string, unknown> {
  if (isModelConfig(config)) {
    return modelToRecord(config);
  }
  return config as Record<string, unknown>;
}

/**
 * Type guard: check if an unknown decorator argument is a TypeSpec `Model`
 * expression (model-expression syntax `{}` passed to a decorator).
 */
export function isModelConfig(config: unknown): config is Model {
  return (
    config !== null &&
    config !== undefined &&
    typeof config === "object" &&
    "kind" in config &&
    config.kind === "Model"
  );
}
