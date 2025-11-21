/**
 * MINIMAL DECORATORS - Back to basics approach
 *
 * Simplest possible decorator implementations to test TypeSpec linkage
 */

import { Effect } from "effect";
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

/**
 * Simplest possible @channel decorator for testing
 */
export function $channel(
  context: DecoratorContext,
  target: Operation,
  path: string,
): void {
  Effect.runSync(Effect.log(`🔍 MINIMAL @channel decorator executed! path: ${path}`));
  Effect.runSync(Effect.log("🔍 Target:").pipe(Effect.annotateLogs({ target: target.name })));
  Effect.runSync(Effect.log("🔍 Context:").pipe(Effect.annotateLogs({ context: "DecoratorContext" })));

  if (!path || path.length === 0) {
    Effect.runSync(Effect.log("❌ Empty channel path - should trigger diagnostic"));
    // This will show if diagnostic reporting works
    context.program.reportDiagnostic({
      code: "missing-channel-path",
      target: target,
      message: `Operation '${target.name}' missing @channel decorator path`,
      severity: "error",
    });
    return;
  }

  // Store channel path in state for emitter to use
  const channelPathsMap = context.program.stateMap(stateSymbols.channelPaths);
  channelPathsMap.set(target, {
    path: path,
    hasParameters: path.includes('{'),
    parameters: path.match(/\{([^}]+)\}/g)?.map(param => param.slice(1, -1)),
  });

  Effect.runSync(Effect.log("✅ @channel decorator completed successfully - stored in state"));
}

/**
 * Simplest possible @server decorator for testing
 */
export function $server(
  context: DecoratorContext,
  target: Namespace,
  config: unknown,
): void {
  Effect.runSync(Effect.log("🔍 MINIMAL @server decorator executed!"));
  Effect.runSync(Effect.log("🔍 Target:").pipe(Effect.annotateLogs({ target: target.name })));
  Effect.runSync(Effect.log("🔍 Config:").pipe(Effect.annotateLogs({ hasConfig: !!config })));

  if (!config) {
    Effect.runSync(Effect.log("❌ No server config"));
    context.program.reportDiagnostic({
      code: "invalid-server-config",
      target: target,
      message: `Server configuration is missing`,
      severity: "error",
    });
    return;
  }

  Effect.runSync(Effect.log("✅ @server decorator completed successfully"));
}

/**
 * Simplest possible @publish decorator for testing
 */
export function $publish(
  context: DecoratorContext,
  target: Operation,
  config?: Model,
): void {
  Effect.runSync(Effect.log("🔍 MINIMAL @publish decorator executed!").pipe(Effect.annotateLogs({ config: config?.name })));
  Effect.runSync(Effect.log("🔍 Target:").pipe(Effect.annotateLogs({ target: target.name })));

  // Store publish operation type in state
  const operationTypesMap = context.program.stateMap(stateSymbols.operationTypes);
  operationTypesMap.set(target, {
    type: "publish",
    messageType: config?.name,
    description: `Publish operation for ${target.name ?? "unnamed"}`,
    tags: [],
  });

  // If there's a message config, link it
  if (config) {
    const messageConfigsMap = context.program.stateMap(stateSymbols.messageConfigs);
    const existingConfig = messageConfigsMap.get(config) as MessageConfigData | undefined;
    if (existingConfig) {
      existingConfig.messageId = config.name;
      messageConfigsMap.set(config, existingConfig);
    }
  }

  Effect.runSync(Effect.log("✅ @publish decorator completed successfully - stored in state"));
}

/**
 * Simplest possible @message decorator for testing
 */
export function $message(
  context: DecoratorContext,
  target: Model,
  config: unknown,
): void {
  Effect.runSync(Effect.log("🔍 MINIMAL @message decorator executed!").pipe(Effect.annotateLogs({ hasConfig: !!config })));
  Effect.runSync(Effect.log("🔍 Target:").pipe(Effect.annotateLogs({ target: target.name })));

  if (!config) {
    Effect.runSync(Effect.log("❌ No message config - should trigger diagnostic"));
    context.program.reportDiagnostic({
      code: "invalid-message-config",
      target: target,
      message: `Message model '${target.name}' missing configuration. Use @message with configuration object.`,
      severity: "error",
    });
    return;
  }

  // Store message configuration in state
  const messageConfigsMap = context.program.stateMap(stateSymbols.messageConfigs);
  const configTyped = config as Record<string, unknown> | undefined;
  messageConfigsMap.set(target, {
    title: (configTyped?.title as string) ?? target.name,
    description: (configTyped?.description as string) ?? `Message ${target.name}`,
    contentType: (configTyped?.contentType as string) ?? "application/json",
  });

  Effect.runSync(Effect.log("✅ @message decorator completed successfully - stored in state"));
}

/**
 * Simplest possible @protocol decorator for testing
 */
export function $protocol(
  context: DecoratorContext,
  target: Operation | Model,
  config: unknown,
): void {
  Effect.runSync(Effect.log("🔍 MINIMAL @protocol decorator executed!").pipe(Effect.annotateLogs({ hasConfig: !!config })));
  Effect.runSync(Effect.log("🔍 Target:").pipe(Effect.annotateLogs({ target: target.name })));

  if (!config) {
    Effect.runSync(Effect.log("❌ No protocol config - should trigger diagnostic"));
    context.program.reportDiagnostic({
      code: "invalid-protocol-config",
      target: target,
      message: `Protocol configuration missing for '${target.kind}'. Use @protocol with configuration object.`,
      severity: "error",
    });
    return;
  }
  Effect.runSync(Effect.log("✅ @protocol decorator completed successfully"));
}

