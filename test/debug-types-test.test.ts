import { createAsyncAPITestHost } from './utils/test-helpers.js'

async function testWorkingTypes() {
  console.log('🧪 TESTING WORKING TYPESPEC TYPES')
  
  try {
    const host = await createAsyncAPITestHost()
    host.addTypeSpecFile("types-test.tsp", `
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;
using TypeSpec.Reflection;

// Fix Task 2.3: Blockless namespace MUST come first
namespace TestTypes;

// Test 1: Try {} type in declaration
extern dec testObject(target: Namespace, config: {});

// Test 2: Try Model type in declaration  
extern dec testModel(target: Namespace, config: Model);

// Test 3: Try unknown type in declaration
extern dec testUnknown(target: Namespace, config: unknown);

// Test 4: Try valueof {} type
extern dec testValueofObject(target: Namespace, config: valueof {});

// Now test actual @server (after namespace declarations)
@server({
  name: "test",
  url: "kafka://localhost:9092",
  protocol: "kafka"
})
namespace TestNamespace;
    `)
    
    console.log('📝 Files added, testing compilation...')
    
    // Test compilation
    const compilationResult = await host.compile("types-test.tsp")
    console.log('✅ Compilation:', compilationResult ? 'SUCCESS' : 'FAILED')
    
  } catch (error) {
    console.log('💥 ERROR:', error.message)
    console.log('📋 Stack:', error.stack)
  }
}

testWorkingTypes()