import type {DecoratorContext, Operation} from "@typespec/compiler"
import {$lib, reportDiagnostic} from "../lib.js"
import {Effect} from "effect"

export function $publish(context: DecoratorContext, target: Operation): void {
	Effect.log(`=
 PROCESSING @publish decorator on operation: ${target.name}`)
	Effect.log(`<�  Target type: ${target.kind}`)

	// Target is already typed as Operation - no validation needed

	// Get existing operation types to check for conflicts
	const operationTypesMap = context.program.stateMap($lib.stateKeys.operationTypes)
	const existingType = operationTypesMap.get(target) as string | undefined

	if (existingType === "subscribe") {
		reportDiagnostic(context, target, "conflicting-operation-type", {operationName: target.name})
		return
	}

	// Store operation type as "publish" in program state
	operationTypesMap.set(target, "publish")

	Effect.log(` Successfully marked operation ${target.name} as publish operation`)
	Effect.log(`=� Total operations with types: ${operationTypesMap.size}`)
}