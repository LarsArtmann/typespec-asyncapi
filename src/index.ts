import type {EmitContext} from "@typespec/compiler"
import {$lib} from "./lib"
import type {AsyncAPIEmitterOptions} from "./options"
import {generateAsyncAPIWithEffect} from "./emitter-with-effect"
import {Effect} from "effect"

export {$lib} from "./lib" // Re-exported for TypeSpec compiler to access library
export type {AsyncAPIEmitterOptions} from "./options" // Re-exported for external consumers

// Export decorator functions (for TypeSpec compiler)
export * from "./decorators/index"

// noinspection JSUnusedGlobalSymbols
/**
 * AsyncAPI emitter entry point
 * Called by TypeSpec compiler to generate AsyncAPI 3.0 specifications
 *
 * NOW WITH:
 * - Effect.TS integration (ghost system connected!)
 * - REAL asyncapi-validator usage
 * - Proper validation at emit time
 *
 * ⚠️ VERSIONING LIMITATION: This emitter does NOT currently support TypeSpec.Versioning
 * decorators (@added, @removed, @renamedFrom). Only generates single AsyncAPI document.
 * See GitHub issue #1 for planned versioning support.
 */
export async function $onEmit(context: EmitContext<AsyncAPIEmitterOptions>): Promise<void> {
	Effect.log("🎯 TYPESPEC ASYNCAPI EMITTER STARTED")
	Effect.log("✨ INTEGRATED: Effect.TS + asyncapi-validator + Performance Monitoring")
	Effect.log(`📁 Output directory: ${context.emitterOutputDir}`)
	Effect.log(`🔧 Program has ${context.program.sourceFiles.size || 0} source files`)
	Effect.log(`🌍 Global namespace: ${context.program.getGlobalNamespaceType().name || 'unknown'}`)

	Effect.log("🚀 Using Effect.TS integrated emitter with full performance monitoring")
	await generateAsyncAPIWithEffect(context)

	Effect.log("🎉 AsyncAPI generation complete with performance monitoring!")
}

//TODO: is this dead code or called by TypeSpec??
/**
 * Get the library instance
 */
export function getLibrary() {
	return $lib
}