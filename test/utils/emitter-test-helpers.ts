/**
 * TypeSpec 1.4.0 EmitterTester-based test helpers
 *
 * This replaces the old createTestWrapper approach with the proper
 * EmitterTester API that correctly passes options to emitters.
 */

import { createTester, findTestPackageRoot } from "@typespec/compiler/testing"
import type { AsyncAPIEmitterOptions } from "../../src/infrastructure/configuration/options.js"
import YAML from "yaml"

/**
 * Create an EmitterTester configured for AsyncAPI emitter testing
 *
 * Uses TypeSpec 1.4.0's .emit() API which properly passes options to the emitter.
 *
 * @param options - AsyncAPI emitter options (file-type, output-file, etc.)
 * @returns Configured EmitterTester instance
 */
export async function createAsyncAPIEmitterTester(
	options: AsyncAPIEmitterOptions = {},
) {
	const packageRoot = await findTestPackageRoot(import.meta.url)

	return createTester(packageRoot, {
		libraries: ["@lars-artmann/typespec-asyncapi"],
	})
		.importLibraries() // Auto-import all configured libraries
		.using("TypeSpec.AsyncAPI") // Add using statement for TypeSpec.AsyncAPI namespace
		.emit("@lars-artmann/typespec-asyncapi", options)
}

/**
 * Compile TypeSpec source to AsyncAPI using new EmitterTester API
 *
 * This is the 1.4.0 replacement for compileAsyncAPISpecRaw that:
 * - Properly passes options to the emitter
 * - Has direct access to output files via result.outputs
 * - Doesn't require filesystem searches
 * - Provides better test isolation
 *
 * @param source - TypeSpec source code to compile
 * @param options - AsyncAPI emitter options
 * @returns AsyncAPI document, diagnostics, program, and outputs
 */
export async function compileAsyncAPI(
	source: string,
	options: AsyncAPIEmitterOptions = {},
) {
	const tester = await createAsyncAPIEmitterTester(options)
	const result = await tester.compile(source)

	// Find the AsyncAPI output file
	const outputFile = Object.keys(result.outputs).find(
		f => f.endsWith(".yaml") || f.endsWith(".json"),
	)

	if (!outputFile) {
		throw new Error("No AsyncAPI output generated")
	}

	const content = result.outputs[outputFile]
	const doc = outputFile.endsWith(".json")
		? JSON.parse(content)
		: YAML.parse(content)

	return {
		asyncApiDoc: doc,
		diagnostics: result.program.diagnostics,
		program: result.program,
		outputs: result.outputs,
		outputFile,
	}
}

/**
 * Compile TypeSpec source and assert no errors (warnings OK)
 *
 * Equivalent to compileAsyncAPISpecWithoutErrors but using new API.
 *
 * @param source - TypeSpec source code
 * @param options - AsyncAPI emitter options
 * @returns AsyncAPI document and diagnostics
 */
export async function compileAsyncAPIWithoutErrors(
	source: string,
	options: AsyncAPIEmitterOptions = {},
) {
	const result = await compileAsyncAPI(source, options)

	const errors = result.diagnostics.filter(d => d.severity === "error")
	if (errors.length > 0) {
		const errorMessages = errors.map(e => `${e.code}: ${e.message}`).join("\n")
		throw new Error(`Compilation failed with errors:\n${errorMessages}`)
	}

	return result
}
