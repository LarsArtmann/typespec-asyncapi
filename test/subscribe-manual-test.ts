/**
 * Manual test to validate @subscribe decorator compilation
 */

import { createAsyncAPITestHost } from "./utils/test-helpers.js";

async function testSubscribeDecorator() {
  console.log("🧪 Testing @subscribe decorator functionality...");
  
  try {
    const host = await createAsyncAPITestHost();
    
    const testSource = `
      import "@typespec/asyncapi";
      using TypeSpec.AsyncAPI;
      
      namespace TestApi;
      
      model UserEvent {
        userId: string;
        email: string;
      }

      @channel("user.events")  
      @subscribe
      op handleUserSignup(): UserEvent;
    `;
    
    console.log("📝 Compiling test TypeSpec source with @subscribe decorator...");
    host.addTypeSpecFile("main.tsp", testSource);
    
    const result = await host.compileAndDiagnose("main.tsp", {
      emitters: {
        "@typespec/asyncapi": {
          "output-file": "test-subscribe",
          "file-type": "json"
        }
      },
      outputDir: "test-output",
      noEmit: false,
    });
    
    console.log(`📊 Compilation result: ${result.diagnostics.length} diagnostics`);
    
    const errors = result.diagnostics.filter(d => d.severity === "error");
    const warnings = result.diagnostics.filter(d => d.severity === "warning");
    
    console.log(`❌ Errors: ${errors.length}`);
    console.log(`⚠️  Warnings: ${warnings.length}`);
    
    if (errors.length > 0) {
      console.log("❌ ERRORS FOUND:");
      errors.forEach(error => {
        console.log(`  - ${error.code}: ${error.message}`);
      });
    }
    
    if (warnings.length > 0) {
      console.log("⚠️  WARNINGS:");
      warnings.forEach(warning => {
        console.log(`  - ${warning.code}: ${warning.message}`);
      });
    }
    
    console.log("📁 Output files:", Array.from(host.fs.keys()));
    
    if (errors.length === 0) {
      console.log("✅ @subscribe decorator compiled successfully!");
      return true;
    } else {
      console.log("❌ @subscribe decorator failed to compile!");
      return false;
    }
    
  } catch (error) {
    console.error("💥 Test failed with exception:", error);
    return false;
  }
}

// Run the manual test if called directly
if (import.meta.main) {
  testSubscribeDecorator()
    .then(success => {
      console.log(success ? "🎉 Test PASSED" : "💥 Test FAILED");
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error("💥 Test crashed:", error);
      process.exit(1);
    });
}