/**
 * AsyncAPI Standard Protocol Bindings Implementation
 *
 * CRITICAL MIGRATION: Replaced custom types with official AsyncAPI v3 standard types
 *
 * This module provides protocol-specific binding generation using official
 * AsyncAPI parser types instead of custom implementations.
 */

import type { Binding } from "@asyncapi/parser/esm/spec-types/v3.js";
import type { KafkaChannelBinding } from "./kafka-channel-binding.js";
import type { KafkaOperationBinding } from "./kafka-operation-binding.js";
import type { KafkaMessageBinding } from "./kafka-message-binding.js";
import type { WebSocketChannelBinding } from "./web-socket-channel-binding.js";
import type { HttpOperationBinding } from "./http-operation-binding.js";
import type { HttpMessageBinding } from "./http-message-binding.js";

/**
 * Configuration types for binding creation (backwards compatibility)
 */
export type KafkaChannelBindingConfig = Omit<
  KafkaChannelBinding,
  "bindingVersion"
>;
export type KafkaOperationBindingConfig = Omit<
  KafkaOperationBinding,
  "bindingVersion"
>;
export type KafkaMessageBindingConfig = Omit<
  KafkaMessageBinding,
  "bindingVersion"
>;

export type WebSocketMessageBinding = {
  // WebSocket message bindings are minimal in AsyncAPI spec
} & Binding;

export type WebSocketChannelBindingConfig = Omit<
  WebSocketChannelBinding,
  "bindingVersion"
>;
export type WebSocketMessageBindingConfig = Omit<
  WebSocketMessageBinding,
  "bindingVersion"
>;

export type HttpOperationBindingConfig = Omit<
  HttpOperationBinding,
  "bindingVersion"
>;
export type HttpMessageBindingConfig = Omit<
  HttpMessageBinding,
  "bindingVersion"
>;
