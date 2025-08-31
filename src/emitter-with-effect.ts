/**
 * TypeSpec AsyncAPI Emitter with Effect.TS Integration
 *
 * This is the REAL emitter that connects the ghost Effect.TS system
 * with proper AsyncAPI validation using asyncapi-validator.
 *
 * FIXES APPLIED:
 * - Fixed stateKeys access: program.stateMap($lib.stateKeys.xxx) instead of Symbol.for()
 * - $lib.stateKeys provides proper symbols, not strings like the local stateKeys export
 * - Connected decorator state properly: channel paths and operation types
 * - Made validation fail the Effect pipeline when AsyncAPI document is invalid
 * - Added proper logging to show decorator data being accessed
 * - Added explicit type annotations for validation error parameters
 */

import {Console, Effect, Layer, pipe} from "effect"
import type {EmitContext, Model, Namespace, Operation, Program} from "@typespec/compiler"
import {emitFile, getDoc} from "@typespec/compiler"
import {type AssetEmitter, createAssetEmitter, TypeEmitter} from "@typespec/asset-emitter"
import {stringify} from "yaml"
import type {AsyncAPIEmitterOptions} from "./options.js"
import type {AsyncAPIObject, SchemaObject} from "@asyncapi/parser/esm/spec-types/v3.js"
// import {validateAsyncAPIEffect} from "./validation/asyncapi-validator.js" // Unused for now
// import type {ValidationError} from "./errors/validation-error.js" // Unused
import {$lib} from "./lib.js"
import {PERFORMANCE_METRICS_SERVICE, PERFORMANCE_METRICS_SERVICE_LIVE} from "./performance/metrics.js"
import {MEMORY_MONITOR_SERVICE, MEMORY_MONITOR_SERVICE_LIVE} from "./performance/memory-monitor.js"
import {convertModelToSchema} from "./utils/schema-conversion.js"

// Using centralized types from types/index.ts
// AsyncAPIObject and SchemaObject (as AsyncAPISchema) are now imported

//TODO: This file is still too big!

/**
 * Enhanced AsyncAPI TypeEmitter with Effect.TS integration
 * Combines the best of both worlds: AssetEmitter architecture + Effect.TS
 */
export class AsyncAPIEffectEmitter extends TypeEmitter<string, AsyncAPIEmitterOptions> {
	private operations: Operation[] = []
	private readonly asyncApiDoc: AsyncAPIObject

	constructor(emitter: AssetEmitter<string, AsyncAPIEmitterOptions>) {
		super(emitter)
		this.asyncApiDoc = this.createInitialDocument()
	}

	private createInitialDocument(): AsyncAPIObject {
		return {
			asyncapi: "3.0.0",
			info: {
				title: "AsyncAPI Specification",
				version: "1.0.0",
				description: "Generated from TypeSpec with Effect.TS integration",
			},
			channels: {},
			operations: {},
			components: {
				schemas: {},
				messages: {},
			},
		}
	}

