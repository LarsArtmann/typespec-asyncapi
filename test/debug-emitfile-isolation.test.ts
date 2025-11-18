import { describe, expect, it } from "bun:test"
import { createAsyncAPIEmitterTester, compileAsyncAPI } from "./utils/emitter-test-helpers.js"

describe("emitFile API Isolation Test", () => {
	it("should demonstrate emitFile -> result.outputs disconnect", async () => {
		console.log("🧪 ISOLATING EMITFILE ISSUE")
		
		// Create a test that clearly shows the disconnect
		const tester = await createAsyncAPIEmitterTester({
			"output-file": "emitfile-test",
			"file-type": "json"
		})
		
		// Simple source that should emit a file
		const source = `
		namespace TestNamespace;
		
		model TestEvent {
		  id: string;
		  message: string;
		}
		
		@channel("test-channel")
		@publish
		op publishTest(): TestEvent;
		`
		
		// Compile and capture result
		const result = await tester.compile(source)
		
		// DEBUG: Show all filesystem paths in virtual FS
		console.log("🔍 Virtual FS contents:")
		for (const [name, value] of Object.entries(result.fs.fs)) {
			console.log(`  ${name}: ${typeof value === 'string' ? 'string(' + value.length + ' chars)' : typeof value}`)
		}
		
		// DEBUG: Show result.outputs
		console.log("🔍 result.outputs:", result.outputs)
		
		// This should find the emitted file but will fail
		const outputFile = Object.keys(result.outputs).find(
			f => f.endsWith(".json") || f.endsWith(".yaml"),
		)
		
		if (!outputFile) {
			console.log("❌ CONFIRMED: emitFile writes to real FS but result.outputs is empty")
			throw new Error("emitFile API test framework integration broken")
		}
		
		// This would be ideal state
		expect(result.outputFile).toBe("emitfile-test.json")
		expect(result.outputs["emitfile-test.json"]).toBeDefined()
		
		console.log("✅ ISSUE RESOLVED: emitFile now populates result.outputs")
	})
})
