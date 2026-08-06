/**
 * Binding Validation Module
 *
 * Normalizes, validates, and enriches protocol binding objects.
 *
 * Responsibilities:
 * 1. Normalize binding keys: `websockets` → `ws`, `websocket` → `ws`
 * 2. Validate binding keys are known AsyncAPI protocols
 * 3. Auto-inject `bindingVersion` when missing (default to latest)
 * 4. Warn on unsupported binding version values
 *
 * Used by:
 * - `$bindings` decorator (src/minimal-decorators.ts)
 * - document-builder.ts (for @protocol-generated bindings)
 */

import {
  isSupportedProtocol,
  normalizeProtocol,
} from "../constants/protocols.js";
import {
  getLatestBindingVersion,
  getValidPlacements,
  getValidVersionsString,
  hasProtocolBindings,
  isValidBindingVersion,
  normalizeBindingProtocol,
  supportsBindingPlacement,
} from "../constants/binding-versions.js";
import type { BindingTargetKind } from "../constants/binding-versions.js";
import type { ProtocolBindings } from "../domain/models/asyncapi-document.js";
import { validateBindingFields } from "./binding-field-validator.js";

/** Diagnostic codes that can be produced by binding validation. */
export type BindingDiagnosticCode =
  | "unknown-binding-protocol"
  | "invalid-binding-version"
  | "misplaced-binding"
  | "invalid-binding-field";

export interface BindingValidationIssue {
  key: string;
  severity: "error" | "warning";
  code: BindingDiagnosticCode;
  format: Record<string, unknown>;
}

/**
 * Normalize a single binding key to its canonical AsyncAPI protocol name.
 * Returns the canonical name if the key is a known protocol or alias,
 * or undefined if the key is not recognized.
 */
export function normalizeBindingKey(key: string): string | undefined {
  const lower = key.toLowerCase();
  if (isSupportedProtocol(lower)) {
    return normalizeBindingProtocol(normalizeProtocol(lower));
  }
  if (hasProtocolBindings(lower)) {
    return normalizeBindingProtocol(lower);
  }
  return undefined;
}

/**
 * Process a raw bindings object:
 * - Normalize all keys to canonical protocol names
 * - Auto-inject bindingVersion where missing
 * - Validate binding placement against the target kind
 * - Collect validation issues for unknown keys / bad versions / misplaced bindings
 *
 * When `targetKind` is provided, protocols that lack a binding definition for
 * that target kind generate a `misplaced-binding` warning. The binding is still
 * passed through so the output remains usable.
 *
 * Returns the cleaned bindings object and a list of issues.
 * Issues should be reported as diagnostics by the caller.
 */
export function processBindings(
  raw: Record<string, unknown>,
  targetKind?: BindingTargetKind,
): {
  bindings: ProtocolBindings;
  issues: BindingValidationIssue[];
} {
  const issues: BindingValidationIssue[] = [];
  const bindings: ProtocolBindings = {};

  for (const [key, value] of Object.entries(raw)) {
    const canonical = normalizeBindingKey(key);

    if (!canonical) {
      pushIssue(issues, key, "unknown-binding-protocol", "warning", {
        protocol: key,
        validProtocols: "kafka, amqp, mqtt, http, ws, wss, nats, redis, etc.",
      });
      bindings[key] = value as Record<string, unknown>;
      continue;
    }

    if (targetKind && !supportsBindingPlacement(canonical, targetKind)) {
      pushIssue(issues, canonical, "misplaced-binding", "warning", {
        protocol: canonical,
        targetKind,
        validPlacements: getValidPlacements(canonical).join(", "),
      });
    }

    const bindingObj =
      value && typeof value === "object" && !Array.isArray(value)
        ? { ...(value as Record<string, unknown>) }
        : {};

    if (hasProtocolBindings(canonical)) {
      const declaredVersion = bindingObj.bindingVersion;
      if (declaredVersion === undefined) {
        bindingObj.bindingVersion = getLatestBindingVersion(canonical);
      } else {
        const versionStr = stringifyBindingVersion(declaredVersion);
        if (!isValidBindingVersion(canonical, versionStr)) {
          pushIssue(issues, canonical, "invalid-binding-version", "warning", {
            protocol: canonical,
            validVersions:
              getValidVersionsString(canonical) ??
              getLatestBindingVersion(canonical) ??
              "latest",
            version: versionStr,
          });
        }
      }

      const fieldIssues = validateBindingFields(
        canonical,
        targetKind,
        bindingObj,
      );
      for (const fi of fieldIssues) {
        pushIssue(
          issues,
          fi.key,
          "invalid-binding-field",
          "warning",
          fi.format,
        );
      }
    }

    bindings[canonical] = bindingObj;
  }

  return { bindings, issues };
}

/** Coerce an arbitrary `bindingVersion` value to its string form for comparison. */
function stringifyBindingVersion(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  return "[object]";
}

/** Push a `BindingValidationIssue` onto the issues array. */
export function pushIssue(
  issues: BindingValidationIssue[],
  key: string,
  code: BindingDiagnosticCode,
  severity: "error" | "warning",
  format: Record<string, unknown>,
): void {
  issues.push({ code, format, key, severity });
}
