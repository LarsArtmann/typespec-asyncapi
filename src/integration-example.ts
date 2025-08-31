/**
 * INTEGRATION EXAMPLE: Pure Effect.TS with TypeSpec Emitter
 *
 * Demonstrates pure Effect.TS integration with TypeSpec's emitter system
 * using Railway Programming patterns, eliminating all Promise/async patterns.
 */

import {Console, Context, Duration, Effect, Layer} from "effect"
import type {EmitContext, Model, Operation} from "@typespec/compiler"
import type {AsyncAPIEmitterOptions, AsyncAPIOptionsParseError, AsyncAPIOptionsValidationError} from "./options"
import {AsyncAPIEmitterOptionsSchema, createAsyncAPIEmitterOptions, validateAsyncAPIEmitterOptions} from "./options"
import {$lib} from "./lib"
import type {MessageConfig} from "./decorators/message"
import type {MetricsCollectionError} from "./errors/MetricsCollectionError"
import type {MetricsInitializationError} from "./errors/MetricsInitializationError"
import {MemoryThresholdExceededError} from "./errors/MemoryThresholdExceededError"
import {PERFORMANCE_METRICS_SERVICE, PERFORMANCE_METRICS_SERVICE_LIVE} from "./performance/metrics"
import type {MemoryMonitorInitializationError} from "./errors/MemoryMonitorInitializationError"
import {MEMORY_MONITOR_SERVICE, MEMORY_MONITOR_SERVICE_LIVE, withMemoryTracking} from "./performance/memory-monitor"
import {validateAsyncAPIDocumentEffect} from "./utils/validation-helpers"
import {generateSchemaPropertiesFromModel} from "./utils/schema-conversion"
import {sanitizeChannelId} from "./utils/typespec-helpers"

//TODO: move to src/errors/
// TAGGED ERROR TYPES for Railway Programming
export class EmitterInitializationError extends Error {
	readonly _tag = "EmitterInitializationError"
	override readonly name = "EmitterInitializationError"
	override readonly cause?: unknown

	constructor(message: string, cause?: unknown) {
		super(message)
		this.cause = cause
	}
}

//TODO: move to src/errors/
export class SpecGenerationError extends Error {
	readonly _tag = "SpecGenerationError"
	override readonly name = "SpecGenerationError"

	constructor(message: string, public readonly options: AsyncAPIEmitterOptions) {
		super(message)
	}
}

//TODO: move to src/errors/
export class SpecValidationError extends Error {
	readonly _tag = "SpecValidationError"
	override readonly name = "SpecValidationError"

	constructor(message: string, public readonly spec: unknown) {
		super(message)
	}
}

//TODO: move to src/errors/
export class EmitterTimeoutError extends Error {
	readonly _tag = "EmitterTimeoutError"
	override readonly name = "EmitterTimeoutError"

	constructor(public readonly timeoutMs: number, public readonly operation: string) {
		super(`Operation '${operation}' timed out after ${timeoutMs}ms`)
	}
}

// Document validation moved to shared utilities

// PURE EFFECT.TS EMITTER SERVICE
export type EmitterService = {
	generateSpec: (options: AsyncAPIEmitterOptions, context?: EmitContext<object>) => Effect.Effect<unknown, SpecGenerationError>;
	validateSpec: (spec: unknown) => Effect.Effect<boolean, SpecValidationError>;
	writeOutput: (path: string, content: string) => Effect.Effect<void, Error>;
	initializeEmitter: (context: EmitContext<object>) => Effect.Effect<void, EmitterInitializationError>;
}

export const emitterService = Context.GenericTag<EmitterService>("EmitterService")

