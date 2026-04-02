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
  Program,
} from "@typespec/compiler";
import { stateSymbols } from "./lib.js";
import { getStateMap } from "./state-compatibility.js";
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
export const storeChannelState = (program: Program, target: Operation, path: string) => {
  const channelPathsMap = getStateMap(program, stateSymbols.channelPaths);
  channelPathsMap.set(target, {
    path: path,
    hasParameters: path.includes("{"),
    parameters: path.match(/\{([^}]+)\}/g)?.map((param) => param.slice(1, -1)),
  });
};

export const storeOperationType = (
  program: Program,
  target: Operation,
  type: "publish" | "subscribe",
  messageType?: string,
  description?: string,
) => {
  const operationTypesMap = getStateMap(program, stateSymbols.operationTypes);
  operationTypesMap.set(target, {
    type,
    messageType,
    description: description ?? `${type} operation for ${target.name ?? "unnamed"}`,
    tags: [],
  });
};

export const storeMessageConfig = (
  program: Program,
  target: Model,
  config: { title: string; description: string; contentType: string },
) => {
  const messageConfigsMap = getStateMap(program, stateSymbols.messageConfigs);
  messageConfigsMap.set(target, {
    title: config.title ?? target.name,
    description: config.description ?? `Message ${target.name}`,
    contentType: config.contentType ?? "application/json",
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
  program: Program,
  target: Namespace,
  config: Record<string, unknown> & { name: string },
) => {
  const serverConfigsMap = getStateMap(program, stateSymbols.serverConfigs);
  serverConfigsMap.set(target, {
    name: config.name,
    url: (config.url as string) ?? "http://localhost:3000",
    protocol: (config.protocol as string) ?? "http",
    description: (config.description as string) ?? `Server for ${target.name}`,
  });
};

/**
 * Store security configuration in state for emitter to use
 */
export const storeSecurityConfig = (
  program: Program,
  target: Operation | Namespace,
  config: { name: string; scheme: Record<string, unknown> },
) => {
  const securityConfigsMap = getStateMap(program, stateSymbols.securityConfigs);
  securityConfigsMap.set(target, {
    name: config.name,
    scheme: config.scheme,
  });
};

/**
 * Simplest possible @server decorator for testing
 */
export function $server(
  context: DecoratorContext,
  target: Namespace | Operation,
  name: string,
  config: unknown,
): void {
  // Validate target is a Namespace (not an Operation or other type)
  if (target.kind !== "Namespace") {
    reportDecoratorDiagnostic(
      context,
      "@lars-artmann/typespec-asyncapi/server-target-invalid",
      target,
      "@server can only be applied to namespaces",
    );
    return;
  }

  if (
    !validateConfig(
      config,
      context,
      target,
      "@lars-artmann/typespec-asyncapi/invalid-server-config",
      "Server configuration is missing",
    )
  ) {
    return;
  }

  const configTyped = config as Record<string, unknown>;

  // Validate required fields
  if (!configTyped.url) {
    reportDecoratorDiagnostic(
      context,
      "@lars-artmann/typespec-asyncapi/server-url-required",
      target,
      "Server URL is required",
    );
    return;
  }

  if (!configTyped.protocol) {
    reportDecoratorDiagnostic(
      context,
      "@lars-artmann/typespec-asyncapi/server-protocol-required",
      target,
      "Server protocol is required",
    );
    return;
  }

  // Validate protocol is supported
  const supportedProtocols = [
    "kafka",
    "amqp",
    "amqp1",
    "mqtt",
    "mqtt5",
    "http",
    "https",
    "ws",
    "wss",
    "websocket",
    "nats",
    "jms",
    "sns",
    "sqs",
    "stomp",
    "redis",
    "mercure",
    "ibmmq",
  ];
  const protocol = (configTyped.protocol as string).toLowerCase();
  if (!supportedProtocols.includes(protocol)) {
    const protocolValue = String(configTyped.protocol);
    reportDecoratorDiagnostic(
      context,
      "@lars-artmann/typespec-asyncapi/unsupported-protocol",
      target,
      `Protocol '${protocolValue}' is not supported. Supported protocols: ${supportedProtocols.join(", ")}`,
    );
    return;
  }

  // Store server configuration in state map with the provided name
  storeServerConfig(context.program, target, { ...configTyped, name });
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
    const messageConfigsMap = getStateMap(context.program, stateSymbols.messageConfigs);
    const existingConfig = messageConfigsMap.get(config) as MessageConfigData | undefined;
    if (existingConfig) {
      existingConfig.messageId = config.name;
      messageConfigsMap.set(config, existingConfig);
    }
  }
}

/**
 * Helper to extract string value from Model property
 */
function getModelPropertyStringValue(model: Model, propertyName: string): string | undefined {
  const property = model.properties.get(propertyName);
  if (!property) return undefined;
  const type = property.type as { kind: string; value?: string };
  if (type.kind === "String" && type.value !== undefined) {
    return type.value;
  }
  return undefined;
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

  // Extract config values from Model
  const configModel = config as Model;
  const title = getModelPropertyStringValue(configModel, "title") ?? target.name;
  const description =
    getModelPropertyStringValue(configModel, "description") ?? `Message ${target.name}`;
  const contentType = getModelPropertyStringValue(configModel, "contentType") ?? "application/json";

  // Store message configuration in state
  storeMessageConfig(context.program, target, { title, description, contentType });
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
  const protocolConfigsMap = getStateMap(context.program, stateSymbols.protocolConfigs);
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
 * Helper to extract value from Model property (handles any type)
 */
function getModelPropertyValue(model: Model, propertyName: string): unknown {
  const property = model.properties.get(propertyName);
  if (!property) return undefined;
  const type = property.type as { kind: string; value?: unknown };
  if (type.kind === "String" && type.value !== undefined) {
    return type.value;
  }
  // Return the type itself for complex properties (like objects)
  return type;
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

  // Store security configuration in state for emitter to use
  // Handle both plain objects and Model types
  let name: string | undefined;
  let scheme: Record<string, unknown> | undefined;

  if (config && typeof config === "object" && "kind" in config && config.kind === "Model") {
    // Extract from Model properties
    const configModel = config as Model;
    name = getModelPropertyStringValue(configModel, "name");
    const schemeValue = getModelPropertyValue(configModel, "scheme");
    if (schemeValue && typeof schemeValue === "object" && "properties" in schemeValue) {
      // Scheme is a nested Model - extract its properties
      const schemeModel = schemeValue as Model;
      scheme = {};
      for (const [propName, prop] of schemeModel.properties) {
        const propType = prop.type as { kind: string; value?: unknown; name?: string };
        if (propType.kind === "String" && propType.value !== undefined) {
          scheme[propName] = propType.value;
        } else if (propType.kind === "Scalar" && propType.name !== undefined) {
          scheme[propName] = propType.name;
        }
      }
    } else if (schemeValue && typeof schemeValue === "object") {
      scheme = schemeValue as Record<string, unknown>;
    }
  } else {
    // Plain object config
    const configTyped = config as Record<string, unknown>;
    name = configTyped.name as string;
    scheme = configTyped.scheme as Record<string, unknown>;
  }

  // Skip validation if values aren't present (let TypeSpec handle type checking)
  // This allows both inline objects and Model references to work
  if (name && scheme && Object.keys(scheme).length > 0) {
    storeSecurityConfig(context.program, target, { name, scheme });
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
 * Store tags in state for emitter to use
 */
export const storeTags = (program: Program, target: Operation | Model, tags: string[]) => {
  const tagsMap = getStateMap(program, stateSymbols.tags);
  // Store as comma-separated string to match TagData interface
  const existingTags = (tagsMap.get(target) as { name: string } | undefined)?.name ?? "";
  const allTags = existingTags ? existingTags.split(",") : [];
  const newTags = [...allTags, ...tags].filter((tag, index, arr) => arr.indexOf(tag) === index);
  tagsMap.set(target, { name: newTags.join(",") });
};

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

  // Validate all values are strings
  const stringTags = value.filter((tag): tag is string => typeof tag === "string");
  if (stringTags.length !== value.length) {
    reportDecoratorDiagnostic(context, "invalid-tags-config", target, "All tags must be strings.");
    return;
  }

  // Store tags in state for emitter to use
  storeTags(context.program, target as Operation, stringTags);
}

/**
 * Store correlation ID in state for emitter to use
 */
export const storeCorrelationId = (
  program: Program,
  target: Model,
  location: string,
  property?: string,
) => {
  const correlationIdsMap = getStateMap(program, stateSymbols.correlationIds);
  correlationIdsMap.set(target, {
    location,
    property,
  });
};

/**
 * Simplest possible @correlationId decorator for testing
 */
export function $correlationId(
  context: DecoratorContext,
  target: Model,
  location: unknown,
  property?: unknown,
): void {
  if (!location || typeof location !== "string") {
    reportDecoratorDiagnostic(
      context,
      "invalid-correlationId-config",
      target,
      `Correlation ID location missing for model '${target.name}'. Use @correlationId with location path.`,
    );
    return;
  }

  // Store correlation ID in state
  storeCorrelationId(context.program, target, location, property as string | undefined);
}

/**
 * Store bindings in state for emitter to use
 */
export const storeBindings = (
  program: Program,
  target: Operation | Model,
  bindings: Record<string, unknown>,
) => {
  const bindingsMap = getStateMap(program, stateSymbols.protocolBindings);
  const existingBindings = (bindingsMap.get(target) as Record<string, unknown> | undefined) ?? {};
  bindingsMap.set(target, { ...existingBindings, ...bindings });
};

/**
 * Simplest possible @bindings decorator for testing
 */
export function $bindings(
  context: DecoratorContext,
  target: Operation | Model,
  value: unknown,
): void {
  if (!value || typeof value !== "object") {
    reportDecoratorDiagnostic(
      context,
      "invalid-bindings-config",
      target,
      `Protocol bindings missing for '${target.kind}'. Use @bindings with configuration object.`,
    );
    return;
  }

  // Store bindings in state
  storeBindings(context.program, target, value as Record<string, unknown>);
}

/**
 * Store header in state for emitter to use
 */
export const storeHeader = (
  program: Program,
  target: Model | ModelProperty,
  name: string,
  value?: unknown,
) => {
  const headersMap = getStateMap(program, stateSymbols.messageHeaders);

  // Store headers on the property itself since parent model reference
  // may not be available at decorator execution time
  // The emitter will need to collect headers from properties when building messages
  let headerType = "string";
  let description: string | undefined;

  if (target.kind === "ModelProperty") {
    const prop = target;

    // Try to get type info from the property
    const propType = prop.type as { kind?: string; name?: string } | undefined;
    if (propType?.kind === "Scalar") {
      headerType = propType.name?.toLowerCase() ?? "string";
    }
    // Get doc from decorators or value
    description = typeof value === "string" ? value : undefined;
  }

  const existingHeaders =
    (headersMap.get(target) as
      | Array<{ name: string; value?: unknown; type?: string; description?: string }>
      | undefined) ?? [];
  headersMap.set(target, [...existingHeaders, { name, value, type: headerType, description }]);
};

/**
 * Simplest possible @header decorator for testing
 */
export function $header(
  context: DecoratorContext,
  target: Model | ModelProperty,
  name: unknown,
  value?: unknown,
): void {
  if (!name || typeof name !== "string") {
    reportDecoratorDiagnostic(
      context,
      "invalid-header-config",
      target,
      `Header name missing for '${target.kind}'. Use @header with name and value.`,
    );
    return;
  }

  // Store header in state
  storeHeader(context.program, target, name, value);
}
