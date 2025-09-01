/**
 * Debug test to check if emitter is being called at all
 */

import {describe, it} from "vitest"
import {createAsyncAPITestHost} from "./utils/test-helpers"
import {Effect} from "effect"

describe("Debug Emitter Registration", () => {
	it("should call our emitter and generate console output", async () => {
		const host = await createAsyncAPITestHost()

		// Simpler test - just check if TypeSpec can resolve our library at all
		const source = `
      namespace DebugTest;
      
      model TestEvent {
        id: string;
        message: string;
      }
      
      op publishTestEvent(): TestEvent;
    `

		host.addTypeSpecFile("debug.tsp", source)

		// Capture console output
		const consoleLogs: string[] = []
		const originalLog = Effect.log
		//TODO: needs to be replaced with something that works, e.g. Effect tests?
		///Effect.log = (...args) => {
		///	consoleLogs.push(args.join(" "))
		///	originalLog(...args)
		///}

		try {
			const result = await host.compileAndDiagnose("debug.tsp", {
				emitters: {
					"@larsartmann/typespec-asyncapi": {
						"output-file": "debug-output",
						"file-type": "json",
					},
				},
				outputDir: "debug-test-output",
				noEmit: false,
			})

			Effect.log("=== COMPILATION COMPLETE ===")
			Effect.log(`Result:`, typeof result, Object.keys(result || {}))
			Effect.log(`Result as array:`, Array.isArray(result), result?.length)

			// Try to destructure as array
			if (Array.isArray(result) && result.length >= 2) {
				const [program, diagnostics] = result
				Effect.log(`Program (array[0]):`, !!program, typeof program)
				Effect.log(`Diagnostics (array[1]):`, Array.isArray(diagnostics), diagnostics?.length || 0)

				if (diagnostics && Array.isArray(diagnostics) && diagnostics.length > 0) {
					const errors = diagnostics.filter(d => d.severity === "error")
					const warnings = diagnostics.filter(d => d.severity === "warning")
					Effect.log(`Errors: ${errors.length}, Warnings: ${warnings.length}`)

					if (errors.length > 0) {
						Effect.log("Compilation errors:")
						errors.forEach(error => Effect.log(`  - ${error.message}`))
					}
				}
			} else if (result) {
				Effect.log(`Diagnostics count: ${result.diagnostics?.length || 0}`)
				Effect.log(`Program exists: ${!!result.program}`)

				// Check diagnostics
				if (result.diagnostics?.length > 0) {
					const errors = result.diagnostics.filter(d => d.severity === "error")
					const warnings = result.diagnostics.filter(d => d.severity === "warning")
					Effect.log(`Errors: ${errors.length}, Warnings: ${warnings.length}`)

					if (errors.length > 0) {
						Effect.log("Compilation errors:")
						errors.forEach(error => Effect.log(`  - ${error.message}`))
					}
				}
			}

			Effect.log("Available files in host.fs:")
			for (const [path, file] of host.fs.entries()) {
				Effect.log(`  - ${path} (${file.content?.length || 0} chars)`)

				// Look specifically for our emitter output
				if (path.includes('debug-test-output') || path.includes('debug-output')) {
					Effect.log(`  🎯 FOUND EMITTER OUTPUT: ${path}`)
					Effect.log(`     Content: ${file.content?.substring(0, 200)}...`)
				}
			}

			// Check if our emitter was called
			const emitterLogs = consoleLogs.filter(log =>
				log.includes("ASYNCAPI EMITTER") ||
				log.includes("Generated") ||
				log.includes("Processing REAL TypeSpec AST"),
			)

			Effect.log(`Found ${emitterLogs.length} emitter-related logs:`)
			emitterLogs.forEach((log, i) => Effect.log(`  ${i + 1}. ${log}`))

		} finally {
			//TODO: needs to be replaced with something that works, e.g. Effect tests?
			//Effect.log = originalLog
		}
	})
})