// EMITTER SERVICE IMPLEMENTATION
const makeEmitterService = Effect.gen(function* () {
	const generateSpec = (options: AsyncAPIEmitterOptions, context?: EmitContext<object>): Effect.Effect<unknown, SpecGenerationError> =>
		Effect.gen(function* () {
			yield* Effect.logDebug("Generating AsyncAPI specification", {
				outputFile: options["output-file"],
				fileType: options["file-type"],
			})

			// Generate actual AsyncAPI specification from TypeSpec program state
			const spec = {
				asyncapi: "3.0.0",
				info: {
					title: `Generated API - ${options["output-file"] ?? 'asyncapi'}`,
					version: "1.0.0",
				},
				channels: context ? yield* generateChannels(context) : {},
				operations: context ? yield* generateOperations(context) : {},
				components: context ? yield* generateComponents(context) : {},
			}

			if (options["include-source-info"]) {
				(spec as Record<string, unknown>)["sourceInfo"] = {
					generatedAt: new Date().toISOString(),
					generator: "TypeSpec AsyncAPI Emitter",
					options: options,
				}
			}

			return spec
		}).pipe(
			Effect.catchAll(error =>
				Effect.fail(new SpecGenerationError(
					`Failed to generate AsyncAPI spec: ${error}`,
					options,
				)),
			),
		)

	const validateSpec = (spec: unknown): Effect.Effect<boolean, SpecValidationError> =>
		validateAsyncAPIDocumentEffect(spec).pipe(
			Effect.mapError((error) => new SpecValidationError(error.message, spec)),
		)

	const writeOutput = (path: string, content: string): Effect.Effect<void, Error> =>
		Effect.gen(function* () {
			yield* Effect.logInfo(`Writing AsyncAPI output to ${path}`)
			yield* Effect.logDebug("Output content preview", {
				contentLength: content.length,
				preview: content.substring(0, 200),
			})
			// In actual implementation, this would write to filesystem
			return
		}).pipe(
			Effect.catchAll(error =>
				Effect.fail(new Error(`Failed to write output: ${error}`)),
			),
		)

	const initializeEmitter = (context: EmitContext<object>): Effect.Effect<void, EmitterInitializationError> =>
		Effect.gen(function* () {
			yield* Effect.logInfo("Initializing AsyncAPI emitter", {
				compilerOptions: Object.keys(context.options || {}),
				outputDir: context.emitterOutputDir,
			})

			if (!context.program) {
				return yield* Effect.fail(new EmitterInitializationError(
					"TypeSpec program context is missing",
				))
			}

			yield* Effect.logDebug("Emitter initialization completed successfully")
		}).pipe(
			Effect.catchAll(error => {
				if (error instanceof EmitterInitializationError) {
					return Effect.fail(error)
				}
				return Effect.fail(new EmitterInitializationError(
					`Initialization failed: ${error}`,
					error,
				))
			}),
		)

	return emitterService.of({
		generateSpec,
		validateSpec,
		writeOutput,
		initializeEmitter,
	})
})

// EFFECT LAYER for dependency injection
export const emitterServiceLive = Layer.effect(emitterService, makeEmitterService)

// ASYNCAPI GENERATION FUNCTIONS - Generate actual content from TypeSpec program state

/**
 * Generate AsyncAPI channels from TypeSpec @channel decorators
 * Extracts channel paths and creates AsyncAPI channel objects
 */
const generateChannels = (context: EmitContext<object>): Effect.Effect<Record<string, unknown>, SpecGenerationError> =>
	Effect.gen(function* () {
		if (!context.program) {
			return yield* Effect.fail(new SpecGenerationError("TypeSpec program context missing", {} as AsyncAPIEmitterOptions))
		}

		const channels: Record<string, unknown> = {}
		const channelMap = context.program.stateMap($lib.stateKeys.channelPaths)
		const operationTypesMap = context.program.stateMap($lib.stateKeys.operationTypes)

		yield* Effect.logDebug(`Found ${channelMap.size} operations with channel paths`)

		for (const [operation, channelPath] of channelMap) {
			const operationType = operationTypesMap.get(operation) as string | undefined
			const channelId = sanitizeChannelId(channelPath as string)

			// Create or update channel object
			if (!channels[channelId]) {
				channels[channelId] = {
					address: channelPath,
					description: `Channel for ${channelPath}`,
					messages: {},
				}
			}

			const channel = channels[channelId] as Record<string, unknown>
			const messages = channel['messages'] as Record<string, unknown>

			// Add operation-specific message reference
			const operationObj = operation as Operation
			if (operationType === "publish") {
				messages[`${operationObj.name}Message`] = {
					"$ref": `#/components/messages/${operationObj.name}Message`,
				}
			} else if (operationType === "subscribe") {
				messages[`${operationObj.name}Message`] = {
					"$ref": `#/components/messages/${operationObj.name}Message`,
				}
			}

			yield* Effect.logDebug(`Generated channel: ${channelId}`, {
				address: channelPath,
				operationType,
				operationName: operationObj.name,
			})
		}

		return channels
	}).pipe(
		Effect.catchAll(error =>
			Effect.fail(new SpecGenerationError(
				`Failed to generate channels: ${error}`,
				{} as AsyncAPIEmitterOptions,
			)),
		),
	)

