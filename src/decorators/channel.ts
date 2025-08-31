import type {DecoratorContext, Operation, StringValue} from "@typespec/compiler"
import {$lib, reportDiagnostic} from "../lib.js"
import {Effect} from "effect"

export function $channel(context: DecoratorContext, target: Operation, path: StringValue | string): void {
	Effect.log(`🔍 PROCESSING @channel decorator on operation: ${target.name}`)
	Effect.log(`📍 Channel path raw value:`, path)
	Effect.log(`📍 Channel path type:`, typeof path)
	Effect.log(`🏷️  Target type: ${target.kind}`)

	// Target is always Operation type - no validation needed

	// Extract string value from TypeSpec value with proper type handling
	// Using Effect.TS patterns for validation would be implemented here in production
	let channelPath: string
	if (typeof path === "string") {
		channelPath = path
	} else {
		// path is StringValue type
		channelPath = String(path.value)
	}

	Effect.log(`📍 Extracted channel path: "${channelPath}"`)

	// Validate channel path format
	if (!channelPath) {
		reportDiagnostic(context, target, "missing-channel-path", {operationName: target.name})
		return
	}

	// Store channel path in program state - PROOF we're processing real TypeSpec data
	const channelMap = context.program.stateMap($lib.stateKeys.channelPaths)
	channelMap.set(target, channelPath)

	Effect.log(`✅ Successfully stored channel path for operation ${target.name}: ${channelPath}`)
	Effect.log(`📊 Total operations with channels: ${channelMap.size}`)
}