/**
 * State Writer Functions
 *
 * Write decorator data into TypeSpec's state map for later retrieval by the emitter.
 * Each function corresponds to a specific decorator's state storage.
 */

import type { Program, Operation, Model, ModelProperty, Namespace } from "@typespec/compiler";
import { stateSymbols } from "./lib.js";
import { getStateMap } from "./state-compatibility.js";
import { normalizeProtocol } from "./constants/protocols.js";
import type { ProtocolBindings, SecurityScheme, Tag } from "./domain/models/asyncapi-document.js";
import type { MessageConfigData, ProtocolConfigData } from "./state.js";

export const storeChannelState = (program: Program, target: Operation, path: string) => {
  const map = getStateMap(program, stateSymbols.channelPaths);
  map.set(target, {
    path,
    hasParameters: path.includes("{"),
    parameters: path.match(/\{([^}]+)\}/g)?.map((p) => p.slice(1, -1)),
  });
};

export const storeOperationType = (
  program: Program,
  target: Operation,
  type: "publish" | "subscribe",
  messageType?: string,
) => {
  const map = getStateMap(program, stateSymbols.operationTypes);
  map.set(target, {
    type,
    messageType,
  });
};

export const storeMessageConfig = (
  program: Program,
  target: Model,
  config: { title: string; description: string; contentType: string },
) => {
  const map = getStateMap(program, stateSymbols.messageConfigs);
  map.set(target, {
    title: config.title ?? target.name,
    description: config.description ?? `Message ${target.name}`,
    contentType: config.contentType ?? "application/json",
  });
};

export const storeServerConfig = (
  program: Program,
  target: Namespace,
  config: Record<string, unknown> & { name: string },
) => {
  type ServerConfigEntry = {
    name: string;
    url: string;
    protocol: string;
    description: string;
  };

  const map = getStateMap<ServerConfigEntry[]>(program, stateSymbols.serverConfigs);
  const existing = map.get(target);
  const newEntry: ServerConfigEntry = {
    name: config.name,
    url: (config.url as string) ?? "http://localhost:3000",
    protocol: normalizeProtocol((config.protocol as string) ?? "http"),
    description: (config.description as string) ?? `Server for ${target.name}`,
  };
  if (Array.isArray(existing)) {
    map.set(target, [...existing, newEntry]);
  } else {
    map.set(target, [newEntry]);
  }
};

export const storeSecurityConfig = (
  program: Program,
  target: Operation | Namespace,
  config: { name: string; scheme: SecurityScheme },
) => {
  type SecurityConfigEntry = { name: string; scheme: SecurityScheme };
  const map = getStateMap<SecurityConfigEntry[]>(program, stateSymbols.securityConfigs);
  const existing = map.get(target);
  const newEntry: SecurityConfigEntry = {
    name: config.name,
    scheme: config.scheme,
  };
  if (Array.isArray(existing)) {
    map.set(target, [...existing, newEntry]);
  } else {
    map.set(target, [newEntry]);
  }
};

export const storeTags = (program: Program, target: Operation | Model, tags: string[]) => {
  const map = getStateMap<Tag[]>(program, stateSymbols.tags);
  const existing = map.get(target) ?? [];
  const allNames = new Set([...existing.map((t) => t.name), ...tags]);
  map.set(
    target,
    [...allNames].map((name) => ({ name })),
  );
};

export const storeCorrelationId = (program: Program, target: Model, location: string) => {
  const map = getStateMap(program, stateSymbols.correlationIds);
  map.set(target, { location });
};

export const storeBindings = (
  program: Program,
  target: Operation | Model,
  bindings: ProtocolBindings,
) => {
  const map = getStateMap(program, stateSymbols.protocolBindings);
  const existing = (map.get(target) as ProtocolBindings | undefined) ?? {};
  map.set(target, { ...existing, ...bindings });
};

export const storeHeader = (
  program: Program,
  target: Model | ModelProperty,
  name: string,
  value?: unknown,
) => {
  const map = getStateMap(program, stateSymbols.messageHeaders);

  let headerType = "string";
  let description: string | undefined;

  if (target.kind === "ModelProperty") {
    const propType = target.type as { kind?: string; name?: string } | undefined;
    if (propType?.kind === "Scalar") {
      headerType = propType.name?.toLowerCase() ?? "string";
    }
    description = typeof value === "string" ? value : undefined;
  }

  const existing =
    (map.get(target) as
      | Array<{
          name: string;
          value?: unknown;
          type?: string;
          description?: string;
        }>
      | undefined) ?? [];
  map.set(target, [...existing, { name, value, type: headerType, description }]);
};

export const storeProtocolConfig = (
  program: Program,
  target: Operation | Model,
  config: Record<string, unknown>,
) => {
  const map = getStateMap<ProtocolConfigData>(program, stateSymbols.protocolConfigs);
  const rawProtocol = (config.protocol as string) ?? "kafka";
  const protocolType = normalizeProtocol(rawProtocol);

  const base = {
    version: config.version as string | undefined,
    binding: config.binding as Record<string, unknown> | undefined,
  };

  let protocolConfig: ProtocolConfigData;

  switch (protocolType) {
    case "kafka":
      protocolConfig = {
        ...base,
        protocol: "kafka",
        partitions: (config.partitions as number) ?? 1,
        replicationFactor: (config.replicationFactor as number) ?? 1,
        consumerGroup: (config.consumerGroup as string) ?? "default",
        sasl: (config.sasl as {
          mechanism: string;
          username: string;
          password: string;
        }) ?? {
          mechanism: "plain",
          username: "",
          password: "",
        },
      };
      break;
    case "ws":
    case "wss":
      protocolConfig = {
        ...base,
        protocol: protocolType,
        subprotocol: (config.subprotocol as string) ?? "asyncapi",
        queryParams: (config.queryParams as Record<string, string>) ?? {},
        headers: (config.headers as Record<string, string>) ?? {},
      };
      break;
    case "mqtt":
    case "mqtt5":
      protocolConfig = {
        ...base,
        protocol: protocolType,
        qos: (config.qos as 0 | 1 | 2) ?? 1,
        retain: (config.retain as boolean) ?? false,
        lastWill: (config.lastWill as {
          topic: string;
          message: string;
          qos: 0 | 1 | 2;
          retain: boolean;
        }) ?? {
          topic: "",
          message: "",
          qos: 1,
          retain: false,
        },
      };
      break;
    default:
      protocolConfig = { ...base, protocol: protocolType };
  }

  map.set(target, protocolConfig);
};

export const linkPublishMessage = (program: Program, target: Operation, config?: Model) => {
  if (config) {
    const map = getStateMap<MessageConfigData>(program, stateSymbols.messageConfigs);
    const existing = map.get(config);
    if (existing) {
      existing.messageId = config.name;
      map.set(config, existing);
    }
  }
};
