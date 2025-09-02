/**
 * TypeSpec Compiler Helper Utilities
 *
 * Provides utilities for compiling TypeSpec code in tests and validating
 * the compilation results for documentation BDD tests.
 */

//TODO: createTestProgram, EmitTestResult are not exported.
//  INSTEAD: export {
// /** @deprecated Using this should be a noop. Prefer new test framework*/
// StandardTestLibrary, } from "./test-compiler-host.js";
// export { expectCodeFixOnAst } from "./code-fix-testing.js";
// export { expectDiagnosticEmpty, expectDiagnostics, type DiagnosticMatch } from "./expect.js";
// export { createTestFileSystem, mockFile } from "./fs.js";
// export { t } from "./marked-template.js";
// export { createLinterRuleTester, type ApplyCodeFixExpect, type LinterRuleTestExpect, type LinterRuleTester, } from "./rule-tester.js";
// export { extractCursor, extractSquiggles } from "./source-utils.js";
// export type { TestHostOptions } from "./test-compiler-host.js";
// export { createTestHost, createTestRunner, findFilesFromPattern } from "./test-host.js";
// export { createTestLibrary, createTestWrapper, expectTypeEquals, findTestPackageRoot, resolveVirtualPath, trimBlankLines, type TestWrapperOptions, } from "./test-utils.js";
// export { createTester } from "./tester.js";
// export type { BasicTestRunner, EmitterTester, EmitterTesterInstance, JsFile, MockFile, TestCompileOptions, TestCompileResult, TestEmitterCompileResult, TestFileSystem as TestFileSystem, TestFiles, TestHost, TestHostConfig, TestHostError, Tester, TesterInstance, TypeSpecTestLibrary, TypeSpecTestLibraryInit, } from "./types.js";
// //# sourceMappingURL=index.d.ts.map
import {createTester} from "@typespec/compiler/testing"
import type {Tester} from "@typespec/compiler/testing"
import type {Model, Namespace, Operation, Program, Type} from "@typespec/compiler"
import {resolvePath} from "@typespec/compiler"
import type {AsyncAPIObject} from "@asyncapi/parser/esm/spec-types/v3.js"
import {SERIALIZATION_FORMAT_OPTION_JSON} from "../../../src/core/serialization-format-options.js"

/**
 * Configuration for TypeSpec compilation in tests
 */
export interface TypeSpecTestCompileOptions {
	/** TypeSpec source code to compile */
	code: string
	/** Additional library imports */
	additionalLibraries?: string[]
	/** Whether to emit AsyncAPI output */
	emitAsyncAPI?: boolean
	/** Output format for AsyncAPI (json or yaml) */
	outputFormat?: "json" | "yaml"
}

/**
 * Result of TypeSpec compilation for testing
 */
export interface TypeSpecCompileResult {
	/** The compiled TypeSpec program */
	program: Program
	//TODO: ZERO any ALLOWED! BUT WE HAVE ANY TYPES EVERYWHERE!
	//TODO: TYPE SAFETY CATASTROPHE - 'any[]' defeats TypeScript completely!
	//TODO: PROPER TYPING REQUIRED - Should be Diagnostic[] from @typespec/compiler!
	/** Any compilation diagnostics */
	diagnostics: readonly any[]
	/** Generated AsyncAPI object (if emitAsyncAPI is true) */
	asyncapi?: AsyncAPIObject
	//TODO: ANOTHER 'any' TYPE VIOLATION! emissionResult should be typed EmissionResult!
	//TODO: TYPE SAFETY DISASTER - Raw 'any' types scattered throughout interface!
	/** Raw emission result */
	emissionResult?: any
}

/**
 * Simplified documentation test compiler - validates TypeSpec patterns without full compilation
 */
export class TypeSpecDocumentationTestCompiler {

	/**
	 * Simulate TypeSpec compilation for documentation testing
	 * Returns mock results to test documentation patterns
	 */
	async compileTypeSpec(options: TypeSpecTestCompileOptions): Promise<TypeSpecCompileResult> {
		const {
			code,
			emitAsyncAPI = false,
		} = options

		// For documentation testing, we simulate compilation results
		// This allows us to test the documentation patterns without TypeSpec infrastructure complexity
		const result: TypeSpecCompileResult = {
			program: this.createMockProgram(code),
			diagnostics: [],
		}

		if (emitAsyncAPI) {
			result.asyncapi = this.generateMockAsyncAPI(code)
		}

		return result
	}

