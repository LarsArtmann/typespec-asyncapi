import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "@typespec/asyncapi",
  diagnostics: {
    "invalid-asyncapi-version": {
      severity: "error", 
      messages: {
        default: paramMessage`AsyncAPI version '${{"version"}}' is not supported. Only AsyncAPI 3.0.0 is supported.`,
      },
    },
    "missing-channel-path": {
      severity: "error",
      messages: {
        default: "Channel operation must specify a channel path using @channel decorator",
      },
    },
    "invalid-channel-path": {
      severity: "error",
      messages: {
        default: paramMessage`Channel path '${{"path"}}' is not valid. Channel paths must be valid AsyncAPI channel identifiers.`,
      },
    },
    "missing-message-schema": {
      severity: "error", 
      messages: {
        default: paramMessage`Message '${{"messageName"}}' must have a defined schema. Use @message decorator with a TypeSpec model.`,
      },
    },
    "conflicting-operation-type": {
      severity: "error",
      messages: {
        default: paramMessage`Operation '${{"operationName"}}' cannot be both @publish and @subscribe. Choose one operation type.`,
      },
    },
    "unsupported-protocol": {
      severity: "error",
      messages: {
        default: paramMessage`Protocol '${{"protocol"}}' is not supported. Supported protocols: kafka, amqp, websocket, http.`,
      },
    },
    "missing-server-config": {
      severity: "warning",
      messages: {
        default: "No server configuration found. Add @server decorator to define AsyncAPI servers.",
      },
    },
    "invalid-security-scheme": {
      severity: "error",
      messages: {
        default: paramMessage`Security scheme '${{"scheme"}}' is not valid for AsyncAPI 3.0.`,
      },
    },
    "duplicate-channel-id": {
      severity: "error", 
      messages: {
        default: paramMessage`Channel ID '${{"channelId"}}' is already defined. Channel IDs must be unique within an AsyncAPI specification.`,
      },
    },
    "circular-message-reference": {
      severity: "error",
      messages: {
        default: paramMessage`Circular reference detected in message schema for '${{"messageName"}}'.`,
      },
    },
  },
  state: {
    channelPaths: { description: "Map of operation to channel path" },
    messageSchemas: { description: "Map of message names to their schemas" },
    serverConfigs: { description: "Server configurations" },
    protocolBindings: { description: "Protocol-specific bindings" },
    securitySchemes: { description: "Security scheme configurations" },
    operationTypes: { description: "Map of operations to publish/subscribe type" },
  },
} as const);

export const { reportDiagnostic, createDiagnostic, stateKeys } = $lib;