/**
 * State Writer Functions
 *
 * Write decorator data into TypeSpec's state map for later retrieval by the emitter.
 * Each function corresponds to a specific decorator's state storage.
 */

import type {
  KafkaSaslConfig,
  MessageConfigData,
  MessageHeaderData,
  MqttLastWillConfig,
  OperationReplyData,
  ProtocolBindings,
  ProtocolConfigData,
  SecurityRequirement,
  SecurityScheme,
  ServerConfigData,
  Tag,
} from "./state.js";
import type {
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Program,
  Type,
} from "@typespec/compiler";
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
    contentType: config.contentType,
    description: config.description,
    title: config.title,
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
  updateMessageConfig(program, target, (existing) => {
    existing.messageId = messageId;
  });
};

/**
 * Read the message config entry for `target`, create a default if absent,
 * apply `update`, then write it back to the state map.
 */
function updateMessageConfig(
  program: Program,
  target: Model,
  update: (existing: MessageConfigData) => void,
): void {
  const map = getMessageConfigsMap(program);
  const existing = map.get(target) ?? {
    contentType: "application/json",
    description: `Message ${target.name}`,
    title: target.name,
  };
  update(existing);
  map.set(target, existing);
}

/** Get the state map for message configs. Shared by writers that mutate it. */
function getMessageConfigsMap(
  program: Program,
): ReturnType<typeof getStateMap<MessageConfigData>> {
  return getStateMap<MessageConfigData>(program, stateSymbols.messageConfigs);
}

export const storeServerConfig = (
  program: Program,
  target: Namespace,
  config: Record<string, unknown> & { name: string },
): void => {
  const newEntry: ServerConfigData = {
    description:
      (config.description as string | undefined) ?? `Server for ${target.name}`,
    name: config.name,
    protocol: normalizeProtocol(
      (config.protocol as string | undefined) ?? "http",
    ),
    url: (config.url as string | undefined) ?? "http://localhost:3000",
    ...(typeof config.protocolVersion === "string"
      ? { protocolVersion: config.protocolVersion }
      : {}),
    ...(typeof config.pathname === "string" ? { pathname: config.pathname } : {}),
    ...(config.variables !== undefined
      ? {
          variables: extractVariables(
            config.variables,
          ) as ServerConfigData["variables"],
        }
      : {}),
    ...(config.security !== undefined
      ? { security: extractSecurity(config.security) }
      : {}),
  };
  const map = getStateMap<ServerConfigData[]>(
    program,
    stateSymbols.serverConfigs,
  );
  appendToStateArray(map, target, newEntry);
};

/** Extract variables from either a plain object or a Model instance. */
function extractVariables(
  raw: unknown,
): Record<string, { enum?: string[]; default?: string; description?: string }> {
  if (raw && typeof raw === "object" && "properties" in raw) {
    const model = raw as { properties: Map<string, { type: unknown }> };
    const out: Record<string, { enum?: string[]; default?: string; description?: string }> = {};
    for (const [name, prop] of model.properties) {
      out[name] = extractVariableValue(prop.type);
    }
    return out;
  }
  return raw as never;
}

function extractVariableValue(type: unknown): {
  enum?: string[];
  default?: string;
  description?: string;
} {
  if (!type || typeof type !== "object") {
    return {};
  }
  const t = type as { kind?: string; value?: unknown; properties?: Map<string, { type: unknown }> };
  if (t.kind === "String" || t.kind === "Number") {
    return { default: String(t.value) };
  }
  if (t.kind === "Model" && t.properties) {
    const out: { enum?: string[]; default?: string; description?: string } = {};
    for (const [name, prop] of t.properties) {
      const v = extractVariableValue(prop.type);
      if (name === "enum" && Array.isArray(v.default)) {
        out.enum = v.default as string[];
      } else if (name === "default" && typeof v.default === "string") {
        out.default = v.default;
      } else if (name === "description" && typeof v.default === "string") {
        out.description = v.default;
      }
    }
    return out;
  }
  if (t.kind === "Tuple" || Array.isArray(t.value)) {
    return { default: (t.value as unknown[]).map(String) as never };
  }
  return {};
}

