/**
 * @fileoverview TypeSpec AsyncAPI State Management - Decorator data persistence
 */

import { stateSymbols } from "./lib.js";
import { type Program, type Type } from "@typespec/compiler";

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
};

/**
 * Consolidates all AsyncAPI state data from TypeSpec program
 */
export function consolidateAsyncAPIState(program: Program): AsyncAPIConsolidatedState {
  const channelPaths = program.stateMap(stateSymbols.channelPaths) as Map<Type, ChannelPathData>;
  const messageConfigs = program.stateMap(stateSymbols.messageConfigs) as Map<Type, MessageConfigData>;
  const serverConfigs = program.stateMap(stateSymbols.serverConfigs) as Map<Type, ServerConfigData>;
  const operationTypes = program.stateMap(stateSymbols.operationTypes) as Map<Type, OperationTypeData>;
  const tags = program.stateMap(stateSymbols.tags) as Map<Type, TagData>;

  return {
    channels: channelPaths,
    messages: messageConfigs,
    servers: serverConfigs,
    operations: operationTypes,
    tags: tags,
  };
}
