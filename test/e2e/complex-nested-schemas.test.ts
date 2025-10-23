/**
 * E2E Test 3: Complex Nested Schemas
 *
 * Tests deep nesting, arrays, recursive types, and complex object structures
 */

import { describe, expect, it } from "bun:test"
import { createAsyncAPITestHost } from "../utils/test-helpers.js"
import { Effect } from "effect"

describe("E2E: Complex Nested Schemas", () => {
	it("should handle deeply nested and complex schema structures", async () => {
		const host = await createAsyncAPITestHost()

		host.addTypeSpecFile("main.tsp", `
			import "@lars-artmann/typespec-asyncapi";
			using TypeSpec.AsyncAPI;

			namespace ComplexSchemas;

			// === Deep Nesting (5 levels) ===
			model Address {
				street: string;
				city: string;
				state: string;
				zipCode: string;
				country: string;
			}

			model ContactInfo {
				email: string;
				phone?: string;
				address: Address;
				emergencyContact?: {
					name: string;
					relationship: string;
					phone: string;
				};
			}

			model EmploymentHistory {
				companyName: string;
				position: string;
				startDate: utcDateTime;
				endDate?: utcDateTime;
				responsibilities: string[];
				achievements: {
					title: string;
					description: string;
					date: utcDateTime;
				}[];
			}

			model UserProfile {
				userId: string;
				personalInfo: {
					firstName: string;
					lastName: string;
					dateOfBirth: utcDateTime;
					contact: ContactInfo;
				};
				professional: {
					currentPosition: string;
					department: string;
					employmentHistory: EmploymentHistory[];
				};
				metadata: {
					createdAt: utcDateTime;
					updatedAt: utcDateTime;
					version: int32;
					tags: string[];
					customFields?: Record<unknown>;
				};
			}

			// === Arrays of Complex Objects ===
			model ProductVariant {
				variantId: string;
				sku: string;
				attributes: {
					name: string;
					value: string;
				}[];
				pricing: {
					basePrice: float64;
					currency: string;
					discount?: {
						type: "percentage" | "fixed";
						value: float64;
						validUntil: utcDateTime;
					};
				};
				inventory: {
					quantity: int32;
					locations: {
						warehouseId: string;
						quantity: int32;
						reserved: int32;
					}[];
				};
			}

			model Order {
				orderId: string;
				customerId: string;
				items: {
					productId: string;
					variant: ProductVariant;
					quantity: int32;
					priceAtPurchase: float64;
				}[];
				shipping: {
					method: "standard" | "express" | "overnight";
					address: Address;
					tracking?: {
						carrier: string;
						trackingNumber: string;
						estimatedDelivery: utcDateTime;
					};
				};
				payment: {
					method: "credit_card" | "paypal" | "bank_transfer";
					status: "pending" | "completed" | "failed" | "refunded";
					transactions: {
						transactionId: string;
						amount: float64;
						currency: string;
						timestamp: utcDateTime;
					}[];
				};
			}

			// === Union Types with Complex Objects ===
			model EventMetadata {
				eventId: string;
				timestamp: utcDateTime;
				source: string;
				correlationId?: string;
			}

			model UserEventPayload {
				metadata: EventMetadata;
				eventType: "created" | "updated" | "deleted";
				data: UserProfile;
			}

			model OrderEventPayload {
				metadata: EventMetadata;
				eventType: "placed" | "shipped" | "delivered" | "cancelled";
				data: Order;
			}

			// === Test Operations ===
			@channel("events.user.profile")
			@publish
			op publishUserEvent(): UserEventPayload;

			@channel("events.orders")
			@publish
			op publishOrderEvent(): OrderEventPayload;

			@channel("products.variants.update")
			@subscribe
			op subscribeProductVariants(): ProductVariant;
		`)

		const program = await host.compile("./main.tsp")
		const diagnostics = await host.diagnose("./main.tsp", {
			emit: ["@lars-artmann/typespec-asyncapi"]
		})

		Effect.log(`Diagnostics: ${diagnostics.length}`)

		const outputFiles = Array.from(host.fs.keys())
		const asyncApiFile = outputFiles.find(f =>
			f.includes("asyncapi") && (f.endsWith(".json") || f.endsWith(".yaml"))
		)

		expect(asyncApiFile).toBeDefined()

		if (asyncApiFile) {
			const content = host.fs.get(asyncApiFile) as string
			const spec = content.startsWith('{') ? JSON.parse(content) : require('yaml').parse(content)

			const schemas = spec.components?.schemas || {}

			// Validate deep nesting (5 levels)
			expect(schemas.UserProfile).toBeDefined()
			expect(schemas.UserProfile.properties.personalInfo.type).toBe("object")
			expect(schemas.UserProfile.properties.personalInfo.properties.contact.type).toBe("object")
			expect(schemas.Address).toBeDefined()

			// Validate arrays
			expect(schemas.Order.properties.items.type).toBe("array")
			expect(schemas.Order.properties.items.items.type).toBe("object")
			expect(schemas.ProductVariant.properties.attributes.type).toBe("array")

			// Validate optional fields in nested structures
			expect(schemas.ContactInfo.properties.phone).toBeDefined()
			expect(schemas.ContactInfo.required).not.toContain("phone")

			// Validate union types in nested structures
			expect(schemas.ProductVariant.properties.pricing.properties.discount).toBeDefined()

			// Validate enums from union types
			expect(schemas.Order.properties.shipping.properties.method.enum).toEqual(["standard", "express", "overnight"])
			expect(schemas.UserEventPayload.properties.eventType.enum).toEqual(["created", "updated", "deleted"])

			// Validate all required schemas exist
			expect(schemas.Address).toBeDefined()
			expect(schemas.ContactInfo).toBeDefined()
			expect(schemas.EmploymentHistory).toBeDefined()
			expect(schemas.UserProfile).toBeDefined()
			expect(schemas.ProductVariant).toBeDefined()
			expect(schemas.Order).toBeDefined()

			// Validate operations
			expect(Object.keys(spec.operations || {}).length).toBeGreaterThanOrEqual(3)

			Effect.log("✅ Complex nested schemas E2E test passed!")
		}
	})
})
