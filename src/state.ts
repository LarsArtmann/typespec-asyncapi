/**
 * @fileoverview TypeSpec AsyncAPI State Management - Decorator data persistence
 */

import { stateSymbols } from "./lib.js";
import { type Program, type Type } from "@typespec/compiler";
import { getStateMap, getMultiState } from "./state-compatibility.js";
import type { AsyncAPIProtocol } from "./constants/protocols.js";
import type { ProtocolBindings, SecurityScheme, Tag } from "./domain/models/asyncapi-document.js";

// === STATE DATA INTERFACES ===

/**
 * Channel Path State Data
 */
export type ChannelPathData = {
  path: string;
  hasParameters: boolean;
  parameters?: string[];
};

/**
 * Message Configuration State Data
 */
export type MessageConfigData = {
  messageId?: string;
  description?: string;
  title?: string;
  contentType?: string;
};

/**
 * Server Configuration State Data
 */
export type ServerConfigData = {
  url: string;
  protocol: AsyncAPIProtocol;
  description?: string;
  name: string;
};

/**
 * Operation Type Classification State Data
 */
export type OperationTypeData = {
  type: "publish" | "subscribe";
  messageType?: string;
};

/**
 * Protocol Configuration State Data — discriminated union on `protocol`.
 *
 * Protocol-specific fields can only exist on the variant that owns them,
 * making impossible states (e.g. `qos` on a Kafka config) unrepresentable.
 * The `protocol` discriminant is always a canonical `AsyncAPIProtocol`
 * (never an alias) because `storeProtocolConfig` normalizes before storing.
 */
type ProtocolConfigBase = {
  binding?: Record<string, unknown>;
  version?: string;
};

export type KafkaConfigData = ProtocolConfigBase & {
  protocol: "kafka";
  partitions?: number;
  replicationFactor?: number;
  consumerGroup?: string;
  sasl?: { mechanism: string; username: string; password: string };
};

export type WebSocketConfigData = ProtocolConfigBase & {
  protocol: "ws" | "wss";
  subprotocol?: string;
  queryParams?: Record<string, string>;
  headers?: Record<string, string>;
};

export type MqttConfigData = ProtocolConfigBase & {
  protocol: "mqtt" | "mqtt5";
  qos?: 0 | 1 | 2;
  retain?: boolean;
  lastWill?: {
    topic: string;
    message: string;
    qos: 0 | 1 | 2;
    retain: boolean;
  };
};

export type GenericProtocolConfigData = ProtocolConfigBase & {
  protocol: Exclude<AsyncAPIProtocol, "kafka" | "ws" | "wss" | "mqtt" | "mqtt5">;
};

export type ProtocolConfigData =
  | KafkaConfigData
  | WebSocketConfigData
  | MqttConfigData
  | GenericProtocolConfigData;

/** Tag Configuration State Data — identical to Tag[] from the domain model. */
export type TagData = Tag[];

/**
 * Security Configuration State Data
 */
export type SecurityConfigData = {
  name: string;
  scheme: SecurityScheme;
};

/**
 * Correlation ID Configuration State Data
 */
export type CorrelationIdData = {
  location: string;
};

/**
 * Message Header State Data
 */
export type MessageHeaderData = {
  name: string;
  value?: unknown;
  description?: string;
  type?: string;
};

// === STATE CONSOLIDATION UTILITIES ===

/**
 * AsyncAPI Consolidated State Data
 */
export type AsyncAPIConsolidatedState = {
  channels: Map<Type, ChannelPathData>;
  messages: Map<Type, MessageConfigData>;
  servers: Map<Type, ServerConfigData[]>;
  operations: Map<Type, OperationTypeData>;
  tags: Map<Type, TagData>;
  protocolConfigs: Map<Type, ProtocolConfigData>;
  protocolBindings: Map<Type, ProtocolBindings>;
  securityConfigs: Map<Type, SecurityConfigData[]>;
  correlationIds: Map<Type, CorrelationIdData>;
  messageHeaders: Map<Type, MessageHeaderData[]>;
};

/**
 * Consolidates all AsyncAPI state data from TypeSpec program
 *
 * Handles TypeSpec's StateMapView which wraps the actual Map.
 * The StateMapView stores data in an internal 'map' property.
 */
export function consolidateAsyncAPIState(program: Program): AsyncAPIConsolidatedState {
  return {
    channels: getStateMap<ChannelPathData>(program, stateSymbols.channelPaths),
    messages: getStateMap<MessageConfigData>(program, stateSymbols.messageConfigs),
    servers: getMultiState<ServerConfigData>(program, stateSymbols.serverConfigs),
    operations: getStateMap<OperationTypeData>(program, stateSymbols.operationTypes),
    tags: getStateMap<TagData>(program, stateSymbols.tags),
    protocolConfigs: getStateMap<ProtocolConfigData>(program, stateSymbols.protocolConfigs),
    protocolBindings: getStateMap<ProtocolBindings>(program, stateSymbols.protocolBindings),
    securityConfigs: getMultiState<SecurityConfigData>(program, stateSymbols.securityConfigs),
    correlationIds: getStateMap<CorrelationIdData>(program, stateSymbols.correlationIds),
    messageHeaders: getStateMap<MessageHeaderData[]>(program, stateSymbols.messageHeaders),
  };
}
