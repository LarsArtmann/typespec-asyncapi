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
import {createTestProgram, EmitTestResult} from "@typespec/compiler/testing"
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
	//TODO: ZERO any ALLOWED!
	/** Any compilation diagnostics */
	diagnostics: readonly any[]
	/** Generated AsyncAPI object (if emitAsyncAPI is true) */
	asyncapi?: AsyncAPIObject
	/** Raw emission result */
	emissionResult?: EmitTestResult
}

/**
 * Helper class for TypeSpec compilation in documentation tests
 */
export class TypeSpecDocumentationTestCompiler {

	/**
	 * Compile TypeSpec code for documentation testing
	 *
	 * @param options - Compilation options
	 * @returns Compilation result with program and optional AsyncAPI output
	 */
	async compileTypeSpec(options: TypeSpecTestCompileOptions): Promise<TypeSpecCompileResult> {
		const {
			code,
			additionalLibraries = [],
			emitAsyncAPI = false,
			outputFormat = SERIALIZATION_FORMAT_OPTION_JSON,
		} = options

		// Create the TypeSpec source with proper imports
		const sourceCode = this.buildSourceCode(code, additionalLibraries)

		try {
			// Use TypeSpec testing utilities to create program
			const testProgram = await createTestProgram({
				sourceFiles: {
					"main.tsp": sourceCode,
				},
				libraries: [
					"@typespec/compiler",
					resolvePath("../../../lib"), // Our AsyncAPI library
					...additionalLibraries,
				],
			})

			const result: TypeSpecCompileResult = {
				program: testProgram.program,
				diagnostics: testProgram.program.diagnostics,
			}

			// If AsyncAPI emission is requested, compile with our emitter
			if (emitAsyncAPI) {
				const emissionResult = await testProgram.host.emit({
					emitterName: "@typespec/asyncapi",
					options: {
						"output-format": outputFormat,
					},
				})

				result.emissionResult = emissionResult

				// Extract AsyncAPI object from emission result
				if (emissionResult.outputFiles.length > 0) {
					const asyncApiContent = emissionResult.outputFiles[0].contents
					result.asyncapi = outputFormat === "json"
						? JSON.parse(asyncApiContent)
						: asyncApiContent // YAML parsing would need additional library
				}
			}

			return result

		} catch (error) {
			throw new Error(`TypeSpec compilation failed: ${error instanceof Error ? error.message : String(error)}`)
		}
	}

	/**
	 * Build complete TypeSpec source code with imports
	 */
	private buildSourceCode(userCode: string, additionalLibraries: string[]): string {
		const standardImports = [
			'import "@typespec/http";',
			'import "@typespec/rest";',
			'import "@typespec/openapi";',
			'import "../../../lib/main.tsp";', // Our AsyncAPI library
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