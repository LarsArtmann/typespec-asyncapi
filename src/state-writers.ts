/**
 * State Writer Functions
 *
 * Write decorator data into TypeSpec's state map for later retrieval by the emitter.
 * Each function corresponds to a specific decorator's state storage.
 */

import type {
  MessageConfigData,
  OperationReplyData,
  ProtocolConfigData,
} from "./state.js";
import type {
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Program,
} from "@typespec/compiler";
import type {
  ProtocolBindings,
  SecurityScheme,
  Tag,
} from "./domain/models/asyncapi-document.js";
import { getStateMap } from "./state-compatibility.js";
import { normalizeProtocol } from "./constants/protocols.js";
import { stateSymbols } from "./lib.js";

export const storeChannelState = (
  program: Program,
  target: Operation,
  path: string,
): void => {
  const map = getStateMap(program, stateSymbols.channelPaths);
  map.set(target, {
    hasParameters: path.includes("{"),
    parameters: path.match(/\{(?<param>[^}]+)\}/gu)?.map((p) => p.slice(1, -1)),
    path,
  });
};

export const storeOperationType = (
  program: Program,
  target: Operation,
  type: "publish" | "subscribe",
  messageType?: string,
): void => {
  const map = getStateMap(program, stateSymbols.operationTypes);
  map.set(target, {
    messageType,
    type,
  });
};

export const storeMessageConfig = (
  program: Program,
  target: Model,
  config: { title: string; description: string; contentType: string },
): void => {
  const map = getStateMap(program, stateSymbols.messageConfigs);
  map.set(target, {
    contentType: config.contentType ?? "application/json",
    description: config.description ?? `Message ${target.name}`,
    title: config.title ?? target.name,
  });
};

export const storeOperationId = (
  program: Program,
  target: Operation,
  operationId: string,
): void => {
  const map = getStateMap<string>(program, stateSymbols.operationIds);
  map.set(target, operationId);
};

export const storeMessageId = (
  program: Program,
  target: Model,
  messageId: string,
): void => {
  const map = getStateMap<MessageConfigData>(
    program,
    stateSymbols.messageConfigs,
  );
  const existing = map.get(target) ?? {
    contentType: "application/json",
    description: `Message ${target.name}`,
    title: target.name,
  };
  existing.messageId = messageId;
  map.set(target, existing);
};

export const storeServerConfig = (
  program: Program,
  target: Namespace,
  config: Record<string, unknown> & { name: string },
): void => {
  interface ServerConfigEntry {
    name: string;
    url: string;
    protocol: string;
    description: string;
  }

  const map = getStateMap<ServerConfigEntry[]>(
    program,
    stateSymbols.serverConfigs,
  );
  const existing = map.get(target);
  const newEntry: ServerConfigEntry = {
    description: (config.description as string) ?? `Server for ${target.name}`,
    name: config.name,
    protocol: normalizeProtocol((config.protocol as string) ?? "http"),
    url: (config.url as string) ?? "http://localhost:3000",
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
): void => {
  interface SecurityConfigEntry {
    name: string;
    scheme: SecurityScheme;
  }
  const map = getStateMap<SecurityConfigEntry[]>(
    program,
    stateSymbols.securityConfigs,
  );
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

export const storeTags = (
  program: Program,
  target: Operation | Model,
  tags: string[],
): void => {
  const map = getStateMap<Tag[]>(program, stateSymbols.tags);
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
): void => {
  const map = getStateMap(program, stateSymbols.correlationIds);
  map.set(target, { location });
};

export const storeBindings = (
  program: Program,
  target: Operation | Model | Namespace,
  bindings: ProtocolBindings,
): void => {
  const map = getStateMap(program, stateSymbols.protocolBindings);
  const existing = (map.get(target) as ProtocolBindings | undefined) ?? {};
  map.set(target, { ...existing, ...bindings });
};

export const storeHeader = (
  program: Program,
  target: Model | ModelProperty,
  name: string,
  value?: unknown,
): void => {
  const map = getStateMap(program, stateSymbols.messageHeaders);

  let headerType = "string";
  let description: string | undefined;

  if (target.kind === "ModelProperty") {
    const propType = target.type as
      { kind?: string; name?: string } | undefined;
    if (propType?.kind === "Scalar") {
      headerType = propType.name?.toLowerCase() ?? "string";
    }
    description = typeof value === "string" ? value : undefined;
  }

  const existing =
    (map.get(target) as
      | {
          name: string;
          value?: unknown;
          type?: string;
          description?: string;
        }[]
      | undefined) ?? [];
  map.set(target, [
    ...existing,
    { description, name, type: headerType, value },
  ]);
};

export const storeProtocolConfig = (
  program: Program,
  target: Operation | Model,
  config: Record<string, unknown>,
): void => {
  const map = getStateMap<ProtocolConfigData>(
    program,
    stateSymbols.protocolConfigs,
  );
  const rawProtocol = (config.protocol as string) ?? "kafka";
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
        consumerGroup: (config.consumerGroup as string) ?? "default",
        partitions: (config.partitions as number) ?? 1,
        protocol: "kafka",
        replicationFactor: (config.replicationFactor as number) ?? 1,
        sasl: (config.sasl as {
          mechanism: string;
          username: string;
          password: string;
        }) ?? {
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
        headers: (config.headers as Record<string, string>) ?? {},
        protocol: protocolType,
        queryParams: (config.queryParams as Record<string, string>) ?? {},
        subprotocol: (config.subprotocol as string) ?? "asyncapi",
      };
      break;
    }
    case "mqtt":
    case "mqtt5": {
      protocolConfig = {
        ...base,
        lastWill: (config.lastWill as {
          topic: string;
          message: string;
          qos: 0 | 1 | 2;
          retain: boolean;
        }) ?? {
          message: "",
          qos: 1,
          retain: false,
          topic: "",
        },
        protocol: protocolType,
        qos: (config.qos as 0 | 1 | 2) ?? 1,
        retain: (config.retain as boolean) ?? false,
      };
      break;
    }
    default: {
      protocolConfig = { ...base, protocol: protocolType };
    }
  }

  map.set(target, protocolConfig);
};

export const linkPublishMessage = (
  program: Program,
  target: Operation,
  config?: Model,
): void => {
  if (config) {
    const map = getStateMap<MessageConfigData>(
      program,
      stateSymbols.messageConfigs,
    );
    const existing = map.get(config);
    if (existing) {
      existing.messageId = config.name;
      map.set(config, existing);
    }
  }
};

export const storeDefaultContentType = (
  program: Program,
  target: Namespace,
  contentType: string,
): void => {
  const map = getStateMap(program, stateSymbols.defaultContentType);
  map.set(target, { contentType });
};

export const storeOperationReply = (
  program: Program,
  target: Operation,
  replyData: OperationReplyData,
): void => {
  const map = getStateMap(program, stateSymbols.operationReplies);
  map.set(target, replyData);
};

export const storeApiVersion = (
  program: Program,
  target: Namespace,
  version: string,
): void => {
  const map = getStateMap(program, stateSymbols.apiVersion);
  map.set(target, version);
};
