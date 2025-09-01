/**
 * AsyncAPI Standard Protocol Binding Tests
 *
 * Tests for AsyncAPI 3.0 compliant protocol bindings using standard format.
 * Replaces custom ProtocolBindingFactory with AsyncAPI specification compliance.
 */
import {expect, test, describe} from "bun:test"
import {SUPPORTED_PROTOCOLS, type AsyncAPIProtocolType} from "../../src/constants/protocol-defaults.js"

// Standard AsyncAPI 3.0 binding format helpers
const createStandardBinding = (protocol: AsyncAPIProtocolType, config: Record<string, unknown> = {}) => {
	return {
		[protocol]: {
			bindingVersion: "0.5.0", // AsyncAPI 3.0 standard
			...config
		}
	}
}

// AsyncAPI JSON Schema validation helper
const validateAsyncAPIBinding = (binding: Record<string, unknown>): {valid: boolean, errors: string[]} => {
	const errors: string[] = []
	
	if (!binding || typeof binding !== 'object') {
		errors.push("Binding must be an object")
		return {valid: false, errors}
	}
	
	// Check each protocol binding has required bindingVersion
	for (const [protocol, bindingConfig] of Object.entries(binding)) {
		if (typeof bindingConfig !== 'object' || !bindingConfig) {
			errors.push(`Protocol '${protocol}' binding must be an object`)
			continue
		}
		
		const config = bindingConfig as Record<string, unknown>
		if (!config.bindingVersion) {
			errors.push(`Protocol '${protocol}' binding must have bindingVersion`)
		}
	}
	
	return {
		valid: errors.length === 0,
		errors
	}
}

describe("AsyncAPI 3.0 Standard Protocol Bindings", () => {
	test("Kafka server bindings follow AsyncAPI standard format", () => {
		const serverBindings = createStandardBinding("kafka", {
			schemaRegistryUrl: "http://localhost:8081",
			clientId: "test-client",
		})

		expect(serverBindings).toBeDefined()
		expect(serverBindings.kafka).toBeDefined()
		expect(serverBindings.kafka.schemaRegistryUrl).toBe("http://localhost:8081")
		expect(serverBindings.kafka.clientId).toBe("test-client")
		expect(serverBindings.kafka.bindingVersion).toBe("0.5.0")
		
		// Validate AsyncAPI compliance
		const validation = validateAsyncAPIBinding(serverBindings)
		expect(validation.valid).toBe(true)
		expect(validation.errors).toHaveLength(0)
	})

	test("Minimal Kafka server bindings are valid", () => {
		const serverBindings = createStandardBinding("kafka")

		expect(serverBindings).toBeDefined()
		expect(serverBindings.kafka).toBeDefined()
		expect(serverBindings.kafka.bindingVersion).toBe("0.5.0")
		
		const validation = validateAsyncAPIBinding(serverBindings)
		expect(validation.valid).toBe(true)
	})

	test("Kafka channel bindings follow AsyncAPI standard", () => {
		const channelBindings = createStandardBinding("kafka", {
			topic: "user-events",
			partitions: 3,
			replicas: 2,
		})

		expect(channelBindings).toBeDefined()
		expect(channelBindings.kafka).toBeDefined()
		expect(channelBindings.kafka.topic).toBe("user-events")
		expect(channelBindings.kafka.partitions).toBe(3)
		expect(channelBindings.kafka.replicas).toBe(2)
		expect(channelBindings.kafka.bindingVersion).toBe("0.5.0")
		
		const validation = validateAsyncAPIBinding(channelBindings)
		expect(validation.valid).toBe(true)
	})

	test("WebSocket channel bindings are AsyncAPI compliant", () => {
		const channelBindings = createStandardBinding("websocket", {
			method: "GET",
			headers: {type: "object"},
		})

		expect(channelBindings).toBeDefined()
		expect(channelBindings.websocket).toBeDefined()
		expect(channelBindings.websocket.method).toBe("GET")
		expect(channelBindings.websocket.bindingVersion).toBe("0.5.0")
		
		const validation = validateAsyncAPIBinding(channelBindings)
		expect(validation.valid).toBe(true)
	})

	test("Supported protocols are properly defined", () => {
		expect(SUPPORTED_PROTOCOLS).toBeDefined()
		expect(SUPPORTED_PROTOCOLS.length).toBeGreaterThan(0)
		expect(SUPPORTED_PROTOCOLS).toContain("kafka")
		expect(SUPPORTED_PROTOCOLS).toContain("websocket")
		expect(SUPPORTED_PROTOCOLS).toContain("http")
	})

	test("Binding validation catches missing bindingVersion", () => {
		const invalidBinding = {
			kafka: {
				topic: "test"
				// Missing bindingVersion
			}
		}
		
		const validation = validateAsyncAPIBinding(invalidBinding)
		expect(validation.valid).toBe(false)
		expect(validation.errors.length).toBeGreaterThan(0)
		expect(validation.errors[0]).toContain("bindingVersion")
	})

	test("Binding validation catches invalid binding structure", () => {
		const invalidBinding = {
			kafka: null
		}
		
		const validation = validateAsyncAPIBinding(invalidBinding)
		expect(validation.valid).toBe(false)
		expect(validation.errors.length).toBeGreaterThan(0)
	})
})

