/**
 * @fileoverview TypeSpec AsyncAPI State Management - Decorator data persistence
 */

import { stateSymbols } from "./lib.js";
import { type Program, type Type } from "@typespec/compiler";
import { getStateMap, getMultiState } from "./state-compatibility.js";
import type { SecurityScheme } from "./domain/models/asyncapi-document.js";

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
  protocol: string;
  description?: string;
  name: string;
};

/**
 * Operation Type Classification State Data
 */
export type OperationTypeData = {
  type: "publish" | "subscribe";
  messageType?: string;
  description?: string;
  tags?: string[];
};

/**
 * Protocol Configuration State Data
 */
export type ProtocolConfigData = {
  protocol: string;
  binding?: Record<string, unknown>;
  // Kafka specific
  partitions?: number;
  replicationFactor?: number;
  consumerGroup?: string;
  sasl?: {
    mechanism: string;
    username: string;
    password: string;
  };
  // WebSocket specific
  subprotocol?: string;
  queryParams?: Record<string, string>;
  headers?: Record<string, string>;
  // MQTT specific
  qos?: 0 | 1 | 2;
  retain?: boolean;
  lastWill?: {
    topic: string;
    message: string;
    qos: 0 | 1 | 2;
    retain: boolean;
  };
  // Generic protocol properties
  version?: string;
};

/**
 * Tag Configuration State Data
 */
export type TagData = {
  name: string;
}[];

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
  property?: string;
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
  protocolBindings: Map<Type, Record<string, unknown>>;
  securityConfigs: Map<Type, SecurityConfigData>;
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
    protocolBindings: getStateMap<Record<string, unknown>>(program, stateSymbols.protocolBindings),
    securityConfigs: getStateMap<SecurityConfigData>(program, stateSymbols.securityConfigs),
    correlationIds: getStateMap<CorrelationIdData>(program, stateSymbols.correlationIds),
    messageHeaders: getStateMap<MessageHeaderData[]>(program, stateSymbols.messageHeaders),
  };
}
