import type {EmitContext} from "@typespec/compiler"
import {$lib} from "./lib.js"
import type {AsyncAPIEmitterOptions} from "./options.js"
import {generateAsyncAPIWithEffect} from "./emitter-with-effect.js"

export {$lib} from "./lib.js" // Re-exported for TypeSpec compiler to access library
export type {AsyncAPIEmitterOptions} from "./options.js" // Re-exported for external consumers

// Export decorator functions (for TypeSpec compiler)
export * from "./decorators/index.js"

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
	console.log("🎯 TYPESPEC ASYNCAPI EMITTER STARTED")
	console.log("✨ INTEGRATED: Effect.TS + asyncapi-validator + Performance Monitoring")
	console.log(`📁 Output directory: ${context.emitterOutputDir}`)
	console.log(`🔧 Program has ${context.program.sourceFiles.size || 0} source files`)
	console.log(`🌍 Global namespace: ${context.program.getGlobalNamespaceType().name || 'unknown'}`)

	console.log("🚀 Using Effect.TS integrated emitter with full performance monitoring")
	await generateAsyncAPIWithEffect(context)

	console.log("🎉 AsyncAPI generation complete with performance monitoring!")
}

//TODO: is this dead code or called by TypeSpec??
/**
 * Get the library instance
 */
export function getLibrary() {
	return $lib
}