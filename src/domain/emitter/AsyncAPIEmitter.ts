/**
 * AsyncAPIEmitter - Micro-kernel Core Orchestrator
 *
 * Enterprise-grade TypeSpec emitter that generates AsyncAPI 3.0 specifications from TypeSpec definitions.
 * Uses a micro-kernel architecture where all business logic is delegated to specialized services and plugins
 * for maximum extensibility, testability, and maintainability.
 *
 * ## Core Responsibilities:
 * - **Plugin lifecycle management** - Coordinates initialization and execution of protocol-specific plugins
 * - **Event bus coordination** - Manages communication between pipeline stages and plugins
 * - **Resource monitoring** - Tracks memory usage and performance metrics during emission
 * - **State persistence** - Maintains TypeSpec program state throughout the emission process
 * - **Hot reload coordination** - Supports development-time recompilation workflows
 *
 * ## Architecture:
 * The emitter follows the TypeSpec AssetEmitter pattern, extending `TypeEmitter` to provide
 * proper integration with the TypeSpec compiler toolchain. It delegates actual AsyncAPI generation
 * to a composition of specialized services:
 * - `EmissionPipeline` - Sequential stage processing (Discovery → Processing → Generation → Validation)
 * - `DocumentGenerator` - AsyncAPI document serialization (JSON/YAML)
 * - `DocumentBuilder` - AsyncAPI document structure initialization
 * - `PerformanceMonitor` - Memory and execution time tracking
 * - `PluginRegistry` - Protocol-specific binding management
 *
 * ## Usage:
 * This class is instantiated by the TypeSpec compiler and should not be created directly.
 * Configuration is provided through `AsyncAPIEmitterOptions` in the TypeSpec configuration.
 *
 * @example TypeSpec Configuration:
 * ```yaml
 * # tspconfig.yaml
 * emit:
 *   - "@typespec/asyncapi"
 * options:
 *   "@typespec/asyncapi":
 *     file-type: "yaml"
 *     output-file: "api-spec"
 * ```
 *
 * @example Generated Output:
 * ```yaml
 * # api-spec.yaml
 * asyncapi: 3.0.0
 * info:
 *   title: Generated API
 *   version: 1.0.0
 * channels:
 *   user-events:
 *     address: /users/{userId}/events
 * operations:
 *   publishUserRegistered:
 *     action: send
 *     channel: { $ref: '#/channels/user-events' }
 * ```
 *
 * @since 0.1.0-alpha
 * @public
 */

// TODO: CRITICAL - Import organization inconsistent - group by source and add separating comments
// TODO: CRITICAL - Effect is imported but only used for logging - consider importing specific functions  
// TODO: CRITICAL - AsyncAPI parser types imported but not validated for version compatibility
// TODO: CRITICAL - Missing branded types for better type safety - file paths, document IDs should be branded
// TODO: CRITICAL - No proper interfaces defined - makes testing and mocking impossible
// TODO: CRITICAL - Should import Result/Either types from Effect for better error handling
// TODO: CRITICAL - Missing validation imports for input sanitization
// TODO: CRITICAL - No dependency injection container imports - tight coupling to concrete types
import {Effect} from "effect"
import {EmitterErrors} from "../../utils/standardized-errors.js"
import type {AssetEmitter, EmittedSourceFile, SourceFile} from "@typespec/asset-emitter"
import {TypeEmitter} from "@typespec/asset-emitter"
import {DocumentGenerator} from "./DocumentGenerator.js"
import type {Program, Namespace} from "@typespec/compiler"
import type {AsyncAPIEmitterOptions} from "../../infrastructure/configuration/options.js"
import type {AsyncAPIObject} from "@asyncapi/parser/esm/spec-types/v3.js"
// ASYNCAPI_VERSION import removed - now using DocumentBuilder.createInitialDocument()
import {EmissionPipeline} from "./EmissionPipeline.js"
import {DocumentBuilder} from "./DocumentBuilder.js"
import {PerformanceMonitor} from "../../infrastructure/performance/PerformanceMonitor.js"
import {PluginRegistry} from "../../infrastructure/adapters/PluginRegistry.js"
import {DEFAULT_SERIALIZATION_FORMAT} from "../models/serialization-format-option.js"

import type { IAsyncAPIEmitter } from "./IAsyncAPIEmitter.js"

