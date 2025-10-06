/**
 * Direct test of emitter function bypass TypeSpec test framework
 */

import {describe, expect, it} from "bun:test"
import {createTestHost} from "@typespec/compiler/testing"
import {$onEmit} from "../../src/index.js"
import {AsyncAPITestLibrary} from "./test-host"
import {createAsyncAPITestHost} from "../utils/test-helpers.js"
import {Effect} from "effect"

describe("Direct Emitter Test", () => {
	it("should call emitter function directly", async () => {
		const host = await createAsyncAPITestHost()

		// Simple TypeSpec source with proper imports
		const source = `
      import "@lars-artmann/typespec-asyncapi";
      using TypeSpec.AsyncAPI;
      
      namespace DirectTest;
      
      model TestEvent {
        id: string;
        message: string;
      }
      
      op publishTestEvent(): TestEvent;
    `

		host.addTypeSpecFile("main.tsp", source)

		// Capture console output
		const consoleLogs: string[] = []
		const originalLog = Effect.log
		Effect.log = (...args) => {
			consoleLogs.push(args.join(" "))
			originalLog(...args)
		}

		try {
			// Use TypeSpec's compile method properly
			const result = await host.compile("main.tsp")
			Effect.logInfo("Compile result type:", typeof result)
			
			// The compile method returns a Program directly
			const program = result

			Effect.logInfo("Program compiled successfully")
			Effect.logInfo("Program type:", {type: typeof program})
			Effect.logInfo("Program sourceFiles:", {count: program.sourceFiles?.size || 0})

			// USE THE REAL PROGRAM OBJECT - NO MOCKING!
			Effect.logInfo("=== USING REAL TYPESPEC PROGRAM ===")

			const emitterContext = {
				program: program, // REAL PROGRAM from TypeSpec compilation
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
			Effect.log = originalLog
		}
	})
})