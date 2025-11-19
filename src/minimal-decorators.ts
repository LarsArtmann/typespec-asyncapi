/**
 * MINIMAL DECORATORS - Back to basics approach
 *
 * Simplest possible decorator implementations to test TypeSpec linkage
 */

import type {
  DecoratorContext,
  Namespace,
  Operation,
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