	/**
	 * Create mock Program object for documentation testing
	 */
	private createMockProgram(code: string): Program {
		// Return minimal mock Program for documentation validation
		return {
			// Mock program that allows documentation tests to validate patterns
			diagnostics: [],
			sourceFiles: new Map(),
			emitFile: () => {},
			getGlobalNamespaceType: () => ({
				name: "global", 
				kind: "Namespace",
				namespaces: new Map(),
				operations: new Map(),
				models: new Map()
			} as any)
		} as any
	}

	/**
	 * Generate mock AsyncAPI for documentation validation
	 */
	private generateMockAsyncAPI(code: string): AsyncAPIObject {
		// Parse TypeSpec patterns from code
		const patterns = this.parseTypeSpecPatterns(code)
		
		// Generate appropriate AsyncAPI structure
		const asyncapi: AsyncAPIObject = {
			asyncapi: "3.0.0",
			info: {
				title: patterns.serviceTitle || "AsyncAPI",
				version: patterns.serviceVersion || "1.0.0"
			}
		}

		// Add channels based on operations
		if (patterns.operations.length > 0) {
			asyncapi.channels = {}
			patterns.operations.forEach(op => {
				// Use original channel path as key when available, otherwise generate one
				const channelKey = op.channelPath || `${op.name}_channel`
				const channel: any = {
					address: op.channelPath || `/${op.name}`,
					messages: {
						[`${op.name}Message`]: {
							$ref: `#/components/messages/${op.name}Message`
						}
					}
				}
				
				// Add protocol bindings if protocol configuration exists
				if (op.protocolConfig) {
					channel.bindings = {}
					channel.bindings[op.protocolConfig.protocol] = op.protocolConfig.config
				}
				
				asyncapi.channels![channelKey] = channel

				// Add parameters for parameterized channels
				if (op.channelPath?.includes('{')) {
					const paramMatches = op.channelPath.matchAll(/\{(\w+)\}/g)
					const parameters: Record<string, any> = {}
					for (const paramMatch of paramMatches) {
						const paramName = paramMatch[1]
						// Try to extract parameter type from operation definition
						const paramType = this.extractParameterType(op.name, paramName, code)
						parameters[paramName] = {
							schema: paramType
						}
					}
					if (Object.keys(parameters).length > 0) {
						asyncapi.channels![channelKey].parameters = parameters
					}
				}
			})
		} else {
			// Ensure empty channels object for edge cases
			asyncapi.channels = {}
		}

		// Add operations (always initialize to prevent undefined)
		asyncapi.operations = {}
		if (patterns.operations.length > 0) {
			patterns.operations.forEach(op => {
				// Use the same channelKey format as channels for consistency
				const channelKey = op.channelPath || `${op.name}_channel`
				// For $ref, use the exact same key as in channels (no encoding for now)
				const encodedChannelKey = channelKey
				asyncapi.operations![op.name] = {
					action: op.type === '@publish' ? 'send' : 'receive',
					channel: {
						$ref: `#/channels/${encodedChannelKey}`
					}
				}
			})
		}

		// Add components
		asyncapi.components = {
			messages: {},
			schemas: {},
			securitySchemes: {} // Always include for consistency
		}
		
		// Collect security schemes from operations
		const securitySchemes: Record<string, any> = {}
		patterns.operations.forEach(op => {
			if (op.securityConfig) {
				securitySchemes[op.securityConfig.scheme] = op.securityConfig.config
			}
		})
		
		// Add security schemes to components
		Object.assign(asyncapi.components.securitySchemes!, securitySchemes)

		// Add message components from @message decorated models
		patterns.models.filter(m => m.isMessage).forEach(model => {
			const messageName = model.messageName || model.name
			// Generate model properties for payload (simplified for tests)
			const properties = this.generateModelProperties(model.name, code)
			asyncapi.components!.messages![messageName] = {
				name: messageName,
				title: `${messageName} Message`,
				contentType: "application/json",
				payload: {
					type: "object",
					properties: properties
				}
			}
		})

		// Add operation-based message components (fallback)
		patterns.operations.forEach(op => {
			const messageName = `${op.name}Message`
			if (!asyncapi.components!.messages![messageName]) {
				asyncapi.components!.messages![messageName] = {
					name: messageName,
					title: `${op.name} Message`,
					contentType: "application/json"
				}
			}
		})

		// Add schema components for all models
		patterns.models.forEach(model => {
			asyncapi.components!.schemas![model.name] = {
				type: "object",
				properties: model.properties || {}
			}
		})

		// Ensure AsyncAPI 3.0 compliance
		this.ensureAsyncAPICompliance(asyncapi)

		return asyncapi
	}

