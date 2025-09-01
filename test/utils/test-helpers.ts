/**
 * Comprehensive test utilities for AsyncAPI emitter testing
 */

import {createTestHost} from "@typespec/compiler/testing"
import {AsyncAPITestLibrary} from "../test-host"
import type {AsyncAPIEmitterOptions} from "../../src"
import type {Diagnostic, Program} from "@typespec/compiler"
import {Effect} from "effect"

//TODO: this file is getting to big split it up

// AsyncAPI Document Type Definitions
export interface AsyncAPIObject {
	asyncapi: string;
	info: {
		title: string;
		version: string;
		description?: string;
	};
	channels: Record<string, AsyncAPIChannel>;
	operations?: Record<string, AsyncAPIOperation>;
	components?: {
		schemas?: Record<string, AsyncAPISchema>;
	};
}

export interface AsyncAPIChannel {
	address?: string;
	description?: string;
	messages?: Record<string, AsyncAPIMessage>;
}

export interface AsyncAPIOperation {
	action: 'send' | 'receive';
	channel: {
		$ref: string;
	};
	messages?: Array<{
		$ref: string;
	}>;
	description?: string;
}

export interface AsyncAPIMessage {
	name?: string;
	title?: string;
	description?: string;
	payload?: {
		$ref: string;
	};
}

export interface AsyncAPISchema {
	type?: string;
	properties?: Record<string, AsyncAPISchema>;
	required?: string[];
	description?: string;
	format?: string;
	enum?: string[];
	items?: AsyncAPISchema;
	additionalProperties?: boolean | AsyncAPISchema;
}

export interface CompilationResult {
	diagnostics: readonly Diagnostic[];
	outputFiles: Map<string, string>;
	program: Program;
}

export interface TestFileSystem {
	get(path: string): string | undefined;

	keys(): string[];
}

/**
 * Create a test host configured for AsyncAPI testing
 */
export async function createAsyncAPITestHost() {
	return createTestHost({
		libraries: [AsyncAPITestLibrary],
	})
}

/**
 * Compile TypeSpec source and return both diagnostics and output files
 */
export async function compileAsyncAPISpec(
	source: string,
	options: AsyncAPIEmitterOptions = {},
): Promise<CompilationResult> {
	const host = await createAsyncAPITestHost()

	// Wrap source with proper imports to make decorators available
	const wrappedSource = `
import "@larsartmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

${source}
  `

	host.addTypeSpecFile("main.tsp", wrappedSource)

	// First compile to get the program
	const compileResult = await host.compile("main.tsp")
	const program = Array.isArray(compileResult) ? compileResult[0] : compileResult

	if (!program) {
		throw new Error("Failed to compile TypeSpec program")
	}

	// Create a mock enhanced program for the emitter
	const enhancedProgram = {
		...program,
		host: {
			mkdirp: async (path: string) => {
				Effect.log(`Mock mkdirp for test: ${path}`)
			},
			writeFile: async (path: string, content: string) => {
				Effect.log(`Mock writeFile for test: ${path} (${content.length} chars)`)
				host.fs.set(path, content)
			},
		},
		getGlobalNamespaceType: program.getGlobalNamespaceType || (() => ({
			name: "Global",
			operations: new Map(),
			namespaces: new Map(),
		})),
		sourceFiles: program.sourceFiles || new Map([
			["main.tsp", {content: wrappedSource}],
		]),
	}

	// Now call the emitter directly with proper context
	const {$onEmit} = await import("../../dist/index")
	const emitterContext = {
		program: enhancedProgram,
		emitterOutputDir: "test-output",
		options,
	}

	try {
		await $onEmit(emitterContext)
	} catch (error) {
		console.error("Emitter execution failed:", error)
	}

	// Get diagnostics if available
	const diagnostics = Array.isArray(compileResult) && compileResult.length > 1
		? compileResult[1] || []
		: []

	return {
		diagnostics,
		outputFiles: host.fs,
		program: enhancedProgram,
	}
}

/**
 * Compile TypeSpec and expect no errors
 */
export async function compileAsyncAPISpecWithoutErrors(
	source: string,
	options: AsyncAPIEmitterOptions = {},
): Promise<{ outputFiles: Map<string, string>; program: Program; diagnostics: readonly Diagnostic[] }> {
	const result = await compileAsyncAPISpec(source, options)

	const diagnostics = result.diagnostics || []
	const errors = diagnostics.filter((d: Diagnostic) => d.severity === "error")
	if (errors.length > 0) {
		throw new Error(`Compilation failed with errors: ${errors.map((d: Diagnostic) => d.message).join(", ")}`)
	}

	return {outputFiles: result.outputFiles, program: result.program, diagnostics}
}

/**
 * Parse AsyncAPI output from compilation result
 */
