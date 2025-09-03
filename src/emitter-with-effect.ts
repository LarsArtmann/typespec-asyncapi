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

// TODO: CRITICAL - Import organization inconsistent - reorganize by category with separating comments
// TODO: CRITICAL - Missing type-only imports reduce tree shaking efficiency - import {type X} for types
// TODO: CRITICAL - No explicit import type distinction hurts bundle size optimization
// TODO: TYPE_SAFETY - Effect import should be more specific: import {type Effect} from "effect" 
// TODO: TYPE_SAFETY - createAssetEmitter return type not properly typed in variable assignment

// Effect.TS Framework Imports
import {Effect} from "effect"

// TypeSpec Compiler Framework Imports  
import type {EmitContext} from "@typespec/compiler"
import {createAssetEmitter} from "@typespec/asset-emitter"

// Internal Type Definitions
import type {AsyncAPIEmitterOptions} from "./options.js"
import type {AsyncAPIEmitterError} from "./errors/index.js"

// Internal Service Implementations
import {AsyncAPIEmitter} from "./core/AsyncAPIEmitter.js"
import {registerBuiltInPlugins} from "./plugins/plugin-system.js"
import { railwayLogging, railwayPipeline } from "./utils/effect-helpers.js"

// Internal Error Factories
import {
	createCompilerOptionsError,
	createGlobalNamespaceMissingError,
	createGlobalNamespaceInvalidError,
	createGlobalNamespaceAccessError,
	createStateMapMissingError,
	createPluginSystemError
} from "./errors/index.js"

/**
 * Main emission function using modular architecture with Effect.TS error handling
 * 
 * TODO: TYPE_SAFETY - Add @param JSDoc annotation with detailed parameter description
 * TODO: TYPE_SAFETY - Consider making context parameter readonly to prevent mutation
 * TODO: TYPE_SAFETY - Add explicit generic constraint for EmitContext to ensure type safety
 * TODO: TYPE_SAFETY - Return type could be more specific: Effect<void, AsyncAPIEmitterError, never>
 * TODO: PERFORMANCE - Add performance timing measurements for function execution
 * TODO: PERFORMANCE - Consider memoization for repeated calls with same context
 * TODO: ERROR_HANDLING - Add input validation for context parameter (null/undefined checks)
 * TODO: ERROR_HANDLING - Add structured error context with operation metadata
 * TODO: LOGGING - Add function entry/exit logging for debugging
 * TODO: TESTING - Add unit test coverage assertions in JSDoc
 * 
 * @param context - TypeSpec emit context containing program and emitter options
 * @returns Effect that succeeds with void or fails with branded AsyncAPIEmitterError
 */
