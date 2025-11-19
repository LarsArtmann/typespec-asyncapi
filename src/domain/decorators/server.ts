import type {
  DecoratorContext,
  Model,
  Namespace,
  Operation,
} from "@typespec/compiler";
import { $lib, reportDiagnostic } from "../../lib.js";
import { Effect } from "effect";
import { Protocol } from "../types/ServerTypes.js";
import type { ServerConfig } from "../types/ServerTypes.js";
import { extractServerConfig } from "../types/ServerTypes.js";
import { $tags as $tagsImpl } from "./tags.js";
import { $correlationId as $correlationIdImpl } from "./correlation-id.js";
import { $bindings as $bindingsImpl } from "./cloud-bindings.js";

/**
 * AsyncAPI root document decorator - defines top-level AsyncAPI specification metadata
 */
export function $asyncapi(
  context: DecoratorContext,
  target: Namespace,
  config: Record<string, unknown>,
): void {
  Effect.log(`🔍 PROCESSING @asyncapi decorator on namespace: ${target.name}`);
  Effect.log(`📋 Config:`, config);

  // Validate target is Namespace
  if (target.kind !== "Namespace") {
    reportDiagnostic(context, target, "invalid-asyncapi-target", {
      targetType: target.kind,
    });
    return;
  }

  // Store asyncapi configuration in program state
  // Note: Using serverConfigs temporarily until asyncApiConfigs is added to lib.ts stateKeys
  const asyncApiMap = context.program.stateMap($lib.stateKeys.serverConfigs);
  asyncApiMap.set(target, config);

  Effect.log(
    `✅ Successfully stored AsyncAPI config for namespace ${target.name}`,
  );
}

/**
 * Tags decorator - apply categorization tags to operations, models, or namespaces
 */
export function $tags(
  context: DecoratorContext,
  target: Operation | Model | Namespace,
  tags: string[],
): void {
  return $tagsImpl(context, target, tags);
}

/**
 * Correlation ID decorator - define message correlation tracking
 */
export function $correlationId(
  context: DecoratorContext,
  target: Model,
  config: Record<string, unknown>,
): void {
  return $correlationIdImpl(context, target, config);
}

/**
 * Bindings decorator - define protocol-specific bindings
 */
export function $bindings(
  context: DecoratorContext,
  target: Operation | Model,
  bindingType: string,
  config: Record<string, unknown>,
): void {
  return $bindingsImpl(context, target, bindingType, config);
}

//TODO: CRITICAL - Add AsyncAPI 3.0.0 Server Object compliance validation
//TODO: CRITICAL - Missing required AsyncAPI Server fields (host, pathname, protocol version)
//TODO: CRITICAL - Add server variable support for URL templating
//TODO: CRITICAL - Implement server security scheme validation
//TODO: CRITICAL - Add server binding support (protocol-specific configurations)
//TODO: CRITICAL - Validate server tags and external documentation fields

//TODO: CRITICAL - Missing AsyncAPI Server Object fields: host, pathname, protocolVersion, security, bindings, tags
// ServerConfig type imported from ../types/ServerTypes.js to ensure type consistency

/**
 * AsyncAPI root document decorator - defines top-level AsyncAPI specification metadata
 * Type-safe implementation using proper Domain-Driven Design
 *
 * @param target Namespace to configure with AsyncAPI metadata
 * @param config Server configuration object from TypeSpec
 */
export function $server(
  context: DecoratorContext,
  target: Namespace,
  config: unknown,
): void {
  Effect.log(`🔍 PROCESSING @server decorator on namespace: ${target.name}`);
  Effect.log(`📋 Config raw value:`, config);
  Effect.log(`📋 Config type:`, typeof config);

  //TODO: CRITICAL - Redundant validation - TypeScript ensures target is Namespace
  if (target.kind !== "Namespace") {
    const targetKind = target.kind as string;
    Effect.log(`❌ Target kind validation failed: ${targetKind}`);
    reportDiagnostic(context, target, "invalid-server-config", {
      serverName: "unknown",
    });
    return;
  }

  // Extract and validate server configuration with proper type safety
  const validationResult = extractServerConfig(config);
  Effect.log(`📋 Validation result:`, validationResult);

  if (!validationResult.success || !validationResult.config) {
    Effect.log(`❌ Server config validation failed: ${validationResult.error}`);
    reportDiagnostic(context, target, "invalid-server-config", {
      serverName: validationResult.config?.name ?? "unknown",
      error: validationResult.error ?? "Unknown error",
    });
    return;
  }

  const serverConfig = validationResult.config;
  Effect.log(`✅ Extracted server config:`, serverConfig);

  // Validate protocol against known AsyncAPI 3.0.0 protocols
  const currentProtocol = serverConfig.protocol;
  const supportedProtocols = Object.values(Protocol);
  Effect.log(`📋 Current protocol: ${currentProtocol}`);
  Effect.log(`📋 Supported protocols:`, supportedProtocols);

  //TODO: CRITICAL - Extend with missing AsyncAPI 3.0.0 protocols (mqtt, mqtt5, nats, redis, etc.)
  if (!supportedProtocols.includes(currentProtocol)) {
    Effect.log(`❌ Protocol not supported: ${currentProtocol}`);
    reportDiagnostic(context, target, "unsupported-protocol", {
      protocol: currentProtocol,
    });
    return;
  }

  Effect.log(`✅ Server configuration validated and stored for ${target.name}`);
  //TODO: CRITICAL - Ensure serverConfigsMap state exists and handle properly
  // Store server configuration in program state with proper type safety
  const serverConfigsMap = context.program.stateMap(
    $lib.stateKeys.serverConfigs,
  );
  const existingConfigs =
    (serverConfigsMap.get(target) as Map<string, ServerConfig> | undefined) ??
    new Map<string, ServerConfig>();
  existingConfigs.set(serverConfig.name, serverConfig);
  serverConfigsMap.set(target, existingConfigs);
}

//TODO: CRITICAL - Complex extraction logic should use Effect.TS schema validation
