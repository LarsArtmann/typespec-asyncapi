/**
 * Shared AsyncAPI document generation utilities
 * Extracted from duplicated document generation logic
 */

import type {Operation, Program} from "@typespec/compiler"
import {getDoc} from "@typespec/compiler"
import type {ChannelObject, OperationObject} from "@asyncapi/parser/esm/spec-types/v3.js"
import {getAsyncAPIAction, getChannelPath, getOperationType} from "./typespec-helpers.js"

// 🔥 CRITICAL FIX: Apply branded types to eliminate type safety waste
import { ChannelName, OperationName, MessageName } from "../types/branded-types.js"


/**
 * Create channel definition from operation
 * Extracted from asyncapi-emitter.ts and emitter-with-effect.ts
 * FIXED: Use @channel decorator value instead of hardcoded prefix
 */
export function createChannelDefinition(op: Operation, program: Program): { name: string, definition: ChannelObject } {
	const channelPath = getChannelPath(op, program)
	// FIXED: Use the actual channel path from @channel decorator as the channel name
	const channelName = channelPath ?? `/${op.name.toLowerCase()}`

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
 * 🔥 CRITICAL FIX: Apply branded types for type safety
 * Create operation definition from TypeSpec operation
 * Centralized operation definition creation
 */
export function createOperationDefinition(op: Operation, program: Program, channelName: ChannelName): { name: OperationName, definition: OperationObject } {
	const operationType = getOperationType(op, program)
	const action = getAsyncAPIAction(operationType)
	
	// 🔥 CRITICAL FIX: Use branded types for type safety
	const operationName: OperationName = op.name as OperationName

	return {
		action,
		channel: {$ref: `#/channels/${channelName}`},
		summary: getDoc(program, op) ?? `Operation ${op.name}`,
		description: `Generated from TypeSpec operation with ${op.parameters.properties.size} parameters`,
	}
}