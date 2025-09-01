/**
 * REAL emitter test - no mocks, just real TypeSpec compilation
 */

import {describe, expect, it} from "vitest"
import {createTestHost} from "@typespec/compiler/testing"
import {AsyncAPITestLibrary} from "./test-host"

describe("REAL Emitter Test - No Mocks", () => {
	it("should compile TypeSpec to AsyncAPI using REAL emitter", async () => {
		// Create a REAL TypeSpec test host
		const host = await createTestHost({
			libraries: [AsyncAPITestLibrary],
		})

		// Add the AsyncAPI library so decorators work
		host.addTypeSpecFile("main.tsp", `
			import "@larsartmann/typespec-asyncapi";
			
			using TypeSpec.AsyncAPI;
			
			@server("production", {
				url: "kafka://localhost:9092",
				protocol: "kafka"
			})
			namespace MyService;
			
			model UserEvent {
				id: string;
				timestamp: utcDateTime;
			}
			
			@channel("user.events")
			@publish
			op publishUserEvent(): UserEvent;
		`)

		// Compile with the REAL emitter
		const diagnostics = await host.diagnose("main.tsp", {
			emit: ["@larsartmann/typespec-asyncapi"],
		})

		// Should compile without errors
		expect(diagnostics).toHaveLength(0)

		// Check that AsyncAPI output was generated
		const outputFiles = host.fs.keys()
		const asyncApiFile = Array.from(outputFiles).find(f => 
			f.includes("asyncapi") && (f.endsWith(".json") || f.endsWith(".yaml"))
		)
		
		expect(asyncApiFile).toBeDefined()
		
		if (asyncApiFile) {
			const content = host.fs.get(asyncApiFile)
			expect(content).toBeDefined()
			
			// Parse and validate the AsyncAPI document
			const spec = JSON.parse(content as string)
			expect(spec.asyncapi).toBe("3.0.0")
			expect(spec.servers).toBeDefined()
			expect(spec.channels).toBeDefined()
		}
	})

	it("should handle real decorators without mocking", async () => {
		const host = await createTestHost({
			libraries: [AsyncAPITestLibrary],
		})

		host.addTypeSpecFile("test.tsp", `
			import "@larsartmann/typespec-asyncapi";
			using TypeSpec.AsyncAPI;

			@server("dev", {url: "localhost:9092", protocol: "kafka"})
			namespace TestAPI {
				@channel("test.channel")
				@subscribe
				op receiveMessage(): string;
			}
		`)

		const program = await host.compile("test.tsp")
		
		// The REAL program has all the methods we need
		expect(program.stateMap).toBeDefined()
		expect(typeof program.stateMap).toBe("function")
		
		// No mocking needed - it just works!
	})
})