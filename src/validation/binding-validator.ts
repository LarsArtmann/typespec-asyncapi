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

import { normalizeProtocol, isSupportedProtocol } from "../constants/protocols.js";
import {
  getLatestBindingVersion,
  hasProtocolBindings,
  isValidBindingVersion,
  normalizeBindingProtocol,
} from "../constants/binding-versions.js";
import type { ProtocolBindings } from "../domain/models/asyncapi-document.js";

export type BindingValidationIssue = {
  key: string;
  severity: "error" | "warning";
  code: string;
  format: Record<string, unknown>;
};

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
 * - Collect validation issues for unknown keys / bad versions
 *
 * Returns the cleaned bindings object and a list of issues.
 * Issues should be reported as diagnostics by the caller.
 */
export function processBindings(raw: Record<string, unknown>): {
  bindings: ProtocolBindings;
  issues: BindingValidationIssue[];
} {
  const issues: BindingValidationIssue[] = [];
  const bindings: ProtocolBindings = {};

  for (const [key, value] of Object.entries(raw)) {
    const canonical = normalizeBindingKey(key);

    if (!canonical) {
      issues.push({
        key,
        severity: "warning",
        code: "unknown-binding-protocol",
        format: {
          protocol: key,
          validProtocols: "kafka, amqp, mqtt, http, ws, wss, nats, redis, etc.",
        },
      });
      bindings[key] = value as Record<string, unknown>;
      continue;
    }

    const bindingObj =
      value && typeof value === "object" && !Array.isArray(value)
        ? { ...(value as Record<string, unknown>) }
        : {};

    if (hasProtocolBindings(canonical)) {
      const declaredVersion = bindingObj.bindingVersion;
      if (declaredVersion !== undefined) {
        const versionStr =
          typeof declaredVersion === "string"
            ? declaredVersion
            : typeof declaredVersion === "number"
              ? String(declaredVersion)
              : "[object]";
        if (!isValidBindingVersion(canonical, versionStr)) {
          issues.push({
            key: canonical,
            severity: "warning",
            code: "invalid-binding-version",
            format: {
              protocol: canonical,
              version: versionStr,
              validVersions:
                getValidVersionsString(canonical) ?? getLatestBindingVersion(canonical) ?? "latest",
            },
          });
        }
      } else {
        bindingObj.bindingVersion = getLatestBindingVersion(canonical);
      }
    }

    bindings[canonical] = bindingObj;
  }

  return { bindings, issues };
}

function getValidVersionsString(protocol: string): string | undefined {
  const versions: Record<string, readonly string[]> = {
    kafka: ["0.5.0", "0.4.0", "0.3.0"],
    amqp: ["0.3.0"],
    mqtt: ["0.2.0"],
    http: ["0.3.0", "0.2.0"],
    ws: ["0.1.0"],
  };
  const list = versions[protocol];
  return list ? list.join(", ") : undefined;
}
