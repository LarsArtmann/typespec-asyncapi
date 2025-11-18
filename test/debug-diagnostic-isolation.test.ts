import { createAsyncAPITestHost } from './utils/test-helpers.js'

async function testDiagnosticIsolation() {
  console.log('🧪 ISOLATING DIAGNOSTIC RESOLUTION ISSUE')
  
  try {
    const host = await createAsyncAPITestHost()
    host.addTypeSpecFile("diagnostic-test.tsp", `
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

// Test with minimal diagnostic trigger
@server({
  name: "test",
  url: "test://test",
  protocol: "test"
})
namespace TestNamespace;
    `)
    
    console.log('📝 Files added, testing diagnostic isolation...')
    
    // Test compilation first
    const compilationResult = await host.compile("diagnostic-test.tsp")
    console.log('✅ Compilation:', compilationResult ? 'SUCCESS' : 'FAILED')
    
    // Test diagnostics - bypass expectDiagnosticEmpty
    console.log('🔍 Attempting direct diagnostic inspection...')
    try {
      const diagnostics = await host.diagnose("diagnostic-test.tsp", {
        emit: ["@lars-artmann/typespec-asyncapi"]
      })
      
      console.log('📊 Direct diagnostics count:', diagnostics.length)
      console.log('📊 Direct diagnostics count:', diagnostics.length)
      
      // Check if there are any diagnostic codes that look like our custom ones
      const customDiagnostics = diagnostics.filter(d => d.code?.includes('asyncapi'))
      console.log(`🔍 Custom AsyncAPI diagnostics: ${customDiagnostics.length}`)
      
      // Check all diagnostic codes
      const allCodes = diagnostics.map(d => d.code)
      console.log(`🔍 All diagnostic codes:`, allCodes)
      
      // Check for undefined messages
      const undefinedMessages = diagnostics.filter(d => d.message === undefined)
      console.log(`🔍 Diagnostics with undefined messages: ${undefinedMessages.length}`)
      
      diagnostics.forEach((d, i) => {
        console.log(`\n=== Diagnostic ${i+1} ===`)
        console.log(`  Code: ${d.code}`)
        console.log(`  Severity: ${d.severity}`)
        console.log(`  Message: ${d.message}`)
        console.log(`  Message Type: ${typeof d.message}`)
        
        if (d.code?.includes('asyncapi') || d.code?.includes('server')) {
          console.log(`  🔍 CUSTOM DIAGNOSTIC DETECTED!`)
          console.log(`     Full Object:`, JSON.stringify(d, null, 2))
          if (d.target) {
            console.log(`     Target: ${d.target.kind} at ${d.target.name}`)
          }
        }
      })
      
    } catch (diagError) {
      console.log('💥 Diagnostic inspection error:', diagError.message)
    }
    
    // Check if there are any diagnostic codes that look like our custom ones
    const customDiagnostics = diagnostics.filter(d => d.code?.includes('asyncapi'))
    console.log(`🔍 Custom AsyncAPI diagnostics: ${customDiagnostics.length}`)
    
    // Check all diagnostic codes
    const allCodes = diagnostics.map(d => d.code)
    console.log(`🔍 All diagnostic codes:`, allCodes)
    
    // Check for undefined messages
    const undefinedMessages = diagnostics.filter(d => d.message === undefined)
    console.log(`🔍 Diagnostics with undefined messages: ${undefinedMessages.length}`)
    
    diagnostics.forEach((d, i) => {
      console.log(`\n=== Diagnostic ${i+1} ===`)
      console.log(`  Code: ${d.code}`)
      console.log(`  Severity: ${d.severity}`)
      console.log(`  Message: ${d.message}`)
      console.log(`  Message Type: ${typeof d.message}`)
      
      if (d.code?.includes('asyncapi') || d.code?.includes('server')) {
        console.log(`  🔍 CUSTOM DIAGNOSTIC DETECTED!`)
        console.log(`     Full Object:`, JSON.stringify(d, null, 2))
        if (d.target) {
          console.log(`     Target: ${d.target.kind} at ${d.target.name}`)
        }
      }
    })
    
  } catch (error) {
    console.log('💥 ERROR:', error.message)
    console.log('📋 Stack:', error.stack)
  }
}

testDiagnosticIsolation()