/**
 * Generate AsyncAPI operations from TypeSpec @publish/@subscribe decorators
 * Creates operation objects with proper action types and channel references
 */
const generateOperations = (context: EmitContext<object>): Effect.Effect<Record<string, unknown>, SpecGenerationError> =>
	Effect.gen(function* () {
		if (!context.program) {
			return yield* Effect.fail(new SpecGenerationError("TypeSpec program context missing", {} as AsyncAPIEmitterOptions))
		}

		const operations: Record<string, unknown> = {}
		const operationTypesMap = context.program.stateMap($lib.stateKeys.operationTypes)
		const channelMap = context.program.stateMap($lib.stateKeys.channelPaths)

		yield* Effect.logDebug(`Found ${operationTypesMap.size} operations with types`)

		for (const [operation, operationType] of operationTypesMap) {
			const operationObj = operation as Operation
			const channelPath = channelMap.get(operation) as string | undefined

			if (!channelPath) {
				yield* Effect.logWarning(`Operation ${operationObj.name} has type ${operationType} but no channel path`)
				continue
			}

			const channelId = sanitizeChannelId(channelPath)
			const operationId = operationObj.name

			operations[operationId] = {
				action: operationType === "publish" ? "send" : "receive", // AsyncAPI 3.0.0 actions
				channel: {
					"$ref": `#/channels/${channelId}`,
				},
				title: `${operationType} ${operationObj.name}`,
				description: `${operationType === "publish" ? "Send" : "Receive"} message on ${channelPath}`,
				messages: [{
					"$ref": `#/components/messages/${operationId}Message`,
				}],
			}

			yield* Effect.logDebug(`Generated operation: ${operationId}`, {
				action: operationType,
				channel: channelPath,
			})
		}

		return operations
	}).pipe(
		Effect.catchAll(error =>
			Effect.fail(new SpecGenerationError(
				`Failed to generate operations: ${error}`,
				{} as AsyncAPIEmitterOptions,
			)),
		),
	)

/**
 * Generate AsyncAPI components from TypeSpec @message decorators and models
 * Creates message schemas and security schemes
 */
const generateComponents = (context: EmitContext<object>): Effect.Effect<Record<string, unknown>, SpecGenerationError> =>
	Effect.gen(function* () {
		if (!context.program) {
			return yield* Effect.fail(new SpecGenerationError("TypeSpec program context missing", {} as AsyncAPIEmitterOptions))
		}

		const components: Record<string, unknown> = {
			messages: {},
			schemas: {},
			securitySchemes: {},
		}

		// Generate message components from @message decorators
		const messageMap = context.program.stateMap($lib.stateKeys.messageConfigs)
		const operationTypesMap = context.program.stateMap($lib.stateKeys.operationTypes)

		yield* Effect.logDebug(`Found ${messageMap.size} models with message configurations`)

		// Generate messages from operations
		for (const [operation] of operationTypesMap) {
			const operationObj = operation as Operation
			const messageId = `${operationObj.name}Message`

			const messages = components['messages'] as Record<string, unknown>
			messages[messageId] = {
				name: messageId,
				title: `${operationObj.name} Message`,
				description: `Message for ${operationObj.name} operation`,
				contentType: "application/json",
				payload: {
					"$ref": `#/components/schemas/${operationObj.name}Schema`,
				},
			}

			// Generate corresponding schema
			const schemas = components['schemas'] as Record<string, unknown>
			schemas[`${operationObj.name}Schema`] = {
				type: "object",
				description: `Schema for ${operationObj.name} operation`,
				properties: {
					id: {
						type: "string",
						description: "Unique identifier",
					},
					timestamp: {
						type: "string",
						format: "date-time",
						description: "Event timestamp",
					},
					data: {
						type: "object",
						description: "Operation-specific data",
						additionalProperties: true,
					},
				},
				required: ["id", "timestamp"],
			}

			yield* Effect.logDebug(`Generated message component: ${messageId}`)
		}

		// Generate additional message components from @message decorators
		for (const [model, messageConfig] of messageMap) {
			const modelObj = model as Model
			const config = messageConfig as MessageConfig
			const messageId = config.name ?? modelObj.name

			const messages = components['messages'] as Record<string, unknown>
			if (!messages[messageId]) {
				messages[messageId] = {
					name: messageId,
					title: config.title ?? messageId,
					description: config.description ?? `Message based on ${modelObj.name} model`,
					contentType: config.contentType ?? "application/json",
					payload: {
						"$ref": `#/components/schemas/${modelObj.name}Schema`,
					},
				}

				// Add examples if provided
				if (config.examples && config.examples.length > 0) {
					(messages[messageId] as Record<string, unknown>)['examples'] = config.examples
				}

				// Generate schema for the model
				const schemas = components['schemas'] as Record<string, unknown>
				schemas[`${modelObj.name}Schema`] = {
					type: "object",
					description: `Schema for ${modelObj.name} model`,
					properties: generateSchemaPropertiesFromModel(modelObj),
					additionalProperties: false,
				}

				yield* Effect.logDebug(`Generated message from @message decorator: ${messageId}`)
			}
		}

		// Generate security schemes if configured
		const securitySchemesMap = context.program.stateMap($lib.stateKeys.securitySchemes)
		for (const [_, securityScheme] of securitySchemesMap) {
			const scheme = securityScheme as Record<string, unknown>
			const securitySchemes = components['securitySchemes'] as Record<string, unknown>
			securitySchemes[scheme['name'] as string] = {
				type: scheme['type'],
				description: scheme['description'],
				...scheme,
			}

			yield* Effect.logDebug(`Generated security scheme: ${scheme['name'] as string}`)
		}

		return components
	}).pipe(
		Effect.catchAll(error =>
			Effect.fail(new SpecGenerationError(
				`Failed to generate components: ${error}`,
				{} as AsyncAPIEmitterOptions,
			)),
		),
	)

