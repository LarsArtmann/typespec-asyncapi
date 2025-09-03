import type {DecoratorContext, Operation} from "@typespec/compiler"
import {$lib, reportDiagnostic} from "../lib.js"
import {Effect} from "effect"

//TODO: CRITICAL - Add AsyncAPI 3.0.0 Publish Operation Object compliance validation
//TODO: CRITICAL - Implement proper Effect.TS Result/Either types for error handling
//TODO: CRITICAL - Add message schema validation for publish operations
//TODO: CRITICAL - Validate operation binding support (HTTP, WebSocket, Kafka, AMQP)
//TODO: CRITICAL - Add correlation ID pattern validation for request-reply
//TODO: CRITICAL - Implement operation security scheme validation
//TODO: CRITICAL - Add operation tags and external documentation support

/**
 * Shared utility function to handle operation type conflict checking
 * @param context - Decorator context
 * @param target - Operation target
 * @param newType - New operation type being set
 * @param conflictType - Conflicting operation type to check for
 * @returns true if there's a conflict, false otherwise
 */
//TODO: CRITICAL - Convert to Effect.TS monadic composition instead of boolean returns
//TODO: CRITICAL - Add proper type safety for operation type strings (use enum/union types)
//TODO: CRITICAL - Validate state map exists before accessing
//TODO: CRITICAL - Add comprehensive logging for state mutations
export function checkOperationTypeConflict(
	context: DecoratorContext,
	target: Operation,
	newType: string,
	conflictType: string
): boolean {
	//TODO: CRITICAL - Handle potential undefined state map gracefully
	// Get existing operation types to check for conflicts
	const operationTypesMap = context.program.stateMap($lib.stateKeys.operationTypes)
	const rawType = operationTypesMap.get(target) as string | undefined
	//TODO: CRITICAL - This type guard is insufficient - need proper schema validation
	const existingType = typeof rawType === 'string' ? rawType : undefined

	if (existingType === conflictType) {
		reportDiagnostic(context, target, "conflicting-operation-type", {operationName: target.name})
		return true
	}

	//TODO: CRITICAL - No validation that newType is valid AsyncAPI operation type
	// Store operation type in program state
	operationTypesMap.set(target, newType)
	return false
}

//TODO: CRITICAL - Add support for publish operation options (reply channel, headers, etc.)
//TODO: CRITICAL - Implement AsyncAPI 3.0.0 action validation ("send" for publish operations)
//TODO: CRITICAL - Add message trait validation and inheritance
export function $publish(context: DecoratorContext, target: Operation): void {
	Effect.log(`=
 PROCESSING @publish decorator on operation: ${target.name}`)
	Effect.log(`<�  Target type: ${target.kind}`)

	//TODO: CRITICAL - This comment is misleading - should validate Operation type constraints
	// Target is already typed as Operation - no validation needed

	//TODO: CRITICAL - Missing validation: operation must have input/output types defined
	// Check for operation type conflicts and set type
	if (checkOperationTypeConflict(context, target, "publish", "subscribe")) {
		return
	}

	//TODO: CRITICAL - Need to validate that operation has appropriate message schema
	//TODO: CRITICAL - Should store additional publish-specific metadata (channel binding, etc.)

	Effect.log(` Successfully marked operation ${target.name} as publish operation`)
}