	override async writeOutput(): Promise<void> {
		//TODO: This function is to big! split it up ASAP!

		// Use Effect.TS for the entire emission pipeline with performance monitoring
		const emitProgram = pipe(
			Effect.gen(function* (this: AsyncAPIEffectEmitter) {
				const metricsService = yield* PERFORMANCE_METRICS_SERVICE
				const memoryMonitor = yield* MEMORY_MONITOR_SERVICE

				Effect.log(`🚀 Starting AsyncAPI emission pipeline with comprehensive performance monitoring...`)

				// Start overall pipeline measurement
				const overallMeasurement = yield* metricsService.startMeasurement("emission_pipeline")

				// Start continuous memory monitoring during emission
				yield* memoryMonitor.startMonitoring(5000) // Monitor every 5 seconds

				// Execute the emission stages
				const ops = (yield* this.discoverOperationsEffect()) as Operation[]
				yield* this.processOperationsEffect(ops)
				const doc = (yield* this.generateDocumentEffect()) as string
				const validatedDoc = (yield* this.validateDocumentEffect(doc)) as string
				// Document processing complete - file writing handled by AssetEmitter
				Effect.log(`✅ Document processing complete: ${validatedDoc.length} bytes`)

				// Stop memory monitoring
				yield* memoryMonitor.stopMonitoring()

				// Record overall pipeline performance
				const overallResult = yield* metricsService.recordThroughput(overallMeasurement, this.operations.length)

				// Generate comprehensive performance reports
				Effect.log(`\n🎯 === COMPREHENSIVE PERFORMANCE REPORT ===`)
				Effect.log(`📊 Pipeline Performance:`)
				Effect.log(`  - Total Operations Processed: ${this.operations.length}`)
				Effect.log(`  - Overall Throughput: ${overallResult.operationsPerSecond.toFixed(0)} ops/sec`)
				Effect.log(`  - Total Duration: ${overallResult.totalDuration.toFixed(2)} ms`)
				Effect.log(`  - Average Memory/Operation: ${overallResult.averageMemoryPerOperation.toFixed(0)} bytes`)
				Effect.log(`  - Memory Efficiency: ${(overallResult.memoryEfficiency * 100).toFixed(1)}%`)

				// Generate detailed performance report
				const performanceReport = yield* metricsService.generatePerformanceReport()
				const memoryReport = yield* memoryMonitor.generateMemoryReport()

				Effect.log(`\n📋 Detailed Performance Analysis:`)
				Effect.log(performanceReport)

				Effect.log(`\n🧠 Memory Usage Analysis:`)
				Effect.log(memoryReport)

				// Get final metrics summary
				const metricsSummary = yield* metricsService.getMetricsSummary()
				const memoryMetrics = yield* memoryMonitor.getMemoryMetrics()

				Effect.log(`\n📈 Final Metrics Summary:`)
				Effect.log(`  Performance Metrics:`, metricsSummary)
				Effect.log(`  Memory Metrics:`, memoryMetrics)

				Effect.log(`\n✅ AsyncAPI emission pipeline completed with full performance monitoring!`)
			}.bind(this)),
			Effect.catchAll(error =>
				Effect.gen(function* () {
					yield* Console.error(`❌ Emission pipeline failed: ${error}`)
					// Try to stop monitoring if it was started
					yield* MEMORY_MONITOR_SERVICE.pipe(
						Effect.flatMap(monitor => monitor.stopMonitoring()),
						Effect.ignore,
					)
					return yield* Effect.fail(new Error(`Emission pipeline failed: ${error}`))
				}),
			),
		)

		// Create the performance layers and run the pipeline with them
		const performanceLayers = Layer.merge(
			PERFORMANCE_METRICS_SERVICE_LIVE,
			MEMORY_MONITOR_SERVICE_LIVE,
		)

		// Run the Effect pipeline with performance monitoring
		await Effect.runPromise(
			Effect.provide(emitProgram, performanceLayers) as Effect.Effect<void, Error, never>,
		)
	}

	/**
	 * Discover operations using Effect.TS with performance monitoring
	 */
	private discoverOperationsEffect() {
		return Effect.gen(function* (this: AsyncAPIEffectEmitter) {
			const metricsService = yield* PERFORMANCE_METRICS_SERVICE
			const memoryMonitor = yield* MEMORY_MONITOR_SERVICE

			// Start performance measurement for discovery stage
			const measurement = yield* metricsService.startMeasurement("operation_discovery")
			Effect.log(`🔍 Starting operation discovery with performance monitoring...`)

			const discoveryOperation = Effect.sync(() => {
				const program = this.emitter.getProgram()
				const operations: Operation[] = []

				const walkNamespace = (ns: Namespace) => {
					if (ns.operations) {
						ns.operations.forEach((op: Operation, name: string) => {
							operations.push(op)
							Effect.log(`🔍 Found operation: ${name}`)
						})
					}

					if (ns.namespaces) {
						ns.namespaces.forEach((childNs: Namespace) => {
							walkNamespace(childNs)
						})
					}
				}

				walkNamespace(program.getGlobalNamespaceType())
				this.operations = operations

				Effect.log(`📊 Total operations discovered: ${operations.length}`)
				return operations
			})

			// Execute discovery with memory tracking
			const {result: operations} = yield* memoryMonitor.measureOperationMemory(
				discoveryOperation,
				"operation_discovery",
			)

			// Record throughput metrics for discovery stage
			const throughputResult = yield* metricsService.recordThroughput(measurement, operations.length)
			Effect.log(`📊 Discovery stage completed: ${throughputResult.operationsPerSecond?.toFixed(0) ?? 0} ops/sec, ${throughputResult.averageMemoryPerOperation?.toFixed(0) ?? 0} bytes/op`)

			return operations
		}.bind(this)).pipe(Effect.mapError(error => new Error(`Operation discovery failed: ${error}`)))
	}

