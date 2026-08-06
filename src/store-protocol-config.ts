/**
 * Protocol configuration state writer — extracted from state-writers.ts
 * to respect the 400-line file size limit.
 */

import type { Model, Operation, Program } from "@typespec/compiler";
import { getStateMap } from "./state-compatibility.js";
import { stateSymbols } from "./lib.js";
import { normalizeProtocol } from "./constants/protocols.js";
import type {
  KafkaSaslConfig,
  MqttLastWillConfig,
  ProtocolConfigData,
} from "./state.js";

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
    binding: config.binding as Record<string, unknown> | undefined,
    version: config.version as string | undefined,
  };

  let protocolConfig: ProtocolConfigData;

  switch (protocolType) {
    case "kafka": {
      protocolConfig = {
        ...base,
        consumerGroup:
          (config.consumerGroup as string | undefined) ?? "default",
        partitions: (config.partitions as number | undefined) ?? 1,
        protocol: "kafka",
        replicationFactor:
          (config.replicationFactor as number | undefined) ?? 1,
        sasl: (config.sasl as KafkaSaslConfig | undefined) ?? {
          mechanism: "plain",
          password: "",
          username: "",
        },
      };
      break;
    }
    case "ws":
    case "wss": {
      protocolConfig = {
        ...base,
        headers: (config.headers as Record<string, string> | undefined) ?? {},
        protocol: protocolType,
        queryParams:
          (config.queryParams as Record<string, string> | undefined) ?? {},
        subprotocol: (config.subprotocol as string | undefined) ?? "asyncapi",
      };
      break;
    }
    case "mqtt":
    case "mqtt5": {
      protocolConfig = {
        ...base,
        lastWill: (config.lastWill as MqttLastWillConfig | undefined) ?? {
          message: "",
          qos: 1,
          retain: false,
          topic: "",
        },
        protocol: protocolType,
        qos: (config.qos as 0 | 1 | 2 | undefined) ?? 1,
        retain: (config.retain as boolean | undefined) ?? false,
      };
      break;
    }
    default: {
      protocolConfig = { ...base, protocol: protocolType };
    }
  }

  map.set(target, protocolConfig);
};
