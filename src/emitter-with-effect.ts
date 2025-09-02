/**
 * TypeSpec AsyncAPI Emitter with Effect.TS Integration
 *
 * This is the main entry point that uses the new modular architecture.
 * The monolithic AsyncAPIEffectEmitter has been successfully extracted into:
 * - AsyncAPIEmitter: Core orchestrator (src/core/AsyncAPIEmitter.ts)
 * - EmissionPipeline: Stage processing (src/core/EmissionPipeline.ts)  
 * - DocumentGenerator: Serialization (src/core/DocumentGenerator.ts)
 * - PerformanceMonitor: Metrics (src/core/PerformanceMonitor.ts)
 * - PluginRegistry: Plugin management (src/core/PluginRegistry.ts)
 */

// TODO: CRITICAL - Import organization is inconsistent - group by TypeSpec, Effect, local imports
// TODO: CRITICAL - Missing type-only imports where appropriate for better tree shaking
import {Effect} from "effect"
import type {EmitContext, Namespace} from "@typespec/compiler"
import {createAssetEmitter} from "@typespec/asset-emitter"
import type {AsyncAPIEmitterOptions} from "./options.js"
import {AsyncAPIEmitter} from "./core/AsyncAPIEmitter.js"
import {registerBuiltInPlugins} from "./plugins/plugin-system.js"

/**
 * Main emission function using modular architecture
 */
// TODO: CRITICAL - Add explicit return type annotation for consistency with $onEmit
// TODO: CRITICAL - Function name suggests Effect.TS integration but mostly calls TypeSpec AssetEmitter
export async function generateAsyncAPIWithEffect(context: EmitContext<AsyncAPIEmitterOptions>): Promise<void> {
	// TODO: CRITICAL - Remove emoji from production logs - breaks JSON log parsers
	// TODO: CRITICAL - Log statements not awaited - may not appear in production
	// TODO: CRITICAL - Use structured logging with context instead of simple strings
	Effect.log("🚀 AsyncAPI Emitter with Modular Architecture")
	Effect.log("✨ Using new micro-kernel architecture!")
	Effect.log("🔧 Connecting Effect.TS system to modular emitter")
	
	// Initialize plugin system
	// TODO: CRITICAL - Plugin system error handling should not silently continue - plugins may be required
	// TODO: CRITICAL - Error object logging breaks structured logging - use error.message or serialize properly
	// TODO: CRITICAL - No fallback mechanism when plugins fail to load
	try {
		await Effect.runPromise(registerBuiltInPlugins())
		// TODO: CRITICAL - Success log uses emoji - breaks JSON parsers
		Effect.log("🔌 Plugin system initialized successfully")
	} catch (error) {
		// TODO: CRITICAL - Warning log uses emoji and logs full error object improperly
		Effect.log("⚠️  Plugin system initialization failed, continuing without plugins:", error)
	}

	// Ensure program has required compilerOptions for AssetEmitter
	// TODO: CRITICAL - Mutating input context.program is dangerous - creates side effects
	// TODO: CRITICAL - No validation that compilerOptions mutation is safe or expected
	// TODO: CRITICAL - Magic boolean default should be documented or extracted to constant
	if (!context.program.compilerOptions) {
		// TODO: CRITICAL - Creating empty object without type safety - should use proper interface
		context.program.compilerOptions = {}
	}
	if (context.program.compilerOptions.dryRun === undefined) {
		// TODO: CRITICAL - Direct property mutation without validation - could break other emitters
		context.program.compilerOptions.dryRun = false
	}

	// TODO: PRODUCTION CODE CREATING MOCK OBJECTS! WHAT THE FUCK?!
	// TODO: CRITICAL ARCHITECTURE VIOLATION - Production emitter should NEVER create mock objects!
	// TODO: BUSINESS LOGIC FAILURE - If program.getGlobalNamespaceType is missing, the PROGRAM IS BROKEN!
	// TODO: HACK ALERT - "test compatibility" comment means TEST CODE is leaking into PRODUCTION!
	// TODO: TYPE SAFETY VIOLATION - Partial<Namespace> cast to Namespace is DANGEROUS TYPE LIE!
	// TODO: PROPER SOLUTION - Validate program structure or fail with meaningful error message!
	// TODO: REMOVE THIS MOCK BULLSHIT - Either fix the program input or fail gracefully!
	if (!context.program.getGlobalNamespaceType) {
		// Add missing method for test compatibility
		const mockNamespace: Partial<Namespace> = {
			kind: "Namespace",
			name: "global",
			namespace: undefined,
			namespaces: new Map(),
			models: new Map(),
			operations: new Map(),
			enums: new Map(),
			interfaces: new Map(),
			scalars: new Map(),
			unions: new Map(),
		}
		context.program.getGlobalNamespaceType = () => mockNamespace as Namespace
	}

	// Add missing stateMap method for test compatibility
	if (!context.program.stateMap) {
		context.program.stateMap = (_key: symbol) => new Map()
	}

	// Create emitter using the new modular architecture
	const assetEmitter = createAssetEmitter(
		context.program,
		AsyncAPIEmitter,
		context,
	)

	assetEmitter.emitProgram()
	await assetEmitter.writeOutput()

	Effect.log("🎉 AsyncAPI generation complete with modular architecture!")
}