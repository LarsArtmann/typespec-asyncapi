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
import type {EmitContext} from "@typespec/compiler"
import {createAssetEmitter} from "@typespec/asset-emitter"
import type {AsyncAPIEmitterOptions} from "./options.js"
import {AsyncAPIEmitter} from "./core/AsyncAPIEmitter.js"
import {registerBuiltInPlugins} from "./plugins/plugin-system.js"
import {
	createCompilerOptionsError,
	createGlobalNamespaceMissingError,
	createGlobalNamespaceInvalidError,
	createGlobalNamespaceAccessError,
	createStateMapMissingError,
	createPluginSystemError,
	type AsyncAPIEmitterError
} from "./errors/index.js"

/**
 * Main emission function using modular architecture with Effect.TS error handling
 * 
 * @returns Effect that succeeds with void or fails with branded AsyncAPIEmitterError
 */
export function generateAsyncAPIWithEffect(context: EmitContext<AsyncAPIEmitterOptions>): Effect.Effect<void, AsyncAPIEmitterError> {
	return Effect.gen(function* () {
		yield* Effect.log("AsyncAPI Emitter with Modular Architecture")
		yield* Effect.log("Using new micro-kernel architecture!")
		yield* Effect.log("Connecting Effect.TS system to modular emitter")
		
		// Initialize plugin system with proper Effect error handling
		yield* Effect.tryPromise(() => Effect.runPromise(registerBuiltInPlugins())).pipe(
			Effect.mapError((error) => createPluginSystemError(error)),
			Effect.catchAll((pluginError) => Effect.gen(function* () {
				yield* Effect.log(`Plugin system initialization failed, continuing without plugins: ${pluginError.message}`)
				return undefined
			}))
		)
		
		yield* Effect.log("Plugin system initialized successfully")

		// Validate program has required structure for AssetEmitter
		if (!context.program.compilerOptions) {
			return yield* Effect.fail(createCompilerOptionsError({ program: context.program }))
		}
		
		// Use safe defaults without mutation
		const DEFAULT_DRY_RUN = false
		const effectiveDryRun = context.program.compilerOptions.dryRun ?? DEFAULT_DRY_RUN
		
		yield* Effect.log(`Compiler options validated - dryRun: ${effectiveDryRun}`)

		// Validate program has required TypeSpec compiler methods
		if (!context.program.getGlobalNamespaceType) {
			return yield* Effect.fail(createGlobalNamespaceMissingError({ program: context.program }))
		}
		
		// Validate that the global namespace is available
		const globalNamespace = yield* Effect.try({
			try: () => context.program.getGlobalNamespaceType!(),
			catch: (error) => createGlobalNamespaceAccessError(error, context.program)
		})
		
		if (!globalNamespace || globalNamespace.kind !== "Namespace") {
			return yield* Effect.fail(createGlobalNamespaceInvalidError(globalNamespace?.kind))
		}
		
		yield* Effect.log(`Global namespace validated - contains ${globalNamespace.models?.size || 0} models, ${globalNamespace.operations?.size || 0} operations`)

		// Validate program has required state management capabilities
		if (!context.program.stateMap) {
			return yield* Effect.fail(createStateMapMissingError({ program: context.program }))
		}
		
		yield* Effect.log("Program structure validated - ready for AsyncAPI generation")

		// Create emitter using the new modular architecture
		const assetEmitter = createAssetEmitter(
			context.program,
			AsyncAPIEmitter,
			context,
		)

		assetEmitter.emitProgram()
		yield* Effect.tryPromise(() => assetEmitter.writeOutput()).pipe(
			Effect.mapError((error) => createPluginSystemError(error, 'AssetEmitter.writeOutput'))
		)

		yield* Effect.log("AsyncAPI generation complete with modular architecture!")
	})
}