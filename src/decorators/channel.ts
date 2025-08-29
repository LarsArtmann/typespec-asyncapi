import type { DecoratorContext, Operation } from "@typespec/compiler";
import { reportDiagnostic, stateKeys } from "../lib.js";

export function $channel(context: DecoratorContext, target: Operation, path: any): void {
  console.log(`🔍 PROCESSING @channel decorator on operation: ${target.name}`);
  console.log(`📍 Channel path raw value:`, path);
  console.log(`📍 Channel path type:`, typeof path);
  console.log(`🏷️  Target type: ${target.kind}`);
  
  if (target.kind !== "Operation") {
    reportDiagnostic(context.program, {
      code: "invalid-channel-path",
      target: target,
      format: { path: String(path) },
    });
    return;
  }

  // Extract string value from TypeSpec value
  let channelPath: string;
  if (typeof path === "string") {
    channelPath = path;
  } else if (path && typeof path === "object" && "value" in path) {
    channelPath = String(path.value);
  } else if (path && typeof path === "object" && "kind" in path && path.kind === "String") {
    channelPath = String((path as any).value || path);
  } else {
    console.log(`⚠️  Could not extract string from path:`, path);
    reportDiagnostic(context.program, {
      code: "missing-channel-path",
      target: target,
    });
    return;
  }

  console.log(`📍 Extracted channel path: "${channelPath}"`);

  // Validate channel path format
  if (!channelPath) {
    reportDiagnostic(context.program, {
      code: "missing-channel-path",
      target: target,
    });
    return;
  }

  // Store channel path in program state - PROOF we're processing real TypeSpec data
  const channelMap = context.program.stateMap(stateKeys.channelPaths);
  channelMap.set(target, channelPath);
  
  console.log(`✅ Successfully stored channel path for operation ${target.name}: ${channelPath}`);
  console.log(`📊 Total operations with channels: ${channelMap.size}`);
}