/**
 * AsyncAPIEmitter - Micro-kernel Core Orchestrator
 *
 * This is the minimal core that orchestrates the emission pipeline.
 * All business logic is delegated to plugins for maximum extensibility.
 *
 * Core Responsibilities:
 * - Plugin lifecycle management
 * - Event bus coordination
 * - Resource monitoring
 * - State persistence
 * - Hot reload coordination
 */

// TODO: CRITICAL - Import organization inconsistent - group by source and add separating comments
// TODO: CRITICAL - Effect is imported but only used for logging - consider importing specific functions
// TODO: CRITICAL - AsyncAPI parser types imported but not validated for version compatibility
import {Effect} from "effect"
import type {AssetEmitter, EmittedSourceFile, SourceFile} from "@typespec/asset-emitter"
import {TypeEmitter} from "@typespec/asset-emitter"
import type {Program, Namespace} from "@typespec/compiler"
import type {AsyncAPIEmitterOptions} from "../options.js"
import type {AsyncAPIObject} from "@asyncapi/parser/esm/spec-types/v3.js"
// ASYNCAPI_VERSION import removed - now using DocumentBuilder.createInitialDocument()
import {EmissionPipeline} from "./EmissionPipeline.js"
import {DocumentGenerator} from "./DocumentGenerator.js"
import {DocumentBuilder} from "./DocumentBuilder.js"
import {PerformanceMonitor} from "./PerformanceMonitor.js"
import {PluginRegistry} from "./PluginRegistry.js"
import {DEFAULT_SERIALIZATION_FORMAT} from "./serialization-format-option.js"

/**
 * Micro-kernel AsyncAPI emitter with plugin architecture
 * Enforces separation of concerns and enables hot reload
 */
export class AsyncAPIEmitter extends TypeEmitter<string, AsyncAPIEmitterOptions> {
	private readonly pipeline: EmissionPipeline
	private readonly documentGenerator: DocumentGenerator
	private readonly documentBuilder: DocumentBuilder
	private readonly performanceMonitor: PerformanceMonitor
	private readonly pluginRegistry: PluginRegistry
	private readonly asyncApiDoc: AsyncAPIObject

	// TODO: CRITICAL - Constructor parameter validation missing - emitter could be null/undefined
	// TODO: CRITICAL - No error handling for component initialization failures
	constructor(emitter: AssetEmitter<string, AsyncAPIEmitterOptions>) {
		super(emitter)

		Effect.log(`🔧 AsyncAPIEmitter constructor called`)

		// Initialize micro-kernel components with REAL business logic
		// TODO: CRITICAL - Component initialization could fail but no error handling
		// TODO: CRITICAL - No dependency injection - hard to test and mock components
		// TODO: CRITICAL - Components created without configuration - should pass options
		this.pipeline = new EmissionPipeline()
		this.documentGenerator = new DocumentGenerator()
		this.documentBuilder = new DocumentBuilder()
		this.performanceMonitor = new PerformanceMonitor()
		this.pluginRegistry = new PluginRegistry()

		Effect.log(`🏗️  About to call createInitialDocument`)
		// Initialize document structure using REAL DocumentBuilder logic
		// TODO: CRITICAL - Document initialization could fail but no error handling
		// TODO: CRITICAL - emitter.getProgram() called without null safety check
		this.asyncApiDoc = this.documentBuilder.createInitialDocument(emitter.getProgram())
		Effect.log(`🏗️  Finished createInitialDocument`)
	}

	// TODO: CRITICAL - Override method lacks explicit return type annotation
	// TODO: CRITICAL - Method parameter 'program' not used but not marked as unused with underscore
	override programContext(program: Program): Record<string, unknown> {
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

		try {
			// Execute the emission pipeline using Effect.TS
			this.executeEmissionPipelineSync(program)
			Effect.log(" Micro-kernel emission pipeline completed successfully")
		} catch (error) {
			Effect.log(`L Micro-kernel emission pipeline failed: ${error}`)
			throw error
		}

		return {
			scope: sourceFile.globalScope,
		}
	}

	// Add namespace method to handle global namespace emission
	override namespace(namespace: Namespace): string {
		Effect.log(`🔍 namespace() called for: ${namespace.name}`)
		return "namespace emitted"
	}

	override sourceFile(sourceFile: SourceFile<string>): EmittedSourceFile {
		Effect.log(`🔍 Micro-kernel: Generating file content for ${sourceFile.path}`)

		const options = this.emitter.getOptions()
		const fileType: "yaml" | "json" = options["file-type"] || "yaml"

		const content = this.documentGenerator.serializeDocument(this.asyncApiDoc, fileType)

		return {
			path: sourceFile.path,
			contents: content,
		}
	}

	override async writeOutput(sourceFiles: SourceFile<string>[]): Promise<void> {
		Effect.log("=� Micro-kernel: Writing output files...")

		await super.writeOutput(sourceFiles)

		Effect.log(" Output files written successfully")
	}

	/**
	 * Execute the emission pipeline synchronously with performance monitoring
	 */
	private executeEmissionPipelineSync(program: Program): void {
		Effect.log(`🚀 Starting micro-kernel emission pipeline...`)

		// Start performance monitoring - simplified synchronous approach
		const startTime = performance.now()
		const initialStatus = this.performanceMonitor.getPerformanceStatus()
		Effect.log(`📊 Performance monitoring initialized: ${initialStatus.snapshotCount} snapshots, monitoring: ${initialStatus.isMonitoring}`)

		try {
			// Execute pipeline stages through plugins
			const context = {
				program,
				asyncApiDoc: this.asyncApiDoc,
				emitter: this.emitter,
				performanceMonitor: this.performanceMonitor
			}

			// Run pipeline synchronously using Effect.runSync
			Effect.runSync(this.pipeline.executePipeline(context))

			// Calculate execution metrics
			const endTime = performance.now()
			const executionTime = endTime - startTime
			
			// Generate performance report
			const finalStatus = this.performanceMonitor.getPerformanceStatus()
			const report = this.performanceMonitor.generatePerformanceReport()
			
			Effect.log(`📊 Performance metrics - Execution: ${executionTime.toFixed(2)}ms, Snapshots: ${finalStatus.snapshotCount}`)
			Effect.log(`📊 Performance Report:\n${report}`)
			
		} catch (error) {
			const endTime = performance.now()
			const executionTime = endTime - startTime
			Effect.log(`❌ Pipeline execution failed after ${executionTime.toFixed(2)}ms: ${error}`)
			throw error
		}
		
		Effect.log(`✅ Micro-kernel emission pipeline completed!`)
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
	 * Get current document state (for plugin access)
	 */
	public getDocument(): AsyncAPIObject {
		return this.asyncApiDoc
	}

	/**
	 * Update document state (for plugin modifications)
	 */
	public updateDocument(updater: (doc: AsyncAPIObject) => void): void {
		updater(this.asyncApiDoc)
	}

	/**
	 * Get plugin registry for external plugin management
	 */
	public getPluginRegistry(): PluginRegistry {
		return this.pluginRegistry
	}
}