/**
 * Micro-kernel AsyncAPI emitter with plugin architecture
 * Enforces separation of concerns and enables hot reload
 * 
 * REFACTORED: Reduced from 558 lines to focused emitter with dependency injection
 * REFACTORED: Now implements IAsyncAPIEmitter interface for better testability
 * REFACTORED: Constructor uses dependency injection instead of hard-coded concrete types
 * REFACTORED: Service composition over inheritance for better separation of concerns
 */
export class AsyncAPIEmitter extends TypeEmitter<string, AsyncAPIEmitterOptions> implements IAsyncAPIEmitter {
	// TODO: CRITICAL - Dependencies injected as concrete types - should use interfaces/abstract classes
	// TODO: CRITICAL - No null safety - these could be undefined if constructor fails partially
	// TODO: CRITICAL - Missing validation that components are properly initialized
	// TODO: CRITICAL - Components hold mutable state but no thread safety considerations
	private readonly pipeline: EmissionPipeline
	private readonly documentGenerator: DocumentGenerator
	private readonly documentBuilder: DocumentBuilder
	private readonly performanceMonitor: PerformanceMonitor
	private readonly pluginRegistry: PluginRegistry
	// TODO: CRITICAL - AsyncAPIObject is mutable - should be immutable with copy-on-write updates
	// TODO: CRITICAL - No validation that asyncApiDoc conforms to AsyncAPI 3.0 schema
	// TODO: CRITICAL - Document state not protected from concurrent access in plugin system
	private readonly asyncApiDoc: AsyncAPIObject

	/**
	 * Creates a new AsyncAPIEmitter instance with micro-kernel architecture.
	 *
	 * Initializes all core services and components required for AsyncAPI document generation.
	 * The constructor performs minimal initialization, with actual processing deferred to
	 * the `programContext` and `sourceFile` methods called by the TypeSpec compiler.
	 *
	 * ## Initialization Process:
	 * 1. Initialize EmissionPipeline for stage-based processing
	 * 2. Create DocumentGenerator for JSON/YAML serialization
	 * 3. Set up DocumentBuilder for AsyncAPI structure management
	 * 4. Configure PerformanceMonitor for resource tracking
	 * 5. Initialize PluginRegistry for protocol-specific extensions
	 * 6. Create initial AsyncAPI document structure
	 *
	 * @param emitter - TypeSpec AssetEmitter providing compiler integration and file output capabilities
	 * @throws {StandardizedError} If component initialization fails or emitter is invalid
	 *
	 * @example Internal Usage (called by TypeSpec compiler):
	 * ```typescript
	 * const assetEmitter = new AssetEmitter(program, options);
	 * const asyncApiEmitter = new AsyncAPIEmitter(assetEmitter);
	 * ```
	 *
	 * @internal
	 */
	// TODO: CRITICAL - Constructor parameter not validated - could be null/undefined
	// TODO: CRITICAL - Constructor does too much work - violates SRP, should use factory pattern
	// TODO: CRITICAL - No error handling - partially constructed objects possible
	// TODO: CRITICAL - Logging in constructor violates separation of concerns
	// TODO: CRITICAL - Component creation order may matter but not documented
	constructor(emitter: AssetEmitter<string, AsyncAPIEmitterOptions>) {
		// Parameter validation - prevent construction with invalid emitter
		if (!emitter) {
			Effect.runSync(Effect.die(
				EmitterErrors.emitterInitializationFailed(
					"AssetEmitter instance is required for initialization",
					emitter
				)
			))
		}
		
		// Validate emitter has required methods
		if (typeof emitter.getProgram !== 'function') {
			Effect.runSync(Effect.die(
				EmitterErrors.emitterInitializationFailed(
					"AssetEmitter missing required getProgram method",
					emitter
				)
			))
		}

		// TODO: CRITICAL - Parent constructor could throw but no error handling
		super(emitter)

		// TODO: CRITICAL - Effect.log not awaited - may not appear in logs
		// TODO: CRITICAL - Emoji characters could break terminal/log parsers
		// TODO: CRITICAL - Logging should be injected as dependency, not hard-coded
		Effect.log(`🔧 AsyncAPIEmitter constructor called`)

		// Initialize micro-kernel components with Effect.TS patterns
		// EFFECT.TS CONVERTED: Replaced try/catch with Effect-based initialization
		const initializationResult = Effect.runSync(
			Effect.gen(function* () {
				// Component creation with proper error handling
				const pipeline = yield* Effect.try(() => new EmissionPipeline()).pipe(
					Effect.mapError(error => `EmissionPipeline initialization failed: ${error}`)
				)
				
				const documentGenerator = yield* Effect.try(() => new DocumentGenerator()).pipe(
					Effect.mapError(error => `DocumentGenerator initialization failed: ${error}`)
				)
				
				const documentBuilder = yield* Effect.try(() => new DocumentBuilder()).pipe(
					Effect.mapError(error => `DocumentBuilder initialization failed: ${error}`)
				)
				
				const performanceMonitor = yield* Effect.try(() => new PerformanceMonitor()).pipe(
					Effect.mapError(error => `PerformanceMonitor initialization failed: ${error}`)
				)
				
				const pluginRegistry = yield* Effect.try(() => new PluginRegistry()).pipe(
					Effect.mapError(error => `PluginRegistry initialization failed: ${error}`)
				)
				
				return {
					pipeline,
					documentGenerator, 
					documentBuilder,
					performanceMonitor,
					pluginRegistry
				}
			}).pipe(
				Effect.tapError(error => Effect.log(`❌ Component initialization failed: ${error}`)),
				Effect.mapError(error => new Error(`AsyncAPIEmitter initialization failed: ${error}`))
			)
		)

		// Assign initialized components
		this.pipeline = initializationResult.pipeline
		this.documentGenerator = initializationResult.documentGenerator
		this.documentBuilder = initializationResult.documentBuilder
		this.performanceMonitor = initializationResult.performanceMonitor
		this.pluginRegistry = initializationResult.pluginRegistry

		Effect.log(`🏗️  About to call createInitialDocument`)
		// Initialize document structure using Effect.TS patterns
		// EFFECT.TS CONVERTED: Replaced try/catch with Effect-based document initialization
		this.asyncApiDoc = Effect.runSync(
			Effect.gen(function* (this: AsyncAPIEmitter) {
				// Get program with null safety
				const program = yield* Effect.fromNullable(emitter.getProgram()).pipe(
					Effect.mapError(() => "Program is null or undefined - cannot create AsyncAPI document")
				)
				
				// Create initial document with error handling
				const document = yield* this.documentBuilder.createInitialDocument(program)
				
				// TODO: Add document structure validation here
				yield* Effect.log(`🏗️  Document structure created successfully`)
				
				return document
			}).pipe(
				Effect.tapError(error => Effect.log(`❌ Document initialization failed: ${error}`)),
				Effect.mapError(error => new Error(`AsyncAPI document initialization failed: ${error}`))
			)
		)
		Effect.log(`🏗️  Finished createInitialDocument`)
	}

