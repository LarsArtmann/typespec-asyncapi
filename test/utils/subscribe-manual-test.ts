/**
 * Manual test to validate @subscribe decorator compilation
 */

//TODO: MANUAL TEST ANTI-PATTERN DISASTER! This should be automated test in test suite!
//TODO: IMPORT PATH ERROR! "./utils/test-helpers" should be "./test-helpers" (missing utils)!
//TODO: MANUAL TESTING PHILOSOPHY FAILURE - All tests should be automated, not manual!
//TODO: SCRIPT-STYLE FILE IN TEST UTILS - This is NOT a utility, it's a runnable script!
import {createAsyncAPITestHost} from "./utils/test-helpers"
import {Effect} from "effect"

//TODO: MANUAL TEST FUNCTION ANTI-PATTERN - Should be proper vitest/jest test case!
//TODO: ASYNC FUNCTION WITHOUT EFFECT RETURN - Should return Effect<boolean, never, never>!
async function testSubscribeDecorator() {
	//TODO: EFFECT.LOG ANTI-PATTERN EVERYWHERE! Effect.log not composed with async function!
	//TODO: EMOJI LOGGING IN PRODUCTION CODE - Remove emojis from library/test code!
	//TODO: EFFECT.LOG SCATTERED THROUGHOUT - Should use proper Effect composition!
	Effect.log("🧪 Testing @subscribe decorator functionality...")

	//TODO: TRY-CATCH WITH EFFECT ANTI-PATTERN! Should use Effect error handling!
	//TODO: MIXED ERROR HANDLING - try-catch with Effect.log creates inconsistent patterns!
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