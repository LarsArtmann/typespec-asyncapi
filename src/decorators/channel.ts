import type { DecoratorContext, Operation, StringValue } from "@typespec/compiler";
import { reportDiagnostic, stateKeys } from "../lib.js";

export function $channel(context: DecoratorContext, target: Operation, path: StringValue | string): void {
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

  // TODO: Effects.TS Schema here!!
  // Extract string value from TypeSpec value with proper type handling
  let channelPath: string;
  if (typeof path === "string") {
    channelPath = path;
  } else if (path && typeof path === "object" && "value" in path && path.value !== undefined) {
    channelPath = String(path.value);
  } else if (path && typeof path === "object" && "valueKind" in path && (path as StringValue).valueKind === "StringValue") {
    const stringValue = path as StringValue;
    channelPath = String(stringValue.value);
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