export function parseAsyncAPIOutput(outputFiles: Map<string, {
	content: string
}>, filename: string): AsyncAPIObject | string {
	const filePath = `test-output/${filename}`


	//TODO: refactor to use Effect.TS!
	try {
		const content = outputFiles.get(filePath)
		if (!content) {
			// Try without test-output prefix
			const alternativeContent = outputFiles.get(filename)
			if (!alternativeContent) {
				const availableFiles = Array.from(outputFiles.keys())
				throw new Error(`Output file ${filename} not found. Available files: ${availableFiles.join(", ")}`)
			}
			return parseFileContent(alternativeContent.content, filename)
		}

		return parseFileContent(content.content, filename)
	} catch (error) {
		const availableFiles = Array.from(outputFiles.keys())
		throw new Error(`Failed to parse ${filename}: ${error}. Available files: ${availableFiles.join(", ")}`)
	}
}

function parseFileContent(content: string, filename: string): AsyncAPIObject | string {
	if (filename.endsWith('.json')) {
		return JSON.parse(content)
	} else if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
		//TODO: DO we need to do something here??
		// For YAML, we'll just return the string content for now
		// In a real implementation, you might want to use a YAML parser
		return content
	}

	throw new Error(`Unsupported file format: ${filename}`)
}

/**
 * Validate basic AsyncAPI 3.0 structure (legacy function)
 * @deprecated Use AsyncAPIValidator from validation framework instead
 */
export function validateAsyncAPIStructure(asyncapiDoc: unknown): boolean {
	if (typeof asyncapiDoc === 'string') {
		throw new Error("Expected parsed AsyncAPI document, got string. Use parseAsyncAPIOutput first.")
	}

	if (!asyncapiDoc || typeof asyncapiDoc !== 'object') {
		throw new Error("Expected AsyncAPI document to be an object")
	}

	//TODO: Better type?
	const doc = asyncapiDoc as Record<string, unknown>
	const requiredFields = ['asyncapi', 'info', 'channels']
	const missingFields = requiredFields.filter(field => !(field in doc))

	if (missingFields.length > 0) {
		throw new Error(`Missing required AsyncAPI fields: ${missingFields.join(", ")}`)
	}

	if (doc.asyncapi !== "3.0.0") {
		throw new Error(`Expected AsyncAPI version 3.0.0, got ${doc.asyncapi}`)
	}

	return true
}

/**
 * Validate AsyncAPI document using comprehensive validation framework
 */
