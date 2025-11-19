import type { Operation, Program } from "@typespec/compiler"
import { getDoc } from "@typespec/compiler"
import type { OperationObject } from "@asyncapi/parser/esm/spec-types/v3.js"
import { getOperationType, getAsyncAPIAction } from "./typespec-helpers.js"
import type { ChannelName, OperationName } from "../types/branded-types.js"
import { unbrand } from "../types/branded-types.js"

export function createChannelDefinition(op: Operation, program: Program): { name: ChannelName; definition: OperationObject } {
	const operationType = getOperationType(op, program)
	const action = getAsyncAPIAction(operationType)
	
	// 🔥 CRITICAL FIX: Use branded types for type safety
	const operationName: OperationName = op.name as OperationName
	// Generate default channel path: "/" + lowercase operation name
	const channelName: ChannelName = ("/" + unbrand(operationName).toLowerCase()) as ChannelName

	return {
		name: channelName,
		definition: {
			action,
			channel: {$ref: `#/channels/${channelName}`},
			summary: getDoc(program, op) ?? `Operation ${op.name}`,
			description: `Generated from TypeSpec operation with ${op.parameters.properties.size} parameters`,
		}
	}
}