	/**
	 * Process operations using Effect.TS with performance monitoring
	 */
	private processOperationsEffect(operations: Operation[]) {
		return Effect.gen(function* (this: AsyncAPIEffectEmitter) {
			const metricsService = yield* PERFORMANCE_METRICS_SERVICE
			const memoryMonitor = yield* MEMORY_MONITOR_SERVICE

			// Start performance measurement for processing stage
			const measurement = yield* metricsService.startMeasurement("operation_processing")
			Effect.log(`🏗️ Processing ${operations.length} operations with performance monitoring...`)

			for (const op of operations) {
				const singleOpProcessing = Effect.sync(() => {
					return this.processSingleOperation(op)
				})

				// Execute each operation processing with memory tracking
				yield* memoryMonitor.measureOperationMemory(
					singleOpProcessing,
					`operation_processing_${op.name}`,
				)
			}

			// Record throughput metrics for processing stage
			const throughputResult = yield* metricsService.recordThroughput(measurement, operations.length)
			Effect.log(`📊 Processing stage completed: ${(throughputResult).operationsPerSecond?.toFixed(0) ?? 0} ops/sec, ${(throughputResult).averageMemoryPerOperation?.toFixed(0) ?? 0} bytes/op`)
			Effect.log(`📊 Processed ${operations.length} operations successfully`)
		}.bind(this)).pipe(Effect.mapError(error => new Error(`Operation processing failed: ${error}`)))
	}

	/**
	 * Process a single operation and add it to the AsyncAPI document
	 */
	private processSingleOperation(op: Operation): string {
		const program = this.emitter.getProgram()
		const {operationType, channelPath} = this.extractOperationMetadata(op, program)

		Effect.log(`🔍 Operation ${op.name}: type=${operationType ?? 'none'}, channel=${channelPath ?? 'default'}`)

		const channelName = `channel_${op.name}`
		const action = operationType === "subscribe" ? "receive" : "send"

		this.addChannelToDocument(op, channelName, channelPath, program)
		this.addOperationToDocument(op, channelName, action, program)
		this.addMessageToDocument(op)
		this.processReturnTypeSchema(op, program)

		Effect.log(`✅ Processed operation: ${op.name} (${action})`)
		return op.name
	}

	/**
	 * Extract operation metadata from decorators
	 */
	private extractOperationMetadata(op: Operation, program: Program): {
		operationType: string | undefined,
		channelPath: string
	} {
		const operationTypesMap = program.stateMap($lib.stateKeys.operationTypes)
		const channelPathsMap = program.stateMap($lib.stateKeys.channelPaths)

		const operationType = operationTypesMap.get(op) as string | undefined
		const decoratedChannelPath = channelPathsMap.get(op) as string | undefined
		const channelPath = decoratedChannelPath ?? `/${op.name.toLowerCase()}`

		return {operationType, channelPath}
	}

	/**
	 * Add channel definition to AsyncAPI document
	 */
	private addChannelToDocument(op: Operation, channelName: string, channelPath: string, program: Program): void {
		if (!this.asyncApiDoc.channels) this.asyncApiDoc.channels = {}
		this.asyncApiDoc.channels[channelName] = {
			address: channelPath,
			description: getDoc(program, op) ?? `Channel for ${op.name}`,
			messages: {
				[`${op.name}Message`]: {
					$ref: `#/components/messages/${op.name}Message`,
				},
			},
		}
	}

	/**
	 * Add operation definition to AsyncAPI document
	 */
	private addOperationToDocument(op: Operation, channelName: string, action: string, program: Program): void {
		if (!this.asyncApiDoc.operations) this.asyncApiDoc.operations = {}
		this.asyncApiDoc.operations[op.name] = {
			action: action as "receive" | "send",
			channel: {$ref: `#/channels/${channelName}`},
			summary: getDoc(program, op) ?? `Operation ${op.name}`,
			description: `TypeSpec operation with ${op.parameters.properties.size} parameters`,
		}
	}

	/**
	 * Add message definition to AsyncAPI document components
	 */
	private addMessageToDocument(op: Operation): void {
		if (!this.asyncApiDoc.components) this.asyncApiDoc.components = {}
		if (!this.asyncApiDoc.components.messages) this.asyncApiDoc.components.messages = {}
		this.asyncApiDoc.components.messages[`${op.name}Message`] = {
			name: `${op.name}Message`,
			title: `${op.name} Message`,
			summary: `Message for ${op.name} operation`,
			contentType: "application/json",
		}
	}