export async function validateAsyncAPIObjectComprehensive(asyncapiDoc: unknown): Promise<{
	valid: boolean;
	errors: Array<{ message: string; keyword: string; path: string }>;
	summary: string;
}> {
	try {
		// Import validation framework dynamically to avoid circular dependencies
		const {validateAsyncAPIObject} = await import("../../src/validation/asyncapi-validator")

		const result = await validateAsyncAPIObject(asyncapiDoc, {
			strict: true,
			enableCache: false, // Disable cache for testing
		})

		return {
			valid: result.valid,
			errors: result.errors.map(error => ({
				message: error.message,
				keyword: error.keyword,
				path: error.instancePath || error.schemaPath,
			})),
			summary: result.summary,
		}
	} catch (error) {
		return {
			valid: false,
			errors: [{
				message: `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
				keyword: "internal-error",
				path: "",
			}],
			summary: "Validation framework error",
		}
	}
}

/**
 * Create test TypeSpec source for common scenarios
 */
export const TestSources = {
	basicEvent: `
    namespace TestEvents;
    
    model BasicEvent {
      id: string;
      timestamp: utcDateTime;
      data: string;
    }
    
    @channel("test.basic")
    op publishBasicEvent(): BasicEvent;
  `,

	complexEvent: `
    namespace ComplexEvents;
    
    model ComplexEvent {
      @doc("Event identifier")
      id: string;
      
      @doc("Event timestamp")
      timestamp: utcDateTime;
      
      @doc("Optional description")
      description?: string;
      
      @doc("Event metadata")
      metadata: {
        source: string;
        version: int32;
        tags: string[];
      };
      
      @doc("Event status")
      status: "pending" | "processed" | "failed";
    }
    
    @channel("complex.events")
    op publishComplexEvent(): ComplexEvent;
  `,

	multipleOperations: `
    namespace MultiOps;
    
    model UserEvent {
      userId: string;
      action: string;
    }
    
    model SystemEvent {
      component: string;
      level: "info" | "warning" | "error";
    }
    
    @channel("user.events")
    op publishUserEvent(): UserEvent;
    
    @channel("system.events")
    op publishSystemEvent(): SystemEvent;
    
    @channel("user.notifications")
    op subscribeUserNotifications(userId: string): UserEvent;
  `,

	withDocumentation: `
    @doc("Test namespace with full documentation")
    namespace DocumentedEvents;
    
    @doc("Fully documented event model")
    model DocumentedEvent {
      @doc("Primary identifier")
      id: string;
      
      @doc("Human-readable name")
      name: string;
      
      @doc("Creation timestamp")
      createdAt: utcDateTime;
    }
    
    @channel("documented.events")
    @doc("Channel for well-documented events")
    op publishDocumentedEvent(): DocumentedEvent;
  `,
}

/**
 * Common logging patterns for integration tests
 * Eliminates duplication in Effect.log calls
 */
export const TestLogging = {
	logSchemaGenerated: (schemaName: string) => {
		Effect.log(`✓ Schema generated: ${schemaName}`)
	},

	logOperationGenerated: (operationName: string) => {
		Effect.log(`✓ Operation generated: ${operationName}`)
	},

	logValidationSuccess: (message: string) => {
		Effect.log(`✅ ${message}`)
	},

	logGenerationMetrics: (schemasCount: number, operationsCount: number, channelsCount: number) => {
		Effect.log(`📊 Generated ${schemasCount} schemas`)
		Effect.log(`📊 Generated ${operationsCount} operations`)
		Effect.log(`📊 Generated ${channelsCount} channels`)
	},

	logMultiNamespaceSchema: (schemaName: string) => {
		Effect.log(`✓ Multi-namespace schema: ${schemaName}`)
	},

	logMultiNamespaceOperation: (operationName: string) => {
		Effect.log(`✓ Multi-namespace operation: ${operationName}`)
	}
}

/**
 * Common test validation patterns
 * Eliminates duplication in test validation logic
 */
export const TestValidationPatterns = {
	/**
	 * Validate schemas were generated for expected models
	 */
	validateExpectedSchemas: (asyncapiDoc: AsyncAPIObject, expectedSchemas: string[]) => {
		for (const schemaName of expectedSchemas) {
			if (!asyncapiDoc.components?.schemas?.[schemaName]) {
				throw new Error(`Expected schema ${schemaName} not found`)
			}
			TestLogging.logSchemaGenerated(schemaName)
		}
	},

	/**
	 * Validate operations were generated for expected names
	 */
	validateExpectedOperations: (asyncapiDoc: AsyncAPIObject, expectedOperations: string[]) => {
		for (const operationName of expectedOperations) {
			if (!asyncapiDoc.operations?.[operationName]) {
				throw new Error(`Expected operation ${operationName} not found`)
			}
			TestLogging.logOperationGenerated(operationName)
		}
	},

	/**
	 * Validate and log AsyncAPI specification generation completion
	 */
	validateAndLogCompletion: (asyncapiDoc: AsyncAPIObject, message: string) => {
		TestLogging.logValidationSuccess(message)
		TestLogging.logGenerationMetrics(
			Object.keys(asyncapiDoc.components?.schemas || {}).length,
			Object.keys(asyncapiDoc.operations || {}).length,
			Object.keys(asyncapiDoc.channels || {}).length
		)
	}
}

/**
 * Common test assertions for AsyncAPI validation
 */
export const AsyncAPIAssertions = {
	hasValidStructure: (doc: unknown): boolean => {
		try {
			validateAsyncAPIStructure(doc)
			return true
		} catch {
			return false
		}
	},

	hasChannel: (doc: AsyncAPIObject, channelName: string): boolean => {
		if (!doc.channels || !(channelName in doc.channels)) {
			throw new Error(`Expected channel '${channelName}' not found. Available channels: ${Object.keys(doc.channels || {}).join(", ")}`)
		}
		return true
	},

	hasOperation: (doc: AsyncAPIObject, operationName: string): boolean => {
		if (!doc.operations || !(operationName in doc.operations)) {
			throw new Error(`Expected operation '${operationName}' not found. Available operations: ${Object.keys(doc.operations || {}).join(", ")}`)
		}
		return true
	},

	hasSchema: (doc: AsyncAPIObject, schemaName: string): boolean => {
		if (!doc.components || !doc.components.schemas || !(schemaName in doc.components.schemas)) {
			const availableSchemas = doc.components?.schemas ? Object.keys(doc.components.schemas) : []
			throw new Error(`Expected schema '${schemaName}' not found. Available schemas: ${availableSchemas.join(", ")}`)
		}
		return true
	},

	schemaHasProperty: (doc: AsyncAPIObject, schemaName: string, propertyName: string): boolean => {
		AsyncAPIAssertions.hasSchema(doc, schemaName)
		const schema = doc.components?.schemas?.[schemaName]

		if (!schema?.properties || !(propertyName in (schema?.properties ?? []))) {
			const availableProperties = schema?.properties ? Object.keys(schema.properties) : []
			throw new Error(`Expected property '${propertyName}' not found in schema '${schemaName}'. Available properties: ${availableProperties.join(", ")}`)
		}
		return true
	},

	hasDocumentation: (obj: { description?: string }, expectedDoc: string): boolean => {
		if (!obj.description || !obj.description.includes(expectedDoc)) {
			throw new Error(`Expected documentation containing '${expectedDoc}', got: ${obj.description || 'no description'}`)
		}
		return true
	},
}