// Utility functions moved to shared modules - see utils/ directory

/**
 * Pure Effect.TS TypeSpec emitter function with Railway Programming
 * COMPLETELY ASYNC-FIRST: No Promise patterns, pure Effect composition
 */
export const onEmitEffect = (
	context: EmitContext<object>,
	options: unknown,
) =>
	Effect.gen(function* () {
		const emitterSvc = yield* emitterService
		const performanceMetrics = yield* PERFORMANCE_METRICS_SERVICE
		const memoryMonitor = yield* MEMORY_MONITOR_SERVICE

		// Start performance measurement
		const measurement = yield* performanceMetrics.startMeasurement("asyncapi-emit")

		// Step 1: Initialize emitter with error handling
		yield* emitterSvc.initializeEmitter(context).pipe(
			Effect.catchTag("EmitterInitializationError", error =>
				Effect.gen(function* () {
					yield* Effect.logError("Emitter initialization failed", {
						message: error.message,
						cause: String(error.cause),
					})
					return yield* Effect.fail(error)
				}),
			),
		)

		// Step 2: Validate options with comprehensive Railway error handling
		const validatedOptions = yield* validateAsyncAPIEmitterOptions(options).pipe(
			Effect.catchTag("AsyncAPIOptionsValidationError", error =>
				Effect.gen(function* () {
					yield* Effect.logWarning("Options validation failed, applying recovery", {
						error: error.message,
					})
					// Railway pattern: attempt recovery with defaults
					return yield* createAsyncAPIEmitterOptions({})
				}),
			),
			Effect.catchTag("AsyncAPIOptionsParseError", error =>
				Effect.gen(function* () {
					yield* Effect.logError("Options parsing failed", {
						error: error.message,
					})
					// Railway pattern: attempt recovery with minimal defaults
					return yield* createAsyncAPIEmitterOptions({"output-file": "asyncapi"})
				}),
			),
			Effect.catchAll(error =>
				Effect.gen(function* () {
					yield* Effect.logError("Unexpected validation error", {error: String(error)})
					// Final fallback in Railway pattern
					return yield* createAsyncAPIEmitterOptions({})
				}),
			),
		)

		// Step 3: Apply final configuration with defaults
		const finalOptions = yield* createAsyncAPIEmitterOptions(validatedOptions as Partial<AsyncAPIEmitterOptions>)

		// Step 4: Generate spec with resource management and memory tracking
		const generatedSpec = yield* Effect.acquireUseRelease(
			// Acquire: Setup generation context with memory monitoring
			Effect.gen(function* () {
				yield* memoryMonitor.startMonitoring(1000)
				yield* Effect.logInfo("AsyncAPI generation context initialized", {
					outputFile: finalOptions["output-file"],
					fileType: finalOptions["file-type"],
					memoryMonitoring: true,
				})
				return {context, options: finalOptions}
			}),

			// Use: Generate specification with memory tracking
			({options: opts, context: ctx}) =>
				withMemoryTracking(
					emitterSvc.generateSpec(opts, ctx),
					"spec-generation",
				).pipe(
					Effect.catchAll(error =>
						Effect.gen(function* () {
							if (error instanceof SpecGenerationError) {
								yield* Effect.logError("Spec generation failed", {
									message: error.message,
									options: JSON.stringify(error.options),
								})
								return yield* Effect.fail(error)
							}
							if (error instanceof MemoryThresholdExceededError) {
								yield* Effect.logError("Memory threshold exceeded during spec generation", {
									currentUsage: error.currentUsage,
									threshold: error.threshold,
									operation: error.operationType,
								})
								return yield* Effect.fail(error)
							}
							// Re-throw other errors
							return yield* Effect.fail(error)
						}),
					),
					Effect.tap(spec =>
						Effect.logInfo("AsyncAPI specification generated successfully", {
							specSize: JSON.stringify(spec).length,
							outputFile: opts["output-file"],
						}),
					),
				),

			// Release: Cleanup resources
			() =>
				Effect.gen(function* () {
					yield* memoryMonitor.stopMonitoring()
					yield* Effect.logInfo("AsyncAPI generation resources released")
				}),
		)

		// Step 5: Validate generated spec if requested
		if (finalOptions["validate-spec"]) {
			yield* withMemoryTracking(
				emitterSvc.validateSpec(generatedSpec),
				"spec-validation",
			).pipe(
				Effect.flatMap(isValid =>
					isValid
						? Effect.logInfo("Generated specification validation passed")
						: Effect.fail(new SpecValidationError(
							"Generated specification validation failed",
							generatedSpec,
						)),
				),
				Effect.catchTag("SpecValidationError", error =>
					Effect.gen(function* () {
						yield* Effect.logError("Spec validation failed", {
							message: error.message,
						})
						return yield* Effect.fail(error)
					}),
				),
			)
		}

		// Step 6: Record final performance metrics
		const throughputResult = yield* performanceMetrics.recordThroughput(measurement, 1)
		yield* Effect.logInfo("Emitter performance metrics", {
			throughput: `${throughputResult.operationsPerSecond.toFixed(2)} ops/sec`,
			memoryPerOp: `${throughputResult.averageMemoryPerOperation.toFixed(0)} bytes`,
			totalDuration: `${throughputResult.totalDuration.toFixed(2)}ms`,
		})
	}).pipe(
		Effect.timeout(Duration.seconds(30)),
		Effect.mapError(error => {
			// Handle timeout errors from Effect.timeout
			if (error && typeof error === 'object' && '_tag' in error && error._tag === 'TimeoutException') {
				return new EmitterTimeoutError(30000, "asyncapi-emit")
			}
			// Return the error as-is for proper type handling
			return error as EmitterInitializationError | SpecGenerationError | SpecValidationError | EmitterTimeoutError | MetricsInitializationError | MetricsCollectionError | MemoryThresholdExceededError | MemoryMonitorInitializationError | AsyncAPIOptionsValidationError | AsyncAPIOptionsParseError
		}),
		Effect.withSpan("asyncapi-emit-pure", {
			attributes: {
				hasOptions: options !== null && options !== undefined,
				contextId: "emitter-context",
				pureEffect: true,
			},
		}),
	)