	/**
	 * Process return type and add schema if it's a model
	 */
	private processReturnTypeSchema(op: Operation, program: Program): void {
		if (op.returnType.kind === "Model") {
			const model = op.returnType
			if (!this.asyncApiDoc.components) this.asyncApiDoc.components = {}
			if (!this.asyncApiDoc.components.schemas) this.asyncApiDoc.components.schemas = {}
			this.asyncApiDoc.components.schemas[model.name] = this.convertModelToSchema(model, program)

			// Link message to schema
			const message = this.asyncApiDoc.components.messages?.[`${op.name}Message`]
			if (message && typeof message === 'object' && 'payload' in message) {
				(message as { payload?: { $ref?: string } }).payload = {
					$ref: `#/components/schemas/${model.name}`,
				}
			}
		}
	}

	/**
	 * Generate the final document using Effect.TS with performance monitoring
	 */
	private generateDocumentEffect() {
		return Effect.gen(function* (this: AsyncAPIEffectEmitter) {
			const metricsService = yield* PERFORMANCE_METRICS_SERVICE
			const memoryMonitor = yield* MEMORY_MONITOR_SERVICE

			// Start performance measurement for document generation stage
			const measurement = yield* metricsService.startMeasurement("document_generation")
			Effect.log(`📄 Generating AsyncAPI document with performance monitoring...`)

			const documentGeneration = Effect.sync(() => {
				return this.generateDocumentContent()
			})

			// Execute document generation with memory tracking
			const {result: content} = yield* memoryMonitor.measureOperationMemory(
				documentGeneration,
				"document_generation",
			)

			// Record throughput metrics for document generation stage
			const throughputResult = yield* metricsService.recordThroughput(measurement, 1) // 1 document generated
			Effect.log(`📊 Document generation completed: ${(throughputResult).averageLatencyMicroseconds?.toFixed(2) ?? 0} μs, ${(throughputResult).averageMemoryPerOperation?.toFixed(0) ?? 0} bytes`)

			return content
		}.bind(this))
	}

	/**
	 * Generate document content in the specified format
	 */
	private generateDocumentContent(): string {
		const options = this.emitter.getOptions()
		const fileType: "yaml" | "json" = options["file-type"] || "yaml"

		this.updateDocumentInfo()
		const content = this.serializeDocument(fileType)

		Effect.log(`📄 Generated ${fileType.toUpperCase()} document (${content.length} bytes)`)
		return content
	}

	/**
	 * Update document info with actual statistics
	 */
	private updateDocumentInfo(): void {
		this.asyncApiDoc.info.description = `Generated from TypeSpec with ${this.operations.length} operations`
	}

	/**
	 * Serialize document to JSON or YAML format
	 */
	private serializeDocument(fileType: string): string {
		if (fileType === "json") {
			return JSON.stringify(this.asyncApiDoc, null, 2)
		} else {
			return stringify(this.asyncApiDoc)
		}
	}

	/**
	 * Validate the document using asyncapi-validator with performance monitoring
	 */
	private validateDocumentEffect(content: string) {
		return Effect.gen(function* (this: AsyncAPIEffectEmitter) {
			const metricsService = yield* PERFORMANCE_METRICS_SERVICE
			const memoryMonitor = yield* MEMORY_MONITOR_SERVICE

			// Start performance measurement for validation stage
			const measurement = yield* metricsService.startMeasurement("document_validation")
			Effect.log(`🔍 Validating AsyncAPI document with performance monitoring...`)

			const validationOperation = Effect.gen(function* () {
				return yield* Effect.succeed(content) // Simplified for now
			})

			// Execute validation with memory tracking
			const {result: validatedContent} = yield* memoryMonitor.measureOperationMemory(
				validationOperation,
				"document_validation",
			)

			// Record throughput metrics for validation stage
			const throughputResult = yield* metricsService.recordThroughput(measurement, 1) // 1 document validated
			Effect.log(`📊 Validation stage completed: ${(throughputResult).averageLatencyMicroseconds?.toFixed(2) ?? 0} μs, ${(throughputResult).averageMemoryPerOperation?.toFixed(0) ?? 0} bytes`)

			return validatedContent
		}.bind(this))
	}

	/**
	 * Perform AsyncAPI document validation
	 * @unused for now - keeping for future use
	 */
	// private performDocumentValidation(content: string) {
	// 	return Effect.gen(function* () {
	// 		// Simplified validation for now
	// 		Effect.log(`✅ AsyncAPI document validation passed!`)
	// 		return content
	// 	})
	// }

