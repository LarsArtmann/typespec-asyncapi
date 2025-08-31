import { createTypeSpecLibrary, paramMessage, type Diagnostic } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "@typespec/asyncapi",
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

// Export state keys for use in decorators and emitters
export const stateKeys = {
  channelPaths: "channelPaths",
  messageSchemas: "messageSchemas",
  messageConfigs: "messageConfigs",
  serverConfigs: "serverConfigs",
  protocolBindings: "protocolBindings",
  protocolConfigs: "protocolConfigs",
  securitySchemes: "securitySchemes",
  securityConfigs: "securityConfigs",
  operationTypes: "operationTypes",
} as const;

//TODO: if this is a TypeSpec expected function please explain this clearly!
// Export diagnostic reporter helper  
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function reportDiagnostic(context: any, target: unknown, code: string, args?: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  context.program.reportDiagnostic({
    code: `@typespec/asyncapi.${code}`,
    target,
    ...args
  } as Diagnostic);
}
