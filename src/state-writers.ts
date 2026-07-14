/**
 * State Writer Functions
 *
 * Write decorator data into TypeSpec's state map for later retrieval by the emitter.
 * Each function corresponds to a specific decorator's state storage.
 */

import type { Program, Operation, Model, ModelProperty, Namespace } from "@typespec/compiler";
import { stateSymbols } from "./lib.js";
import { getStateMap } from "./state-compatibility.js";
import type { MessageConfigData } from "./state.js";

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
  description?: string,
) => {
  const map = getStateMap(program, stateSymbols.operationTypes);
  map.set(target, {
    type,
    messageType,
    description: description ?? `${type} operation for ${target.name ?? "unnamed"}`,
    tags: [],
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
    protocol: (config.protocol as string) ?? "http",
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
  config: { name: string; scheme: Record<string, unknown> },
) => {
  const map = getStateMap(program, stateSymbols.securityConfigs);
  map.set(target, { name: config.name, scheme: config.scheme });
};

export const storeTags = (program: Program, target: Operation | Model, tags: string[]) => {
  const map = getStateMap<{ name: string }[]>(program, stateSymbols.tags);
  const existing = map.get(target) ?? [];
  const allNames = new Set([...existing.map((t) => t.name), ...tags]);
  map.set(
    target,
    [...allNames].map((name) => ({ name })),
  );
};

export const storeCorrelationId = (
  program: Program,
  target: Model,
  location: string,
  property?: string,
) => {
  const map = getStateMap(program, stateSymbols.correlationIds);
  map.set(target, { location, property });
};

export const storeBindings = (
  program: Program,
  target: Operation | Model,
  bindings: Record<string, unknown>,
) => {
  const map = getStateMap(program, stateSymbols.protocolBindings);
  const existing = (map.get(target) as Record<string, unknown> | undefined) ?? {};
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
  const map = getStateMap(program, stateSymbols.protocolConfigs);
  const protocolType = (config.protocol as string) ?? "kafka";

  const protocolConfig = {
    protocol: protocolType,
    ...config,
    ...(protocolType === "kafka" && {
      partitions: config.partitions ?? 1,
      replicationFactor: config.replicationFactor ?? 1,
      consumerGroup: config.consumerGroup ?? "default",
      sasl: config.sasl ?? { mechanism: "plain", username: "", password: "" },
    }),
    ...(protocolType === "ws" && {
      subprotocol: config.subprotocol ?? "asyncapi",
      queryParams: config.queryParams ?? {},
      headers: config.headers ?? {},
    }),
    ...(protocolType === "mqtt" && {
      qos: config.qos ?? 1,
      retain: config.retain ?? false,
      lastWill: config.lastWill ?? {
        topic: "",
        message: "",
        qos: 1,
        retain: false,
      },
    }),
  };

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