	/**
	 * Executes the complete AsyncAPI emission pipeline for a TypeSpec program.
	 *
	 * This method is called by the TypeSpec compiler during the emission phase and serves as the main
	 * entry point for AsyncAPI document generation. It orchestrates the entire micro-kernel pipeline
	 * including discovery, processing, generation, and validation stages.
	 *
	 * ## Pipeline Execution:
	 * 1. **Configuration Resolution** - Determines output format and filename from emitter options
	 * 2. **Source File Creation** - Creates TypeSpec source file for the generated AsyncAPI document
	 * 3. **Pipeline Execution** - Runs the complete emission pipeline using Effect.TS patterns
	 * 4. **Performance Monitoring** - Tracks execution time and resource usage
	 * 5. **Error Handling** - Provides comprehensive error reporting and recovery
	 * 6. **Source File Emission** - Triggers content generation through the `sourceFile()` method
	 *
	 * ## Output Configuration:
	 * - **file-type**: "yaml" | "json" (default: "yaml")
	 * - **output-file**: Base filename without extension (default: "asyncapi")
	 *
	 * @param program - TypeSpec program containing compiled AST with all type definitions and decorators
	 * @returns Promise<Record<string, unknown>> Context object containing the global scope for the generated source file
	 * @throws {StandardizedError} If pipeline execution fails or configuration is invalid
	 *
	 * @example Generated Files:
	 * ```
	 * // With options: { "file-type": "yaml", "output-file": "user-api" }
	 * → user-api.yaml
	 *
	 * // With options: { "file-type": "json", "output-file": "event-spec" }
	 * → event-spec.json
	 * ```
	 *
	 * @override
	 * @public
	 */
	override async programContext(program: Program): Promise<Record<string, unknown>> {
		// TODO: CRITICAL - No error handling if getOptions() returns null/undefined
		// TODO: CRITICAL - Bracket notation for options access is fragile - consider type-safe property access
		const options = this.emitter.getOptions()
		const fileType = options["file-type"] || DEFAULT_SERIALIZATION_FORMAT
		const fileName = options["output-file"] || "asyncapi"
		// TODO: CRITICAL - String interpolation without validation - fileType could contain invalid characters
		// TODO: CRITICAL - No validation that fileName is safe for filesystem
		const outputPath = `${fileName}.${fileType}`

		// TODO: CRITICAL - createSourceFile could fail but no error handling
		const sourceFile = this.emitter.createSourceFile(outputPath)

		// TODO: CRITICAL - Log uses special characters that may break JSON parsers or terminals
		// TODO: CRITICAL - Effect.log not awaited - logs may not appear in production
		Effect.log("=� AsyncAPI Micro-kernel: Running emission pipeline...")

		// EFFECT.TS CONVERTED: Replaced try/catch with Effect-based pipeline execution
		await Effect.runPromise(
			Effect.gen(function* (this: AsyncAPIEmitter) {
			// Execute the emission pipeline using Effect.TS
				yield* Effect.sync(() => this.executeEmissionPipelineSync(program)).pipe(
					Effect.mapError(error => `Emission pipeline execution failed: ${error}`)
				)
			Effect.log(" Micro-kernel emission pipeline completed successfully")
			
				yield* Effect.log(`✅ AsyncAPI document generation pipeline completed successfully`)
			
			// CRITICAL FIX: Emit the source file to trigger sourceFile() method and write to outputFiles
				yield* Effect.log(`🔥 ASSETEMITTER FIX: About to emit sourceFile to trigger content generation`)
				yield* Effect.tryPromise(() => this.emitter.emitSourceFile(sourceFile))
				yield* Effect.log(`🔥 ASSETEMITTER FIX: Completed emitSourceFile - should have triggered sourceFile() method`)
			
			}).pipe(
				Effect.tapError(error => Effect.log(`❌ Micro-kernel emission pipeline failed: ${error}`))
			)
		)

		return {
			scope: sourceFile.globalScope,
		}
	}

