/**
 * AsyncAPI Protocol Binding Versions
 *
 * Single source of truth for the latest binding version per protocol.
 * Used by the document-builder to auto-inject `bindingVersion` when missing
 * so that generated output always validates against the official AsyncAPI 3.1 JSON Schema.
 *
 * Sources: @asyncapi/specs bindings directory (latest version per protocol).
 */

import { normalizeProtocol } from "./protocols.js";

/** Latest binding version for each protocol that has binding definitions. */
export const LATEST_BINDING_VERSIONS = {
  kafka: "0.5.0",
  amqp: "0.3.0",
  mqtt: "0.2.0",
  http: "0.3.0",
  ws: "0.1.0",
} as const;

/** All protocol names that have official AsyncAPI binding definitions. */
export type ProtocolWithBindings = keyof typeof LATEST_BINDING_VERSIONS;

export const PROTOCOLS_WITH_BINDINGS: readonly ProtocolWithBindings[] = Object.keys(
  LATEST_BINDING_VERSIONS,
) as ProtocolWithBindings[];

/** All valid binding versions per protocol (not just the latest). */
export const VALID_BINDING_VERSIONS: Record<ProtocolWithBindings, readonly string[]> = {
  kafka: ["0.5.0", "0.4.0", "0.3.0"],
  amqp: ["0.3.0"],
  mqtt: ["0.2.0"],
  http: ["0.3.0", "0.2.0"],
  ws: ["0.1.0"],
} as const;

/**
 * Normalize a protocol name for use as a binding key.
 * The AsyncAPI binding schema uses `ws` for both WebSocket and secure WebSocket,
 * so `wss` MUST be mapped to `ws` when used as a binding key.
 * Server.protocol retains the distinction (ws vs wss).
 */
export function normalizeBindingProtocol(protocol: string): string {
  if (protocol === "wss") return "ws";
  return normalizeProtocol(protocol);
}

/**
 * Returns the latest binding version for a protocol, or undefined if the
 * protocol has no binding definitions.
 */
export function getLatestBindingVersion(protocol: string): string | undefined {
  const bindingProtocol = normalizeBindingProtocol(protocol);
  return LATEST_BINDING_VERSIONS[bindingProtocol as ProtocolWithBindings];
}

/**
 * Returns true if the protocol has official AsyncAPI binding definitions.
 */
export function hasProtocolBindings(protocol: string): protocol is ProtocolWithBindings {
  const bindingProtocol = normalizeBindingProtocol(protocol);
  return bindingProtocol in LATEST_BINDING_VERSIONS;
}

/**
 * Returns true if the given binding version is valid for the protocol.
 */
export function isValidBindingVersion(protocol: string, version: string): boolean {
  const versions = VALID_BINDING_VERSIONS[protocol as ProtocolWithBindings];
  return versions ? versions.includes(version) : false;
}

/**
 * Returns a comma-separated string of valid binding versions for a protocol,
 * or undefined if the protocol has no binding definitions.
 */
export function getValidVersionsString(protocol: string): string | undefined {
  const versions = VALID_BINDING_VERSIONS[protocol as ProtocolWithBindings];
  return versions ? versions.join(", ") : undefined;
}
