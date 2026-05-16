/**
 * @fileoverview TypeSpec AsyncAPI Library Definition - Core library infrastructure
 *
 * This module provides the foundational library definition for the TypeSpec AsyncAPI emitter,
 * including decorator definitions, diagnostic messages, state management, and utility functions.
 *
 * Architecture Components:
 * - Library Definition: Metadata, diagnostics, and state schema for TypeSpec integration
 * - State Management: Centralized state keys for decorator data persistence during compilation
 * - Diagnostic Reporting: Standardized error/warning reporting for TypeSpec validation
 * - Type Safety: Strongly-typed constants and helper functions for reliable emitter operation
 *
 * This follows TypeSpec library conventions and integrates with the TypeSpec compiler's
 * plugin system for seamless decorator processing and code generation.
 *
 * @module @typespec/asyncapi/lib
 * @author TypeSpec AsyncAPI Team
 * @version 0.1.0-alpha
 * @since 2025-01-01
 *
 * @see {@link https://typespec.io/docs/extending-typespec/emitters} TypeSpec Emitter Documentation
 * @see {@link https://www.asyncapi.com/docs/reference/specification/v3.0.0} AsyncAPI 3.0.0 Specification
 */

// TypeSpec Core Imports - Library infrastructure and diagnostic system
import {
  createTypeSpecLibrary,
  paramMessage,
} from "@typespec/compiler";

/**
 * TypeSpec AsyncAPI Library Definition - Core library configuration and metadata
 *
 * This constant defines the complete library configuration required by TypeSpec for proper
 * integration with the compiler. It includes diagnostic definitions, state management schema,
 * and library metadata that enables decorator processing and error reporting.
 *
 * Structure:
 * - name: Library identifier used by TypeSpec compiler for namespacing
 * - diagnostics: Error and warning message definitions with parameterized templates
 * - state: Schema definition for persistent data storage during compilation
 *
 * The TypeSpec compiler uses this definition to:
 * - Register diagnostic codes with appropriate severity levels
 * - Initialize state storage for decorator data persistence
 * - Provide IntelliSense and validation in TypeSpec files
 * - Generate comprehensive error messages during compilation
 *
 * @constant {TypeSpecLibrary} $lib - Complete library definition for TypeSpec integration
 * @readonly
 * @public
 *
 * @example Library usage in TypeSpec files:
 * ```typescript
 * import "@typespec/asyncapi";
 *
 * @channel("/users/{userId}/events")
 * @publish
 * op publishUserEvent(): UserEvent;
 * ```
 *
 * @see {@link createTypeSpecLibrary} TypeSpec library creation function
 */
