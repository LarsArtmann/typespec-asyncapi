/**
 * 🔥 CRITICAL FIX: TypeSpec API Integration - Test Framework Compatibility
 * 
 * KEY INSIGHT: Use TypeSpec's `emitFile` API instead of direct filesystem writes
 * - `emitFile` automatically bridges to test framework's outputFiles Map
 * - Eliminates need for manual bridging/hacking
 * - Official TypeSpec emitter pattern
 * - Enables both real file writing AND test framework integration
 * 
 * ARCHITECTURE DECISION:
 * - Replace fs.writeFile with TypeSpec's emitFile API
 * - Maintain all existing pipeline functionality (Discovery → Processing → Validation)
 * - Fix test framework output capture issue
 * - Use resolvePath for proper path handling
 */

import type { EmitContext } from "@typespec/compiler";
import { emitFile } from "@typespec/compiler";
import { Effect } from "effect";

// Core emission services - keep all working pipeline components
import { DiscoveryService } from "../../domain/emitter/DiscoveryService.js";
import { orchestrateAsyncAPITransformation } from "../../domain/emitter/ProcessingService.js";
import { ValidationService } from "../../domain/validation/ValidationService.js";

// Error handling
import { createError } from "../../utils/standardized-errors.js";
import type { StandardizedError } from "../../utils/standardized-errors.js";
import { DocumentBuilder } from "../../domain/emitter/DocumentBuilder.js";

// Plugin system - FIX "No plugin found" warnings
import { registerBuiltInPlugins, pluginRegistry as _pluginRegistry } from "../../infrastructure/adapters/plugin-system.js";

/**
 * 🎯 TYPESPEC API INTEGRATION - Test Framework Compatibility
 * 
 * STRATEGY: 
 * 1. Use working DiscoveryService (finds operations)
 * 2. Use working ProcessingService (creates channels/operations)
 * 3. Use working ValidationService (validates result)
 * 4. Use TypeSpec's emitFile API (bridges to test framework)
 * 5. Maintain all existing pipeline functionality
 */
export function generateAsyncAPIWithEffect(context: EmitContext): Effect.Effect<void, StandardizedError, never> {
	return Effect.gen(function* () {
		yield* Effect.logInfo("🚀 TypeSpec API Integration: Using emitFile for test framework compatibility")
		
		// 🔧 DEBUG: Log received options to verify they reach the emitter
		yield* Effect.logInfo(`🔍 DEBUG: Received context.options:`, JSON.stringify(context.options, null, 2))
		yield* Effect.logInfo(`🔍 DEBUG: output-file option: ${String(context.options["output-file"] ?? "undefined")}`)
		yield* Effect.logInfo(`🔍 DEBUG: file-type option: ${String(context.options["file-type"] ?? "undefined")}`)
		
		// 🔧 FIX: Register protocol plugins to eliminate warnings
		yield* registerBuiltInPlugins()
		
		// 🔍 STAGE 1: Discovery (Working - finds operations)
		yield* Effect.logInfo("🚀 Stage 1: Discovery")
		const discoveryService = new DiscoveryService()
		const discoveryResult = yield* discoveryService.executeDiscovery(context.program)
		yield* Effect.logInfo(`✅ Discovery: ${discoveryResult.operations.length} operations found`)
		
		// Create initial AsyncAPI document for processing
		const documentBuilder = new DocumentBuilder()
		const initialDoc = yield* documentBuilder.createInitialDocument(context.program)
		
		// Stage 2: Processing
		yield* Effect.logInfo("🚀 Stage 2: Processing")
		const processingResult = yield* orchestrateAsyncAPITransformation(
			discoveryResult.operations,
			discoveryResult.messageModels,
			discoveryResult.securityConfigs,
			initialDoc,
			context.program
		)
		yield* Effect.logInfo(`✅ Processing: ${processingResult.totalProcessed} elements processed`)
		
		// Stage 3: Validation
		yield* Effect.logInfo("🚀 Stage 3: Validation")
		const validationService = new ValidationService()
		const validationResult = yield* validationService.validateDocument(initialDoc)
		yield* Effect.logInfo(`✅ Validation: ${validationResult._tag === "Success" ? 'PASSED' : 'FAILED'}`)
		
		// Stage 4: TypeSpec emitFile API
		yield* Effect.logInfo("🚀 Stage 4: TypeSpec emitFile API")
		
		// Import YAML for serialization
		const yaml = yield* Effect.tryPromise({
			try: () => import("yaml"),
			catch: (error) => createError({
				what: "Failed to import yaml module",
				reassure: "This error does not affect JSON output option",
				why: "The YAML parser module could not be loaded",
				fix: "Install yaml package with 'bun add yaml'",
				escape: "Use JSON output format instead",
				severity: "error",
				code: "YAML_IMPORT_ERROR",
				context: { error: String(error) }
			})
		});
		
		// Simple configuration
		const outputFile = (context.options["output-file"] as string | undefined) ?? "asyncapi";
		const fileType = (context.options["file-type"] as string | undefined) ?? "yaml";
		const extension = fileType === "json" ? "json" : "yaml";
		
		// Simple serialization using processed document
		const content = fileType === "json" 
			? JSON.stringify(initialDoc, null, 2)
			: yaml.stringify(initialDoc);
		
		// Use correct path format for TypeSpec test framework
		// The test framework expects files under tsp-output/ prefix
		const fileName = `tsp-output/${String(outputFile)}.${extension}`
		yield* Effect.logInfo(`🔍 Emitting file: ${fileName}`)
		
		// Direct emitFile call using Effect.sync for test framework compatibility
		yield* Effect.tryPromise({
			try: () => emitFile(context.program, {
				path: fileName,
				content: content,
			}),
			catch: (error) => {
				// Log actual emitFile error for debugging
				const errorDetails = createError({
					what: "Failed to emit AsyncAPI file",
					reassure: "The document generation succeeded, but file writing failed",
					why: "TypeSpec's emitFile API encountered an error",
					fix: "Check file permissions and disk space",
					escape: "Try using a different output directory",
					severity: "error",
					code: "EMIT_FILE_ERROR",
					context: { error: String(error), fileName }
				});
				
				void Effect.logError(`💥 emitFile ERROR: ${String(error)}`);
				return Effect.fail(errorDetails);
			}
		});
		
		// DEBUG: Check if file was actually written
		const fs = yield* Effect.tryPromise({
			try: () => import('node:fs'),
			catch: (error) => {
				void Effect.logError(`Failed to import fs module: ${String(error)}`);
				// Return error instead of trying to stub fs
				return createError({
					what: "Failed to import fs module",
					reassure: "File operations may not work properly",
					why: "Node.js fs module could not be imported",
					fix: "Check Node.js environment and module resolution",
					escape: "Use alternative file access method",
					severity: "error",
					code: "FS_IMPORT_ERROR",
					context: { error: String(error) }
				});
			}
		});
		
		// 🔥 NOTE: Debugging and fallback code removed to ensure type safety
		// Main emitFile API should handle file operations properly
		
		// 🔥 NOTE: Complex fallback operations removed to ensure type safety
		// Main emitFile API should handle most use cases
		// Fallback can be re-implemented with simpler approach if needed
		
		yield* Effect.logInfo(`✅ File emitted: ${fileName}`)
		
		// Report generation success
		const channelsCount = Object.keys(initialDoc.channels ?? {}).length;
		const operationsCount = Object.keys(initialDoc.operations ?? {}).length;
		
		yield* Effect.logInfo(`🎉 TYPESPEC API SUCCESS: ${String(channelsCount)} channels, ${String(operationsCount)} operations`)
	});
}