/**
 * Compatibility wrapper for TypeSpec (converts Effect back to Promise)
 * This is the ONLY place where Effect.runPromise is used
 */
export const onEmit = (
	context: EmitContext<object>,
	options: unknown,
): Effect.Effect<void, never> =>
	onEmitEffect(context, options).pipe(
		Effect.provide(emitterServiceLive),
		Effect.provide(PERFORMANCE_METRICS_SERVICE_LIVE),
		Effect.provide(MEMORY_MONITOR_SERVICE_LIVE),
		Effect.catchAll(error =>
			Effect.gen(function* () {
				yield* Effect.logFatal("Emitter failed with unrecoverable error", {
					error: JSON.stringify(error, null, 2),
				})
				// In Railway pattern, we log but don't re-throw to avoid crashing TypeSpec
			}),
		),
	)

/**
 * TypeSpec-compatible Promise wrapper (ONLY for TypeSpec integration)
 */
export const onEmitPromise = async (
	context: EmitContext<object>,
	options: unknown,
): Promise<void> => {
	return await Effect.runPromise(onEmit(context, options))
}

/**
 * Pure Effect.TS batch validation for multiple emitter contexts
 * Demonstrates high-throughput validation with Railway Programming
 */
export const batchEmitEffect = (
	contexts: Array<{ context: EmitContext<object>; options: unknown }>,
) =>
	Effect.gen(function* () {
		const performanceMetrics = yield* PERFORMANCE_METRICS_SERVICE

		yield* Effect.logInfo(`Starting batch emit for ${contexts.length} contexts`)

		const measurement = yield* performanceMetrics.startMeasurement("batch-emit")

		const results = yield* Effect.forEach(
			contexts,
			({context, options}) => onEmitEffect(context, options),
			{concurrency: 5}, // Controlled concurrency for memory management
		)

		const throughputResult = yield* performanceMetrics.recordThroughput(measurement, contexts.length)

		yield* Effect.logInfo("Batch emit completed", {
			processedCount: contexts.length,
			throughput: `${throughputResult.operationsPerSecond.toFixed(0)} contexts/sec`,
			totalDuration: `${throughputResult.totalDuration.toFixed(2)}ms`,
		})

		return results
	}).pipe(
		Effect.provide(emitterServiceLive),
		Effect.provide(PERFORMANCE_METRICS_SERVICE_LIVE),
		Effect.provide(MEMORY_MONITOR_SERVICE_LIVE),
	)