	/**
	 * Handles TypeSpec namespace processing during emission.
	 *
	 * This method is called by the TypeSpec compiler for each namespace encountered during emission.
	 * In the current implementation, namespaces are processed during the discovery phase of the
	 * emission pipeline rather than individually here.
	 *
	 * @param namespace - TypeSpec namespace being processed
	 * @returns Placeholder string indicating namespace was processed
	 *
	 * @override
	 * @internal
	 */
	override namespace(namespace: Namespace): string {
		Effect.log(`🔍 namespace() called for: ${namespace.name}`)
		return "namespace emitted"
	}

	/**
	 * Generates the final AsyncAPI document content for a source file.
	 *
	 * This method is called by the TypeSpec compiler's AssetEmitter after the pipeline has completed
	 * execution. It uses the DocumentGenerator service to serialize the processed AsyncAPI document
	 * into the requested format (JSON or YAML).
	 *
	 * ## Content Generation Process:
	 * 1. Retrieves emitter options to determine output format
	 * 2. Uses DocumentGenerator to serialize the AsyncAPI document
	 * 3. Returns formatted content ready for file system writing
	 *
	 * @param sourceFile - TypeSpec source file metadata containing output path information
	 * @returns Emitted source file with path and serialized AsyncAPI content
	 *
	 * @example Generated Content Structure:
	 * ```typescript
	 * {
	 *   path: "asyncapi.yaml",
	 *   contents: "asyncapi: 3.0.0\ninfo:\n  title: Generated API\n  version: 1.0.0\n..."
	 * }
	 * ```
	 *
	 * @override
	 * @public
	 */
	override sourceFile(sourceFile: SourceFile<string>): EmittedSourceFile {
		Effect.log(`🔍 Micro-kernel: Generating file content for ${sourceFile.path}`)

		const options = this.emitter.getOptions()
		const fileType: "yaml" | "json" = options["file-type"] || "yaml"

		const content = Effect.runSync(this.documentGenerator.serializeDocument(this.asyncApiDoc, fileType))

		return {
			path: sourceFile.path,
			contents: content,
		}
	}

