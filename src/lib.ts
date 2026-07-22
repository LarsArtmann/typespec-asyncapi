import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "@lars-artmann/typespec-asyncapi",
  diagnostics: {
    "missing-channel-path": {
      severity: "error",
      messages: {
        default: paramMessage`Operation '${"operationName"}' missing @channel decorator path.`,
      },
    },
    "unsupported-protocol": {
      severity: "error",
      messages: {
        default: paramMessage`Protocol '${"protocol"}' is not supported. Supported protocols: ${"validProtocols"}.`,
      },
    },
    "server-target-invalid": {
      severity: "error",
      messages: {
        default: "@server can only be applied to namespaces.",
      },
    },
    "invalid-server-config": {
      severity: "error",
      messages: {
        default: paramMessage`Server '${"serverName"}' configuration is missing. Must include url and protocol.`,
      },
    },
    "server-url-required": {
      severity: "error",
      messages: {
        default: "Server URL is required.",
      },
    },
    "invalid-server-url": {
      severity: "error",
      messages: {
        default: paramMessage`Server URL '${"url"}' is not valid. URL must not be empty or contain spaces/control characters.`,
      },
    },
    "server-protocol-required": {
      severity: "error",
      messages: {
        default: "Server protocol is required.",
      },
    },
    "invalid-message-config": {
      severity: "error",
      messages: {
        default: paramMessage`Message model '${"modelName"}' missing configuration. Use @message with configuration object.`,
      },
    },
    "invalid-protocol-config": {
      severity: "error",
      messages: {
        default: paramMessage`Protocol configuration missing for '${"targetKind"}'. Use @protocol with configuration object.`,
      },
    },
    "invalid-security-config": {
      severity: "error",
      messages: {
        default: paramMessage`Security configuration missing for '${"targetKind"}'. Use @security with configuration object.`,
      },
    },
    "invalid-security-scheme-type": {
      severity: "error",
      messages: {
        default: paramMessage`Unsupported security scheme type '${"schemeType"}'. Valid types: ${"validTypes"}.`,
      },
    },
    "invalid-tags-config": {
      severity: "error",
      messages: {
        default: "Tags configuration missing or invalid. Use @tags with string array.",
        "non-string": "All tags must be strings.",
      },
    },
    "invalid-correlationId-config": {
      severity: "error",
      messages: {
        default: paramMessage`Correlation ID location missing for model '${"modelName"}'. Use @correlationId with location path.`,
      },
    },
    "invalid-bindings-config": {
      severity: "error",
      messages: {
        default: paramMessage`Protocol bindings missing for '${"targetKind"}'. Use @bindings with configuration object.`,
      },
    },
    "invalid-header-config": {
      severity: "error",
      messages: {
        default: paramMessage`Header name missing for '${"targetKind"}'. Use @header with name and value.`,
      },
    },
    "unknown-binding-protocol": {
      severity: "warning",
      messages: {
        default: paramMessage`Binding key '${"protocol"}' is not a recognized AsyncAPI protocol. Valid protocols: ${"validProtocols"}.`,
      },
    },
    "invalid-binding-version": {
      severity: "warning",
      messages: {
        default: paramMessage`Binding version '${"version"}' is not valid for protocol '${"protocol"}'. Valid versions: ${"validVersions"}.`,
      },
    },
    "misplaced-binding": {
      severity: "warning",
      messages: {
        default: paramMessage`Binding protocol '${"protocol"}' is not defined for ${"targetKind"} bindings in the AsyncAPI specification. Valid placements: ${"validPlacements"}.`,
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
