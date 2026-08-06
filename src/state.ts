/**
 * @fileoverview TypeSpec AsyncAPI State Management - Decorator data persistence
 */

import type { Program, Type } from "@typespec/compiler";
import type {
  CorrelationIdObject,
  JsonSchema,
  ParameterObject,
  ProtocolBindings,
  SecurityRequirement,
  SecurityScheme,
  Tag,
} from "./domain/models/asyncapi-document.js";
import { getMultiState, getStateMap } from "./state-compatibility.js";
import type { AsyncAPIProtocol } from "./constants/protocols.js";
import { stateSymbols } from "./lib.js";

// === DOMAIN TYPE RE-EXPORTS ===
// Re-export domain types so consumers can import all state-related types from one place.
export type {
  ProtocolBindings,
  SecurityScheme,
  Tag,
} from "./domain/models/asyncapi-document.js";

// === STATE DATA INTERFACES ===

/**
 * Channel Path State Data
 */
export interface ChannelPathData {
  path: string;
  hasParameters: boolean;
  parameters?: string[];
}

/**
 * Message Configuration State Data
 */
export interface MessageConfigData {
  messageId?: string;
  description?: string;
  title?: string;
  contentType?: string;
}

/**
 * Server Configuration State Data
 */
export interface ServerConfigData {
  url: string;
  protocol: AsyncAPIProtocol;
  description?: string;
  name: string;
}

/**
 * Operation Type Classification State Data
 */
export interface OperationTypeData {
  type: "publish" | "subscribe";
  messageType?: string;
}

/**
 * Protocol Configuration State Data — discriminated union on `protocol`.
 *
 * Protocol-specific fields can only exist on the variant that owns them,
 * making impossible states (e.g. `qos` on a Kafka config) unrepresentable.
 * The `protocol` discriminant is always a canonical `AsyncAPIProtocol`
 * (never an alias) because `storeProtocolConfig` normalizes before storing.
 */
interface ProtocolConfigBase {
  binding?: Record<string, unknown>;
  version?: string;
}

export type WebSocketConfigData = ProtocolConfigBase & {
  protocol: "ws" | "wss";
  subprotocol?: string;
  queryParams?: Record<string, string>;
  headers?: Record<string, string>;
};

/**
 * MQTT last-will-and-testament configuration.
 */
export interface MqttLastWillConfig {
  topic: string;
  message: string;
  qos: 0 | 1 | 2;
  retain: boolean;
}

/**
 * Kafka SASL authentication configuration.
 */
export interface KafkaSaslConfig {
  mechanism: string;
  username: string;
  password: string;
}

/**
 * Kafka Configuration State Data
 */
export type KafkaConfigData = ProtocolConfigBase & {
  protocol: "kafka";
  partitions?: number;
  replicationFactor?: number;
  consumerGroup?: string;
  sasl?: KafkaSaslConfig;
};

/**
 * MQTT Configuration State Data
 */
export type MqttConfigData = ProtocolConfigBase & {
  protocol: "mqtt" | "mqtt5";
  qos?: 0 | 1 | 2;
  retain?: boolean;
  lastWill?: MqttLastWillConfig;
};

