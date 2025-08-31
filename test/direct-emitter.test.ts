/**
 * Direct test of emitter function bypass TypeSpec test framework
 */

import {describe, expect, it} from "vitest"
import {createTestHost} from "@typespec/compiler/testing"
import {$onEmit} from "../dist/index.js"
import {AsyncAPITestLibrary} from "./test-host"
import {Effect} from "effect"

describe("Direct Emitter Test", () => {
	it("should call emitter function directly", async () => {
		const host = await createTestHost({
			libraries: [AsyncAPITestLibrary],
		})

		// Simple TypeSpec source
		const source = `
      namespace DirectTest;
      
      model TestEvent {
        id: string;
        message: string;
      }
      
      op publishTestEvent(): TestEvent;
    `

		host.addTypeSpecFile("direct.tsp", source)

		// Capture console output
		const consoleLogs: string[] = []
		const originalLog = console.log
		console.log = (...args) => {
			consoleLogs.push(args.join(" "))
			originalLog(...args)
		}

		try {
			const result = await host.compile("direct.tsp")
			Effect.logInfo("Compile result:", {type: typeof result, isArray: Array.isArray(result), length: result?.length})

			const program = Array.isArray(result) ? result[0] : result

			Effect.logInfo("Program compiled successfully")
			Effect.logInfo("Program type:", {type: typeof program})
			Effect.logInfo("Program sourceFiles:", {count: program.sourceFiles?.size || 0})

			// Call our emitter directly
			Effect.logInfo("=== CALLING EMITTER DIRECTLY ===")

			const emitterContext = {
				program: {
					...program,
					// Add required compilerOptions for AssetEmitter
					compilerOptions: {
						...program.compilerOptions,
						dryRun: false,
					},
					// Mock the host.mkdirp functionality for testing
					host: {
						mkdirp: async (path: string) => {
							Effect.logDebug(`Mock mkdirp: ${path}`)
						},
						writeFile: async (path: string, content: string) => {
							Effect.logDebug(`Mock writeFile: ${path} (${content.length} chars)`)
							// Add to host.fs for test verification
							host.fs.set(path, {content})
						},
					},
					// Add other missing Program methods for testing
					getGlobalNamespaceType: () => ({
						name: "Global",
						operations: new Map(),
						namespaces: new Map(),
					}),
					sourceFiles: new Map([
						["direct.tsp", {content: source}],
					]),
				},
				emitterOutputDir: "/direct-test-output",
				options: {
					"output-file": "direct-test",
					"file-type": "json" as const,
				},
			}

			Effect.logInfo("Emitter context program:", {hasProgram: !!emitterContext.program})
			Effect.logInfo("Emitter context program type:", {type: typeof emitterContext.program})
			Effect.logInfo("Program has sourceFiles:", {hasSourceFiles: !!emitterContext.program?.sourceFiles})

			await $onEmit(emitterContext)

			Effect.logInfo("=== EMITTER CALL COMPLETE ===")

			// Check console output
			const emitterLogs = consoleLogs.filter(log =>
				log.includes("ASYNCAPI EMITTER") ||
				log.includes("Generated") ||
				log.includes("Processing REAL TypeSpec AST"),
			)

			Effect.logInfo(`Found ${emitterLogs.length} emitter-related logs:`)
			emitterLogs.forEach((log, i) => Effect.logDebug(`  ${i + 1}. ${log}`))

			// Check files in host filesystem
			Effect.logInfo("Files in host.fs after direct emitter call:")
			for (const [path, file] of host.fs.entries()) {
				if (path.includes('direct-test') || path.includes('asyncapi')) {
					Effect.logInfo(`  🎯 OUTPUT: ${path} (${file.content?.length || 0} chars)`)
					if (file.content) {
						Effect.logDebug(`     Content preview: ${file.content.substring(0, 100)}...`)
					}
				}
			}

			// This should have called our emitter
			expect(emitterLogs.length).toBeGreaterThan(0)

		} finally {
			console.log = originalLog
		}
	})
})