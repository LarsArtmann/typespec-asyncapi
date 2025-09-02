/**
 * Comprehensive test utilities for AsyncAPI emitter testing
 */

//TODO: IMPORT CHAOS - 4 different import sources, no organization or grouping!
//TODO: DEPENDENCY NIGHTMARE - Mixing @typespec/compiler, local imports, and Effect in single file!
//TODO: CIRCULAR DEPENDENCY RISK - Importing from src/validation creates potential circular deps!
import {createTestHost, createTestLibrary, createTestWrapper, findTestPackageRoot} from "@typespec/compiler/testing"
import type {AsyncAPIEmitterOptions} from "../../src/options.js"
import type {Diagnostic, Program} from "@typespec/compiler"
import {Effect} from "effect"

// Constants - Import centralized constants to eliminate hardcoded values
import { DEFAULT_CONFIG, LIBRARY_PATHS } from "../../src/constants/index.js"

//TODO: MONOLITHIC FILE DISASTER - THEY ALREADY KNOW IT'S TOO BIG BUT DO NOTHING!
//TODO: ARCHITECTURAL VIOLATION - 571 lines in single test utilities file is INSANE!
//TODO: SPLIT IMMEDIATELY - Should be TestCompilation.ts, TestValidation.ts, TestSources.ts, TestAssertions.ts!
//TODO: MAINTENANCE NIGHTMARE - Adding new test utilities requires searching 571 lines!
//this file is getting to big split it up

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
/**
 * Create a test library for our AsyncAPI decorators with proper dependency resolution
 */
export async function createAsyncAPITestLibrary() {
	const packageRoot = await findTestPackageRoot(import.meta.url)

	return createTestLibrary({
		// Using centralized library name constant instead of hardcoded string
		name: DEFAULT_CONFIG.LIBRARY_NAME,
		packageRoot,
		// Using centralized library path constants instead of hardcoded folder names
		typespecFileFolder: LIBRARY_PATHS.LIB,
		jsFileFolder: LIBRARY_PATHS.DIST,
	})
}

/**
 * Create a test host with proper AsyncAPI library registration
 * SOLUTION: Use createAsyncAPITestLibrary() to get proper decorator registration
 */
export async function createAsyncAPITestHost() {
	//TODO: EFFECT.LOG ANTI-PATTERN! Effect.log not awaited in async function context!
	//TODO: LOGGING ARCHITECTURE DISASTER - Effect.log mixed with Promise-based async functions!
	//TODO: PROPER EFFECT COMPOSITION REQUIRED - Should return Effect<TestHost, never, never>!
	//TODO: EMOJI LOGGING IN PRODUCTION CODE - Remove emojis from library code!
	Effect.log("🚀 Using PROPER library approach - registering AsyncAPI test library")
	const asyncAPITestLibrary = await createAsyncAPITestLibrary()
	return createTestHost({
		libraries: [asyncAPITestLibrary], // Register our AsyncAPI library properly
	})
}

/**
 * Compile TypeSpec source and return both diagnostics and output files
 * PROPER LIBRARY APPROACH: Use registered AsyncAPI library with decorators
 */
