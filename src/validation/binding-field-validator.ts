/**
 * Binding Field Validator
 *
 * Validates individual binding field values against constraints
 * AUTO-GENERATED from @asyncapi/specs/bindings/ JSON Schemas.
 *
 * To regenerate: bun run scripts/generate-binding-specs.ts
 */

import type { BindingDiagnosticCode } from "./binding-validator.js";
import { pushIssue } from "./binding-validator.js";
import { GENERATED_FIELD_RULES } from "../constants/generated-bindings.js";

export interface BindingFieldIssue {
  code: BindingDiagnosticCode;
  key: string;
  severity: "error" | "warning";
  format: Record<string, unknown>;
}

type TargetRules = Record<string, { type: string; enum?: unknown[]; min?: number; max?: number }>;

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

  const protocolRules = GENERATED_FIELD_RULES[protocol] as Record<string, TargetRules> | undefined;
  if (!protocolRules) {
    return issues;
  }

  const rules = targetKind ? (protocolRules[targetKind] as TargetRules | undefined) : undefined;
  if (!rules) {
    return issues;
  }

  const fieldEntries = Object.entries(binding).filter(([f]) => f !== "bindingVersion");
  for (const [field, value] of fieldEntries) {
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
        rule.type === "integer" && typeof value === "number" && Number.isInteger(value);
      if (!isCoercibleInteger) {
        pushFieldError(issues, field, protocol, {
          actual: typeof value,
          expected: rule.type,
        });
        continue;
      }
    }

    if (rule.enum && !rule.enum.includes(value)) {
      pushFieldError(issues, field, protocol, {
        actual: String(value),
        validValues: rule.enum.join(", "),
      });
    }

    if (typeof value === "number") {
      const ctx = { field, protocol, rule, value };
      checkBound(issues, ctx, "min", (v, r) => v < r);
      checkBound(issues, ctx, "max", (v, r) => v > r);
    }
  }

  return issues;
}

/** Append an `invalid-binding-field` issue to the issues array. */
function pushFieldError(
  issues: BindingFieldIssue[],
  field: string,
  protocol: string,
  format: Record<string, unknown>,
): void {
  pushIssue(issues, field, "invalid-binding-field", "warning", {
    field,
    protocol,
    ...format,
  });
}

/** Append a min/max bound violation when `predicate(value, rule.bound)` is true. */
function checkBound(
  issues: BindingFieldIssue[],
  ctx: {
    field: string;
    protocol: string;
    value: number;
    rule: { min?: number; max?: number };
  },
  bound: "min" | "max",
  predicate: (value: number, bound: number) => boolean,
): void {
  const limit = ctx.rule[bound];
  if (limit !== undefined && predicate(ctx.value, limit)) {
    pushFieldError(issues, ctx.field, ctx.protocol, {
      actual: ctx.value,
      [bound]: limit,
    });
  }
}
