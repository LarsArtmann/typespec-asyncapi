#!/usr/bin/env bun

/**
 * Quick test script to validate that our schema conversion fixes are working
 */

import { compileAsyncAPISpec } from "./test/utils/test-helpers.js";

const testCode = `
  @service({ title: "Schema Test Service" })
  namespace SchemaTest {
    
    @message(#{ name: "TestEvent" })
    model TestEvent {
      id: string;
      timestamp: utcDateTime;
      count: int32;
      isActive: boolean;
      tags: string[];
      status: "pending" | "active" | "completed";
      metadata?: Record<string>;
    }
    
    @channel("test.events")
    @publish
    op publishTestEvent(): TestEvent;
  }
`;

console.log("🧪 Testing schema conversion improvements...");

try {
  const result = await compileAsyncAPISpec(testCode, { "file-type": "json" });
  
  console.log("📊 Compilation Results:");
  console.log(`  - Program: ${!!result.program}`);
  console.log(`  - Diagnostics: ${result.diagnostics.length}`);
  console.log(`  - Output files: ${result.outputFiles.size}`);

  // Check for errors
  const errors = result.diagnostics.filter(d => d.severity === 'error');
  if (errors.length > 0) {
    console.log("❌ Compilation errors:");
    errors.forEach(error => console.log(`  - ${error.message}`));
    process.exit(1);
  }

  // Try to find AsyncAPI output
  const outputFiles = Array.from(result.outputFiles.keys());
  console.log(`📁 Output files: ${outputFiles.join(', ')}`);
  
  const asyncapiFile = outputFiles.find(path => 
    path.includes('asyncapi') && path.endsWith('.json')
  );
  
  if (!asyncapiFile) {
    console.log("❌ No AsyncAPI JSON file found");
    process.exit(1);
  }
  
  const content = result.outputFiles.get(asyncapiFile);
  if (!content) {
    console.log("❌ AsyncAPI file is empty");
    process.exit(1);
  }
  
  const actualContent = typeof content === 'string' ? content : content.content;
  console.log(`📄 Generated content (${actualContent.length} bytes):`);
  
  if (actualContent.length < 100) {
    console.log("❌ Generated content too small, likely empty");
    console.log(actualContent);
    process.exit(1);
  }
  
  // Parse and validate content
  const doc = JSON.parse(actualContent);
  
  console.log("\n✅ Schema conversion validation:");
  console.log(`  - AsyncAPI version: ${doc.asyncapi}`);
  console.log(`  - Components: ${!!doc.components}`);
  console.log(`  - Schemas: ${doc.components?.schemas ? Object.keys(doc.components.schemas).length : 0}`);
  console.log(`  - Messages: ${doc.components?.messages ? Object.keys(doc.components.messages).length : 0}`);
  console.log(`  - Operations: ${doc.operations ? Object.keys(doc.operations).length : 0}`);
  console.log(`  - Channels: ${doc.channels ? Object.keys(doc.channels).length : 0}`);
  
  // Check TestEvent schema specifically
  if (doc.components?.schemas?.TestEvent) {
    const schema = doc.components.schemas.TestEvent;
    console.log("\n📋 TestEvent schema properties:");
    console.log(`  - Type: ${schema.type}`);
    console.log(`  - Properties: ${schema.properties ? Object.keys(schema.properties).length : 0}`);
    console.log(`  - Required: ${schema.required ? schema.required.length : 0}`);
    
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([name, prop]) => {
        const propStr = typeof prop === 'object' ? JSON.stringify(prop) : prop;
        console.log(`    - ${name}: ${propStr}`);
      });
    }
  } else {
    console.log("❌ TestEvent schema not found in components.schemas");
  }
  
  // Check TestEvent message
  if (doc.components?.messages?.TestEvent) {
    const message = doc.components.messages.TestEvent;
    console.log("\n📨 TestEvent message:");
    console.log(`  - Name: ${message.name}`);
    console.log(`  - Payload: ${message.payload ? JSON.stringify(message.payload) : 'none'}`);
  } else {
    console.log("❌ TestEvent message not found in components.messages");
  }
  
  console.log("\n🎉 Schema conversion test completed successfully!");
  
} catch (error) {
  console.error("❌ Test failed:", error.message);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
}