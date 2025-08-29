import type { DecoratorContext, Operation } from "@typespec/compiler";
import { reportDiagnostic, stateKeys } from "../lib.js";

export function $publish(context: DecoratorContext, target: Operation): void {
  console.log(`= PROCESSING @publish decorator on operation: ${target.name}`);
  console.log(`<÷  Target type: ${target.kind}`);
  
  if (target.kind !== "Operation") {
    reportDiagnostic(context.program, {
      code: "invalid-channel-path",
      target: target,
      format: { path: "@publish can only be applied to operations" },
    });
    return;
  }

  // Get existing operation types to check for conflicts
  const operationTypesMap = context.program.stateMap(stateKeys.operationTypes);
  const existingType = operationTypesMap.get(target);
  
  if (existingType === "subscribe") {
    reportDiagnostic(context.program, {
      code: "conflicting-operation-type",
      target: target,
      format: { operationName: target.name },
    });
    return;
  }

  // Store operation type as "publish" in program state
  operationTypesMap.set(target, "publish");
  
  console.log(` Successfully marked operation ${target.name} as publish operation`);
  console.log(`=Ê Total operations with types: ${operationTypesMap.size}`);
}