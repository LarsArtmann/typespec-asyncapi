export function createOperationDefinition(op: Operation, program: Program, channelName: ChannelName): { name: OperationName, definition: OperationObject } {
	const operationType = getOperationType(op, program)
	const action = getAsyncAPIAction(operationType)
	
	// 🔥 CRITICAL FIX: Use branded types for type safety
	const operationName: OperationName = op.name as OperationName

	return {
		name: operationName,
		definition: {
			action,
			channel: {$ref: `#/channels/${channelName}`},
			summary: getDoc(program, op) ?? `Operation ${op.name}`,
			description: `Generated from TypeSpec operation with ${op.parameters.properties.size} parameters`,
		}
	}
}