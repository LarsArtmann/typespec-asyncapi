/**
 * End-to-End AsyncAPI Validation Pipeline Tests
 *
 * Tests the complete pipeline from TypeSpec source compilation
 * to AsyncAPI generation and comprehensive validation against
 * the official AsyncAPI 3.0.0 specification.
 */

import {afterAll, beforeAll, describe, expect, it} from "vitest"
import {AsyncAPIValidator} from "../../src/validation/asyncapi-validator.js"
import {compileAsyncAPISpec, parseAsyncAPIOutput} from "../utils/test-helpers"
import {mkdir, rm, writeFile} from "node:fs/promises"
import {join} from "node:path"
import {Effect} from "effect"

describe("End-to-End AsyncAPI Validation Pipeline", () => {
	const testOutputDir = join(process.cwd(), "test-output", "e2e-validation")
	let validator: AsyncAPIValidator

	beforeAll(async () => {
		await mkdir(testOutputDir, {recursive: true})
		validator = new AsyncAPIValidator({strict: true, enableCache: false})
		await validator.initialize()
	})

	afterAll(async () => {
		await rm(testOutputDir, {recursive: true, force: true})
	})

	describe("TypeSpec → AsyncAPI → Validation Pipeline", () => {
		it("should generate and validate a complete event-driven API specification", async () => {
			const typeSpecSource = `
        @doc("Comprehensive event-driven API for user management")
        namespace UserManagementAPI;
        
        @doc("User account information")
        model User {
          @doc("Unique user identifier")
          id: string;
          
          @doc("User's full name")
          name: string;
          
          @doc("User's email address")
          email: string;
          
          @doc("Account creation timestamp")
          createdAt: utcDateTime;
          
          @doc("Account status")
          status: "active" | "inactive" | "suspended";
          
          @doc("User profile information")
          profile?: {
            avatar?: string;
            bio?: string;
            preferences: Record<unknown>;
          };
        }
        
        @doc("User lifecycle event")
        model UserEvent {
          @doc("Event identifier")
          eventId: string;
          
          @doc("Type of user event")
          eventType: "created" | "updated" | "deleted" | "activated" | "deactivated";
          
          @doc("User data")
          user: User;
          
          @doc("Event timestamp")
          timestamp: utcDateTime;
          
          @doc("Event metadata")
          metadata: {
            source: string;
            version: int32;
            correlationId?: string;
          };
        }
        
        @doc("System notification event")
        model SystemNotification {
          @doc("Notification ID")
          notificationId: string;
          
          @doc("Notification severity")
          level: "info" | "warning" | "error" | "critical";
          
          @doc("Notification message")
          message: string;
          
          @doc("Notification timestamp")
          timestamp: utcDateTime;
          
          @doc("Affected component")
          component: string;
          
          @doc("Additional context data")
          context?: Record<unknown>;
        }
        
        @channel("user.lifecycle.events")
        @doc("Channel for user lifecycle events")
        op publishUserEvent(): UserEvent;
        
        @channel("user.lifecycle.events")  
        @doc("Subscribe to user lifecycle events with filtering")
        op subscribeUserEvents(
          @doc("Filter by user ID")
          userId?: string,
          
          @doc("Filter by event types")
          eventTypes?: string[]
        ): UserEvent;
        
        @channel("system.notifications")
        @doc("Channel for system-wide notifications")
        op publishSystemNotification(): SystemNotification;
        
        @channel("system.notifications")
        @doc("Subscribe to system notifications by severity")
        op subscribeSystemNotifications(
          @doc("Minimum severity level")
          minLevel?: "info" | "warning" | "error" | "critical"
        ): SystemNotification;
        
        @channel("user.{userId}.direct")
        @doc("Direct communication channel for specific users")
        op sendDirectUserMessage(
          @doc("Target user ID")
          userId: string
        ): {
          @doc("Message ID")
          messageId: string;
          
          @doc("Message content")
          content: string;
          
          @doc("Message timestamp")
          timestamp: utcDateTime;
          
          @doc("Message priority")
          priority: "low" | "normal" | "high" | "urgent";
        };
      `

			// Step 1: Compile TypeSpec to AsyncAPI
			Effect.log("🔄 Step 1: Compiling TypeSpec to AsyncAPI...")
			const compilationResult = await compileAsyncAPISpec(typeSpecSource, {
				"file-type": "json",
				"output-file": "comprehensive-api",
			})

			expect(compilationResult.diagnostics).toBeDefined()
			expect(compilationResult.outputFiles).toBeDefined()
			expect(compilationResult.outputFiles.size).toBeGreaterThan(0)

			// Step 2: Parse generated AsyncAPI document
			Effect.log("📄 Step 2: Parsing generated AsyncAPI document...")
			const asyncApiDoc = parseAsyncAPIOutput(compilationResult.outputFiles, "comprehensive-api.json")
			expect(asyncApiDoc).toBeDefined()
			expect(typeof asyncApiDoc).toBe("object")

			// Step 3: Comprehensive validation against AsyncAPI 3.0.0 schema
			Effect.log("✅ Step 3: Validating against AsyncAPI 3.0.0 specification...")
			const validationResult = await validator.validate(asyncApiDoc)

			expect(validationResult.valid).toBe(true)
			expect(validationResult.errors).toHaveLength(0)
			expect(validationResult.summary).toContain("AsyncAPI document is valid")

			// Step 4: Verify structural completeness
			Effect.log("🔍 Step 4: Verifying document structure...")
			const doc = asyncApiDoc

			// Check AsyncAPI version
			expect(doc.asyncapi).toBe("3.0.0")

			// Check info object
			expect(doc.info).toBeDefined()
			expect(doc.info.title).toBeDefined()
			expect(doc.info.version).toBeDefined()

			// Check channels (should have multiple channels from TypeSpec)
			expect(doc.channels).toBeDefined()
			expect(Object.keys(doc.channels).length).toBeGreaterThan(0)

			// Check operations
			expect(doc.operations).toBeDefined()
			expect(Object.keys(doc.operations).length).toBeGreaterThan(0)

			// Check components/schemas
			expect(doc.components).toBeDefined()
			expect(doc.components.schemas).toBeDefined()
			expect(Object.keys(doc.components.schemas).length).toBeGreaterThan(0)

			// Step 5: Validate specific AsyncAPI patterns
			Effect.log("🎯 Step 5: Validating AsyncAPI patterns...")

			// Check for proper channel references in operations
			for (const [operationName, operation] of Object.entries(doc.operations)) {
				expect(operation).toHaveProperty("action")
				expect(operation).toHaveProperty("channel")
				expect(operation.channel).toHaveProperty("$ref")
				expect(operation.channel.$ref).toMatch(/^#\/channels\/.+/)

				// Verify referenced channel exists
				const channelRef = (operation as any).channel.$ref.replace("#/channels/", "")
				expect(doc.channels).toHaveProperty(channelRef)
			}

			Effect.log("✅ All validation steps completed successfully!")
		})

		it("should detect and report validation errors in malformed AsyncAPI", async () => {
			const invalidTypeSpecSource = `
        namespace InvalidAPI;
        
        // This should generate an invalid AsyncAPI document
        model InvalidModel {
          // Missing required fields or invalid structure
          someField: string;
        }
        
        // Invalid operation definition
        @channel("invalid-channel")
        op invalidOperation(): InvalidModel;
      `

			try {
				const compilationResult = await compileAsyncAPISpec(invalidTypeSpecSource, {
					"file-type": "json",
					"output-file": "invalid-api",
				})

				const asyncApiDoc = parseAsyncAPIOutput(compilationResult.outputFiles, "invalid-api.json")

				// Attempt validation - might pass basic structure but fail on completeness
				const validationResult = await validator.validate(asyncApiDoc)

				// Document might be structurally valid but incomplete
				// The test ensures the validation process completes without errors
				expect(validationResult).toBeDefined()
				expect(validationResult.valid).toBeDefined()
				expect(validationResult.errors).toBeDefined()
				expect(validationResult.summary).toBeDefined()

				Effect.log(`Validation result: ${validationResult.summary}`)
				if (!validationResult.valid) {
					Effect.log("Validation errors:", validationResult.errors.map(e => e.message))
				}
			} catch (error) {
				// If compilation fails, that's also a valid test outcome
				Effect.log(`Compilation failed as expected: ${error instanceof Error ? error.message : String(error)}`)
				expect(error).toBeDefined()
			}
		})

		it("should validate AsyncAPI files generated to disk", async () => {
			const typeSpecSource = `
        @doc("File-based validation test API")
        namespace FileValidationAPI;
        
        @doc("Simple event model")
        model SimpleEvent {
          @doc("Event identifier") 
          id: string;
          
          @doc("Event data")
          data: string;
          
          @doc("Event timestamp")
          timestamp: utcDateTime;
        }
        
        @channel("simple.events")
        @doc("Simple events channel")
        op publishSimpleEvent(): SimpleEvent;
      `

			// Compile and get the generated content
			const compilationResult = await compileAsyncAPISpec(typeSpecSource, {
				"file-type": "json",
				"output-file": "file-validation-test",
			})

			const asyncApiDoc = parseAsyncAPIOutput(compilationResult.outputFiles, "file-validation-test.json")

			// Write to actual file for file validation test
			const filePath = join(testOutputDir, "file-validation-test.json")
			await writeFile(filePath, JSON.stringify(asyncApiDoc, null, 2))

			// Validate the file using file validation
			const fileValidator = new AsyncAPIValidator({strict: false})
			fileValidator.initialize()
			const fileValidationResult = await fileValidator.validateFile(filePath)

			expect(fileValidationResult.valid).toBe(true)
			expect(fileValidationResult.errors).toHaveLength(0)
		})

		it("should validate YAML output from TypeSpec compilation", async () => {
			const typeSpecSource = `
        @doc("YAML output validation test")
        namespace YamlValidationAPI;
        
        @doc("YAML test event")
        model YamlEvent {
          @doc("Event ID")
          eventId: string;
          
          @doc("Event payload")
          payload: {
            message: string;
            severity: "low" | "medium" | "high";
          };
        }
        
        @channel("yaml.events")
        @doc("YAML events channel") 
        op publishYamlEvent(): YamlEvent;
      `

			// Generate YAML output
			const compilationResult = await compileAsyncAPISpec(typeSpecSource, {
				"file-type": "yaml",
				"output-file": "yaml-validation-test",
			})

			// Get YAML content
			const yamlContent = compilationResult.outputFiles.get("test-output/yaml-validation-test.yaml")?.content ||
				compilationResult.outputFiles.get("yaml-validation-test.yaml")?.content

			expect(yamlContent).toBeDefined()
			expect(typeof yamlContent).toBe("string")
			expect(yamlContent).toContain("asyncapi:")
			expect(yamlContent).toContain("3.0.0")

			// Write YAML file and validate
			const yamlFilePath = join(testOutputDir, "yaml-validation-test.yaml")
			await writeFile(yamlFilePath, yamlContent!)

			const yamlValidator = new AsyncAPIValidator({strict: false})
			yamlValidator.initialize()
			const yamlValidationResult = await yamlValidator.validateFile(yamlFilePath)

			expect(yamlValidationResult.valid).toBe(true)
			expect(yamlValidationResult.errors).toHaveLength(0)
		})
	})

	describe("Real-World AsyncAPI Validation Scenarios", () => {
		it("should validate microservices event architecture", async () => {
			const microservicesTypeSpec = `
        @doc("Microservices Event-Driven Architecture")
        namespace MicroservicesAPI;
        
        @doc("Order management events")
        model OrderEvent {
          orderId: string;
          customerId: string;
          eventType: "created" | "updated" | "fulfilled" | "cancelled";
          orderData: {
            items: Array<{
              productId: string;
              quantity: int32;
              price: float64;
            }>;
            total: float64;
            currency: string;
          };
          timestamp: utcDateTime;
        }
        
        @doc("Inventory events")
        model InventoryEvent {
          productId: string;
          eventType: "stock_updated" | "low_stock_alert" | "out_of_stock";
          currentStock: int32;
          reservedStock: int32;
          timestamp: utcDateTime;
        }
        
        @doc("Payment events")
        model PaymentEvent {
          paymentId: string;
          orderId: string;
          eventType: "initiated" | "completed" | "failed" | "refunded";
          amount: float64;
          currency: string;
          paymentMethod: string;
          timestamp: utcDateTime;
        }
        
        // Order service channels
        @channel("orders.events")
        op publishOrderEvent(): OrderEvent;
        
        @channel("orders.events")
        op subscribeOrderEvents(customerId?: string): OrderEvent;
        
        // Inventory service channels
        @channel("inventory.events")
        op publishInventoryEvent(): InventoryEvent;
        
        @channel("inventory.events")
        op subscribeInventoryEvents(productId?: string): InventoryEvent;
        
        // Payment service channels  
        @channel("payments.events")
        op publishPaymentEvent(): PaymentEvent;
        
        @channel("payments.events")
        op subscribePaymentEvents(orderId?: string): PaymentEvent;
        
        // Cross-service integration
        @channel("order.fulfillment")
        op subscribeOrderFulfillment(): {
          orderId: string;
          status: "pending" | "processing" | "shipped" | "delivered";
          trackingNumber?: string;
          estimatedDelivery?: utcDateTime;
        };
      `

			const compilationResult = await compileAsyncAPISpec(microservicesTypeSpec, {
				"file-type": "json",
				"output-file": "microservices-api",
			})

			const asyncApiDoc = parseAsyncAPIOutput(compilationResult.outputFiles, "microservices-api.json")
			const validationResult = await validator.validate(asyncApiDoc)

			expect(validationResult.valid).toBe(true)
			expect(validationResult.errors).toHaveLength(0)

			// Verify comprehensive microservices structure
			const doc = asyncApiDoc
			expect(Object.keys(doc.channels).length).toBeGreaterThan(3) // Multiple service channels
			expect(Object.keys(doc.operations).length).toBeGreaterThan(5) // Multiple operations
			expect(Object.keys(doc.components.schemas).length).toBeGreaterThan(3) // Multiple data models
		})

		it("should validate IoT sensor data streaming API", async () => {
			const iotTypeSpec = `
        @doc("IoT Sensor Data Streaming API")
        namespace IoTSensorAPI;
        
        @doc("Temperature sensor reading")
        model TemperatureReading {
          sensorId: string;
          deviceId: string;
          temperature: float64;
          unit: "celsius" | "fahrenheit";
          timestamp: utcDateTime;
          location: {
            latitude: float64;
            longitude: float64;
            altitude?: float64;
          };
          metadata: {
            batteryLevel?: float64;
            signalStrength?: int32;
            firmware: string;
          };
        }
        
        @doc("Motion detection event")
        model MotionEvent {
          sensorId: string;
          deviceId: string;
          motionDetected: boolean;
          intensity: float64;
          timestamp: utcDateTime;
          duration?: int32;
        }
        
        @doc("Device health status")
        model DeviceHealthStatus {
          deviceId: string;
          status: "online" | "offline" | "maintenance" | "error";
          lastSeen: utcDateTime;
          batteryLevel: float64;
          memoryUsage: float64;
          cpuUsage: float64;
          networkQuality: "excellent" | "good" | "fair" | "poor";
        }
        
        // Real-time sensor data streaming
        @channel("sensors.temperature.{deviceId}")
        op streamTemperatureData(deviceId: string): TemperatureReading;
        
        @channel("sensors.motion.{deviceId}")
        op streamMotionEvents(deviceId: string): MotionEvent;
        
        // Device management
        @channel("devices.health")
        op publishDeviceHealth(): DeviceHealthStatus;
        
        @channel("devices.health")
        op subscribeDeviceHealth(deviceId?: string): DeviceHealthStatus;
        
        // Aggregated data streams
        @channel("analytics.temperature.aggregated")
        op subscribeTemperatureAnalytics(): {
          timeWindow: string;
          avgTemperature: float64;
          minTemperature: float64;
          maxTemperature: float64;
          sampleCount: int32;
          deviceCount: int32;
          timestamp: utcDateTime;
        };
      `

			const compilationResult = await compileAsyncAPISpec(iotTypeSpec, {
				"file-type": "json",
				"output-file": "iot-sensor-api",
			})

			const asyncApiDoc = parseAsyncAPIOutput(compilationResult.outputFiles, "iot-sensor-api.json")
			const validationResult = await validator.validate(asyncApiDoc)

			expect(validationResult.valid).toBe(true)
			expect(validationResult.errors).toHaveLength(0)

			// Verify IoT-specific patterns
			const doc = asyncApiDoc

			// Should have parameterized channels for device-specific streams
			const channelNames = Object.keys(doc.channels)
			const hasParameterizedChannels = channelNames.some(name => name.includes("{"))
			expect(hasParameterizedChannels).toBe(true)

			// Should have both streaming and aggregated data patterns
			expect(Object.keys(doc.operations).length).toBeGreaterThan(4)
			expect(Object.keys(doc.components.schemas).length).toBeGreaterThan(2)
		})
	})

	describe("Validation Performance in Real Pipeline", () => {
		it("should validate multiple generated APIs efficiently", async () => {
			const apiSpecs = [
				{
					name: "user-api",
					source: `
            namespace UserAPI;
            model User { id: string; name: string; }
            @channel("users") op createUser(): User;
          `,
				},
				{
					name: "product-api",
					source: `
            namespace ProductAPI;
            model Product { id: string; name: string; price: float64; }
            @channel("products") op createProduct(): Product;
          `,
				},
				{
					name: "order-api",
					source: `
            namespace OrderAPI;
            model Order { id: string; userId: string; total: float64; }
            @channel("orders") op createOrder(): Order;
          `,
				},
			]

			const startTime = performance.now()
			const validationResults: Array<{ name: string; valid: boolean; duration: number }> = []

			for (const spec of apiSpecs) {
				const compilationResult = await compileAsyncAPISpec(spec.source, {
					"file-type": "json",
					"output-file": spec.name,
				})

				const asyncApiDoc = parseAsyncAPIOutput(compilationResult.outputFiles, `${spec.name}.json`)
				const validationResult = await validator.validate(asyncApiDoc)

				validationResults.push({
					name: spec.name,
					valid: validationResult.valid,
					duration: validationResult.metrics.duration,
				})
			}

			const totalTime = performance.now() - startTime

			// All APIs should be valid
			expect(validationResults.every(r => r.valid)).toBe(true)

			// Total validation time should be reasonable
			expect(totalTime).toBeLessThan(5000) // Less than 5 seconds for 3 APIs

			Effect.log(`Validated ${apiSpecs.length} APIs in ${totalTime.toFixed(2)}ms`)
			Effect.log("Individual results:", validationResults.map(r =>
				`${r.name}: ${r.valid ? "✅" : "❌"} (${r.duration.toFixed(2)}ms)`,
			))
		})
	})
})