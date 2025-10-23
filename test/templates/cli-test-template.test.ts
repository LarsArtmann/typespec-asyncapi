/**
 * CLI Test Template
 *
 * Copy this template to create new CLI-based tests.
 * Replace FEATURE_NAME with your feature (e.g., "channel-decorator", "kafka-protocol")
 *
 * @example
 * // Copy template:
 * cp test/templates/cli-test-template.test.ts test/integration/cli-my-feature.test.ts
 *
 * // Replace FEATURE_NAME with actual feature
 * sed -i '' 's/FEATURE_NAME/my-feature/g' test/integration/cli-my-feature.test.ts
 */

import { describe, test, expect, afterEach } from 'bun:test'
import { compileWithCLI, cleanupTestDir } from '../utils/cli-test-helpers.js'
import type { CLITestResult } from '../utils/cli-test-helpers.js'
import { assertCompilationSuccess, getPropertyKeys } from '../utils/type-guards.js'

describe('CLI Tests: FEATURE_NAME', () => {
	let testResult: CLITestResult | undefined

	/**
	 * Cleanup test directory after each test
	 * Prevents disk bloat and ensures test isolation
	 */
	afterEach(async () => {
		if (testResult?.workdir) {
			await cleanupTestDir(testResult.workdir)
		}
	})

	/**
	 * Test Template: Success Case
	 *
	 * Tests that valid TypeSpec generates correct AsyncAPI output
	 */
	test('should generate AsyncAPI for FEATURE_NAME - success case', async () => {
		// Arrange: Define TypeSpec source
		const typespecSource = `
			import "@lars-artmann/typespec-asyncapi";
			using AsyncAPI;

			model ExampleMessage {
				id: string;
				timestamp: utcDateTime;
			}

			@channel("example.channel")
			@publish
			@asyncAPI("Example feature description")
			op publishExample(...ExampleMessage): void;
		`

		// Act: Compile with CLI
		testResult = await compileWithCLI(typespecSource)

		// Assert: Compilation succeeded
		expect(testResult.exitCode).toBe(0)
		expect(testResult.errors).toHaveLength(0)

		// Assert: Compilation succeeded with type safety
		assertCompilationSuccess(testResult)

		// Assert: Expected AsyncAPI structure
		const channelKeys = getPropertyKeys(testResult.asyncapiDoc.channels)
		expect(channelKeys).toContain('example.channel')

		// Assert: Channel details
		const channel = testResult.asyncapiDoc.channels?.['example.channel']
		expect(channel?.address).toBe('example.channel')

		// Assert: Operations
		const operationKeys = getPropertyKeys(testResult.asyncapiDoc.operations)
		expect(operationKeys).toContain('publishExample')

		// Assert: Operation details
		const operation = testResult.asyncapiDoc.operations?.['publishExample']
		expect(operation?.action).toBe('send')
		expect(operation?.channel?.$ref).toBe('#/channels/example.channel')
	})

	/**
	 * Test Template: Failure Case
	 *
	 * Tests that invalid TypeSpec produces appropriate errors
	 */
	test('should fail gracefully with invalid TypeSpec', async () => {
		// Arrange: Define INVALID TypeSpec source
		const invalidTypespecSource = `
			import "@lars-artmann/typespec-asyncapi";
			using AsyncAPI;

			@channel("invalid")
			op brokenOp(): InvalidType;  // ← Error: InvalidType not defined
		`

		// Act: Compile with CLI
		testResult = await compileWithCLI(invalidTypespecSource)

		// Assert: Compilation failed
		expect(testResult.exitCode).not.toBe(0)

		// Assert: Errors captured
		expect(testResult.errors.length).toBeGreaterThan(0)

		// Assert: No AsyncAPI output
		expect(testResult.asyncapiDoc).toBeUndefined()
	})

	/**
	 * Test Template: Edge Case
	 *
	 * Tests boundary conditions or special cases
	 */
	test('should handle FEATURE_NAME edge cases', async () => {
		// Arrange: Define edge case TypeSpec
		const edgeCaseSource = `
			import "@lars-artmann/typespec-asyncapi";
			using AsyncAPI;

			// Empty model
			model EmptyMessage {}

			@channel("edge.case")
			@publish
			op publishEmpty(...EmptyMessage): void;
		`

		// Act: Compile with CLI
		testResult = await compileWithCLI(edgeCaseSource)

		// Assert: Compilation succeeded (empty model is valid)
		expect(testResult.exitCode).toBe(0)

		// Assert: AsyncAPI generated with empty schema
		expect(testResult.asyncapiDoc?.channels).toHaveProperty('edge.case')

		// Note: Add feature-specific edge case assertions here
	})

	/**
	 * Test Template: Integration Test
	 *
	 * Tests feature working with other features (protocol, security, etc.)
	 */
	test('should integrate FEATURE_NAME with other features', async () => {
		// Arrange: Complex TypeSpec with multiple features
		const integrationSource = `
			import "@lars-artmann/typespec-asyncapi";
			using AsyncAPI;

			model IntegrationMessage {
				id: string;
				data: Record<string>;
			}

			@server("kafka-broker", "kafka://localhost:9092")
			@protocol("kafka")
			@channel("integration.test")
			@publish
			@asyncAPI("Integration test for FEATURE_NAME")
			op publishIntegration(...IntegrationMessage): void;
		`

		// Act: Compile with CLI
		testResult = await compileWithCLI(integrationSource)

		// Assert: Compilation succeeded
		expect(testResult.exitCode).toBe(0)

		// Assert: Server configuration present
		expect(testResult.asyncapiDoc?.servers).toBeDefined()
		expect(testResult.asyncapiDoc?.servers).toHaveProperty('kafka-broker')

		// Assert: Channel with protocol binding
		expect(testResult.asyncapiDoc?.channels).toHaveProperty('integration.test')

		// Note: Add feature-specific integration assertions here
	})
})

/**
 * Test Template: Using Fixture Files
 *
 * For complex tests, use fixture files instead of inline source
 */
describe('CLI Tests: FEATURE_NAME (Fixtures)', () => {
	let testResult: CLITestResult | undefined

	afterEach(async () => {
		if (testResult?.workdir) {
			await cleanupTestDir(testResult.workdir)
		}
	})

	test('should load FEATURE_NAME from fixture file', async () => {
		// Arrange: Path to fixture file
		const fixturePath = 'test/utils/fixtures/FEATURE_NAME.tsp'

		// Act: Compile fixture
		testResult = await compileWithCLI(fixturePath)

		// Assert: Compilation succeeded
		expect(testResult.exitCode).toBe(0)
		expect(testResult.asyncapiDoc).toBeDefined()

		// Note: Add fixture-specific assertions here
	})
})

/**
 * CUSTOMIZATION GUIDE:
 *
 * 1. Replace FEATURE_NAME with your feature name
 * 2. Update TypeSpec source examples for your feature
 * 3. Add feature-specific assertions
 * 4. Create fixture files if needed in test/utils/fixtures/
 * 5. Add more test cases as needed:
 *    - Positive tests (success cases)
 *    - Negative tests (failure cases)
 *    - Edge cases (boundary conditions)
 *    - Integration tests (feature combinations)
 *
 * EXAMPLE FEATURES TO TEST:
 * - channel-decorator
 * - publish-decorator
 * - subscribe-decorator
 * - server-decorator
 * - protocol-bindings
 * - security-schemes
 * - message-models
 * - union-types
 * - optional-fields
 * - nested-objects
 */
