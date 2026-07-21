/**
 * AsyncAPI Protocol Definitions - Single Source of Truth
 *
 * All supported AsyncAPI 3.1 protocols defined once.
 * Every other file must import from here.
 *
 * AsyncAPI 3.1 binding keys and server.protocol values use the canonical
 * short names (`ws`, `wss`, `kafka`, ...). Friendly aliases such as
 * `websocket` are accepted as INPUT only and normalized via
 * `normalizeProtocol()` before being used as binding keys.
 */

const PROTOCOLS = [
  "http",
  "https",
  "ws",
  "wss",
  "mqtt",
  "mqtt5",
  "kafka",
  "amqp",
  "amqp1",
  "nats",
  "jms",
  "sns",
  "sqs",
  "stomp",
  "redis",
  "mercure",
  "ibmmq",
  "pulsar",
] as const;

export type AsyncAPIProtocol = (typeof PROTOCOLS)[number];

/**
 * User-friendly aliases that map to canonical AsyncAPI protocol names.
 * Keys are accepted as input; values are the canonical names that appear
 * in the generated AsyncAPI document.
 */
const PROTOCOL_ALIASES = {
  websocket: "ws",
  websockets: "wss",
} as const satisfies Record<string, AsyncAPIProtocol>;

/** Input aliases that users may write in `.tsp` files. */
export type ProtocolAlias = keyof typeof PROTOCOL_ALIASES;

/** Any protocol value that the emitter accepts as user input. */
export type AcceptedProtocol = AsyncAPIProtocol | ProtocolAlias;

export const SUPPORTED_PROTOCOLS: ReadonlySet<AsyncAPIProtocol> = new Set(PROTOCOLS);

export const PROTOCOL_LIST: readonly AsyncAPIProtocol[] = PROTOCOLS;

const ALIAS_KEYS = new Set<string>(Object.keys(PROTOCOL_ALIASES));

/**
 * Returns true if the input is a supported canonical protocol OR a known alias.
 * Use this to validate user input at the decorator boundary.
 */
export function isSupportedProtocol(value: string): value is AcceptedProtocol {
  const lower = value.toLowerCase();
  return SUPPORTED_PROTOCOLS.has(lower as AsyncAPIProtocol) || ALIAS_KEYS.has(lower);
}

/**
 * Returns the canonical AsyncAPI protocol name for a given input.
 *
 * - Canonical names pass through unchanged (case-normalized to lowercase).
 * - Known aliases (e.g. `websocket`) map to their canonical form (`ws`).
 *
 * MUST be called after `isSupportedProtocol()` has returned true for the value.
 * Unknown values pass through unchanged as a defensive fallback.
 */
export function normalizeProtocol(value: string): AsyncAPIProtocol {
  const lower = value.toLowerCase();
  if (lower in PROTOCOL_ALIASES) {
    return PROTOCOL_ALIASES[lower as ProtocolAlias];
  }
  return lower as AsyncAPIProtocol;
}
