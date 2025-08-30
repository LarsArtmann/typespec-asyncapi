import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";
import { $channel } from "./decorators/channel.js";
import { $publish } from "./decorators/publish.js"; 
import { $subscribe } from "./decorators/subscribe.js";
import { $server } from "./decorators/server.js";

export const $lib = createTypeSpecLibrary({
  name: "@typespec/asyncapi",
  diagnostics: {
    "invalid-asyncapi-version": {
      severity: "error", 
      messages: {
        default: paramMessage`AsyncAPI version '${"version"}' is not supported. Only AsyncAPI 3.0.0 is supported.`,
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
        default: paramMessage`Channel path '${"path"}' is not valid. Channel paths must be valid AsyncAPI channel identifiers.`,
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
    "invalid-server-config": {
      severity: "error",
      messages: {
        default: paramMessage`Server configuration '${"config"}' is not valid. Server configurations must include url and protocol.`,
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
        default: paramMessage`Circular reference detected in message schema for '${"messageName"}'.`,
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
  },
  decorators: {
    "TypeSpec.AsyncAPI": {
      channel: $channel,
      publish: $publish,
      subscribe: $subscribe, 
      server: $server,
    },
  },
  state: {
    channelPaths: { description: "Map of operation to channel path" },
    messageSchemas: { description: "Map of message names to their schemas" },
    messageConfigs: { description: "Map of models to message configurations" },
    serverConfigs: { description: "Server configurations" },
    protocolBindings: { description: "Protocol-specific bindings" },
    protocolConfigs: { description: "Map of targets to protocol configurations" },
    securitySchemes: { description: "Security scheme configurations" },
    securityConfigs: { description: "Map of targets to security configurations" },
    operationTypes: { description: "Map of operations to publish/subscribe type" },
  },
} as const);

export const { reportDiagnostic, createDiagnostic, stateKeys } = $lib;