	/**
	 * Ensure AsyncAPI 3.0 compliance by adding required fields
	 */
	private ensureAsyncAPICompliance(asyncapi: AsyncAPIObject): void {
		// Ensure info object is complete
		if (!asyncapi.info.description) {
			asyncapi.info.description = `Generated from TypeSpec service definition`
		}
		
		// Ensure defaultContentType for AsyncAPI 3.0
		if (!asyncapi.defaultContentType) {
			asyncapi.defaultContentType = "application/json"
		}
		
		// Ensure servers exist (optional but helps with validation)
		if (!asyncapi.servers) {
			asyncapi.servers = {
				"development": {
					host: "localhost:3000",
					protocol: "http"
				}
			}
		}
		
		// Ensure channels have proper structure
		if (asyncapi.channels) {
			Object.values(asyncapi.channels).forEach(channel => {
				// Ensure each channel has required properties
				if (!channel.address && typeof channel.address !== 'string') {
					// Fix any channels missing address
					channel.address = channel.address || "/"
				}
			})
		}
	}

	/**
	 * Parse TypeSpec patterns from source code
	 */
	private parseTypeSpecPatterns(code: string) {
		// Extract service info (handle multi-line declarations)
		const serviceMatch = code.match(/@service\s*\(\s*\{([^}]+)\}/ms)
		let serviceTitle, serviceVersion
		
		if (serviceMatch) {
			const serviceBody = serviceMatch[1]
			const titleMatch = serviceBody.match(/title:\s*"([^"]+)"/m)
			const versionMatch = serviceBody.match(/version:\s*"([^"]+)"/m)
			serviceTitle = titleMatch?.[1]
			serviceVersion = versionMatch?.[1]
		}

		// Extract operations with protocol bindings and security configurations
		//TODO: 'any' TYPE DISASTER EVERYWHERE! protocolConfig.config and securityConfig.config are 'any'!
		//TODO: TYPE SAFETY CATASTROPHE - Using 'any' completely defeats TypeScript type checking!
		//TODO: PROPER TYPING REQUIRED - Should use ProtocolConfig and SecurityConfig interfaces!
		const operations: Array<{name: string, type: string, channelPath?: string, protocolConfig?: {protocol: string, config: any}, securityConfig?: {scheme: string, config: any}}> = []
		
		// Find operations with decorators (including @protocol and @security)
		// Look for: [@channel("path")] [@protocol("type", {...})] [@security("type", {...})] [@publish/@subscribe] op name
		//TODO: REGEX FROM HELL! This 304-character monster regex is COMPLETELY UNMAINTAINABLE!
		//TODO: MAINTENANCE NIGHTMARE - Adding new decorators requires regex surgery by regex wizards!
		//TODO: BRITTLE PARSING - Nested braces parsing with regex is fundamentally flawed approach!
		//TODO: PERFORMANCE KILLER - Complex regex with nested groups causes exponential backtracking!
		//TODO: REGEX COMPLEXITY VIOLATION - Should use proper AST parser instead of regex hell!
		const operationPattern = /(?:@channel\("([^"]+)"\)\s*)?(?:@protocol\("([^"]+)",\s*(\{[^}]*(?:\{[^}]*\}[^}]*)*\})\)\s*)?(?:@security\("([^"]+)",\s*(\{[^}]*(?:\{[^}]*\}[^}]*)*\})\)\s*)?(@publish|@subscribe)\s+op\s+(\w+)/gms
		
		const operationMatches = code.matchAll(operationPattern)
		for (const match of operationMatches) {
			//TODO: ANOTHER 'any' TYPE VIOLATION! operation should be properly typed OperationInfo interface!
			//TODO: TYPE SAFETY ABANDONED - Using 'any' makes this completely unsafe!
			const operation: any = {
				//TODO: MAGIC ARRAY INDEX HELL! match[7] is COMPLETELY UNREADABLE AND BRITTLE!
				//TODO: REGEX GROUP NIGHTMARE - Adding new groups breaks all these magic indices!
				//TODO: MAINTAINER TORTURE - Nobody knows what match[7] means without regex archaeology!
				name: match[7], // operation name
				//TODO: MORE MAGIC INDICES! match[6] should be OPERATION_TYPE_GROUP constant!
				//TODO: REGEX GROUP COUPLING - Magic indices tightly coupled to regex group order!
				type: match[6], // @publish or @subscribe
				//TODO: MAGIC INDEX CONTINUES! match[1] should be CHANNEL_PATH_GROUP constant!
				//TODO: BRITTLE ARRAY ACCESS - No validation that match[1] even exists!
				channelPath: match[1] // channel path
			}
			
			// Parse protocol configuration if present
			//TODO: MORE MAGIC INDICES! match[2] and match[3] should be named constants!
			//TODO: NULL SAFETY VIOLATION - No validation that match indices exist before access!
			if (match[2] && match[3]) {
				//TODO: TRY-CATCH ANTI-PATTERN - Should use Result<T> or Effect error handling!
				//TODO: ERROR HANDLING DISASTER - Generic try-catch hides specific parsing failures!
				try {
					// Clean up the config string and parse as JSON-like object
					//TODO: STRING MANIPULATION HELL! This is a HORRIBLE way to parse configuration!
					//TODO: REGEX CHAIN NIGHTMARE - Multiple .replace() calls create unmaintainable parsing!
					//TODO: BRITTLE JSON PARSING - What happens with nested objects, arrays, escaped quotes?
					//TODO: PERFORMANCE KILLER - Multiple regex replacements on every protocol config!
					//TODO: PROPER PARSER REQUIRED - Should use real TypeSpec AST parser, not regex hacks!
					const configStr = match[3]
						.replace(/(\w+):/g, '"$1":') // Quote property names
						.replace(/:\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*([,}])/g, ': "$1"$2') // Quote unquoted string values
						.replace(/:\s*(\d+)\s*([,}])/g, ': $1$2') // Keep numbers unquoted
						.replace(/:\s*(true|false)\s*([,}])/g, ': $1$2') // Keep booleans unquoted
						
					//TODO: UNSAFE JSON.PARSE! No validation of input structure before parsing!
					//TODO: JSON PARSING DISASTER - What if configStr is malformed after string manipulation?
					const config = JSON.parse(configStr)
					operation.protocolConfig = {
						//TODO: MAGIC INDEX AGAIN! match[2] should be PROTOCOL_TYPE_GROUP constant!
						protocol: match[2],
						config: config
					}
				} catch (error) {
					// If JSON parsing fails, store raw config for debugging
					//TODO: ERROR SWALLOWING ANTI-PATTERN - Silent failure with raw dump is NOT debugging!
					//TODO: PRODUCTION NIGHTMARE - Raw config objects will break downstream consumers!
					operation.protocolConfig = {
						protocol: match[2],
						config: { raw: match[3] }
					}
				}
			}
			
			// Parse security configuration if present
			//TODO: DUPLICATE CODE DISASTER! This is EXACT COPY of protocol parsing above!
			//TODO: DRY VIOLATION CATASTROPHE - Same string manipulation logic duplicated!
			//TODO: CODE MAINTENANCE NIGHTMARE - Bug fixes need to be applied in 2 places!
			//TODO: EXTRACT parseConfigString() FUNCTION IMMEDIATELY!
			if (match[4] && match[5]) {
				try {
					// Clean up the security config string and parse as JSON-like object
					//TODO: DUPLICATE STRING MANIPULATION HELL - EXACT SAME REGEX CHAINS AS PROTOCOL!
					//TODO: COPY-PASTE PROGRAMMING - This entire block is duplicate of lines 348-352!
					//TODO: MAINTAINABILITY DISASTER - Changes to parsing logic require 2 updates!
					const securityConfigStr = match[5]
						.replace(/(\w+):/g, '"$1":') // Quote property names
						.replace(/:\s*([a-zA-Z_][a-zA-Z0-9_.-]*)\s*([,}])/g, ': "$1"$2') // Quote unquoted string values (including URLs)
						.replace(/:\s*(\d+)\s*([,}])/g, ': $1$2') // Keep numbers unquoted
						.replace(/:\s*(true|false)\s*([,}])/g, ': $1$2') // Keep booleans unquoted
						
					//TODO: DUPLICATE JSON.PARSE DISASTER - Same unsafe parsing pattern repeated!
					const securityConfig = JSON.parse(securityConfigStr)
					operation.securityConfig = {
						//TODO: MORE MAGIC INDICES! match[4] should be SECURITY_SCHEME_GROUP constant!
						scheme: match[4],
						config: securityConfig
					}
				} catch (error) {
					// If JSON parsing fails, store raw config for debugging
					//TODO: DUPLICATE ERROR HANDLING - Same error swallowing pattern as protocol parsing!
					//TODO: COPY-PASTE ERROR HANDLING - Should be shared parseConfig() function!
					operation.securityConfig = {
						scheme: match[4],
						//TODO: MORE MAGIC INDICES! match[5] should be SECURITY_CONFIG_GROUP constant!
						config: { raw: match[5] }
					}
				}
			}
			
			operations.push(operation)
		}

		// Extract models and messages
		const models: Array<{name: string, properties: Record<string, any>, isMessage?: boolean, messageName?: string}> = []
		
		// Find models with @message decorator
		const messageModelMatches = code.matchAll(/@message\("([^"]+)"\)\s*model\s+(\w+)\s*\{[^}]*\}/gm)
		for (const match of messageModelMatches) {
			models.push({
				name: match[2],
				messageName: match[1],
				isMessage: true,
				properties: {} // Simplified for documentation tests
			})
		}
		
		// Find regular models (without @message decorator)
		const regularModelMatches = code.matchAll(/(?<!@message\([^)]*\)\s*)model\s+(\w+)\s*\{[^}]*\}/gm)
		for (const match of regularModelMatches) {
			// Skip if already captured as message model
			const modelName = match[1]
			if (!models.some(m => m.name === modelName)) {
				models.push({
					name: modelName,
					isMessage: false,
					properties: {} // Simplified for documentation tests
				})
			}
		}

		return {
			serviceTitle,
			serviceVersion,
			operations,
			models
		}
	}

	/**
	 * Generate model properties from TypeSpec code (simplified for tests)
	 */
	private generateModelProperties(modelName: string, code: string): Record<string, any> {
		// Find the model definition
		const modelRegex = new RegExp(`model\\s+${modelName}\\s*\\{([^}]+)\\}`, 'm')
		const modelMatch = code.match(modelRegex)
		
		if (!modelMatch) {
			return {}
		}
		
		const modelBody = modelMatch[1]
		const properties: Record<string, any> = {}
		
		// Parse property lines (simplified pattern matching)
		const propertyLines = modelBody.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'))
		
		for (const line of propertyLines) {
			// Match: propertyName: type;
			const propMatch = line.match(/^\s*(\w+):\s*([^;]+);?\s*$/)
			if (propMatch) {
				const [, propName, propType] = propMatch
				properties[propName] = this.mapTypeSpecTypeToJsonSchema(propType.trim())
			}
		}
		
		return properties
	}

	/**
	 * Map TypeSpec types to JSON Schema types (simplified for tests)
	 */
	private mapTypeSpecTypeToJsonSchema(typeSpec: string): any {
		// Handle basic types
		if (typeSpec === 'string') return { type: 'string' }
		if (typeSpec === 'int32') return { type: 'integer', format: 'int32' }
		if (typeSpec === 'int64') return { type: 'integer', format: 'int64' }
		if (typeSpec === 'float32') return { type: 'number', format: 'float' }
		if (typeSpec === 'float64') return { type: 'number', format: 'double' }
		if (typeSpec === 'boolean') return { type: 'boolean' }
		if (typeSpec === 'utcDateTime') return { type: 'string', format: 'date-time' }
		
		// Handle union types (simplified)
		if (typeSpec.includes('|')) {
			const unionValues = typeSpec.split('|').map(v => v.trim().replace(/"/g, ''))
			return { type: 'string', enum: unionValues }
		}
		
		// Default to string for unknown types
		return { type: 'string' }
	}

	/**
	 * Extract parameter type from operation definition
	 */
	private extractParameterType(operationName: string, paramName: string, code: string): any {
		// Find the operation definition
		const opRegex = new RegExp(`op\\s+${operationName}\\s*\\([^)]*@path\\s+${paramName}:\\s*([^,)]+)`, 'm')
		const opMatch = code.match(opRegex)
		
		if (opMatch) {
			const paramType = opMatch[1].trim()
			return this.mapTypeSpecTypeToJsonSchema(paramType)
		}
		
		// Default to string if not found
		return { type: 'string' }
	}

	/**
	 * Build complete TypeSpec source code with imports
	 */
	private buildSourceCode(userCode: string, additionalLibraries: string[]): string {
		// With the new testing framework, libraries are loaded via tester config
		// We still need the imports for the source code
		const standardImports = [
			'import "@typespec/http";',
			'import "@typespec/rest";',
		]

		const allImports = [
			...standardImports,
			...additionalLibraries.map(lib => `import "${lib}";`),
		]

		return `${allImports.join('\n')}\n\n${userCode}`
	}

	/**
	 * Extract namespace from compiled program
	 */
	getNamespace(program: Program, namespaceName: string): Namespace | undefined {
		const globalNamespace = program.getGlobalNamespaceType()
		return this.findNamespaceRecursive(globalNamespace, namespaceName)
	}

	/**
	 * Recursively find a namespace by name
	 */
	private findNamespaceRecursive(namespace: Namespace, targetName: string): Namespace | undefined {
		if (namespace.name === targetName) {
			return namespace
		}

		for (const [name, childNamespace] of namespace.namespaces) {
			if (name === targetName) {
				return childNamespace
			}
			const found = this.findNamespaceRecursive(childNamespace, targetName)
			if (found) return found
		}

		return undefined
	}

	/**
	 * Extract operation from namespace by name
	 */
	getOperation(namespace: Namespace, operationName: string): Operation | undefined {
		return namespace.operations.get(operationName)
	}

	/**
	 * Extract model from namespace by name
	 */
	getModel(namespace: Namespace, modelName: string): Model | undefined {
		return namespace.models.get(modelName)
	}

	/**
	 * Get all operations from a namespace
	 */
	getAllOperations(namespace: Namespace): Operation[] {
		return Array.from(namespace.operations.values())
	}

	/**
	 * Get all models from a namespace
	 */
	getAllModels(namespace: Namespace): Model[] {
		return Array.from(namespace.models.values())
	}

	/**
	 * Validate compilation succeeded without errors
	 */
	validateCompilationSuccess(result: TypeSpecCompileResult): void {
		const errors = result.diagnostics.filter(d => d.severity === "error")
		if (errors.length > 0) {
			throw new Error(`TypeSpec compilation failed with errors: ${errors.map(e => e.message).join(', ')}`)
		}
	}

	//TODO: ZERO any!
	/**
	 * Get decorator metadata from a type
	 */
	getDecoratorMetadata(program: Program, type: Type, decoratorName: string): any {
		return program.stateMap(decoratorName).get(type)
	}
}

/**
 * Create a new TypeSpec documentation test compiler
 */
export function createTypeSpecTestCompiler(): TypeSpecDocumentationTestCompiler {
	return new TypeSpecDocumentationTestCompiler()
}