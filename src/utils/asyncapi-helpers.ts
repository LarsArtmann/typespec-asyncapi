/**
 * Shared AsyncAPI document generation utilities
 * Extracted from duplicated document generation logic
 */

import type {Operation, Program} from "@typespec/compiler"
import {getDoc} from "@typespec/compiler"
import type {ChannelObject, OperationObject} from "@asyncapi/parser/esm/spec-types/v3"
import {getAsyncAPIAction, getChannelPath, getOperationType} from "./typespec-helpers"


/**
 * Create channel definition from operation
 * Extracted from asyncapi-emitter.ts and emitter-with-effect.ts
 */
export function createChannelDefinition(op: Operation, program: Program): { name: string, definition: ChannelObject } {
	const channelName = `channel_${op.name}`
	const channelPath = getChannelPath(op, program)

	const definition: ChannelObject = {
		address: channelPath ?? `/${op.name.toLowerCase()}`,
		description: getDoc(program, op) ?? `Channel for ${op.name}`,
		messages: {
			[`${op.name}Message`]: {
				$ref: `#/components/messages/${op.name}Message`,
			},
		},
	}

	return {name: channelName, definition}
}

/**
 * Create operation definition from TypeSpec operation
 * Centralized operation definition creation
 */
export function createOperationDefinition(op: Operation, program: Program, channelName: string): OperationObject {
	const operationType = getOperationType(op, program)
	const action = getAsyncAPIAction(operationType)

	return {
		action,
		channel: {$ref: `#/channels/${channelName}`},
		summary: getDoc(program, op) ?? `Operation ${op.name}`,
		description: `Generated from TypeSpec operation with ${op.parameters.properties.size} parameters`,
	}
}