export function generateAsyncAPIWithEffect(context: EmitContext<AsyncAPIEmitterOptions>): Effect.Effect<void, AsyncAPIEmitterError> {
	// TODO: TYPE_SAFETY - Effect.gen function should have explicit return type annotation  
	// TODO: TYPE_SAFETY - Yield expressions should have explicit types for better IntelliSense
	// TODO: PERFORMANCE - Consider extracting static string literals to constants to avoid re-allocation
	// TODO: ERROR_HANDLING - Add context parameter validation at function entry
	return Effect.gen(function* () {
		// TODO: LOGGING - String literals should be extracted to logging constants for consistency
		// TODO: PERFORMANCE - Expensive string interpolation in hot path - consider lazy evaluation
		yield* railwayLogging.logInitialization("AsyncAPI Emitter with Modular Architecture")
		yield* Effect.logInfo("Using new micro-kernel architecture!")
		yield* Effect.logInfo("Connecting Effect.TS system to modular emitter")
		
		// TODO: TYPE_SAFETY - registerBuiltInPlugins() return type should be explicitly typed
		// TODO: TYPE_SAFETY - Error parameter in mapError callback lacks proper type annotation
		// TODO: TYPE_SAFETY - pluginError should be typed as specific error type, not implicit any
		// TODO: ERROR_HANDLING - Plugin failure should include original error context for debugging
		// TODO: PERFORMANCE - Plugin initialization could be memoized to avoid repeated work
		// Initialize plugin system with proper Railway programming
		yield* railwayPipeline.executeAsync(
			() => Effect.runPromise(registerBuiltInPlugins()),
			"Plugin system initialization"
		).pipe(
			Effect.mapError((error) => createPluginSystemError(error)),
			Effect.catchAll((pluginError) => Effect.gen(function* () {
				// TODO: TYPE_SAFETY - Template string interpolation needs type guard for message property
				// TODO: LOGGING - Warning message should include plugin names and failure reasons
				yield* Effect.logWarning(`Plugin system initialization failed, continuing without plugins: ${pluginError.message}`)
				return undefined // TODO: TYPE_SAFETY - Explicit void return would be clearer than undefined
			}))
		)
		
		yield* railwayLogging.logInitializationSuccess("Plugin system")

		// TODO: TYPE_SAFETY - compilerOptions property access needs null safety check with optional chaining
		// TODO: TYPE_SAFETY - Add explicit type guard function for compilerOptions validation  
		// TODO: ERROR_HANDLING - Error should include details about which required options are missing
		// Validate program has required structure for AssetEmitter
		if (!context.program.compilerOptions) {
			return yield* Effect.fail(createCompilerOptionsError({ program: context.program }))
		}
		
		// TODO: TYPE_SAFETY - DEFAULT_DRY_RUN should have explicit boolean type annotation
		// TODO: TYPE_SAFETY - effectiveDryRun type should be explicitly declared as boolean
		// TODO: PERFORMANCE - Constant should be extracted to module level to avoid re-allocation
		// TODO: CODE_QUALITY - Nullish coalescing is good but add explicit type assertion
		// Use safe defaults without mutation
		const DEFAULT_DRY_RUN: boolean = false
		const effectiveDryRun: boolean = context.program.compilerOptions.dryRun ?? DEFAULT_DRY_RUN
		
		// TODO: LOGGING - Template string interpolation should use structured logging for better parsing
		// TODO: TYPE_SAFETY - Boolean to string coercion should be explicit: String(effectiveDryRun)
		yield* Effect.logInfo(`Compiler options validated - dryRun: ${effectiveDryRun}`)

		// Validate program has required TypeSpec compiler methods
		if (!context.program.getGlobalNamespaceType) {
			return yield* Effect.fail(createGlobalNamespaceMissingError({ program: context.program }))
		}
		
		// Validate that the global namespace is available
		const globalNamespace = yield* Effect.try({
			try: () => context.program.getGlobalNamespaceType(),
			catch: (error) => createGlobalNamespaceAccessError(error, context.program)
		})
		
		if (!globalNamespace || globalNamespace.kind !== "Namespace") {
			return yield* Effect.fail(createGlobalNamespaceInvalidError(globalNamespace?.kind))
		}
		
		yield* Effect.logInfo(`Global namespace validated - contains ${globalNamespace.models?.size || 0} models, ${globalNamespace.operations?.size || 0} operations`)

		// Validate program has required state management capabilities
		if (!context.program.stateMap) {
			return yield* Effect.fail(createStateMapMissingError({ program: context.program }))
		}
		
		yield* Effect.logInfo("Program structure validated - ready for AsyncAPI generation")

		// TODO: TYPE_SAFETY - assetEmitter variable should have explicit type annotation from createAssetEmitter
		// TODO: TYPE_SAFETY - createAssetEmitter parameters should be validated before passing
		// TODO: ERROR_HANDLING - createAssetEmitter call should be wrapped in Effect.try for error handling
		// TODO: PERFORMANCE - Consider caching emitter instance for repeated calls
		// TODO: LOGGING - Debug logs should be conditional based on log level to avoid performance impact
		// Create emitter using the new modular architecture
		const assetEmitter = createAssetEmitter(
			context.program,
			AsyncAPIEmitter,
			context,
		)

		// TODO: TYPE_SAFETY - emitProgram() return value should be typed and potentially awaited
		// TODO: ERROR_HANDLING - emitProgram() call should be wrapped in Effect.try for proper error handling
		// TODO: PERFORMANCE - Consider async/await pattern instead of synchronous call for better performance
		assetEmitter.emitProgram()
		
		// Force emit the global namespace to trigger file generation  
		// TODO: CRITICAL - Fix globalNamespace property access for TypeSpec API compatibility
		// assetEmitter.emitType(context.program.globalNamespace)
		
		// TODO: TYPE_SAFETY - writeOutput() return type should be explicitly handled
		// TODO: TYPE_SAFETY - Error parameter in mapError needs proper type annotation  
		// TODO: ERROR_HANDLING - Should catch specific error types instead of generic Error
		// TODO: PERFORMANCE - writeOutput operation should have timeout handling
		yield* Effect.tryPromise(() => assetEmitter.writeOutput()).pipe(
			Effect.mapError((error) => createPluginSystemError(error, 'AssetEmitter.writeOutput'))
		)

		// TODO: LOGGING - Success logging should include performance metrics and output statistics
		yield* railwayLogging.logInitializationSuccess("AsyncAPI generation")
	})
}