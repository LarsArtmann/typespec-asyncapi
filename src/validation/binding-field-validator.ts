/**
 * Binding Field Validator
 *
 * Validates individual binding field values against constraints
 * AUTO-GENERATED from @asyncapi/specs/bindings/ JSON Schemas.
 *
 * To regenerate: bun run scripts/generate-binding-specs.ts
 */

import type { BindingDiagnosticCode } from "./binding-validator.js";
import { GENERATED_FIELD_RULES } from "../constants/generated-bindings.js";

export interface BindingFieldIssue {
  code: BindingDiagnosticCode;
  key: string;
  format: Record<string, unknown>;
}

type TargetRules = Record<
  string,
  { type: string; enum?: unknown[]; min?: number; max?: number }
>;

/**
 * Validate binding field values against spec-derived constraints.
 * Returns an array of issues for invalid fields.
 */
export function validateBindingFields(
  protocol: string,
  targetKind: string | undefined,
  binding: Record<string, unknown>,
): BindingFieldIssue[] {
  const issues: BindingFieldIssue[] = [];

  const protocolRules = GENERATED_FIELD_RULES[protocol] as
    | Record<string, TargetRules>
    | undefined;
  if (!protocolRules) {
    return issues;
  }

  const rules = targetKind
    ? (protocolRules[targetKind] as TargetRules | undefined)
    : undefined;
  if (!rules) {
    return issues;
  }

  for (const [field, value] of Object.entries(binding)) {
    if (field === "bindingVersion") {
      continue;
    }
    const rule = rules[field];
    if (!rule) {
      continue;
    }

    if (
      rule.type !== "any" &&
      rule.type !== "object" &&
      rule.type !== "array" &&
      typeof value !== rule.type
    ) {
      const isCoercibleInteger =
        rule.type === "integer" &&
        typeof value === "number" &&
        Number.isInteger(value);
      if (!isCoercibleInteger) {
        issues.push({
          code: "invalid-binding-field",
          key: field,
          format: {
            actual: typeof value,
            expected: rule.type,
            field,
            protocol,
          },
        });
        continue;
      }
    }

    if (rule.enum && !rule.enum.includes(value)) {
      issues.push({
        code: "invalid-binding-field",
        key: field,
        format: {
          actual: String(value),
          field,
          protocol,
          validValues: rule.enum.join(", "),
        },
      });
    }

    if (typeof value === "number") {
      if (rule.min !== undefined && value < rule.min) {
        issues.push({
          code: "invalid-binding-field",
          key: field,
          format: {
            actual: value,
            field,
            min: rule.min,
            protocol,
          },
        });
      }
      if (rule.max !== undefined && value > rule.max) {
        issues.push({
          code: "invalid-binding-field",
          key: field,
          format: {
            actual: value,
            field,
            max: rule.max,
            protocol,
          },
        });
      }
    }
  }

  return issues;
}