export const $lib = createTypeSpecLibrary({
  name: "@lars-artmann/typespec-asyncapi",
  diagnostics: {
    "invalid-asyncapi-version": {
      severity: "error",
      messages: {
        default: paramMessage`AsyncAPI version '${"version"}' is not supported. Only AsyncAPI 3.0.0 is supported. Update your emitter options to use "3.0.0".`,
      },
    },
    "missing-channel-path": {
      severity: "error",
      messages: {
        default: paramMessage`Operation '${"operationName"}' missing @channel decorator. Add @channel("/your-channel-path") to specify the channel path.`,
      },
    },
    "invalid-channel-path": {
      severity: "error",
      messages: {
        default: paramMessage`Channel path '${"path"}' is not valid. Use format: /topic-name, /service/event-type, or {variable} syntax.`,
      },
    },
    "missing-message-schema": {
      severity: "error",
      messages: {
        default: paramMessage`Message '${"messageName"}' must have a defined schema. Use @message decorator with a TypeSpec model.`,
      },
    },
    "conflicting-operation-type": {
      severity: "error",
      messages: {
        default: paramMessage`Operation '${"operationName"}' cannot be both @publish and @subscribe. Choose one operation type.`,
      },
    },
    "unsupported-protocol": {
      severity: "error",
      messages: {
        default: paramMessage`Protocol '${"protocol"}' is not supported. Supported protocols: kafka, amqp, websocket, http.`,
      },
    },
    "missing-server-config": {
      severity: "warning",
      messages: {
        default: "No server configuration found. Add @server decorator to define AsyncAPI servers.",
      },
    },
    "test-simple": {
      severity: "error",
      messages: {
        default: "This is a simple test diagnostic without parameters.",
      },
    },
    "invalid-server-config": {
      severity: "error",
      messages: {
        default: paramMessage`Server configuration '${"serverName"}' is not valid. ${"error"} Server configurations must include url and protocol.`,
      },
    },
    "duplicate-server-name": {
      severity: "error",
      messages: {
        default: paramMessage`Server name '${"serverName"}' is already defined. Server names must be unique within a namespace.`,
      },
    },
    "invalid-security-scheme": {
      severity: "error",
      messages: {
        default: paramMessage`Security scheme '${"scheme"}' is not valid for AsyncAPI 3.0.`,
      },
    },
    "duplicate-channel-id": {
      severity: "error",
      messages: {
        default: paramMessage`Channel ID '${"channelId"}' is already defined. Channel IDs must be unique within an AsyncAPI specification.`,
      },
    },
    "circular-message-reference": {
      severity: "error",
      messages: {
        default: paramMessage`Circular reference detected in message schema for '${"messageName"}'. Break the circular dependency or use $ref to handle recursion.`,
      },
    },
    "invalid-message-target": {
      severity: "error",
      messages: {
        default: paramMessage`@message decorator can only be applied to models, not '${"targetType"}'.`,
      },
    },
    "invalid-protocol-target": {
      severity: "error",
      messages: {
        default: paramMessage`@protocol decorator can only be applied to operations or models, not '${"targetType"}'.`,
      },
    },
    "missing-protocol-type": {
      severity: "error",
      messages: {
        default: "Protocol configuration must specify a protocol type.",
      },
    },
    "invalid-protocol-type": {
      severity: "error",
      messages: {
        default: paramMessage`Protocol type '${"protocol"}' is not supported. Supported types: ${"validProtocols"}.`,
      },
    },
    "invalid-security-target": {
      severity: "error",
      messages: {
        default: paramMessage`@security decorator can only be applied to operations or models, not '${"targetType"}'.`,
      },
    },
    "missing-security-config": {
      severity: "error",
      messages: {
        default: "Security configuration must specify a name and scheme.",
      },
    },
    "security-scheme-validation-failed": {
      severity: "error",
      messages: {
        default: paramMessage`Security scheme validation failed: ${"errors"}.`,
      },
    },
    "invalid-asyncapi-target": {
      severity: "error",
      messages: {
        default: paramMessage`@asyncapi decorator can only be applied to namespaces, not '${"targetType"}'.`,
      },
    },
  },
  /**
   * State Management Schema - Decorator data persistence during TypeSpec compilation
   *
   * This section defines the state storage schema used by decorators to persist data
   * throughout the TypeSpec compilation process. Each state key represents a different
   * category of data that decorators collect and the emitter later processes.
   *
   * State Categories:
   * - Channel Configuration: Path mappings and channel-specific settings
   * - Message Definitions: Schema references and message metadata
   * - Server Configuration: Connection details and server bindings
   * - Protocol Settings: Transport-specific configuration (MQTT, WebSocket, etc.)
   * - Security Configuration: Authentication and authorization schemes
   * - Operation Metadata: Publish/subscribe classifications and routing information
   *
   * The TypeSpec compiler automatically manages state lifecycle:
   * 1. Decorators store data using context.program.stateMap()
   * 2. State persists throughout compilation phases
   * 3. Emitter retrieves consolidated state for document generation
   * 4. State is cleaned up automatically after compilation completion
   *
   * @see {@link stateSymbols} Symbol-based state keys used by decorators
   */
  state: {
    channelPaths: { description: "Map of operation to channel path" },
    messageSchemas: { description: "Map of message names to their schemas" },
    messageConfigs: { description: "Map of models to message configurations" },
    messageHeaders: {
      description: "Map of model properties marked as headers",
    },
    serverConfigs: { description: "Server configurations" },
    protocolBindings: { description: "Protocol-specific bindings" },
    protocolConfigs: {
      description: "Map of targets to protocol configurations",
    },
    securitySchemes: { description: "Security scheme configurations" },
    securityConfigs: {
      description: "Map of targets to security configurations",
    },
    operationTypes: {
      description: "Map of operations to publish/subscribe type",
    },
    tags: { description: "Map of targets to tag arrays for categorization" },
    correlationIds: {
      description: "Map of models to correlation ID configurations",
    },
    cloudBindings: {
      description: "Map of targets to cloud provider specific bindings",
    },
  },
  // NOTE: Decorators are auto-discovered through module exports, not registered in createTypeSpecLibrary
} as const);

/**
 * State Symbols - Unique symbols for TypeSpec state management
 *
 * These symbols provide collision-proof keys for storing decorator data
 * during TypeSpec compilation. Each symbol is scoped to this library.
 */
export const stateSymbols = {
  channelPaths: Symbol("channelPaths"),
  messageSchemas: Symbol("messageSchemas"),
  messageConfigs: Symbol("messageConfigs"),
  messageHeaders: Symbol("messageHeaders"),
  serverConfigs: Symbol("serverConfigs"),
  protocolBindings: Symbol("protocolBindings"),
  protocolConfigs: Symbol("protocolConfigs"),
  securitySchemes: Symbol("securitySchemes"),
  securityConfigs: Symbol("securityConfigs"),
  operationTypes: Symbol("operationTypes"),
  tags: Symbol("tags"),
  correlationIds: Symbol("correlationIds"),
  cloudBindings: Symbol("cloudBindings"),
} as const;

/**
 * NOTE: Decorators do NOT need to be exported from lib.ts
 *
 * TypeSpec auto-discovers decorators through the namespace export in decorators.ts.
 * The critical fix was adding: export const namespace = "TypeSpec.AsyncAPI"
 *
 * Lib.ts is only for library definition, diagnostics, and state management.
 */