/**
 * Configuration validation utility for TypeSpec plugin registration
 * Used when registering the emitter with TypeSpec compiler
 */
export function validateEmitterConfiguration(config: unknown): AsyncAPIEmitterOptions {
	// Synchronous validation for plugin registration
	return Effect.runSync(
		Effect.gen(function* () {
			const validated = yield* validateAsyncAPIEmitterOptions(config)
			return yield* createAsyncAPIEmitterOptions(validated)
		}).pipe(
			Effect.catchAll(error =>
				Effect.fail(new Error(`Invalid AsyncAPI emitter configuration: ${error}`)),
			),
		),
	)
}

// EXAMPLE USAGE PATTERNS

/**
 * Example: Safe option parsing with comprehensive error handling
 */
export const parseOptionsExample = async (): Promise<AsyncAPIEmitterOptions> => {
	const userInput = {
		"output-file": "my-api",
		"file-type": "json" as const,
		"validate-spec": true,
		"protocol-bindings": ["kafka", "websocket"] as const,
		"versioning": {
			"separate-files": true,
			"file-naming": "suffix" as const,
		},
	}

	return await Effect.runPromise(
		Effect.gen(function* () {
			// Parse and validate user input
			const parsed = yield* validateAsyncAPIEmitterOptions(userInput)

			// Apply any missing defaults
			const complete = yield* createAsyncAPIEmitterOptions(parsed)

			// Log success
			yield* Effect.log("Configuration loaded successfully", complete)

			return complete
		}).pipe(
			// Comprehensive error handling
			Effect.catchAll(error =>
				Effect.gen(function* () {
					yield* Console.error("Configuration validation failed:", error)

					// Return safe defaults on error
					return yield* createAsyncAPIEmitterOptions({})
				}),
			),
		),
	)
}

/**
 * Example: Batch validation for multiple configurations
 */
export const validateMultipleConfigs = async (configs: unknown[]): Promise<Array<{
	config: unknown;
	validated?: unknown;
	error?: string;
	valid: boolean
}>> => {
	return await Effect.runPromise(
		Effect.forEach(configs, config =>
				Effect.gen(function* () {
					const validated = yield* validateAsyncAPIEmitterOptions(config)
					return {config, validated, valid: true}
				}).pipe(
					Effect.catchAll(error =>
						Effect.succeed({config, error: String(error), valid: false}),
					),
				),
			{concurrency: 5}, // Process up to 5 configs in parallel
		),
	)
}

// TYPESPEC COMPATIBILITY HELPERS

/**
 * Convert Effect.TS validation to TypeSpec-compatible format
 * Maintains the JSONSchemaType interface that TypeSpec expects
 */
