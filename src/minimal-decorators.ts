/**
 * MINIMAL DECORATORS - Back to basics approach
 *
 * Simplest possible decorator implementations to test TypeSpec linkage
 */

import type {
  DecoratorContext,
  Namespace,
  Operation,
  Model,
  ModelProperty,
  DiagnosticTarget,
} from "@typespec/compiler";
import { stateSymbols } from "./lib.js";
import type { MessageConfigData } from "./state.js";

// Decorator logging utilities removed - use Effect.log for production logging

// Diagnostic reporting utilities - eliminates duplicate diagnostic patterns
export const reportDecoratorDiagnostic = (
  context: DecoratorContext,
  code: string,
  target: unknown,
  message: string,
  severity: "error" | "warning" = "error",
) => {
  context.program.reportDiagnostic({
    code,
    target: target as DiagnosticTarget,
    message,
    severity,
  });
};

// Config validation utilities - eliminates duplicate validation patterns
export const validateConfig = (
  config: unknown,
  context: DecoratorContext,
  target: unknown,
  diagnosticCode: string,
  errorMessage: string,
): boolean => {
  if (!config) {
    reportDecoratorDiagnostic(context, diagnosticCode, target, errorMessage);
    return false;
  }
  return true;
};

// State management utilities - eliminates duplicate state operations
export const storeChannelState = (program: unknown, target: Operation, path: string) => {
  const programTyped = program as { stateMap: (symbol: symbol) => Map<unknown, unknown> };
  const channelPathsMap = programTyped.stateMap(stateSymbols.channelPaths);
  channelPathsMap.set(target, {
    path: path,
    hasParameters: path.includes("{"),
    parameters: path.match(/\{([^}]+)\}/g)?.map((param) => param.slice(1, -1)),
  });
};

export const storeOperationType = (
  program: unknown,
  target: Operation,
  type: "publish" | "subscribe",
  messageType?: string,
  description?: string,
) => {
  const programTyped = program as { stateMap: (symbol: symbol) => Map<unknown, unknown> };
  const operationTypesMap = programTyped.stateMap(stateSymbols.operationTypes);
  operationTypesMap.set(target, {
    type,
    messageType,
    description: description ?? `${type} operation for ${target.name ?? "unnamed"}`,
    tags: [],
  });
};

export const storeMessageConfig = (
  program: unknown,
  target: Model,
  config: Record<string, unknown>,
) => {
  const programTyped = program as { stateMap: (symbol: symbol) => Map<unknown, unknown> };
  const messageConfigsMap = programTyped.stateMap(stateSymbols.messageConfigs);
  messageConfigsMap.set(target, {
    title: (config.title as string) ?? target.name,
    description: (config.description as string) ?? `Message ${target.name}`,
    contentType: (config.contentType as string) ?? "application/json",
  });
};

/**
 * Simplest possible @channel decorator for testing
 */
export function $channel(context: DecoratorContext, target: Operation, path: string): void {
  if (!path || path.length === 0) {
    reportDecoratorDiagnostic(
      context,
      "missing-channel-path",
      target,
      `Operation '${target.name}' missing @channel decorator path`,
    );
    return;
  }

  // Store channel path in state for emitter to use
  storeChannelState(context.program, target, path);
}

// State management utilities - eliminates duplicate state operations
export const storeServerConfig = (
  program: unknown,
  target: Namespace,
  config: Record<string, unknown>,
) => {
  const programTyped = program as { stateMap: (symbol: symbol) => Map<unknown, unknown> };
  const serverConfigsMap = programTyped.stateMap(stateSymbols.serverConfigs);
  serverConfigsMap.set(target, {
    name: (config.name as string) ?? target.name,
    url: (config.url as string) ?? "http://localhost:3000",
    protocol: (config.protocol as string) ?? "http",
    description: (config.description as string) ?? `Server for ${target.name}`,
  });
};

/**
 * Simplest possible @server decorator for testing
 */
export function $server(context: DecoratorContext, target: Namespace, config: unknown): void {

  if (
    !validateConfig(
      config,
      context,
      target,
      "invalid-server-config",
      "Server configuration is missing",
    )
  ) {
    return;
  }

  // Store server configuration in state map
  const configTyped = config as Record<string, unknown>;
  storeServerConfig(context.program, target, configTyped);
}

/**
 * Simplest possible @publish decorator for testing
 */
export function $publish(context: DecoratorContext, target: Operation, config?: Model): void {

  // Store publish operation type in state
  storeOperationType(
    context.program,
    target,
    "publish",
    config?.name,
    `Publish operation for ${target.name ?? "unnamed"}`,
  );

  // If there's a message config, link it
  if (config) {
    const programTyped = context.program as { stateMap: (symbol: symbol) => Map<unknown, unknown> };
    const messageConfigsMap = programTyped.stateMap(stateSymbols.messageConfigs);
    const existingConfig = messageConfigsMap.get(config) as MessageConfigData | undefined;
    if (existingConfig) {
      existingConfig.messageId = config.name;
      messageConfigsMap.set(config, existingConfig);
    }
  }
}