/**
 * Simplest possible @security decorator for testing
 */
export function $security(
  context: DecoratorContext,
  target: Operation | Namespace,
  config: unknown,
): void {
  Effect.runSync(Effect.log("🔍 MINIMAL @security decorator executed!").pipe(Effect.annotateLogs({ hasConfig: !!config })));
  Effect.runSync(Effect.log("🔍 Target:").pipe(Effect.annotateLogs({ target: target.name })));

  if (!config) {
    Effect.runSync(Effect.log("❌ No security config - should trigger diagnostic"));
    context.program.reportDiagnostic({
      code: "invalid-security-config",
      target: target,
      message: `Security configuration missing for '${target.kind}'. Use @security with configuration object.`,
      severity: "error",
    });
    return;
  }
  Effect.runSync(Effect.log("✅ @security decorator completed successfully"));
}

/**
 * Simplest possible @subscribe decorator for testing
 */
export function $subscribe(context: DecoratorContext, target: Operation): void {
  Effect.runSync(Effect.log("🔍 MINIMAL @subscribe decorator executed!"));
  Effect.runSync(Effect.log("🔍 Target:").pipe(Effect.annotateLogs({ target: target.name })));

  // Store subscribe operation type in state
  const operationTypesMap = context.program.stateMap(stateSymbols.operationTypes);
  operationTypesMap.set(target, {
    type: "subscribe",
    messageType: undefined,
    description: `Subscribe operation for ${target.name ?? "unnamed"}`,
    tags: [],
  });

  Effect.runSync(Effect.log("✅ @subscribe decorator completed successfully - stored in state"));
}

/**
 * Simplest possible @tags decorator for testing
 */
export function $tags(
  context: DecoratorContext,
  target: DiagnosticTarget,
  value: unknown,
): void {
  Effect.runSync(Effect.log("🔍 MINIMAL @tags decorator executed!").pipe(Effect.annotateLogs({ hasValue: !!value, isArray: Array.isArray(value) })));
  Effect.runSync(Effect.log("🔍 Target:").pipe(Effect.annotateLogs({ targetKind: String(target) })));

  if (!value || !Array.isArray(value)) {
    Effect.runSync(Effect.log("❌ No tags value - should trigger diagnostic"));
    context.program.reportDiagnostic({
      code: "invalid-tags-config",
      target: target,
      message: `Tags configuration missing or invalid. Use @tags with string array.`,
      severity: "error",
    });
    return;
  }
  Effect.runSync(Effect.log("✅ @tags decorator completed successfully"));
}

/**
 * Simplest possible @correlationId decorator for testing
 */
export function $correlationId(
  context: DecoratorContext,
  target: Model,
  location: unknown,
  property?: unknown,
): void {
  Effect.runSync(
    Effect.log("🔍 MINIMAL @correlationId decorator executed!").pipe(
      Effect.annotateLogs({
        location: String(location),
        property: String(property)
      })
    )
  );
  Effect.runSync(Effect.log("🔍 Target:").pipe(Effect.annotateLogs({ target: target.name })));

  if (!location) {
    Effect.runSync(Effect.log("❌ No correlationId location - should trigger diagnostic"));
    context.program.reportDiagnostic({
      code: "invalid-correlationId-config",
      target: target,
      message: `Correlation ID location missing for model '${target.name}'. Use @correlationId with location path.`,
      severity: "error",
    });
    return;
  }
  Effect.runSync(Effect.log("✅ @correlationId decorator completed successfully"));
}

/**
 * Simplest possible @bindings decorator for testing
 */
export function $bindings(
  context: DecoratorContext,
  target: Operation | Model,
  value: unknown,
): void {
  Effect.runSync(Effect.log("🔍 MINIMAL @bindings decorator executed!").pipe(Effect.annotateLogs({ hasValue: !!value })));
  Effect.runSync(Effect.log("🔍 Target:").pipe(Effect.annotateLogs({ target: target.name })));

  if (!value) {
    Effect.runSync(Effect.log("❌ No bindings value - should trigger diagnostic"));
    context.program.reportDiagnostic({
      code: "invalid-bindings-config",
      target: target,
      message: `Protocol bindings missing for '${target.kind}'. Use @bindings with configuration object.`,
      severity: "error",
    });
    return;
  }
  Effect.runSync(Effect.log("✅ @bindings decorator completed successfully"));
}

/**
 * Simplest possible @header decorator for testing
 */
export function $header(
  context: DecoratorContext,
  target: Model | ModelProperty,
  name: unknown,
  value: unknown,
): void {
  Effect.runSync(
    Effect.log("🔍 MINIMAL @header decorator executed!").pipe(
      Effect.annotateLogs({
        name: String(name),
        hasValue: !!value
      })
    )
  );
  Effect.runSync(Effect.log("🔍 Target:").pipe(Effect.annotateLogs({ targetKind: target.kind })));

  if (!name) {
    Effect.runSync(Effect.log("❌ No header name - should trigger diagnostic"));
    context.program.reportDiagnostic({
      code: "invalid-header-config",
      target: target,
      message: `Header name missing for '${target.kind}'. Use @header with name and value.`,
      severity: "error",
    });
    return;
  }
  Effect.runSync(Effect.log("✅ @header decorator completed successfully"));
}
