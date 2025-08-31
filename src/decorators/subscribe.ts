import type {DecoratorContext, Operation} from "@typespec/compiler"
import {$lib, reportDiagnostic} from "../lib.js"
import {Effect} from "effect"

export function $subscribe(context: DecoratorContext, target: Operation): void {
	Effect.log(`= PROCESSING @subscribe decorator on operation: ${target.name}`)
	Effect.log(`🔽 Target type: ${target.kind}`)

	if (target.kind !== "Operation") {
		reportDiagnostic(context, target, "invalid-channel-path", {path: "@subscribe can only be applied to operations"})
		return
	}

	// Get existing operation types to check for conflicts
	const operationTypesMap = context.program.stateMap($lib.stateKeys.operationTypes)
	const existingType = operationTypesMap.get(target) as string | undefined

	if (existingType === "publish") {
		reportDiagnostic(context, target, "conflicting-operation-type", {operationName: target.name})
		return
	}

	// Store operation type as "subscribe" in program state
	operationTypesMap.set(target, "subscribe")

	Effect.log(`✅ Successfully marked operation ${target.name} as subscribe operation`)
	Effect.log(`📊 Total operations with types: ${operationTypesMap.size}`)
}