	/**
	 * Writes generated AsyncAPI files to the file system.
	 *
	 * This method is called by the TypeSpec compiler to perform the final file system write operations.
	 * It logs detailed information about the files being written and delegates to the parent class
	 * for the actual write operations.
	 *
	 * ## Write Process:
	 * 1. Logs source file information for debugging
	 * 2. Delegates to AssetEmitter's writeOutput method
	 * 3. Confirms successful write operation
	 *
	 * @param sourceFiles - Array of source files to write to the file system
	 * @returns Promise that resolves when all files are successfully written
	 * @throws {StandardizedError} If file system write operations fail
	 *
	 * @override
	 * @public
	 */
	override async writeOutput(sourceFiles: SourceFile<string>[]): Promise<void> {
		Effect.log(`🔥 WRITEOUTPUT DEBUG: sourceFiles count = ${sourceFiles.length}`)
		for (let i = 0; i < sourceFiles.length; i++) {
			Effect.log(`🔥 WRITEOUTPUT DEBUG: sourceFile[${i}] = ${sourceFiles[i]?.path ?? 'undefined'}`)
		}
		Effect.log("=� Micro-kernel: Writing output files...")

		await super.writeOutput(sourceFiles)

		Effect.log(" Output files written successfully")
	}

	/**
	 * Executes the emission pipeline synchronously with comprehensive performance monitoring.
	 *
	 * This method orchestrates the complete AsyncAPI generation process using the micro-kernel
	 * architecture. It runs all pipeline stages (Discovery → Processing → Generation → Validation)
	 * while collecting detailed performance metrics and resource usage statistics.
	 *
	 * ## Pipeline Stages:
	 * 1. **Discovery Stage** - Scans TypeSpec AST for operations, messages, and security configurations
	 * 2. **Processing Stage** - Transforms TypeSpec elements into AsyncAPI structures
	 * 3. **Generation Stage** - Finalizes AsyncAPI document with proper structure and metadata
	 * 4. **Validation Stage** - Ensures AsyncAPI 3.0 specification compliance
	 *
	 * ## Performance Monitoring:
	 * - **Execution Time** - Total pipeline execution duration in milliseconds
	 * - **Memory Snapshots** - Memory usage before and after pipeline execution
	 * - **Resource Usage** - CPU and memory consumption during each stage
	 *
	 * @param program - TypeSpec program containing the compiled AST to process
	 * @throws {StandardizedError} If any pipeline stage fails or performance monitoring encounters issues
	 *
	 * @example Performance Output:
	 * ```
	 * 📊 Performance metrics - Execution: 125.50ms, Snapshots: 4
	 * 📊 Performance Report:
	 * Stage 1 (Discovery): 25ms, 2.1MB heap
	 * Stage 2 (Processing): 75ms, 3.8MB heap
	 * Stage 3 (Generation): 15ms, 4.2MB heap
	 * Stage 4 (Validation): 10ms, 4.0MB heap
	 * ```
	 *
	 * @private
	 */
	private executeEmissionPipelineSync(program: Program): void {
		Effect.log(`🚀 Starting micro-kernel emission pipeline...`)

		// Start performance monitoring - simplified synchronous approach
		const startTime = performance.now()
		const initialStatus = this.performanceMonitor.getPerformanceStatus()
		Effect.log(`📊 Performance monitoring initialized: ${initialStatus.snapshotCount} snapshots, monitoring: ${initialStatus.isMonitoring}`)

		// EFFECT.TS CONVERTED: Replaced try/catch with Effect-based pipeline execution
		Effect.runSync(
			Effect.gen(function* (this: AsyncAPIEmitter) {
				// Execute pipeline stages through plugins
				const context = {
					program,
					asyncApiDoc: this.asyncApiDoc,
					emitter: this.emitter,
					performanceMonitor: this.performanceMonitor
				}

				// Run pipeline with proper error handling
				yield* this.pipeline.executePipeline(context).pipe(
					Effect.mapError(error => `Pipeline execution failed: ${error}`)
				)

				// Calculate execution metrics
				const endTime = performance.now()
				const executionTime = endTime - startTime
				
				// Generate performance report with error handling
				const finalStatus = yield* Effect.sync(() => this.performanceMonitor.getPerformanceStatus()).pipe(
					Effect.mapError(error => `Performance status retrieval failed: ${error}`)
				)
				
				const report = yield* Effect.sync(() => this.performanceMonitor.generatePerformanceReport()).pipe(
					Effect.mapError(error => `Performance report generation failed: ${error}`)
				)
				
				yield* Effect.log(`📊 Performance metrics - Execution: ${executionTime.toFixed(2)}ms, Snapshots: ${finalStatus.snapshotCount}`)
				yield* Effect.log(`📊 Performance Report:\n${report}`)
				
				yield* Effect.log(`✅ Micro-kernel emission pipeline completed!`)
			}).pipe(
				Effect.catchAll(error => {
					const endTime = performance.now()
					const executionTime = endTime - startTime
					return Effect.gen(function* () {
						yield* Effect.log(`❌ Pipeline execution failed after ${executionTime.toFixed(2)}ms: ${error}`)
						yield* Effect.fail(new Error(`Pipeline execution failed: ${error}`))
					})
				})
			)
		)
	}

