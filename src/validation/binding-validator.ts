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

import { isSupportedProtocol, normalizeProtocol } from "../constants/protocols.js";
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

/** Diagnostic codes that can be produced by binding validation. */
export type BindingDiagnosticCode =
  | "unknown-binding-protocol"
  | "invalid-binding-version"
  | "misplaced-binding";

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
      issues.push({
        code: "unknown-binding-protocol",
        format: {
          protocol: key,
          validProtocols: "kafka, amqp, mqtt, http, ws, wss, nats, redis, etc.",
        },
        key,
        severity: "warning",
      });
      bindings[key] = value as Record<string, unknown>;
      continue;
    }

    if (targetKind && !supportsBindingPlacement(canonical, targetKind)) {
      issues.push({
        code: "misplaced-binding",
        format: {
          protocol: canonical,
          targetKind,
          validPlacements: getValidPlacements(canonical).join(", "),
        },
        key: canonical,
        severity: "warning",
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
        const versionStr =
          typeof declaredVersion === "string"
            ? declaredVersion
            : typeof declaredVersion === "number"
              ? String(declaredVersion)
              : "[object]";
        if (!isValidBindingVersion(canonical, versionStr)) {
          issues.push({
            code: "invalid-binding-version",
            format: {
              protocol: canonical,
              validVersions:
                getValidVersionsString(canonical) ?? getLatestBindingVersion(canonical) ?? "latest",
              version: versionStr,
            },
            key: canonical,
            severity: "warning",
          });
        }
      }
    }

    bindings[canonical] = bindingObj;
  }

  return { bindings, issues };
}
