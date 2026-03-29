/**
 * @fileoverview TypeSpec AsyncAPI State Management - Decorator data persistence
 */

import { stateSymbols } from "./lib.js";
import { type Program, type Type } from "@typespec/compiler";
import { getStateMap } from "./state-compatibility.js";

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
  [key: string]: unknown;
};

/**
 * Tag Configuration State Data
 */
export type TagData = {
  name: string;
  description?: string;
};

/**
 * Security Configuration State Data
 */
export type SecurityConfigData = {
  name: string;
  scheme: Record<string, unknown>;
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
  servers: Map<Type, ServerConfigData>;
  operations: Map<Type, OperationTypeData>;
  tags: Map<Type, TagData>;
  protocolConfigs: Map<Type, ProtocolConfigData>;
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
  // Helper to unwrap StateMapView to actual Map
  const unwrapStateMap = <T>(stateMap: unknown): Map<Type, T> => {
    // Check if it has an internal map property (StateMapView pattern)
    const stateMapObj = stateMap as Record<string, unknown>;
    if (stateMapObj?.map && typeof stateMapObj.map === "object") {
      const innerMap = stateMapObj.map as Map<Type, T>;
      if (innerMap instanceof Map) {
        return innerMap;
      }
    }

    // Check if it's a Map directly
    const asMap = stateMap as Map<Type, T>;
    if (asMap instanceof Map) {
      return asMap;
    }

    // Check if it has Map-like methods
    const stateMapAsAny = stateMap as { get?: Function; set?: Function };
    if (typeof stateMapAsAny?.get === "function" && typeof stateMapAsAny?.set === "function") {
      return stateMap as Map<Type, T>;
    }

    // Return empty map as fallback
    return new Map<Type, T>();
  };

  const channelPathsState = getStateMap<ChannelPathData>(program, stateSymbols.channelPaths);
  const messageConfigsState = getStateMap<MessageConfigData>(program, stateSymbols.messageConfigs);
  const serverConfigsState = getStateMap<ServerConfigData>(program, stateSymbols.serverConfigs);
  const operationTypesState = getStateMap<OperationTypeData>(program, stateSymbols.operationTypes);
  const tagsState = getStateMap<TagData>(program, stateSymbols.tags);
  const protocolConfigsState = getStateMap<ProtocolConfigData>(program, stateSymbols.protocolConfigs);
  const securityConfigsState = getStateMap<SecurityConfigData>(program, stateSymbols.securityConfigs);
  const correlationIdsState = getStateMap<CorrelationIdData>(program, stateSymbols.correlationIds);
  const messageHeadersState = getStateMap<MessageHeaderData[]>(program, stateSymbols.messageHeaders);

  return {
    channels: unwrapStateMap<ChannelPathData>(channelPathsState),
    messages: unwrapStateMap<MessageConfigData>(messageConfigsState),
    servers: unwrapStateMap<ServerConfigData>(serverConfigsState),
    operations: unwrapStateMap<OperationTypeData>(operationTypesState),
    tags: unwrapStateMap<TagData>(tagsState),
    protocolConfigs: unwrapStateMap<ProtocolConfigData>(protocolConfigsState),
    securityConfigs: unwrapStateMap<SecurityConfigData>(securityConfigsState),
    correlationIds: unwrapStateMap<CorrelationIdData>(correlationIdsState),
    messageHeaders: unwrapStateMap<MessageHeaderData[]>(messageHeadersState),
  };
}
