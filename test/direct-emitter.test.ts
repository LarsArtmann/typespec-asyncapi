/**
 * Direct test of emitter function bypass TypeSpec test framework
 */

import {describe, expect, it} from "vitest"
import {createTestHost} from "@typespec/compiler/testing"
import {$onEmit} from "../dist/index"
import {AsyncAPITestLibrary} from "./test-host"

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
		const originalLog = Effect.log
		Effect.log = (...args) => {
			consoleLogs.push(args.join(" "))
			originalLog(...args)
		}

		try {
			const result = await host.compile("direct.tsp")
			Effect.log("Compile result:", typeof result, Array.isArray(result), result?.length)

			const program = Array.isArray(result) ? result[0] : result

			Effect.log("Program compiled successfully")
			Effect.log("Program type:", typeof program)
			Effect.log("Program sourceFiles:", program.sourceFiles?.size || 0)

			// Call our emitter directly
			Effect.log("=== CALLING EMITTER DIRECTLY ===")

			const emitterContext = {
				program: {
					...program,
					// Mock the host.mkdirp functionality for testing
					host: {
						mkdirp: async (path: string) => {
							Effect.log(`Mock mkdirp: ${path}`)
						},
						writeFile: async (path: string, content: string) => {
							Effect.log(`Mock writeFile: ${path} (${content.length} chars)`)
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

			Effect.log("Emitter context program:", !!emitterContext.program)
			Effect.log("Emitter context program type:", typeof emitterContext.program)
			Effect.log("Program has sourceFiles:", !!emitterContext.program?.sourceFiles)

			await $onEmit(emitterContext as any)

			Effect.log("=== EMITTER CALL COMPLETE ===")

			// Check console output
			const emitterLogs = consoleLogs.filter(log =>
				log.includes("ASYNCAPI EMITTER") ||
				log.includes("Generated") ||
				log.includes("Processing REAL TypeSpec AST"),
			)

			Effect.log(`Found ${emitterLogs.length} emitter-related logs:`)
			emitterLogs.forEach((log, i) => Effect.log(`  ${i + 1}. ${log}`))

			// Check files in host filesystem
			Effect.log("Files in host.fs after direct emitter call:")
			for (const [path, file] of host.fs.entries()) {
				if (path.includes('direct-test') || path.includes('asyncapi')) {
					Effect.log(`  🎯 OUTPUT: ${path} (${file.content?.length || 0} chars)`)
					if (file.content) {
						Effect.log(`     Content preview: ${file.content.substring(0, 100)}...`)
					}
				}
			}

			// This should have called our emitter
			expect(emitterLogs.length).toBeGreaterThan(0)

		} finally {
			Effect.log = originalLog
		}
	})
})