function extractSecurity(raw: unknown): SecurityRequirement[] {
  if (Array.isArray(raw)) {
    return raw as SecurityRequirement[];
  }
  if (raw && typeof raw === "object" && "properties" in raw) {
    const model = raw as { properties: Map<string, { type: unknown }> };
    const out: SecurityRequirement = {};
    for (const [name, prop] of model.properties) {
      if (name === "scopes" || name === "availableScopes") {
        const scopes = extractScopesValue(prop.type);
        if (scopes) {
          out[name] = scopes;
        }
      } else {
        const v = extractVariableValue(prop.type);
        if (typeof v.default === "string") {
          out[name] = [v.default];
        }
      }
    }
    return [out];
  }
  return raw as never;
}

function extractScopesValue(type: unknown): string[] | undefined {
  if (!type || typeof type !== "object") {
    return undefined;
  }
  const t = type as {
    kind?: string;
    values?: unknown[];
    elementType?: unknown;
  };
  if (t.kind === "Tuple" && Array.isArray(t.values)) {
    return t.values.map(String);
  }
  if (t.kind === "Model") {
    return undefined;
  }
  return undefined;
}

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
  appendToStateArray(map, target, { name: config.name, scheme: config.scheme });
};

/**
 * Append `entry` to the array stored under `key` in `map`, initializing the
 * entry to `[entry]` if the key has no existing value.
 */
function appendToStateArray<K, V>(map: Map<K, V[]>, key: K, entry: V): void {
  const existing = map.get(key);
  if (Array.isArray(existing)) {
    map.set(key, [...existing, entry]);
  } else {
    map.set(key, [entry]);
  }
}

export const storeTags = (
  program: Program,
  target: Operation | Model,
  tags: (string | Tag)[],
): void => {
  const normalized: Tag[] = tags.map((t) =>
    typeof t === "string" ? { name: t } : t,
  );
  const map = getStateMap<Tag[]>(program, stateSymbols.tags);
  const existing = map.get(target) ?? [];
  const byName = new Map(existing.map((t) => [t.name, t]));
  for (const tag of normalized) {
    byName.set(tag.name, { ...byName.get(tag.name), ...tag });
  }
  map.set(target, [...byName.values()]);
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

  appendToStateArray<typeof target, MessageHeaderData>(
    map as Map<typeof target, MessageHeaderData[]>,
    target,
    { description, name, type: headerType, value },
  );
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

export const linkPublishMessage = (
  program: Program,
  target: Operation,
  config?: Model,
): void => {
  if (!config) {
    return;
  }
  const map = getMessageConfigsMap(program);
  const existing = map.get(config);
  if (!existing) {
    return;
  }
  existing.messageId = config.name;
  map.set(config, existing);
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

// REUSABLE COMPONENT STATE WRITERS
export function storeMulti(
  program: Program,
  symbol: symbol,
  target: Type,
  data: unknown,
): void {
  const map = getStateMap<unknown[]>(program, symbol);
  appendToStateArray(map, target, data);
}

// REFERENCE STATE WRITERS
type MultiStore = (program: Program, target: Type, name: string) => void;

function multiRefStore(symbol: symbol): MultiStore {
  return (program, target, name) => {
    storeMulti(program, symbol, target, name);
  };
}

export const storeOperationTraitRef: MultiStore = multiRefStore(stateSymbols.operationTraitRefs);
export const storeMessageTraitRef: MultiStore = multiRefStore(stateSymbols.messageTraitRefs);

export const storeCorrelationIdRef = (
  program: Program,
  target: Type,
  correlationIdName: string,
): void => {
  const map = getStateMap<string>(program, stateSymbols.correlationIdRefs);
  map.set(target, correlationIdName);
};

export const storeBindingRef: MultiStore = multiRefStore(stateSymbols.bindingRefs);
export const storeChannelBindingRef: MultiStore = multiRefStore(stateSymbols.channelBindingRefs);
export const storeChannelServerRef: MultiStore = multiRefStore(stateSymbols.channelServerRefs);

export const storeOperationSecurityRef = (
  program: Program,
  target: Type,
  ref: { name: string; scopes?: string[] },
): void =>
  // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
  storeMulti(program, stateSymbols.operationSecurityRefs, target, ref);
