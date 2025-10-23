/**
 * TypeSpec Integration Test
 * 
 * Simple test to verify TypeSpec compiler integration works correctly
 */

import { Effect } from "effect";
import { TypeSpecCompilerIntegration } from "../src/typespec-compiler/TypeSpecIntegration.js";

/**
 * Test TypeSpec compiler integration
 */
async function testTypeSpecIntegration() {
  try {
    console.log("🔧 Testing TypeSpec compiler integration...");
    
    // Test that TypeSpecCompilerIntegration class is available
    const extractor = new TypeSpecCompilerIntegration();
    console.log("✅ TypeSpecCompilerIntegration instantiated successfully");
    
    // Test that methods are available
    console.log("Available methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(extractor)));
    
    console.log("✅ TypeSpec compiler integration test completed successfully");
    
    return true;
  } catch (error) {
    console.error("❌ TypeSpec compiler integration test failed:", error);
    return false;
  }
}

// Run the test
testTypeSpecIntegration().then(success => {
  if (success) {
    console.log("🎉 TypeSpec integration test passed!");
  } else {
    console.log("💔 TypeSpec integration test failed!");
  }
});

export { testTypeSpecIntegration };