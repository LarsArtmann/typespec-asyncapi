import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  diagnostics: {
    "invalid-binding-version": {
      messages: {
        default: paramMessage`Binding version '${"version"}' is not valid for protocol '${"protocol"}'. Valid versions: ${"validVersions"}.`,
      },
      severity: "warning",
    },
    "invalid-bindings-config": {
      messages: {
        default: paramMessage`Protocol bindings missing for '${"targetKind"}'. Use @bindings with configuration object.`,
      },
      severity: "error",
    },
    "invalid-correlationId-config": {
      messages: {
        default: paramMessage`Correlation ID location missing for model '${"modelName"}'. Use @correlationId with location path.`,
      },
      severity: "error",
    },
    "invalid-header-config": {
      messages: {
        default: paramMessage`Header name missing for '${"targetKind"}'. Use @header with name and value.`,
      },
      severity: "error",
    },
    "invalid-message-config": {
      messages: {
        default: paramMessage`Message model '${"modelName"}' missing configuration. Use @message with configuration object.`,
      },
      severity: "error",
    },
    "invalid-protocol-config": {
      messages: {
        default: paramMessage`Protocol configuration missing for '${"targetKind"}'. Use @protocol with configuration object.`,
      },
      severity: "error",
    },
    "invalid-security-config": {
      messages: {
        default: paramMessage`Security configuration missing for '${"targetKind"}'. Use @security with configuration object.`,
      },
      severity: "error",
    },
    "invalid-security-scheme-type": {
      messages: {
        default: paramMessage`Unsupported security scheme type '${"schemeType"}'. Valid types: ${"validTypes"}.`,
      },
      severity: "error",
    },
    "invalid-server-config": {
      messages: {
        default: paramMessage`Server '${"serverName"}' configuration is missing. Must include url and protocol.`,
      },
      severity: "error",
    },
    "invalid-server-url": {
      messages: {
        default: paramMessage`Server URL '${"url"}' is not valid. URL must not be empty or contain spaces/control characters.`,
      },
      severity: "error",
    },
    "invalid-tags-config": {
      messages: {
        default:
          "Tags configuration missing or invalid. Use @tags with string array.",
        "non-string": "All tags must be strings.",
      },
      severity: "error",
    },
    "misplaced-binding": {
      messages: {
        default: paramMessage`Binding protocol '${"protocol"}' is not defined for ${"targetKind"} bindings in the AsyncAPI specification. Valid placements: ${"validPlacements"}.`,
      },
      severity: "warning",
    },
    "missing-channel-path": {
      messages: {
        default: paramMessage`Operation '${"operationName"}' missing @channel decorator path.`,
      },
      severity: "error",
    },
    "schema-generation-failed": {
      messages: {
        default: paramMessage`Schema generation failed: ${"error"}.`,
      },
      severity: "warning",
    },
    "server-protocol-required": {
      messages: {
        default: "Server protocol is required.",
      },
      severity: "error",
    },
    "server-target-invalid": {
      messages: {
        default: "@server can only be applied to namespaces.",
      },
      severity: "error",
    },
    "server-url-required": {
      messages: {
        default: "Server URL is required.",
      },
      severity: "error",
    },
    "unknown-binding-protocol": {
      messages: {
        default: paramMessage`Binding key '${"protocol"}' is not a recognized AsyncAPI protocol. Valid protocols: ${"validProtocols"}.`,
      },
      severity: "warning",
    },
    "unsupported-protocol": {
      messages: {
        default: paramMessage`Protocol '${"protocol"}' is not supported. Supported protocols: ${"validProtocols"}.`,
      },
      severity: "error",
    },
  },
  name: "@lars-artmann/typespec-asyncapi",
  state: {
    channelPaths: { description: "Operation to channel path" },
    correlationIds: { description: "Models to correlation ID configs" },
    messageConfigs: { description: "Models to message configs" },
    messageHeaders: { description: "Model properties marked as headers" },
    messageSchemas: { description: "Message names to schemas" },
    operationTypes: { description: "Operations to pub/sub type" },
    protocolBindings: { description: "Protocol-specific bindings" },
    protocolConfigs: { description: "Protocol configurations" },
    securityConfigs: { description: "Security configurations" },
    securitySchemes: { description: "Security scheme configurations" },
    serverConfigs: { description: "Server configurations" },
    tags: { description: "Targets to tag arrays" },
  },
} as const);

export const stateSymbols = {
  channelPaths: Symbol("channelPaths"),
  correlationIds: Symbol("correlationIds"),
  messageConfigs: Symbol("messageConfigs"),
  messageHeaders: Symbol("messageHeaders"),
  messageSchemas: Symbol("messageSchemas"),
  operationTypes: Symbol("operationTypes"),
  protocolBindings: Symbol("protocolBindings"),
  protocolConfigs: Symbol("protocolConfigs"),
  securityConfigs: Symbol("securityConfigs"),
  securitySchemes: Symbol("securitySchemes"),
  serverConfigs: Symbol("serverConfigs"),
  tags: Symbol("tags"),
} as const;
