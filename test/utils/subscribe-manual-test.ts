/**
 * Manual test to validate @subscribe decorator compilation
 */

import {createAsyncAPITestHost} from "./utils/test-helpers"
import {Effect} from "effect"

async function testSubscribeDecorator() {
	Effect.log("🧪 Testing @subscribe decorator functionality...")

	try {
		const host = await createAsyncAPITestHost()

		const testSource = `
      import "@larsartmann/typespec-asyncapi";
      using TypeSpec.AsyncAPI;
      
      namespace TestApi;
      
      model UserEvent {
        userId: string;
        email: string;
      }

      @channel("user.events")  
      @subscribe
      op handleUserSignup(): UserEvent;
    `

		Effect.log("📝 Compiling test TypeSpec source with @subscribe decorator...")
		host.addTypeSpecFile("main.tsp", testSource)

		const result = await host.compileAndDiagnose("main.tsp", {
			emitters: {
				"@larsartmann/typespec-asyncapi": {
					"output-file": "test-subscribe",
					"file-type": "json",
				},
			},
			outputDir: "test-output",
			noEmit: false,
		})

		Effect.log(`📊 Compilation result: ${result.diagnostics.length} diagnostics`)

		const errors = result.diagnostics.filter(d => d.severity === "error")
		const warnings = result.diagnostics.filter(d => d.severity === "warning")

		Effect.log(`❌ Errors: ${errors.length}`)
		Effect.log(`⚠️  Warnings: ${warnings.length}`)

		if (errors.length > 0) {
			Effect.log("❌ ERRORS FOUND:")
			errors.forEach(error => {
				Effect.log(`  - ${error.code}: ${error.message}`)
			})
		}

		if (warnings.length > 0) {
			Effect.log("⚠️  WARNINGS:")
			warnings.forEach(warning => {
				Effect.log(`  - ${warning.code}: ${warning.message}`)
			})
		}

		Effect.log("📁 Output files:", Array.from(host.fs.keys()))

		if (errors.length === 0) {
			Effect.log("✅ @subscribe decorator compiled successfully!")
			return true
		} else {
			Effect.log("❌ @subscribe decorator failed to compile!")
			return false
		}

	} catch (error) {
		console.error("💥 Test failed with exception:", error)
		return false
	}
}

// Run the manual test if called directly
if (import.meta.main) {
	testSubscribeDecorator()
		.then(success => {
			Effect.log(success ? "🎉 Test PASSED" : "💥 Test FAILED")
			process.exit(success ? 0 : 1)
		})
		.catch(error => {
			console.error("💥 Test crashed:", error)
			process.exit(1)
		})
}