export type GenericProtocolConfigData = ProtocolConfigBase & {
  protocol: Exclude<
    AsyncAPIProtocol,
    "kafka" | "ws" | "wss" | "mqtt" | "mqtt5"
  >;
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
export interface SecurityConfigData {
  name: string;
  scheme: SecurityScheme;
}

/**
 * Correlation ID Configuration State Data
 */
export interface CorrelationIdData {
  location: string;
}

/**
 * Message Header State Data
 */
export interface MessageHeaderData {
  name: string;
  value?: unknown;
  description?: string;
  type?: string;
}

/**
 * Default Content Type State Data
 */
export interface DefaultContentTypeData {
  contentType: string;
}

/**
 * Operation Reply State Data
 */
export interface OperationReplyData {
  messageName: string;
  address?: string;
}

// === REUSABLE COMPONENT STATE DATA ===

/** Operation trait definition stored from @operationTrait. */
export interface OperationTraitData {
  name: string;
  description?: string;
  summary?: string;
  title?: string;
  security?: SecurityRequirement[];
  tags?: Tag[];
  bindings?: ProtocolBindings;
}

/** Message trait definition stored from @messageTrait. */
export interface MessageTraitData {
  name: string;
  contentType?: string;
  description?: string;
  title?: string;
  summary?: string;
  tags?: Tag[];
  bindings?: ProtocolBindings;
  headers?: JsonSchema;
  correlationId?: CorrelationIdObject;
}

/** Reusable parameter definition stored from @parameter. */
export interface ParameterConfigData extends ParameterObject {
  name: string;
}

/** Reusable correlation ID definition stored from @reusableCorrelationId. */
export interface ReusableCorrelationIdData {
  name: string;
  location: string;
  description?: string;
}

/** Reusable binding definition stored from @reusableBinding. */
export interface ReusableBindingData {
  name: string;
  bindings: ProtocolBindings;
}

// === STATE CONSOLIDATION UTILITIES ===

/**
 * AsyncAPI Consolidated State Data
 */
export interface AsyncAPIConsolidatedState {
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
  defaultContentType: Map<Type, DefaultContentTypeData>;
  operationReplies: Map<Type, OperationReplyData>;
  operationIds: Map<Type, string>;
  apiVersion: Map<Type, string>;
  operationTraits: Map<Type, OperationTraitData[]>;
  messageTraits: Map<Type, MessageTraitData[]>;
  reusableParameters: Map<Type, ParameterConfigData[]>;
  reusableCorrelationIds: Map<Type, ReusableCorrelationIdData[]>;
  reusableBindings: Map<Type, ReusableBindingData[]>;
  operationTraitRefs: Map<Type, string[]>;
  messageTraitRefs: Map<Type, string[]>;
  correlationIdRefs: Map<Type, string>;
  bindingRefs: Map<Type, string[]>;
  channelBindingRefs: Map<Type, string[]>;
}

/**
 * Consolidates all AsyncAPI state data from TypeSpec program
 *
 * Handles TypeSpec's StateMapView which wraps the actual Map.
 * The StateMapView stores data in an internal 'map' property.
 */
export function consolidateAsyncAPIState(
  program: Program,
): AsyncAPIConsolidatedState {
  return {
    channels: getStateMap<ChannelPathData>(program, stateSymbols.channelPaths),
    correlationIds: getStateMap<CorrelationIdData>(
      program,
      stateSymbols.correlationIds,
    ),
    defaultContentType: getStateMap<DefaultContentTypeData>(
      program,
      stateSymbols.defaultContentType,
    ),
    operationReplies: getStateMap<OperationReplyData>(
      program,
      stateSymbols.operationReplies,
    ),
    messageHeaders: getStateMap<MessageHeaderData[]>(
      program,
      stateSymbols.messageHeaders,
    ),
    messages: getStateMap<MessageConfigData>(
      program,
      stateSymbols.messageConfigs,
    ),
    operations: getStateMap<OperationTypeData>(
      program,
      stateSymbols.operationTypes,
    ),
    protocolBindings: getStateMap<ProtocolBindings>(
      program,
      stateSymbols.protocolBindings,
    ),
    protocolConfigs: getStateMap<ProtocolConfigData>(
      program,
      stateSymbols.protocolConfigs,
    ),
    securityConfigs: getMultiState<SecurityConfigData>(
      program,
      stateSymbols.securityConfigs,
    ),
    servers: getMultiState<ServerConfigData>(
      program,
      stateSymbols.serverConfigs,
    ),
    tags: getStateMap<TagData>(program, stateSymbols.tags),
    operationIds: getStateMap<string>(program, stateSymbols.operationIds),
    apiVersion: getStateMap<string>(program, stateSymbols.apiVersion),
    operationTraits: getMultiState<OperationTraitData>(
      program,
      stateSymbols.operationTraits,
    ),
    messageTraits: getMultiState<MessageTraitData>(
      program,
      stateSymbols.messageTraits,
    ),
    reusableParameters: getMultiState<ParameterConfigData>(
      program,
      stateSymbols.reusableParameters,
    ),
    reusableCorrelationIds: getMultiState<ReusableCorrelationIdData>(
      program,
      stateSymbols.reusableCorrelationIds,
    ),
    reusableBindings: getMultiState<ReusableBindingData>(
      program,
      stateSymbols.reusableBindings,
    ),
    operationTraitRefs: getMultiState<string>(
      program,
      stateSymbols.operationTraitRefs,
    ),
    messageTraitRefs: getMultiState<string>(
      program,
      stateSymbols.messageTraitRefs,
    ),
    correlationIdRefs: getStateMap<string>(
      program,
      stateSymbols.correlationIdRefs,
    ),
    bindingRefs: getMultiState<string>(program, stateSymbols.bindingRefs),
    channelBindingRefs: getMultiState<string>(
      program,
      stateSymbols.channelBindingRefs,
    ),
  };
}
