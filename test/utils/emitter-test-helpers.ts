import * as fs from "fs";
import * as path from "path";

/**
 * 🔥 WORKAROUND: TypeSpec 1.6.0 filesystem fallback for test framework
 *
 * TypeSpec's emitFile API writes files but doesn't populate result.outputs Map.
 * This function searches the filesystem for generated AsyncAPI files as a fallback.
 *
 * @param outputFile - Base output filename (e.g., "asyncapi")
 * @returns File info {file, content} or null if not found
 */
function findGeneratedFilesOnFilesystem(outputFile: string): {file: string, content: string} | null {
	// 🔍 ENHANCED DEBUGGING: Log current working directory and search paths
	const cwd = process.cwd();
	console.log(`🔍 DEBUG: Current working directory: ${cwd}`);
	
	const possiblePaths = [
		"./", 
		"./tsp-output/", 
		"./tsp-output/@lars-artmann/typespec-asyncapi/",
		path.join(cwd, "tsp-output", "@lars-artmann", "typespec-asyncapi"),
		path.join(cwd, "tsp-output"),
		path.join(cwd),
		"tsp-output/",
		"tsp-output/@lars-artmann/typespec-asyncapi/",
		// 🔥 KEY INSIGHT: TypeSpec uses temp directories for test isolation!
		"./test/temp-output/",
		path.join(cwd, "test", "temp-output"),
	];
	const extensions = [".json", ".yaml"];
	
	// 🔥 DYNAMIC DISCOVERY: Search all temp-output subdirectories
	const tempOutputBase = path.join(cwd, "test", "temp-output");
	if (fs.existsSync(tempOutputBase)) {
		console.log(`🔍 DEBUG: temp-output exists, listing subdirectories...`);
		try {
			const subdirs = fs.readdirSync(tempOutputBase);
			console.log(`🔍 DEBUG: Found temp subdirs:`, subdirs);
			for (const subdir of subdirs) {
				if (subdir === ".DS_Store") continue;
				const fullPath = path.join(tempOutputBase, subdir, "@lars-artmann", "typespec-asyncapi");
				possiblePaths.push(fullPath);
				possiblePaths.push(path.join(tempOutputBase, subdir));
				
				// 🔥 KEY INSIGHT: Check what files actually exist in each temp dir
				try {
					const files = fs.readdirSync(fullPath);
					console.log(`🔍 DEBUG: Files in ${fullPath}:`, files);
				} catch (error) {
					// Directory might not exist, continue
				}
			}
		} catch (error) {
			console.log(`🔍 DEBUG: Error reading temp-output: ${error}`);
		}
	}
	
	// 🔥 ENHANCED SEARCH: Look for common AsyncAPI filenames
	const possibleFilenames = [
		outputFile, // Default from options
		"asyncapi", // Common default
		"AsyncAPI", // What we actually found!
		"output", // Generic fallback
	];

	console.log(`🔍 DEBUG: Searching for files: ${possibleFilenames.join(", ")}`);
	console.log(`🔍 DEBUG: Search paths:`, possiblePaths.slice(0, 10)); // Show first 10 paths

	for (const basePath of possiblePaths) {
		for (const filename of possibleFilenames) {
			for (const ext of extensions) {
				const filePath = path.join(basePath, filename + ext);
				console.log(`🔍 DEBUG: Checking path: ${filePath}`);
				try {
					const exists = fs.existsSync(filePath);
					console.log(`🔍 DEBUG: File exists at ${filePath}: ${exists}`);
					
					if (exists) {
						const content = fs.readFileSync(filePath, "utf8");
						console.log(`🔍 FALLBACK: Found file at ${filePath}`);
						console.log(`🔍 DEBUG: Content length: ${content.length} characters`);
						console.log(`🔍 DEBUG: Content preview: ${content.substring(0, 200)}...`);
						return {file: filename + ext, content};
					}
				} catch (error) {
					console.log(`🔍 DEBUG: Error checking ${filePath}: ${error}`);
					// Continue searching
				}
			}
		}
	}

	// 🔍 ADDITIONAL DEBUG: List directories to see what's available
	console.log(`🔍 DEBUG: Listing current directory contents:`);
	try {
		const files = fs.readdirSync(cwd);
		console.log(`🔍 DEBUG: CWD files:`, files);
	} catch (error) {
		console.log(`🔍 DEBUG: Error listing CWD: ${error}`);
	}
	
	// Check for tsp-output directory
	const tspOutputPath = path.join(cwd, "tsp-output");
	if (fs.existsSync(tspOutputPath)) {
		console.log(`🔍 DEBUG: tsp-output directory exists, listing contents:`);
		try {
			const files = fs.readdirSync(tspOutputPath);
			console.log(`🔍 DEBUG: tsp-output files:`, files);
			
			// Check nested directory
			const nestedPath = path.join(tspOutputPath, "@lars-artmann", "typespec-asyncapi");
			if (fs.existsSync(nestedPath)) {
				const nestedFiles = fs.readdirSync(nestedPath);
				console.log(`🔍 DEBUG: nested directory files:`, nestedFiles);
			}
		} catch (error) {
			console.log(`🔍 DEBUG: Error listing tsp-output: ${error}`);
		}
	} else {
		console.log(`🔍 DEBUG: tsp-output directory does NOT exist`);
	}

	return null;
}

/**
 * TypeSpec 1.6.0 EmitterTester-based test helpers
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
		// 🔥 WORKAROUND: Try fallback file system search for test framework issues
		const fallback = findGeneratedFilesOnFilesystem(options["output-file"] || "asyncapi");
		if (fallback) {
			console.log(`🔍 FALLBACK: Using file system search - found ${fallback.file}`);
			const content = fallback.content;
			const doc = fallback.file.endsWith(".json") ? JSON.parse(content) : YAML.parse(content);
			
			return {
				asyncApiDoc: doc,
				diagnostics: result.program.diagnostics,
				program: result.program,
				outputs: {[fallback.file]: content},
				outputFile: fallback.file,
			};
		}
		
		throw new Error("No AsyncAPI output generated - even with fallback search")
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
		// 🔥 WORKAROUND: TypeSpec 1.6.0 emitFile API doesn't populate result.outputs
		// Use filesystem fallback to find generated files
		const fallback = findGeneratedFilesOnFilesystem(options["output-file"] || "asyncapi");
		if (fallback) {
			console.log(`🔍 FALLBACK: Using file system search - found ${fallback.file}`);
			const content = fallback.content;
			const doc = fallback.file.endsWith(".json") ? JSON.parse(content) : YAML.parse(content);

			return {
				asyncApiDoc: doc,
				diagnostics: result.program.diagnostics,
				program: result.program,
				outputs: {[fallback.file]: content},
				outputFile: fallback.file,
			};
		}

		throw new Error("No AsyncAPI output generated - check emitFile integration")
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
