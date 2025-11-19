import { describe, expect, it } from "bun:test"
import { createAsyncAPIEmitterTester, compileAsyncAPI } from "./utils/emitter-test-helpers.js"

describe("emitFile API Isolation Test", () => {
	it("should demonstrate emitFile -> result.outputs disconnect", async () => {
		console.log("🧪 ISOLATING EMITFILE ISSUE")
		
		// DEBUG: Check real filesystem for generated files
		const fs = await import('fs');
		const path = await import('path');
		const cwd = process.cwd();
		console.log(`🔍 Current working directory: ${cwd}`);
		
		// Check if temp-output exists and list files
		const tempOutputBase = path.join(cwd, "test", "temp-output");
		if (fs.existsSync(tempOutputBase)) {
			const subdirs = fs.readdirSync(tempOutputBase);
			console.log(`🔍 temp-output subdirs:`, subdirs);
			for (const subdir of subdirs) {
				if (subdir === ".DS_Store") continue;
				const fullPath = path.join(tempOutputBase, subdir, "@lars-artmann", "typespec-asyncapi");
				if (fs.existsSync(fullPath)) {
					const files = fs.readdirSync(fullPath);
					console.log(`🔍 Files in ${fullPath}:`, files);
				}
			}
		}
		
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
		
		// DEBUG: Show all filesystem paths in virtual FS
		console.log("🔍 Virtual FS contents:")
		for (const [name, value] of Object.entries(result.fs.fs)) {
			console.log(`  ${name}: ${typeof value === 'string' ? 'string(' + value.length + ' chars)' : typeof value}`)
		}
		
		// This should find the emitted file but will fail
		const outputFile = Object.keys(result.outputs).find(
			f => f.endsWith(".json") || f.endsWith(".yaml"),
		)
		
		// DEBUG: Show result.outputs structure
		console.log(`🔍 result.outputs type:`, typeof result.outputs)
		console.log(`🔍 result.outputs constructor:`, result.outputs?.constructor?.name)
		console.log(`🔍 result.outputs keys:`, Object.keys(result.outputs || {}))
		
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
