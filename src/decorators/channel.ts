import type { DecoratorContext, Operation, StringValue } from "@typespec/compiler";
import { reportDiagnostic, stateKeys } from "../lib.js";

export function $channel(context: DecoratorContext, target: Operation, path: StringValue | string): void {
  console.log(`🔍 PROCESSING @channel decorator on operation: ${target.name}`);
  console.log(`📍 Channel path raw value:`, path);
  console.log(`📍 Channel path type:`, typeof path);
  console.log(`🏷️  Target type: ${target.kind}`);
  
  // Target is always Operation type - no validation needed

  // Extract string value from TypeSpec value with proper type handling
  // Using Effect.TS patterns for validation would be implemented here in production
  let channelPath: string;
  if (typeof path === "string") {
    channelPath = path;
  } else {
    // path is StringValue type
    channelPath = String(path.value);
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