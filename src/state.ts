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
};

/**
 * Consolidates all AsyncAPI state data from TypeSpec program
 */
export function consolidateAsyncAPIState(program: Program): AsyncAPIConsolidatedState {
  const channelPaths = getStateMap<ChannelPathData>(program, stateSymbols.channelPaths);
  const messageConfigs = getStateMap<MessageConfigData>(program, stateSymbols.messageConfigs);
  const serverConfigs = getStateMap<ServerConfigData>(program, stateSymbols.serverConfigs);
  const operationTypes = getStateMap<OperationTypeData>(program, stateSymbols.operationTypes);
  const tags = getStateMap<TagData>(program, stateSymbols.tags);
  const protocolConfigs = getStateMap<ProtocolConfigData>(program, stateSymbols.protocolConfigs);

  return {
    channels: channelPaths,
    messages: messageConfigs,
    servers: serverConfigs,
    operations: operationTypes,
    tags: tags,
    protocolConfigs: protocolConfigs,
  };
}
