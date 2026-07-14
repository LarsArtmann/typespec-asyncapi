/**
 * Helper functions for decorators: diagnostic reporting and model property extraction.
 */

import type { DecoratorContext, DiagnosticTarget, Model } from "@typespec/compiler";

// === DIAGNOSTIC HELPERS ===

export const reportDecoratorDiagnostic = (
  context: DecoratorContext,
  code: string,
  target: unknown,
  message: string,
  severity: "error" | "warning" = "error",
) => {
  context.program.reportDiagnostic({
    code,
    message,
    severity,
    target: target as DiagnosticTarget,
  });
};

export const validateConfig = (
  config: unknown,
  context: DecoratorContext,
  target: unknown,
  diagnosticCode: string,
  errorMessage: string,
): boolean => {
  if (!config) {
    reportDecoratorDiagnostic(context, diagnosticCode, target, errorMessage);
    return false;
  }
  return true;
};

// === MODEL HELPERS ===

export function getModelPropertyStringValue(model: Model, propertyName: string): string | undefined {
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
