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

/**
 * Simplest possible @channel decorator for testing
 */
export function $channel(
  context: DecoratorContext,
  target: Operation,
  path: string,
): void {
  console.log(`🔍 MINIMAL @channel decorator executed! path: ${path}`);
  console.log(`🔍 Target:`, target);
  console.log(`🔍 Context:`, context);

  if (!path || path.length === 0) {
    console.log(`❌ Empty channel path - should trigger diagnostic`);
    // This will show if diagnostic reporting works
    context.program.reportDiagnostic({
      code: "missing-channel-path",
      target: target,
      message: `Operation '${target.name}' missing @channel decorator path`,
      severity: "error",
    });
    return;
  }

  console.log(`✅ @channel decorator completed successfully`);
}

/**
 * Simplest possible @server decorator for testing
 */
export function $server(
  context: DecoratorContext,
  target: Namespace,
  config: unknown,
): void {
  console.log(`🔍 MINIMAL @server decorator executed!`);
  console.log(`🔍 Target:`, target);
  console.log(`🔍 Config:`, config);

  if (!config) {
    console.log(`❌ No server config`);
    context.program.reportDiagnostic({
      code: "invalid-server-config",
      target: target,
      message: `Server configuration is missing`,
      severity: "error",
    });
    return;
  }

  console.log(`✅ @server decorator completed successfully`);
}

/**
 * Simplest possible @publish decorator for testing
 */
export function $publish(
  context: DecoratorContext,
  target: Operation,
  config: unknown,
): void {
  console.log(`🔍 MINIMAL @publish decorator executed! config:`, config);
  console.log(`🔍 Target:`, target);
  
  if (!config) {
    console.log(`❌ No publish config - should trigger diagnostic`);
    context.program.reportDiagnostic({
      code: "invalid-publish-config",
      target: target,
      message: `Publish operation '${target.name}' missing configuration. Use @publish with message configuration.`,
      severity: "error",
    });
    return;
  }
  console.log(`✅ @publish decorator completed successfully`);
}

/**
 * Simplest possible @message decorator for testing
 */
export function $message(
  context: DecoratorContext,
  target: Model,
  config: unknown,
): void {
  console.log(`🔍 MINIMAL @message decorator executed! config:`, config);
  console.log(`🔍 Target:`, target);
  
  if (!config) {
    console.log(`❌ No message config - should trigger diagnostic`);
    context.program.reportDiagnostic({
      code: "invalid-message-config",
      target: target,
      message: `Message model '${target.name}' missing configuration. Use @message with configuration object.`,
      severity: "error",
    });
    return;
  }
  console.log(`✅ @message decorator completed successfully`);
}

/**
 * Simplest possible @protocol decorator for testing
 */
export function $protocol(
  context: DecoratorContext,
  target: Operation | Model,
  config: unknown,
): void {
  console.log(`🔍 MINIMAL @protocol decorator executed! config:`, config);
  console.log(`🔍 Target:`, target);
  
  if (!config) {
    console.log(`❌ No protocol config - should trigger diagnostic`);
    context.program.reportDiagnostic({
      code: "invalid-protocol-config",
      target: target,
      message: `Protocol configuration missing for '${target.kind}'. Use @protocol with configuration object.`,
      severity: "error",
    });
    return;
  }
  console.log(`✅ @protocol decorator completed successfully`);
}

/**
 * Simplest possible @security decorator for testing
 */
export function $security(
  context: DecoratorContext,
  target: Operation | Namespace,
  config: unknown,
): void {
  console.log(`🔍 MINIMAL @security decorator executed! config:`, config);
  console.log(`🔍 Target:`, target);
  
  if (!config) {
    console.log(`❌ No security config - should trigger diagnostic`);
    context.program.reportDiagnostic({
      code: "invalid-security-config",
      target: target,
      message: `Security configuration missing for '${target.kind}'. Use @security with configuration object.`,
      severity: "error",
    });
    return;
  }
  console.log(`✅ @security decorator completed successfully`);
}

/**
 * Simplest possible @subscribe decorator for testing
 */
export function $subscribe(
  context: DecoratorContext,
  target: Operation,
): void {
  console.log(`🔍 MINIMAL @subscribe decorator executed!`);
  console.log(`🔍 Target:`, target);
  console.log(`✅ @subscribe decorator completed successfully`);
}

/**
 * Simplest possible @tags decorator for testing
 */
export function $tags(
  context: DecoratorContext,
  target: DiagnosticTarget,
  value: unknown,
): void {
  console.log(`🔍 MINIMAL @tags decorator executed! value:`, value);
  console.log(`🔍 Target:`, target);
  
  if (!value || !Array.isArray(value)) {
    console.log(`❌ No tags value - should trigger diagnostic`);
    context.program.reportDiagnostic({
      code: "invalid-tags-config",
      target: target,
      message: `Tags configuration missing or invalid. Use @tags with string array.`,
      severity: "error",
    });
    return;
  }
  console.log(`✅ @tags decorator completed successfully`);
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
  console.log(`🔍 MINIMAL @correlationId decorator executed! location: ${location}, property: ${property}`);
  console.log(`🔍 Target:`, target);
  
  if (!location) {
    console.log(`❌ No correlationId location - should trigger diagnostic`);
    context.program.reportDiagnostic({
      code: "invalid-correlationId-config",
      target: target,
      message: `Correlation ID location missing for model '${target.name}'. Use @correlationId with location path.`,
      severity: "error",
    });
    return;
  }
  console.log(`✅ @correlationId decorator completed successfully`);
}

/**
 * Simplest possible @bindings decorator for testing
 */
export function $bindings(
  context: DecoratorContext,
  target: Operation | Model,
  value: unknown,
): void {
  console.log(`🔍 MINIMAL @bindings decorator executed! value:`, value);
  console.log(`🔍 Target:`, target);
  
  if (!value) {
    console.log(`❌ No bindings value - should trigger diagnostic`);
    context.program.reportDiagnostic({
      code: "invalid-bindings-config",
      target: target,
      message: `Protocol bindings missing for '${target.kind}'. Use @bindings with configuration object.`,
      severity: "error",
    });
    return;
  }
  console.log(`✅ @bindings decorator completed successfully`);
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
  console.log(`🔍 MINIMAL @header decorator executed! name: ${name}, value:`, value);
  console.log(`🔍 Target:`, target);
  
  if (!name) {
    console.log(`❌ No header name - should trigger diagnostic`);
    context.program.reportDiagnostic({
      code: "invalid-header-config",
      target: target,
      message: `Header name missing for '${target.kind}'. Use @header with name and value.`,
      severity: "error",
    });
    return;
  }
  console.log(`✅ @header decorator completed successfully`);
}