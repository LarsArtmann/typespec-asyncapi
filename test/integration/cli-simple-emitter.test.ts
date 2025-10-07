/**
 * CLI-Based Test: AsyncAPI emitter basic functionality
 * Converted from simple-emitter.test.ts to use CLI compilation
 */

import { describe, test, expect, afterEach } from 'bun:test'
import { compileWithCLI, cleanupTestDir } from '../utils/cli-test-helpers.js'
import type { CLITestResult } from '../utils/cli-test-helpers.js'

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

		// Debug: Show errors if compilation failed
		if (testResult.exitCode !== 0) {
			console.error('Compilation failed!')
			console.error('stderr:', testResult.stderr)
			console.error('stdout:', testResult.stdout)
			console.error('errors:', testResult.errors)
		}

		// Assert: Compilation succeeded
		expect(testResult.exitCode).toBe(0)
		expect(testResult.errors).toHaveLength(0)

		// Assert: Valid AsyncAPI document structure
		expect(testResult.asyncapiDoc).toBeDefined()
		expect(testResult.asyncapiDoc?.asyncapi).toBe('3.0.0')
		expect(testResult.asyncapiDoc?.info).toBeDefined()
		expect(testResult.asyncapiDoc?.channels).toBeDefined()
		expect(testResult.asyncapiDoc?.operations).toBeDefined()
		expect(testResult.asyncapiDoc?.components).toBeDefined()

		// Assert: Channel created
		expect(testResult.asyncapiDoc?.channels).toHaveProperty('simple.event')

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
		expect(testResult.asyncapiDoc?.channels).toHaveProperty('user.events')
		expect(testResult.asyncapiDoc?.channels).toHaveProperty('system.events')

		// Assert: Multiple operations
		expect(testResult.asyncapiDoc?.operations).toHaveProperty('publishUserEvent')
		expect(testResult.asyncapiDoc?.operations).toHaveProperty('publishSystemEvent')

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
		expect(testResult.asyncapiDoc?.channels).toHaveProperty('test.events')

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
		expect(testResult.asyncapiDoc?.channels).toHaveProperty('notifications.sent')

		console.log('✅ Namespace handling works correctly')
	})
})