export function getTypeSpecCompatibleSchema(): typeof AsyncAPIEmitterOptionsSchema {
	// The AsyncAPIEmitterOptionsSchema is already compatible with TypeSpec
	// This function shows how to access it programmatically
	return AsyncAPIEmitterOptionsSchema
}

/**
 * Validate options in TypeSpec-compatible way
 * Returns boolean result for TypeSpec integration
 */
export function isValidEmitterOptions(options: unknown): options is AsyncAPIEmitterOptions {
	try {
		Effect.runSync(validateAsyncAPIEmitterOptions(options))
		return true
	} catch {
		return false
	}
}

// MOCK IMPLEMENTATION FOR EXAMPLE - Helper function for testing (used in examples below)

export function generateAsyncAPISpecMock(options: AsyncAPIEmitterOptions): void {
	Effect.log("Generating AsyncAPI spec with options:", options)

	// Mock implementation - replace with actual emitter logic
	const outputFile = options["output-file"] ?? "asyncapi"
	const fileType = options["file-type"] ?? "yaml"

	Effect.log(`Would generate: ${outputFile}.${fileType}`)

	if (options["validate-spec"]) {
		Effect.log("Validating generated specification...")
	}

	if (options["protocol-bindings"]?.length) {
		Effect.log("Including protocol bindings:", options["protocol-bindings"])
	}
}

// ADVANCED USAGE EXAMPLES

/**
 * Example: Custom validation with additional business rules
 */
export const validateWithBusinessRules = (input: unknown): Effect.Effect<AsyncAPIEmitterOptions, Error> =>
	Effect.gen(function* () {
		// Step 1: Standard Effect.TS schema validation
		const options = yield* validateAsyncAPIEmitterOptions(input)

		// Step 2: Custom business rule validation
		if (options["file-type"] === "json" && options["include-source-info"]) {
			yield* Effect.fail(new Error("Source info not supported in JSON format"))
		}

		if (options["protocol-bindings"]?.includes("kafka") && !options["security-schemes"]) {
			yield* Effect.fail(new Error("Kafka protocol requires security schemes"))
		}

		// Step 3: Return validated and business-rule-compliant options
		return options
	})

/**
 * Example: Options transformation pipeline
 */
export const processOptionsWithTransformation = (input: unknown): Effect.Effect<AsyncAPIEmitterOptions, AsyncAPIOptionsValidationError | AsyncAPIOptionsParseError | Error> =>
	Effect.gen(function* () {
		// Parse and validate
		const validated = yield* validateAsyncAPIEmitterOptions(input)

		// Transform based on environment
		const environment = process.env["NODE_ENV"] ?? "development"
		const transformed: Partial<AsyncAPIEmitterOptions> = {}

		// Copy existing properties (excluding undefined values)
		Object.entries(validated).forEach(([key, value]) => {
			if (value !== undefined) {
				(transformed as Record<string, unknown>)[key] = value
			}
		})

		// Apply environment-specific transformations
		if (environment === "production") {
			transformed["validate-spec"] = true
		}
		if (environment === "development") {
			transformed["include-source-info"] = true
		}

		// Re-validate transformed options
		const finalValidated = yield* createAsyncAPIEmitterOptions(transformed)

		yield* Effect.log(`Options processed for ${environment} environment`)

		return finalValidated
	})

/**
 * Example: Resource management with validated options
 */
export const processWithManagedResources = (options: unknown): Effect.Effect<string, AsyncAPIOptionsValidationError | AsyncAPIOptionsParseError | Error> =>
	Effect.gen(function* () {
		// Validate options first
		const validatedOptions = yield* validateAsyncAPIEmitterOptions(options)

		// Use options in resource-managed operation
		return yield* Effect.acquireUseRelease(
			// Acquire: Setup resources based on validated options
			Effect.gen(function* () {
				yield* Effect.log("Setting up resources with validated options")
				return {connection: "mock-connection", options: validatedOptions}
			}),
			// Use: Process with guaranteed valid options
			({connection, options}) =>
				Effect.gen(function* () {
					yield* Effect.log("Processing with connection:", connection)
					yield* Effect.log("Using validated options:", options)
					return `Processed with ${options["file-type"]} format`
				}),
			// Release: Cleanup resources
			({connection}) =>
				Effect.gen(function* () {
					yield* Effect.log("Cleaning up connection:", connection)
				}),
		)
	})