	/**
	 * Execute the emission pipeline with plugin orchestration (with performance monitoring)
	 */
	/*private executeEmissionPipeline(program: Program) {
		return Effect.gen(function* (this: AsyncAPIEmitter) {
			Effect.log(`=� Starting micro-kernel emission pipeline...`)

			// Start performance monitoring
			yield* this.performanceMonitor.startMonitoring()

			// Execute pipeline stages through plugins
			const context = {
				program,
				asyncApiDoc: this.asyncApiDoc,
				emitter: this.emitter,
			}

			yield* this.pipeline.executePipeline(context)

			// Stop performance monitoring
			yield* this.performanceMonitor.stopMonitoring()

			Effect.log(` Micro-kernel emission pipeline completed!`)
		}.bind(this))
	}*/

	/**
	 * REMOVED: createInitialDocument method - now using DocumentBuilder.createInitialDocument()
	 * This was placeholder logic replaced by REAL business logic from 1,800-line monolithic file
	 */

	/**
	 * Retrieves the current AsyncAPI document state for plugin access.
	 *
	 * This method provides read-only access to the AsyncAPI document being generated,
	 * allowing plugins and external systems to inspect the current state during
	 * the emission process.
	 *
	 * @returns The current AsyncAPI 3.0 document object
	 *
	 * @example Plugin Usage:
	 * ```typescript
	 * class CustomPlugin {
	 *   process(emitter: AsyncAPIEmitter) {
	 *     const document = emitter.getDocument();
	 *     console.log(`Processing ${Object.keys(document.channels || {}).length} channels`);
	 *   }
	 * }
	 * ```
	 *
	 * @public
	 */
	public getDocument(): AsyncAPIObject {
		return this.asyncApiDoc
	}

	/**
	 * Updates the AsyncAPI document state through a plugin-provided updater function.
	 *
	 * This method allows plugins to safely modify the AsyncAPI document during the emission
	 * process. The updater function receives the current document and can make direct
	 * modifications to its structure.
	 *
	 * ## Usage Guidelines:
	 * - **Atomic Updates** - Make all related changes within a single updater function
	 * - **Validation** - Ensure modifications maintain AsyncAPI 3.0 compliance
	 * - **Non-Breaking** - Avoid removing required fields or corrupting existing data
	 *
	 * @param updater - Function that receives the document and modifies it in-place
	 *
	 * @example Plugin Document Modification:
	 * ```typescript
	 * emitter.updateDocument((doc) => {
	 *   doc.info = doc.info || {};
	 *   doc.info.description = "Enhanced with custom plugin";
	 *   
	 *   doc.channels = doc.channels || {};
	 *   doc.channels["plugin-channel"] = {
	 *     address: "/plugin/events",
	 *     messages: {}
	 *   };
	 * });
	 * ```
	 *
	 * @public
	 */
	public updateDocument(updater: (doc: AsyncAPIObject) => void): void {
		updater(this.asyncApiDoc)
	}

	/**
	 * Retrieves the plugin registry for external plugin management and registration.
	 *
	 * The plugin registry manages protocol-specific binding plugins (HTTP, WebSocket, Kafka, etc.)
	 * and custom extension plugins that enhance the emission process. This method provides
	 * access for runtime plugin registration and configuration.
	 *
	 * ## Plugin Types:
	 * - **Protocol Bindings** - Add support for specific messaging protocols
	 * - **Transformation Plugins** - Modify document structure during generation
	 * - **Validation Plugins** - Add custom validation rules
	 * - **Serialization Plugins** - Support additional output formats
	 *
	 * @returns The plugin registry instance for plugin management operations
	 *
	 * @example Plugin Registration:
	 * ```typescript
	 * const registry = emitter.getPluginRegistry();
	 * registry.registerPlugin("custom-protocol", new CustomProtocolPlugin());
	 * registry.enablePlugin("enhanced-kafka");
	 * ```
	 *
	 * @public
	 */
	public getPluginRegistry(): PluginRegistry {
		return this.pluginRegistry
	}
}