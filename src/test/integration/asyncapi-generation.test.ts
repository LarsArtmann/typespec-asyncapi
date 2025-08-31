/**
 * PRODUCTION TEST: Real AsyncAPI Document Generation Tests
 *
 * Tests complete TypeSpec → AsyncAPI document transformation process.
 * NO mocks - validates real AsyncAPI 3.0.0 generation including:
 * - Full TypeSpec compilation and AST processing
 * - Complex nested schema generation and references
 * - Channel and operation creation from TypeSpec operations
 * - AsyncAPI 3.0.0 specification compliance validation
 * - Multi-namespace and inheritance handling
 */

import {describe, expect, test} from "bun:test"
import {
	type AsyncAPIDocument,
	compileAsyncAPISpecWithoutErrors,
	parseAsyncAPIOutput,
	validateAsyncAPIDocumentComprehensive,
} from "../../../test/utils/test-helpers.ts"
import {Effect} from "effect"
//TODO: this file is getting to big split it up

describe("Real AsyncAPI Generation Tests", () => {
	describe("Complete TypeSpec → AsyncAPI Transformation", () => {
		test("should transform complex TypeSpec namespace to valid AsyncAPI document", async () => {
			const source = `
        @doc("Enterprise event-driven microservice architecture")
        namespace EnterpriseEvents;
        
        @doc("Base event interface for all system events")
        model BaseEvent {
          @doc("Unique event identifier")
          eventId: string;
          
          @doc("Event timestamp in UTC")
          timestamp: utcDateTime;
          
          @doc("Event version for schema evolution")
          version: string;
          
          @doc("Source service identifier")
          source: string;
          
          @doc("Event correlation ID for tracing")
          correlationId?: string;
          
          @doc("Event metadata")
          metadata: EventMetadata;
        }
        
        @doc("Event metadata structure")
        model EventMetadata {
          @doc("Environment where event occurred")
          environment: "development" | "staging" | "production";
          
          @doc("User context if applicable")
          userContext?: UserContext;
          
          @doc("Additional custom properties")
          customProperties: Record<string>;
        }
        
        @doc("User context information")
        model UserContext {
          @doc("User identifier")
          userId: string;
          
          @doc("User roles")
          roles: string[];
          
          @doc("Session identifier")
          sessionId: string;
          
          @doc("User permissions")
          permissions: string[];
        }
        
        @doc("Order management events")
        model OrderEvent extends BaseEvent {
          @doc("Order identifier")
          orderId: string;
          
          @doc("Customer identifier")
          customerId: string;
          
          @doc("Order details")
          orderDetails: OrderDetails;
          
          @doc("Order status")
          status: "created" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
        }
        
        @doc("Detailed order information")
        model OrderDetails {
          @doc("Order items")
          items: OrderItem[];
          
          @doc("Total amount in cents")
          totalAmountCents: int64;
          
          @doc("Currency code")
          currency: string;
          
          @doc("Shipping address")
          shippingAddress: Address;
          
          @doc("Billing address")
          billingAddress: Address;
          
          @doc("Payment method information")
          paymentMethod: PaymentMethod;
        }
        
        @doc("Individual order item")
        model OrderItem {
          @doc("Product SKU")
          productSku: string;
          
          @doc("Product name")
          productName: string;
          
          @doc("Item quantity")
          quantity: int32;
          
          @doc("Unit price in cents")
          unitPriceCents: int64;
          
          @doc("Item discount percentage")
          discountPercent?: float32;
          
          @doc("Product variant details")
          variant?: ProductVariant;
        }
        
        @doc("Product variant information")
        model ProductVariant {
          @doc("Size specification")
          size?: string;
          
          @doc("Color specification")
          color?: string;
          
          @doc("Material specification")
          material?: string;
          
          @doc("Additional attributes")
          attributes: Record<string>;
        }
        
        @doc("Address information")
        model Address {
          @doc("Street address line 1")
          street1: string;
          
          @doc("Street address line 2")
          street2?: string;
          
          @doc("City name")
          city: string;
          
          @doc("State or province")
          state: string;
          
          @doc("Postal code")
          postalCode: string;
          
          @doc("Country code")
          country: string;
          
          @doc("Geographic coordinates")
          coordinates?: GeoCoordinates;
        }
        
        @doc("Geographic coordinates")
        model GeoCoordinates {
          @doc("Latitude")
          latitude: float64;
          
          @doc("Longitude") 
          longitude: float64;
        }
        
        @doc("Payment method details")
        model PaymentMethod {
          @doc("Payment type")
          type: "credit_card" | "debit_card" | "paypal" | "apple_pay" | "google_pay" | "bank_transfer";
          
          @doc("Last 4 digits of card (if applicable)")
          lastFourDigits?: string;
          
          @doc("Card brand (if applicable)")
          brand?: "visa" | "mastercard" | "amex" | "discover";
          
          @doc("Payment processor")
          processor: string;
          
          @doc("Transaction reference")
          transactionRef: string;
        }
        
        @doc("Inventory management events")
        model InventoryEvent extends BaseEvent {
          @doc("Product SKU")
          productSku: string;
          
          @doc("Warehouse identifier")
          warehouseId: string;
          
          @doc("Stock quantity change")
          quantityChange: int32;
          
          @doc("New total quantity")
          newQuantity: int32;
          
          @doc("Reason for change")
          reason: "sale" | "return" | "adjustment" | "restock" | "damage" | "theft";
          
          @doc("Change details")
          changeDetails?: InventoryChangeDetails;
        }
        
        @doc("Inventory change details")
        model InventoryChangeDetails {
          @doc("Reference order ID (if applicable)")
          referenceOrderId?: string;
          
          @doc("Employee ID who made change")
          employeeId?: string;
          
          @doc("Additional notes")
          notes?: string;
          
          @doc("Cost impact in cents")
          costImpactCents?: int64;
        }
        
        // Order Event Operations
        @channel("orders.created")
        @doc("Published when new order is created")
        @publish
        op publishOrderCreated(): OrderEvent;
        
        @channel("orders.confirmed")
        @doc("Published when order is confirmed")
        @publish
        op publishOrderConfirmed(): OrderEvent;
        
        @channel("orders.shipped")
        @doc("Published when order is shipped")
        @publish
        op publishOrderShipped(): OrderEvent;
        
        @channel("orders.delivered")
        @doc("Published when order is delivered")
        @publish
        op publishOrderDelivered(): OrderEvent;
        
        @channel("orders.cancelled")
        @doc("Published when order is cancelled")
        @publish
        op publishOrderCancelled(): OrderEvent;
        
        // Inventory Event Operations
        @channel("inventory.stock_changed")
        @doc("Published when inventory stock changes")
        @publish
        op publishInventoryStockChanged(): InventoryEvent;
        
        @channel("inventory.low_stock")
        @doc("Published when inventory reaches low stock threshold")
        @publish
        op publishInventoryLowStock(): InventoryEvent;
        
        // Subscription Operations
        @channel("orders.{customerId}.events")
        @doc("Subscribe to all order events for specific customer")
        @subscribe
        op subscribeCustomerOrderEvents(customerId: string): OrderEvent;
        
        @channel("inventory.{warehouseId}.changes")
        @doc("Subscribe to inventory changes for specific warehouse")
        @subscribe
        op subscribeWarehouseInventoryChanges(warehouseId: string): InventoryEvent;
        
        @channel("orders.status.{status}")
        @doc("Subscribe to orders by status")
        @subscribe
        op subscribeOrdersByStatus(status: string): OrderEvent;
      `

			const {outputFiles, program} = await compileAsyncAPISpecWithoutErrors(source, {
				"output-file": "enterprise-events",
				"file-type": "json",
			})

			// Verify comprehensive compilation
			expect(program).toBeDefined()
			expect(outputFiles.size).toBeGreaterThan(0)

			const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "enterprise-events.json") as AsyncAPIDocument

			// Validate AsyncAPI document structure
			expect(asyncapiDoc.asyncapi).toBe("3.0.0")
			expect(asyncapiDoc.info).toBeDefined()
			expect(asyncapiDoc.channels).toBeDefined()
			expect(asyncapiDoc.operations).toBeDefined()
			expect(asyncapiDoc.components?.schemas).toBeDefined()

			// Validate all complex schemas were generated
			const expectedSchemas = [
				"BaseEvent", "EventMetadata", "UserContext", "OrderEvent", "OrderDetails",
				"OrderItem", "ProductVariant", "Address", "GeoCoordinates", "PaymentMethod",
				"InventoryEvent", "InventoryChangeDetails",
			]

			for (const schemaName of expectedSchemas) {
				expect(asyncapiDoc.components.schemas[schemaName]).toBeDefined()
				Effect.log(`✓ Schema generated: ${schemaName}`)
			}

			// Validate inheritance handling (OrderEvent extends BaseEvent)
			const orderEventSchema = asyncapiDoc.components.schemas.OrderEvent
			expect(orderEventSchema.properties?.eventId).toBeDefined() // From BaseEvent
			expect(orderEventSchema.properties?.timestamp).toBeDefined() // From BaseEvent
			expect(orderEventSchema.properties?.orderId).toBeDefined() // From OrderEvent
			expect(orderEventSchema.properties?.customerId).toBeDefined() // From OrderEvent

			// Validate complex nested object handling
			const orderDetailsSchema = asyncapiDoc.components.schemas.OrderDetails
			expect(orderDetailsSchema.properties?.items?.type).toBe("array")
			expect(orderDetailsSchema.properties?.shippingAddress?.type).toBe("object")
			expect(orderDetailsSchema.properties?.billingAddress?.type).toBe("object")

			// Validate all operations were generated
			const expectedOperations = [
				"publishOrderCreated", "publishOrderConfirmed", "publishOrderShipped",
				"publishOrderDelivered", "publishOrderCancelled", "publishInventoryStockChanged",
				"publishInventoryLowStock", "subscribeCustomerOrderEvents",
				"subscribeWarehouseInventoryChanges", "subscribeOrdersByStatus",
			]

			for (const operationName of expectedOperations) {
				expect(asyncapiDoc.operations[operationName]).toBeDefined()
				Effect.log(`✓ Operation generated: ${operationName}`)
			}

			// Validate publish vs subscribe actions
			expect(asyncapiDoc.operations.publishOrderCreated.action).toBe("send")
			expect(asyncapiDoc.operations.subscribeCustomerOrderEvents.action).toBe("receive")

			// Run comprehensive AsyncAPI validation
			const validation = await validateAsyncAPIDocumentComprehensive(asyncapiDoc)
			expect(validation.valid).toBe(true)
			if (!validation.valid) {
				console.error("Validation errors:", validation.errors)
				throw new Error(`AsyncAPI validation failed: ${validation.summary}`)
			}

			Effect.log("✅ Complex TypeSpec → AsyncAPI transformation completed successfully")
			Effect.log(`📊 Generated ${Object.keys(asyncapiDoc.components.schemas).length} schemas`)
			Effect.log(`📊 Generated ${Object.keys(asyncapiDoc.operations).length} operations`)
			Effect.log(`📊 Generated ${Object.keys(asyncapiDoc.channels).length} channels`)
		})

		test("should handle TypeSpec union types and optional fields correctly", async () => {
			const source = `
        namespace UnionTypeTest;
        
        @doc("Event with union types and optional fields")
        model FlexibleEvent {
          @doc("Event ID")
          eventId: string;
          
          @doc("Flexible data payload")
          data: string | int32 | boolean | object;
          
          @doc("Optional status with union type")
          status?: "active" | "inactive" | "pending" | "archived";
          
          @doc("Optional metadata")
          metadata?: {
            tags: string[];
            priority: "low" | "medium" | "high" | "critical";
            customData?: Record<unknown>;
          };
          
          @doc("Numeric value that can be int or float")
          numericValue: int32 | float64;
          
          @doc("Optional array of mixed types")
          mixedArray?: (string | int32)[];
        }
        
        @channel("flexible.events")
        @publish
        op publishFlexibleEvent(): FlexibleEvent;
      `

			const {outputFiles} = await compileAsyncAPISpecWithoutErrors(source, {
				"output-file": "union-type-test",
				"file-type": "json",
			})

			const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "union-type-test.json") as AsyncAPIDocument

			// Validate union type handling in schema
			const flexibleEventSchema = asyncapiDoc.components.schemas.FlexibleEvent
			expect(flexibleEventSchema).toBeDefined()
			expect(flexibleEventSchema.properties?.eventId?.type).toBe("string")

			// Validate required vs optional fields
			expect(flexibleEventSchema.required).toContain("eventId")
			expect(flexibleEventSchema.required).toContain("data")
			expect(flexibleEventSchema.required).toContain("numericValue")
			expect(flexibleEventSchema.required).not.toContain("status")
			expect(flexibleEventSchema.required).not.toContain("metadata")
			expect(flexibleEventSchema.required).not.toContain("mixedArray")

			Effect.log("✅ Union types and optional fields processed correctly")
		})

		test("should generate valid AsyncAPI for multi-namespace TypeSpec", async () => {
			const source = `
        @doc("User management namespace")
        namespace UserManagement {
          @doc("User account information")
          model User {
            userId: string;
            email: string;
            profile: UserProfile;
          }
          
          @doc("User profile details")
          model UserProfile {
            firstName: string;
            lastName: string;
            preferences: Record<string>;
          }
          
          @channel("users.created")
          @publish
          op publishUserCreated(): User;
        }
        
        @doc("Order processing namespace")
        namespace OrderProcessing {
          @doc("Order information")
          model Order {
            orderId: string;
            userId: string;
            items: OrderItem[];
            status: "pending" | "confirmed" | "shipped";
          }
          
          @doc("Order item details")
          model OrderItem {
            productId: string;
            quantity: int32;
            price: float64;
          }
          
          @channel("orders.processed")
          @publish
          op publishOrderProcessed(): Order;
          
          @channel("orders.{userId}.status")
          @subscribe
          op subscribeUserOrderStatus(userId: string): Order;
        }
        
        @doc("Notification service namespace")
        namespace NotificationService {
          @doc("Notification message")
          model Notification {
            notificationId: string;
            recipientId: string;
            message: string;
            type: "email" | "sms" | "push" | "in_app";
            scheduledAt?: utcDateTime;
          }
          
          @channel("notifications.send")
          @publish
          op publishNotification(): Notification;
        }
      `

			const {outputFiles} = await compileAsyncAPISpecWithoutErrors(source, {
				"output-file": "multi-namespace-test",
				"file-type": "json",
			})

			const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "multi-namespace-test.json") as AsyncAPIDocument

			// Validate schemas from all namespaces
			const expectedSchemas = ["User", "UserProfile", "Order", "OrderItem", "Notification"]
			for (const schemaName of expectedSchemas) {
				expect(asyncapiDoc.components.schemas[schemaName]).toBeDefined()
				Effect.log(`✓ Multi-namespace schema: ${schemaName}`)
			}

			// Validate operations from all namespaces
			const expectedOperations = [
				"publishUserCreated", "publishOrderProcessed",
				"subscribeUserOrderStatus", "publishNotification",
			]
			for (const operationName of expectedOperations) {
				expect(asyncapiDoc.operations[operationName]).toBeDefined()
				Effect.log(`✓ Multi-namespace operation: ${operationName}`)
			}

			Effect.log("✅ Multi-namespace TypeSpec processed successfully")
		})
	})

	describe("AsyncAPI 3.0.0 Specification Compliance", () => {
		test("should generate AsyncAPI document compliant with 3.0.0 specification", async () => {
			const source = `
        namespace ComplianceTest;
        
        @doc("Specification compliance test message")
        model ComplianceMessage {
          @doc("Message identifier")
          id: string;
          
          @doc("Message content")
          content: string;
          
          @doc("Creation timestamp")
          createdAt: utcDateTime;
          
          @doc("Message metadata")
          metadata: {
            version: string;
            source: string;
            correlationId: string;
          };
        }
        
        @channel("compliance.test.messages")
        @doc("Channel for compliance testing")
        @publish
        op publishComplianceMessage(): ComplianceMessage;
        
        @channel("compliance.test.subscribe")
        @doc("Subscription channel for compliance testing")
        @subscribe
        op subscribeComplianceMessages(): ComplianceMessage;
      `

			const {outputFiles} = await compileAsyncAPISpecWithoutErrors(source, {
				"output-file": "compliance-test",
				"file-type": "json",
			})

			const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "compliance-test.json") as AsyncAPIDocument

			// Validate AsyncAPI 3.0.0 specification compliance
			expect(asyncapiDoc.asyncapi).toBe("3.0.0")

			// Validate required top-level fields
			expect(asyncapiDoc.info).toBeDefined()
			expect(asyncapiDoc.info.title).toBeDefined()
			expect(asyncapiDoc.info.version).toBeDefined()

			// Validate channels structure
			expect(asyncapiDoc.channels).toBeDefined()
			expect(Object.keys(asyncapiDoc.channels).length).toBeGreaterThan(0)

			// Validate operations structure
			expect(asyncapiDoc.operations).toBeDefined()
			expect(Object.keys(asyncapiDoc.operations).length).toBeGreaterThan(0)

			// Validate components structure
			expect(asyncapiDoc.components).toBeDefined()
			expect(asyncapiDoc.components.schemas).toBeDefined()

			// Validate operation structure compliance
			const publishOp = asyncapiDoc.operations.publishComplianceMessage
			expect(publishOp.action).toBe("send")
			expect(publishOp.channel).toBeDefined()
			expect(publishOp.channel.$ref).toMatch(/^#\/channels\//)

			const subscribeOp = asyncapiDoc.operations.subscribeComplianceMessages
			expect(subscribeOp.action).toBe("receive")
			expect(subscribeOp.channel).toBeDefined()

			// Run comprehensive specification compliance validation
			const validation = await validateAsyncAPIDocumentComprehensive(asyncapiDoc)
			expect(validation.valid).toBe(true)

			if (!validation.valid) {
				console.error("AsyncAPI 3.0.0 compliance validation failed:")
				validation.errors.forEach(error => {
					console.error(`- ${error.path}: ${error.message}`)
				})
				throw new Error(`AsyncAPI 3.0.0 compliance validation failed: ${validation.summary}`)
			}

			Effect.log("✅ AsyncAPI 3.0.0 specification compliance validated successfully")
		})

		test("should handle complex schema references correctly", async () => {
			const source = `
        namespace ReferenceTest;
        
        @doc("Referenced base model")
        model BaseReference {
          id: string;
          createdAt: utcDateTime;
        }
        
        @doc("Model with internal references")
        model ModelWithReferences extends BaseReference {
          @doc("Reference to another model")
          relatedModel: RelatedModel;
          
          @doc("Array of references")
          relatedItems: RelatedModel[];
          
          @doc("Optional reference")
          optionalRef?: RelatedModel;
          
          @doc("Nested object with references")
          nested: {
            innerRef: RelatedModel;
            deepNested: {
              deepRef: BaseReference;
            };
          };
        }
        
        @doc("Related model for references")
        model RelatedModel {
          refId: string;
          name: string;
          status: "active" | "inactive";
        }
        
        @channel("references.test")
        @publish
        op publishReferenceTest(): ModelWithReferences;
      `

			const {outputFiles} = await compileAsyncAPISpecWithoutErrors(source, {
				"output-file": "reference-test",
				"file-type": "json",
			})

			const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "reference-test.json") as AsyncAPIDocument

			// Validate all referenced schemas are generated
			expect(asyncapiDoc.components.schemas.BaseReference).toBeDefined()
			expect(asyncapiDoc.components.schemas.ModelWithReferences).toBeDefined()
			expect(asyncapiDoc.components.schemas.RelatedModel).toBeDefined()

			// Validate inheritance in schema
			const modelWithRefsSchema = asyncapiDoc.components.schemas.ModelWithReferences
			expect(modelWithRefsSchema.properties?.id).toBeDefined() // From BaseReference
			expect(modelWithRefsSchema.properties?.createdAt).toBeDefined() // From BaseReference
			expect(modelWithRefsSchema.properties?.relatedModel).toBeDefined() // Own property

			// Validate nested object structures
			expect(modelWithRefsSchema.properties?.nested?.type).toBe("object")

			Effect.log("✅ Complex schema references handled correctly")
		})
	})

	describe("Performance and Scale Testing", () => {
		test("should generate large AsyncAPI document efficiently", async () => {
			// Generate a large TypeSpec source with many models and operations
			const generateLargeTypeSpecSource = (): string => {
				const models = []
				const operations = []

				// Generate 20 models with multiple properties each
				for (let i = 1; i <= 20; i++) {
					models.push(`
            @doc("Generated model ${i}")
            model GeneratedModel${i} {
              @doc("Model ${i} ID")
              id${i}: string;
              
              @doc("Model ${i} name")
              name${i}: string;
              
              @doc("Model ${i} timestamp")
              timestamp${i}: utcDateTime;
              
              @doc("Model ${i} data")
              data${i}: {
                value: int32;
                label: string;
                active: boolean;
                metadata: Record<string>;
              };
              
              @doc("Model ${i} status")
              status${i}: "pending" | "active" | "inactive" | "archived";
            }
          `)

					// Generate publish and subscribe operations for each model
					operations.push(`
            @channel("generated.model${i}.events")
            @publish
            op publishGeneratedModel${i}Event(): GeneratedModel${i};
            
            @channel("generated.model${i}.subscribe")
            @subscribe
            op subscribeGeneratedModel${i}Events(): GeneratedModel${i};
          `)
				}

				return `
          namespace LargeScaleTest;
          ${models.join('\n')}
          ${operations.join('\n')}
        `
			}

			const startTime = Date.now()
			const largeSource = generateLargeTypeSpecSource()

			const {outputFiles} = await compileAsyncAPISpecWithoutErrors(largeSource, {
				"output-file": "large-scale-test",
				"file-type": "json",
			})

			const endTime = Date.now()
			const compilationTime = endTime - startTime

			const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "large-scale-test.json") as AsyncAPIDocument

			// Validate scale - should have 20 schemas and 40 operations
			expect(Object.keys(asyncapiDoc.components.schemas).length).toBe(20)
			expect(Object.keys(asyncapiDoc.operations).length).toBe(40)

			// Performance assertion - should compile large document in reasonable time
			expect(compilationTime).toBeLessThan(30000) // 30 seconds max

			Effect.log(`✅ Large scale AsyncAPI generation completed in ${compilationTime}ms`)
			Effect.log(`📊 Generated ${Object.keys(asyncapiDoc.components.schemas).length} schemas`)
			Effect.log(`📊 Generated ${Object.keys(asyncapiDoc.operations).length} operations`)
		})
	})
})