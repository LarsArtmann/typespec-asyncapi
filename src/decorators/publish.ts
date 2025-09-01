import type {DecoratorContext, Operation} from "@typespec/compiler"
import {$lib, reportDiagnostic} from "../lib.js"
import {Effect} from "effect"

/**
 * Shared utility function to handle operation type conflict checking
 * @param context - Decorator context
 * @param target - Operation target
 * @param newType - New operation type being set
 * @param conflictType - Conflicting operation type to check for
 * @returns true if there's a conflict, false otherwise
 */
export function checkOperationTypeConflict(
	context: DecoratorContext,
	target: Operation,
	newType: string,
	conflictType: string
): boolean {
	// Get existing operation types to check for conflicts
	const operationTypesMap = context.program.stateMap($lib.stateKeys.operationTypes)
	const existingType = operationTypesMap.get(target) as string | undefined

	if (existingType === conflictType) {
		reportDiagnostic(context, target, "conflicting-operation-type", {operationName: target.name})
		return true
	}

	// Store operation type in program state
	operationTypesMap.set(target, newType)
	return false
}

export function $publish(context: DecoratorContext, target: Operation): void {
	Effect.log(`=
 PROCESSING @publish decorator on operation: ${target.name}`)
	Effect.log(`<�  Target type: ${target.kind}`)

	// Target is already typed as Operation - no validation needed

	// Check for operation type conflicts and set type
	if (checkOperationTypeConflict(context, target, "publish", "subscribe")) {
		return
	}

	Effect.log(` Successfully marked operation ${target.name} as publish operation`)
}