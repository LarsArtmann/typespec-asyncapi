/**
 * Helper functions for decorators: diagnostic reporting and model property extraction.
 */

import type { DecoratorContext, DiagnosticTarget, Model } from "@typespec/compiler";
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
    target: target as DiagnosticTarget,
    format,
    messageId: messageId as "default",
  });
};

/**
 * Validate that a config value is present; if not, report the given diagnostic and return false.
 */
export const validateConfig = (
  config: unknown,
  context: DecoratorContext,
  target: unknown,
  diagnosticCode: keyof typeof $lib.diagnostics,
  format?: Record<string, unknown>,
): boolean => {
  if (!config) {
    reportDiagnostic(context, diagnosticCode, target, format);
    return false;
  }
  return true;
};

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
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (trimmed.length === 0) return false;
  if (/\s/.test(trimmed)) return false;
  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.charCodeAt(i);
    if (code < 32 || code === 127) return false;
  }
  return true;
}

// === MODEL HELPERS ===

export function getModelPropertyStringValue(
  model: Model,
  propertyName: string,
): string | undefined {
  const property = model.properties.get(propertyName);
  if (!property) return undefined;
  const type = property.type as { kind: string; value?: string };
  return type.kind === "String" && type.value !== undefined ? type.value : undefined;
}

export function getModelPropertyValue(model: Model, propertyName: string): unknown {
  const property = model.properties.get(propertyName);
  if (!property) return undefined;
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
  if (config && typeof config === "object" && "kind" in config && config.kind === "Model") {
    return modelToRecord(config as Model);
  }
  return config as Record<string, unknown>;
}
