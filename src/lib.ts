import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "@lars-artmann/typespec-asyncapi",
  diagnostics: {
    "invalid-asyncapi-version": {
      severity: "error",
      messages: {
        default: paramMessage`AsyncAPI version '${"version"}' is not supported. Only 3.0.0 is supported.`,
      },
    },
    "missing-channel-path": {
      severity: "error",
      messages: {
        default: paramMessage`Operation '${"operationName"}' missing @channel decorator.`,
      },
    },
    "unsupported-protocol": {
      severity: "error",
      messages: {
        default: paramMessage`Protocol '${"protocol"}' is not supported.`,
      },
    },
    "invalid-server-config": {
      severity: "error",
      messages: {
        default: paramMessage`Server configuration '${"serverName"}' is not valid. ${"error"} Must include url and protocol.`,
      },
    },
    "duplicate-server-name": {
      severity: "error",
      messages: {
        default: paramMessage`Server name '${"serverName"}' is already defined.`,
      },
    },
    "invalid-message-target": {
      severity: "error",
      messages: {
        default: paramMessage`@message can only be applied to models, not '${"targetType"}'.`,
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
        default: paramMessage`Protocol type '${"protocol"}' is not supported. Supported: ${"validProtocols"}.`,
      },
    },
    "missing-security-config": {
      severity: "error",
      messages: {
        default: "Security configuration must specify a name and scheme.",
      },
    },
  },
  state: {
    channelPaths: { description: "Operation to channel path" },
    messageSchemas: { description: "Message names to schemas" },
    messageConfigs: { description: "Models to message configs" },
    messageHeaders: { description: "Model properties marked as headers" },
    serverConfigs: { description: "Server configurations" },
    protocolBindings: { description: "Protocol-specific bindings" },
    protocolConfigs: { description: "Protocol configurations" },
    securitySchemes: { description: "Security scheme configurations" },
    securityConfigs: { description: "Security configurations" },
    operationTypes: { description: "Operations to pub/sub type" },
    tags: { description: "Targets to tag arrays" },
    correlationIds: { description: "Models to correlation ID configs" },
  },
} as const);

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
} as const;