/**
 * Simplest possible @message decorator for testing
 */
export function $message(context: DecoratorContext, target: Model, config: unknown): void {

  if (
    !validateConfig(
      config,
      context,
      target,
      "invalid-message-config",
      `Message model '${target.name}' missing configuration. Use @message with configuration object.`,
    )
  ) {
    return;
  }

  // Store message configuration in state
  const configTyped = config as Record<string, unknown>;
  storeMessageConfig(context.program, target, configTyped);
}

/**
 * Simplest possible @protocol decorator for testing
 */
export function $protocol(
  context: DecoratorContext,
  target: Operation | Model,
  config: unknown,
): void {

  if (
    !validateConfig(
      config,
      context,
      target,
      "invalid-protocol-config",
      `Protocol configuration missing for '${target.kind}'. Use @protocol with configuration object.`,
    )
  ) {
    return;
  }

  // Store protocol configuration in state map
  const programTyped = context.program as { stateMap: (symbol: symbol) => Map<unknown, unknown> };
  const protocolConfigsMap = programTyped.stateMap(stateSymbols.protocolConfigs);
  const configTyped = config as Record<string, unknown>;

  // Store protocol-specific configuration based on type
  const protocolType = (configTyped.protocol as string) ?? "kafka";
  const protocolConfig = {
    protocol: protocolType,
    ...configTyped,
    // Add protocol-specific defaults
    ...(protocolType === "kafka" && {
      partitions: configTyped.partitions ?? 1,
      replicationFactor: configTyped.replicationFactor ?? 1,
      consumerGroup: configTyped.consumerGroup ?? "default",
      sasl: configTyped.sasl ?? {
        mechanism: "plain",
        username: "",
        password: "",
      },
    }),
    ...(protocolType === "ws" && {
      subprotocol: configTyped.subprotocol ?? "asyncapi",
      queryParams: configTyped.queryParams ?? {},
      headers: configTyped.headers ?? {},
    }),
    ...(protocolType === "mqtt" && {
      qos: configTyped.qos ?? 1,
      retain: configTyped.retain ?? false,
      lastWill: configTyped.lastWill ?? {
        topic: "",
        message: "",
        qos: 1,
        retain: false,
      },
    }),
  };

  protocolConfigsMap.set(target, protocolConfig);
}

/**
 * Simplest possible @security decorator for testing
 */
export function $security(
  context: DecoratorContext,
  target: Operation | Namespace,
  config: unknown,
): void {

  if (
    !validateConfig(
      config,
      context,
      target,
      "invalid-security-config",
      `Security configuration missing for '${target.kind}'. Use @security with configuration object.`,
    )
  ) {
    return;
  }
}

/**
 * Simplest possible @subscribe decorator for testing
 */
export function $subscribe(context: DecoratorContext, target: Operation): void {

  // Store subscribe operation type in state
  storeOperationType(
    context.program,
    target,
    "subscribe",
    undefined,
    `Subscribe operation for ${target.name ?? "unnamed"}`,
  );
}

/**
 * Simplest possible @tags decorator for testing
 */
export function $tags(context: DecoratorContext, target: DiagnosticTarget, value: unknown): void {

  if (!value || !Array.isArray(value)) {
    reportDecoratorDiagnostic(
      context,
      "invalid-tags-config",
      target,
      "Tags configuration missing or invalid. Use @tags with string array.",
    );
    return;
  }
}

/**
 * Simplest possible @correlationId decorator for testing
 */
export function $correlationId(
  context: DecoratorContext,
  target: Model,
  location: unknown,
  _property?: unknown,
): void {

  if (!location) {
    reportDecoratorDiagnostic(
      context,
      "invalid-correlationId-config",
      target,
      `Correlation ID location missing for model '${target.name}'. Use @correlationId with location path.`,
    );
    return;
  }
}

/**
 * Simplest possible @bindings decorator for testing
 */
export function $bindings(
  context: DecoratorContext,
  target: Operation | Model,
  value: unknown,
): void {

  if (!value) {
    reportDecoratorDiagnostic(
      context,
      "invalid-bindings-config",
      target,
      `Protocol bindings missing for '${target.kind}'. Use @bindings with configuration object.`,
    );
    return;
  }
}

/**
 * Simplest possible @header decorator for testing
 */
export function $header(
  context: DecoratorContext,
  target: Model | ModelProperty,
  name: unknown,
  _value: unknown,
): void {

  if (!name) {
    reportDecoratorDiagnostic(
      context,
      "invalid-header-config",
      target,
      `Header name missing for '${target.kind}'. Use @header with name and value.`,
    );
    return;
  }
}
