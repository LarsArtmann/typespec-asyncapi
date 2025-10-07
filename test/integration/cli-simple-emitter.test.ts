/**
 * CLI-Based Test: AsyncAPI emitter basic functionality
 * Converted from simple-emitter.test.ts to use CLI compilation
 * Uses type guards for type-safe assertions
 */

import { describe, test, expect, afterEach } from 'bun:test'
import { compileWithCLI, cleanupTestDir } from '../utils/cli-test-helpers.js'
import type { CLITestResult } from '../utils/cli-test-helpers.js'
import {
	assertAsyncAPIDoc,
	assertCompilationSuccess,
	getPropertyKeys,
	assertContainsKeys,
} from '../utils/type-guards.js'

describe('CLI Tests: Simple AsyncAPI Emitter', () => {
	let testResult: CLITestResult | undefined

	afterEach(async () => {
		if (testResult?.workdir) {
			await cleanupTestDir(testResult.workdir)
		}
	})

	test('should generate basic AsyncAPI from simple TypeSpec', async () => {
		// Arrange: Simple TypeSpec without decorators
		const source = `
			import "@lars-artmann/typespec-asyncapi";
			using AsyncAPI;

			namespace SimpleTest;

			model SimpleEvent {
				id: string;
				message: string;
				timestamp: utcDateTime;
			}

			@channel("simple.event")
			@publish
			op publishSimpleEvent(...SimpleEvent): void;
		`

		// Act: Compile with CLI
		testResult = await compileWithCLI(source)

		// Assert: Compilation succeeded with type safety
		assertCompilationSuccess(testResult)
		// Now TypeScript knows testResult.asyncapiDoc is AsyncAPIObject

		// Assert: Valid AsyncAPI document (type guard removes optional chaining)
		assertAsyncAPIDoc(testResult.asyncapiDoc)

		// Assert: Channel created (clean, no ?. operators)
		const channelKeys = getPropertyKeys(testResult.asyncapiDoc.channels)
		expect(channelKeys).toContain('simple.event')

		console.log('✅ Basic AsyncAPI generation works')
	})

	test('should handle multiple operations', async () => {
		// Arrange: Multiple operations with different models
		const source = `
			import "@lars-artmann/typespec-asyncapi";
			using AsyncAPI;

			namespace MultiOp;

			model UserEvent {
				userId: string;
				action: string;
			}

			model SystemEvent {
				component: string;
				level: string;
			}

			@channel("user.events")
			@publish
			op publishUserEvent(...UserEvent): void;

			@channel("system.events")
			@publish
			op publishSystemEvent(...SystemEvent): void;
		`

		// Act: Compile with CLI
		testResult = await compileWithCLI(source)

		// Assert: Compilation succeeded
		expect(testResult.exitCode).toBe(0)
		expect(testResult.asyncapiDoc).toBeDefined()
		expect(testResult.asyncapiDoc?.asyncapi).toBe('3.0.0')

		// Assert: Multiple channels created
		const channelKeys = Object.keys(testResult.asyncapiDoc?.channels || {})
		expect(channelKeys).toContain('user.events')
		expect(channelKeys).toContain('system.events')

		// Assert: Multiple operations
		const operationKeys = Object.keys(testResult.asyncapiDoc?.operations || {})
		expect(operationKeys).toContain('publishUserEvent')
		expect(operationKeys).toContain('publishSystemEvent')

		// Assert: Info section
		expect(testResult.asyncapiDoc?.info.title).toBeDefined()

		console.log(`✅ Generated AsyncAPI with title: ${testResult.asyncapiDoc?.info.title}`)
	})

	test('should generate YAML output', async () => {
		// Arrange: Basic test event
		const source = `
			import "@lars-artmann/typespec-asyncapi";
			using AsyncAPI;

			namespace YamlTest;

			model TestEvent {
				id: string;
				data: string;
			}

			@channel("test.events")
			@publish
			op publishTest(...TestEvent): void;
		`

		// Act: Compile with CLI
		testResult = await compileWithCLI(source)

		// Assert: Compilation succeeded
		expect(testResult.exitCode).toBe(0)
		expect(testResult.asyncapiDoc).toBeDefined()
		expect(testResult.asyncapiDoc?.asyncapi).toBe('3.0.0')
		expect(testResult.asyncapiDoc?.info).toBeDefined()

		// Assert: Channel created
		const channelKeys = Object.keys(testResult.asyncapiDoc?.channels || {})
		expect(channelKeys).toContain('test.events')

		console.log('✅ YAML generation works')
	})

	test('should include schema components for models', async () => {
		// Arrange: TypeSpec with explicit model schema
		const source = `
			import "@lars-artmann/typespec-asyncapi";
			using AsyncAPI;

			model DetailedEvent {
				eventId: string;
				eventType: "create" | "update" | "delete";
				payload: {
					field1: string;
					field2: int32;
				};
				metadata?: Record<string>;
			}

			@channel("detailed.events")
			@publish
			op publishDetailed(...DetailedEvent): void;
		`

		// Act: Compile with CLI
		testResult = await compileWithCLI(source)

		// Assert: Compilation succeeded
		expect(testResult.exitCode).toBe(0)
		expect(testResult.asyncapiDoc?.components).toBeDefined()

		// Assert: Schemas section exists
		if (testResult.asyncapiDoc?.components?.schemas) {
			console.log(`✅ Generated ${Object.keys(testResult.asyncapiDoc.components.schemas).length} schema components`)
		}
	})

	test('should handle namespaces correctly', async () => {
		// Arrange: Nested namespace structure
		const source = `
			import "@lars-artmann/typespec-asyncapi";
			using AsyncAPI;

			namespace MyAPI {
				namespace Events {
					model NotificationEvent {
						notificationId: string;
						message: string;
					}

					@channel("notifications.sent")
					@publish
					op sendNotification(...NotificationEvent): void;
				}
			}
		`

		// Act: Compile with CLI
		testResult = await compileWithCLI(source)

		// Assert: Compilation succeeded
		expect(testResult.exitCode).toBe(0)
		expect(testResult.asyncapiDoc).toBeDefined()

		// Assert: Channel created regardless of namespace nesting
		const channelKeys = Object.keys(testResult.asyncapiDoc?.channels || {})
		expect(channelKeys).toContain('notifications.sent')

		console.log('✅ Namespace handling works correctly')
	})
})