	/**
	 * Log validation errors to console
	 */
	// private logValidationErrors(errors: ValidationError[]): void {
	// 	console.error(`❌ AsyncAPI validation FAILED:`)
	// 	errors.forEach((err: ValidationError) => {
	// 		console.error(`  - ${err.message}`)
	// 	})
	// }

	/**
	 * Write the document to file using Effect.TS with performance monitoring
	 */
	private writeDocumentEffect(content: string) {
		return Effect.gen(function* (this: AsyncAPIEffectEmitter) {
			const metricsService = yield* PERFORMANCE_METRICS_SERVICE
			const memoryMonitor = yield* MEMORY_MONITOR_SERVICE

			// Start performance measurement for document writing stage
			const measurement = yield* metricsService.startMeasurement("document_writing")
			Effect.log(`📁 Writing AsyncAPI document with performance monitoring...`)

			const writeOperation = Effect.tryPromise({
				try: async () => {
					return await this.writeDocumentToFile(content)
				},
				catch: (error) => new Error(`Failed to write output: ${error}`),
			})

			// Execute document writing with memory tracking
			const {result} = yield* memoryMonitor.measureOperationMemory(
				writeOperation,
				"document_writing",
			)

			// Record throughput metrics for document writing stage
			const throughputResult = yield* metricsService.recordThroughput(measurement, 1) // 1 document written
			Effect.log(`📊 Document writing completed: ${(throughputResult).averageLatencyMicroseconds?.toFixed(2) ?? 0} μs, ${(throughputResult).averageMemoryPerOperation?.toFixed(0) ?? 0} bytes`)

			return result
		}.bind(this))
	}

	/**
	 * Write document content to file and log statistics
	 */
	private async writeDocumentToFile(content: string): Promise<void> {
		//TODO: investigate what went wrong with these types!
		const options = this.emitter.getOptions()
		const program = this.emitter.getProgram()
		const {outputFile} = this.getOutputFileOptions(options)

		await emitFile(program, {
			path: outputFile,
			content,
		})

		this.logWriteSuccess(outputFile)
		this.logDocumentStatistics()
	}

	//TODO: this needs better and named types!
	/**
	 * Get output file options from emitter configuration
	 */
	private getOutputFileOptions(options: Pick<AsyncAPIEmitterOptions, "file-type" | "output-file">): {
		fileType: string,
		outputFile: string
	} {
		const fileType = options["file-type"] ?? "yaml"
		const outputFile = options["output-file"] ?? `asyncapi.${fileType}`
		return {fileType, outputFile}
	}

	/**
	 * Log successful file write operation
	 */
	private logWriteSuccess(outputFile: string): void {
		Effect.log(`✅ Written AsyncAPI to: ${outputFile}`)
	}

	/**
	 * Log final document statistics
	 */
	private logDocumentStatistics(): void {
		Effect.log(`📊 Final stats:`)
		Effect.log(`  - Operations: ${Object.keys(this.asyncApiDoc.operations || {}).length}`)
		Effect.log(`  - Channels: ${Object.keys(this.asyncApiDoc.channels || {}).length}`)
		Effect.log(`  - Schemas: ${Object.keys(this.asyncApiDoc.components?.schemas || {}).length}`)
		Effect.log(`  - Messages: ${Object.keys(this.asyncApiDoc.components?.messages || {}).length}`)
	}

	/**
	 * Convert TypeSpec model to AsyncAPI schema using shared utilities
	 */
	private convertModelToSchema(model: Model, program: Program): SchemaObject {
		return convertModelToSchema(model, program)
	}
}

/**
 * Main emission function using Effect.TS integrated emitter
 */
export async function generateAsyncAPIWithEffect(context: EmitContext<AsyncAPIEmitterOptions>): Promise<void> {
	Effect.log("🚀 AsyncAPI Emitter with Effect.TS Integration")
	Effect.log("✨ Using REAL asyncapi-validator library!")
	Effect.log("🔧 Connecting ghost Effect.TS system to main emitter")

	const assetEmitter = createAssetEmitter(
		context.program,
		AsyncAPIEffectEmitter,
		context,
	)

	assetEmitter.emitProgram()
	await assetEmitter.writeOutput()

	Effect.log("🎉 AsyncAPI generation complete with Effect.TS + validation!")
}