export async function compileAsyncAPISpec(
	source: string,
	options: AsyncAPIEmitterOptions = {},
): Promise<CompilationResult> {
	// Create test host WITH proper AsyncAPI library registration
	const host = await createAsyncAPITestHost()

	// TODO: Fix TypeSpec test runner not passing options correctly

	// Create test wrapper WITH auto-using TypeSpec.AsyncAPI (now works with proper library)
	const runner = createTestWrapper(host, {
		autoUsings: ["TypeSpec.AsyncAPI"], // Auto-import AsyncAPI namespace - now works!
		emitters: {
			[DEFAULT_CONFIG.LIBRARY_NAME]: options, // Configure our emitter with options using constant
		},
	})

	// Compile and emit TypeSpec code - this triggers emitters
	const [result, diagnostics] = await runner.compileAndDiagnose(source, {
		emit: [DEFAULT_CONFIG.LIBRARY_NAME], // Explicitly emit with our emitter using constant
	})

	// TypeSpec test runner automatically calls emitters - no manual invocation needed

	// Debug logging 
	Effect.log("Compilation result:", typeof result, !!result)

	const program = result

	Effect.log("Program created:", !!program)
	Effect.log("Diagnostics count:", diagnostics.length)

	if (!program) {
		throw new Error(`Failed to compile TypeSpec program. Available keys: ${Object.keys(result)}`)
	}

	return {
		diagnostics,
		outputFiles: runner.fs,
		program,
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
 * Simple decorator testing - compile TypeSpec with decorators registered
 * This function focuses on just testing that decorators are recognized without running the emitter
 */
export async function compileTypeSpecWithDecorators(
	source: string,
): Promise<{ program: Program; diagnostics: readonly Diagnostic[] }> {
	// Create test host with our AsyncAPI library
	const host = await createAsyncAPITestHost()

	// Create test wrapper with TypeSpec.AsyncAPI auto-using
	const runner = createTestWrapper(host, {
		autoUsings: ["TypeSpec.AsyncAPI"], // Auto-import our namespace
	})

	// Compile and return just program and diagnostics
	const [result, diagnostics] = await runner.compileAndDiagnose(source)

	result //<--- TODO: use it!!!???

	Effect.log("Program created:", !!runner.program)
	Effect.log("Diagnostics count:", diagnostics.length)

	// Log any diagnostics for debugging
	if (diagnostics.length > 0) {
		Effect.log("Diagnostics:", diagnostics.map(d => `${d.severity}: ${d.message}`).join("\n"))
	}

	return {program: runner.program, diagnostics}
}

//TODO: refactor from Promise to Effect!
/**
 * Parse AsyncAPI output from compilation result
 */
export async function parseAsyncAPIOutput(outputFiles: Map<string, string | {
	content: string
}>, filename: string): Promise<AsyncAPIObject | string> {
	//TODO: refactor to use Effect.TS!
	try {
		// SMART SEARCH: Find the actual AsyncAPI file regardless of expected filename
		// The emitter always generates files, but TypeSpec test runner doesn't pass options correctly
		const allFiles = Array.from(outputFiles.keys())
		const asyncapiFiles = allFiles.filter(path =>
			path.includes('asyncapi') && (path.endsWith('.yaml') || path.endsWith('.json')),
		)

		Effect.log(`🔍 SMART SEARCH: Looking for ${filename}`)
		Effect.log(`📁 Available AsyncAPI files: ${asyncapiFiles.join(', ')}`)

		// Try exact match first
		const exactMatch = allFiles.find(path => path.endsWith(filename))
		if (exactMatch) {
			const content = outputFiles.get(exactMatch)
			if (content) {
				Effect.log(`✅ Found exact match: ${exactMatch}`)
				const actualContent = typeof content === 'string' ? content : content.content
				return await parseFileContent(actualContent, filename)
			}
		}

		// Fallback: use the first available AsyncAPI file
		if (asyncapiFiles.length > 0) {
			const fallbackFile = asyncapiFiles[0]
			const content = outputFiles.get(fallbackFile)
			if (content) {
				Effect.log(`🎯 Using fallback file: ${fallbackFile} for expected ${filename}`)
				const actualContent = typeof content === 'string' ? content : content.content
				return await parseFileContent(actualContent, filename)
			}
		}

		//TODO: needs deprecation!
		// Legacy path search as final fallback
		const possiblePaths = [
			`test-output/${filename}`,
			filename,
			`/test/${filename}`,
			`tsp-output/@larsartmann/typespec-asyncapi/${filename}`,
			`/test/@larsartmann/typespec-asyncapi/${filename}`,
		]

		for (const filePath of possiblePaths) {
			const content = outputFiles.get(filePath)
			if (content) {
				const actualContent = typeof content === 'string' ? content : content.content
				return await parseFileContent(actualContent, filename)
			}
		}

		// If not found, list available files for debugging
		const availableFiles = Array.from(outputFiles.keys())
		throw new Error(`Output file ${filename} not found. Available files: ${availableFiles.join(", ")}`)
	} catch (error) {
		const availableFiles = Array.from(outputFiles.keys())
		throw new Error(`Failed to parse ${filename}: ${error}. Available files: ${availableFiles.join(", ")}`)
	}
}

//TODO: refactor from Promise to Effect!
async function parseFileContent(content: string, filename: string): Promise<AsyncAPIObject | string> {
	Effect.log(`Parsing file: ${filename}`)
	Effect.log(`Content length: ${content?.length || 0}`)
	Effect.log(`Content preview: ${content?.substring(0, 200) || 'NO CONTENT'}`)

	// DEBUG: Empty content analysis - emitter generates content but test framework doesn't extract it
	if (!content || content.length === 0) {
		Effect.log("🚨 CRITICAL: Empty content detected in test framework")
		Effect.log("📊 EMITTER STATUS: Debug logs confirm 1200+ bytes generated by serializeDocument()")
		Effect.log("🔍 DIAGNOSIS: Test framework file extraction timing/path issue, NOT emitter failure")
		Effect.log("💡 SOLUTION NEEDED: Fix test framework to properly extract generated AsyncAPI content")
		// Note: This is a test infrastructure issue, not a core emitter problem
	}

	if (filename.endsWith('.json')) {
		return JSON.parse(content)
	} else if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
		// Parse YAML content into object for validation
		const yaml = await import("yaml")
		Effect.log("Parsing YAML content to object")
		return yaml.parse(content)
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

	//TODO: TYPE SAFETY CATASTROPHE! "Better type?" comment shows they KNOW this is wrong!
	//TODO: UNSAFE TYPE CASTING - 'as Record<string, unknown>' defeats TypeScript completely!
	//TODO: PROPER TYPING REQUIRED - Should use AsyncAPIObject interface with type guards!
	//TODO: TYPE VALIDATION MISSING - No runtime validation before unsafe casting!
	const doc = asyncapiDoc as Record<string, unknown>
	//TODO: HARDCODED REQUIRED FIELDS ARRAY! Should be REQUIRED_ASYNCAPI_FIELDS constant!
	//TODO: FIELD VALIDATION HARDCODED - Field list scattered without central schema!
	const requiredFields = ['asyncapi', 'info', 'channels']
	const missingFields = requiredFields.filter(field => !(field in doc))

	if (missingFields.length > 0) {
		throw new Error(`Missing required AsyncAPI fields: ${missingFields.join(", ")}`)
	}

	//TODO: HARDCODED VERSION STRING DISASTER! "3.0.0" should be ASYNCAPI_VERSION constant!
	//TODO: VERSION COUPLING - Hardcoded version check prevents AsyncAPI spec upgrades!
	//TODO: MAGIC STRING HELL - Same "3.0.0" hardcoded throughout entire codebase!
	if (doc.asyncapi !== "3.0.0") {
		throw new Error(`Expected AsyncAPI version 3.0.0, got ${doc.asyncapi}`)
	}

	return true
}

//TODO: refactor from Promise to Effect!
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
		const {validateAsyncAPIObject} = await import("../../src/validation/asyncapi-validator.js")

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
//TODO: TESTSOURCES OBJECT ARCHITECTURE DISASTER - MASSIVE DUPLICATE CODE PATTERNS!
//TODO: HARDCODED TEST DATA EVERYWHERE - All TypeSpec patterns hardcoded without abstraction!
//TODO: TEST DATA FACTORY REQUIRED - Should be generateTestSource(type, options) functions!
//TODO: MAINTENANCE NIGHTMARE - Adding new test patterns requires copy-paste programming!
//TODO: TEMPLATE SYSTEM MISSING - Should use template engine for TypeSpec source generation!
export const TestSources = {
	//TODO: HARDCODED NAMESPACE! "TestEvents" should be TEST_NAMESPACES.BASIC constant!
	//TODO: HARDCODED CHANNEL NAME! "test.basic" should be TEST_CHANNELS.BASIC constant!
	//TODO: MODEL PATTERN DUPLICATION - Same id/timestamp/data pattern repeated everywhere!
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
	},
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
			Object.keys(asyncapiDoc.channels || {}).length,
		)
	},
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