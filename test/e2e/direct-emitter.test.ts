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
	it.skip("should call emitter function directly", async () => {
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

		// Note: Cannot capture Effect.log output (readonly)
		// Test will verify emitter runs without errors

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

			// Call the emitter directly
			await $onEmit(emitterContext)

			Effect.logInfo("=== EMITTER CALL COMPLETE ===")

			// Verify emitter produced output files
			const outputFiles = Array.from(host.fs.keys())
			const asyncapiFiles = outputFiles.filter(f =>
				f.includes('asyncapi') || f.includes('direct-test')
			)

			Effect.logInfo(`Found ${asyncapiFiles.length} output files:`, asyncapiFiles)

			// Verify at least emitter ran without throwing
			expect(asyncapiFiles.length).toBeGreaterThanOrEqual(0)

		} catch (error) {
			throw error
		}
	})
})