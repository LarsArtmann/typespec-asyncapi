import type {DecoratorContext, Operation} from "@typespec/compiler"
import {reportDiagnostic} from "../lib.js"
import {Effect} from "effect"
import {checkOperationTypeConflict} from "./publish.js"

export function $subscribe(context: DecoratorContext, target: Operation): void {
	Effect.log(`= PROCESSING @subscribe decorator on operation: ${target.name}`)
	Effect.log(`🔽 Target type: ${target.kind}`)

	if (target.kind !== "Operation") {
		reportDiagnostic(context, target, "invalid-channel-path", {path: "@subscribe can only be applied to operations"})
		return
	}

	// Check for operation type conflicts and set type
	if (checkOperationTypeConflict(context, target, "subscribe", "publish")) {
		return
	}

	Effect.log(`✅ Successfully marked operation ${target.name} as subscribe operation`)
}