#!/usr/bin/env node

/**
 * Debug script to test protocol binding creation in isolation
 */
console.log("🔧 Testing protocol binding creation logic...")

// Import the createAsyncAPIBinding function from emitter-with-effect.js
// Since it's not exported, we'll replicate the logic here

const createAsyncAPIBinding = (protocol, config = {}) => {
	return {
		[protocol]: {
			bindingVersion: "0.5.0",
			...config
		}
	}
}

// Test Kafka binding creation
console.log("\n🔹 Testing Kafka binding creation:")
const kafkaConfig = {
	groupId: "user-service",
	clientId: "user-publisher",
	bindingVersion: "0.5.0"
}
const kafkaBinding = createAsyncAPIBinding("kafka", kafkaConfig)
console.log("Kafka binding result:", JSON.stringify(kafkaBinding, null, 2))

// Test WebSocket binding creation  
console.log("\n🔹 Testing WebSocket binding creation:")
const wsConfig = {
	method: "GET",
	bindingVersion: "0.1.0"
}
const wsBinding = createAsyncAPIBinding("websocket", wsConfig)
console.log("WebSocket binding result:", JSON.stringify(wsBinding, null, 2))

// Test empty binding creation
console.log("\n🔹 Testing empty binding creation:")
const emptyBinding = createAsyncAPIBinding("kafka", {})
console.log("Empty binding result:", JSON.stringify(emptyBinding, null, 2))

// Test undefined binding creation
console.log("\n🔹 Testing undefined config binding creation:")
const undefinedBinding = createAsyncAPIBinding("kafka", undefined)
console.log("Undefined config binding result:", JSON.stringify(undefinedBinding, null, 2))

console.log("\n✅ Binding creation tests completed!")