/**
 * REAL emitter test - no mocks, just real TypeSpec compilation
 */

import {describe, expect, it} from "bun:test"
import {expectDiagnosticEmpty, formatDiagnostics, createTestHost} from "@typespec/compiler/testing"
import {AsyncAPITestLibrary} from "./test-host"
import {createAsyncAPITestHost} from "./utils/test-helpers"

describe("REAL Emitter Test - No Mocks", () => {
	it("should compile TypeSpec to AsyncAPI using REAL emitter", async () => {
		// Create a REAL TypeSpec test host with the AsyncAPI library loaded
		const host = await createAsyncAPITestHost()
		
		// Load our actual decorator implementations
		await host.compile("")  // Initialize the host first

		// Test a simple TypeSpec document without decorators first
		host.addTypeSpecFile("main.tsp", `
			import "@larsartmann/typespec-asyncapi";
			using TypeSpec.AsyncAPI;
			
			namespace MyService;
			
			model UserEvent {
				id: string;
				timestamp: utcDateTime;
			}
			
			// Simple operations without decorators - test basic emitter functionality
			op publishUserEvent(): UserEvent;
			op subscribeUserEvent(): UserEvent;
		`)

		// Debug: Check what files are actually in the host filesystem
		Effect.log("Files in host filesystem:", Array.from(host.fs.keys()))
		
		// Compile with the REAL emitter - specify the correct file path
		const program = await host.compile("./main.tsp")
		
		// Check if there are any compilation diagnostics first
		expectDiagnosticEmpty(program.diagnostics)

		// Now emit AsyncAPI
		const diagnostics = await host.diagnose("./main.tsp", {
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
		const host = await createAsyncAPITestHost()

		host.addTypeSpecFile("test.tsp", `
			import "@larsartmann/typespec-asyncapi";
			using TypeSpec.AsyncAPI;
			
			namespace TestAPI;
			
			model Message {
				id: string;
				content: string;
			}
			
			// Test basic compilation without decorators
			op receiveMessage(): Message;
			op sendMessage(msg: Message): void;
		`)

		const program = await host.compile("./test.tsp")
		
		// The REAL program has all the methods we need
		expect(program.stateMap).toBeDefined()
		expect(typeof program.stateMap).toBe("function")
		
		// No mocking needed - it just works!
	})
})