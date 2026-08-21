/**
 * Protocol configuration state writer — extracted from state-writers.ts
 * to respect the 400-line file size limit.
 */

import type { Model, Operation, Program } from "@typespec/compiler";
import { getStateMap } from "./state-compatibility.js";
import { stateSymbols } from "./lib.js";
import { normalizeProtocol } from "./constants/protocols.js";
import type { ProtocolConfigData } from "./state.js";

/** Config keys with dedicated meaning in `@protocol`; all others are binding passthrough. */
const RESERVED_CONFIG_KEYS: ReadonlySet<string> = new Set([
  "protocol",
  "binding",
  "version",
  "partitions",
  "replicationFactor",
  "consumerGroup",
  "qos",
  "retain",
  "headers",
  "queryParams",
]);

/** Collect non-reserved config keys as raw binding passthrough fields. */
function topLevelPassthrough(
  config: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const entries = Object.entries(config).filter(
    ([key]) => !RESERVED_CONFIG_KEYS.has(key),
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export const storeProtocolConfig = (
  program: Program,
  target: Operation | Model,
  config: Record<string, unknown>,
): void => {
  const map = getStateMap<ProtocolConfigData>(
    program,
    stateSymbols.protocolConfigs,
  );
  const rawProtocol = (config.protocol as string | undefined) ?? "kafka";
  const protocolType = normalizeProtocol(rawProtocol);

  const base = {
    binding: {
      ...topLevelPassthrough(config),
      ...(config.binding as Record<string, unknown> | undefined),
    },
    version: config.version as string | undefined,
  };

  let protocolConfig: ProtocolConfigData;

  switch (protocolType) {
    case "kafka": {
      protocolConfig = {
        ...base,
        protocol: "kafka",
        partitions: config.partitions as number | undefined,
        replicationFactor: config.replicationFactor as number | undefined,
        consumerGroup: config.consumerGroup as string | undefined,
      };
      break;
    }
    case "ws":
    case "wss": {
      protocolConfig = {
        ...base,
        protocol: protocolType,
        headers: config.headers as Record<string, string> | undefined,
        queryParams:
          config.queryParams as Record<string, string> | undefined,
      };
      break;
    }
    case "mqtt":
    case "mqtt5": {
      protocolConfig = {
        ...base,
        protocol: protocolType,
        qos: config.qos as 0 | 1 | 2 | undefined,
        retain: config.retain as boolean | undefined,
      };
      break;
    }
    default: {
      protocolConfig = { ...base, protocol: protocolType };
    }
  }

  map.set(target, protocolConfig);
};
