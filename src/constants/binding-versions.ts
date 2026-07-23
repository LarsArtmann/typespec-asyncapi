/**
 * AsyncAPI Protocol Binding Versions
 *
 * Data is AUTO-GENERATED from @asyncapi/specs/bindings/ by scripts/generate-binding-specs.ts.
 * A small SCHEMA_OVERRIDES map patches values where the AsyncAPI 3.1 JSON Schema
 * only accepts a subset of versions (e.g. SNS 0.1.0, not 0.2.0).
 *
 * To regenerate: bun run scripts/generate-binding-specs.ts
 */

import { normalizeProtocol } from "./protocols.js";
import {
  GENERATED_ALL_VERSIONS,
  GENERATED_LATEST_VERSIONS,
  GENERATED_PLACEMENT,
} from "./generated-bindings.js";

/**
 * Overrides where the AsyncAPI 3.1 JSON Schema accepts fewer versions
 * than the @asyncapi/specs bindings directory contains.
 */
const SCHEMA_VERSION_OVERRIDES: Record<
  string,
  { latest: string; valid: string[] }
> = {
  sns: { latest: "0.1.0", valid: ["0.1.0"] },
};

function buildLatestVersions(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [proto, version] of Object.entries(GENERATED_LATEST_VERSIONS)) {
    if (!version) {
      continue;
    }
    const override = SCHEMA_VERSION_OVERRIDES[proto];
    result[proto] = override?.latest ?? version;
  }
  return result;
}

function buildValidVersions(): Record<string, readonly string[]> {
  const result: Record<string, readonly string[]> = {};
  for (const [proto, versions] of Object.entries(GENERATED_ALL_VERSIONS)) {
    if (versions.length === 0) {
      continue;
    }
    const override = SCHEMA_VERSION_OVERRIDES[proto];
    result[proto] = override?.valid ?? versions;
  }
  return result;
}

function buildPlacement(): Record<string, Record<string, boolean>> {
  const result: Record<string, Record<string, boolean>> = {};
  for (const [proto, placement] of Object.entries(GENERATED_PLACEMENT)) {
    if (!GENERATED_LATEST_VERSIONS[proto]) {
      continue;
    }
    result[proto] = placement;
  }
  return result;
}

export const LATEST_BINDING_VERSIONS = buildLatestVersions() as Readonly<
  Record<string, string>
>;

export type ProtocolWithBindings = keyof typeof LATEST_BINDING_VERSIONS;

export const PROTOCOLS_WITH_BINDINGS: readonly string[] = Object.keys(
  LATEST_BINDING_VERSIONS,
);

export const VALID_BINDING_VERSIONS = buildValidVersions();

export const BINDING_PLACEMENT = buildPlacement() as Readonly<
  Record<string, Record<string, boolean>>
>;

export type BindingTargetKind = "channel" | "operation" | "message" | "server";

export function normalizeBindingProtocol(protocol: string): string {
  if (protocol === "wss") {
    return "ws";
  }
  return normalizeProtocol(protocol);
}

export function getLatestBindingVersion(protocol: string): string | undefined {
  const bindingProtocol = normalizeBindingProtocol(protocol);
  return LATEST_BINDING_VERSIONS[bindingProtocol];
}

export function hasProtocolBindings(protocol: string): boolean {
  const bindingProtocol = normalizeBindingProtocol(protocol);
  return bindingProtocol in LATEST_BINDING_VERSIONS;
}

export function isValidBindingVersion(
  protocol: string,
  version: string,
): boolean {
  const versions = VALID_BINDING_VERSIONS[protocol];
  return versions ? versions.includes(version) : false;
}

export function getValidVersionsString(protocol: string): string | undefined {
  const versions = VALID_BINDING_VERSIONS[protocol];
  return versions ? versions.join(", ") : undefined;
}

export function supportsBindingPlacement(
  protocol: string,
  kind: BindingTargetKind,
): boolean {
  const placement = BINDING_PLACEMENT[protocol];
  return placement ? placement[kind] === true : false;
}

export function getValidPlacements(protocol: string): BindingTargetKind[] {
  const placement = BINDING_PLACEMENT[protocol];
  if (!placement) {
    return [];
  }
  return (Object.keys(placement) as BindingTargetKind[]).filter(
    (kind) => placement[kind] === true,
  );
}
