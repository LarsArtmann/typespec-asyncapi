import type { DecoratorContext, Operation } from "@typespec/compiler";
import { reportDiagnostic, stateKeys } from "../lib.js";

export function $subscribe(context: DecoratorContext, target: Operation): void {
  console.log(`= PROCESSING @subscribe decorator on operation: ${target.name}`);
  console.log(`🔽 Target type: ${target.kind}`);
  
  if (target.kind !== "Operation") {
    reportDiagnostic(context.program, {
      code: "invalid-channel-path",
      target: target,
      format: { path: "@subscribe can only be applied to operations" },
    });
    return;
  }

  // Get existing operation types to check for conflicts
  const operationTypesMap = context.program.stateMap(stateKeys.operationTypes);
  const existingType = operationTypesMap.get(target);
  
  if (existingType === "publish") {
    reportDiagnostic(context.program, {
      code: "conflicting-operation-type",
      target: target,
      format: { operationName: target.name },
    });
    return;
  }

  // Store operation type as "subscribe" in program state
  operationTypesMap.set(target, "subscribe");
  
  console.log(`✅ Successfully marked operation ${target.name} as subscribe operation`);
  console.log(`📊 Total operations with types: ${operationTypesMap.size}`);
}