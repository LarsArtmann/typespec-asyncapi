/**
 * E2E Test 4: Real-World E-Commerce Event System
 *
 * Simulates a complete e-commerce event-driven architecture with:
 * - Product catalog events
 * - Order lifecycle events
 * - Inventory management
 * - Payment processing
 * - Shipping notifications
 */

import { describe, expect, it } from "bun:test";
import Ajv from "ajv";
import { readFileSync } from "fs";
import { join } from "path";
import { createAsyncAPITestHost } from "../utils/test-helpers.js";

const asyncApiSchema = JSON.parse(
  readFileSync(
    join(
      import.meta.dir,
      "..",
      "..",
      "node_modules",
      "@asyncapi",
      "specs",
      "schemas",
      "3.1.0-without-$id.json",
    ),
    "utf-8",
  ),
);

const ajv = new Ajv({ allErrors: true, strict: false, allowUnionTypes: true });
const validate = ajv.compile(asyncApiSchema);

describe("E2E: Real-World E-Commerce System", () => {
  it("should generate complete e-commerce event system", async () => {
    const host = await createAsyncAPITestHost();

    host.addTypeSpecFile(
      "main.tsp",
      `
			import "@lars-artmann/typespec-asyncapi";
			using TypeSpec.AsyncAPI;

			namespace ECommerceEvents;

			// === Product Catalog Events ===
			model Product {
				productId: string;
				name: string;
				description: string;
				category: string;
				price: float64;
				currency: string;
				inStock: boolean;
				images: string[];
				variants: {
					sku: string;
					attributes: string;
					price: float64;
					inventory: int32;
				}[];
			}

			@channel("catalog.product.created")
			@protocol(#{
				protocol: "kafka",
				binding: #{
					topic: "product-events",
					bindingVersion: "0.5.0"
				}
			})
			@publish
			op publishProductCreated(): Product;

			@channel("catalog.product.updated")
			@protocol(#{
				protocol: "kafka",
				binding: #{ topic: "product-events", bindingVersion: "0.5.0" }
			})
			@publish
			op publishProductUpdated(): Product;

			// === Inventory Management ===
			model InventoryUpdate {
				productId: string;
				sku: string;
				warehouseId: string;
				previousQuantity: int32;
				newQuantity: int32;
				reason: "sale" | "restock" | "return" | "adjustment";
				timestamp: utcDateTime;
			}

			@channel("inventory.quantity.changed")
			@protocol(#{
				protocol: "kafka",
				binding: #{
					topic: "inventory-events",
					bindingVersion: "0.5.0"
				}
			})
			@publish
			op publishInventoryUpdate(): InventoryUpdate;

			@channel("inventory.low-stock.alert")
			@protocol(#{
				protocol: "ws",
				binding: #{ method: "GET", bindingVersion: "0.1.0" }
			})
			@subscribe
			op subscribeLowStockAlerts(): {
				productId: string;
				sku: string;
				currentQuantity: int32;
				threshold: int32;
			};

			// === Order Lifecycle ===
			model OrderPlaced {
				orderId: string;
				customerId: string;
				items: {
					productId: string;
					sku: string;
					quantity: int32;
					pricePerUnit: float64;
				}[];
				total: float64;
				currency: string;
				shippingAddress: {
					street: string;
					city: string;
					state: string;
					zipCode: string;
					country: string;
				};
				placedAt: utcDateTime;
			}

			@channel("orders.placed")
			@protocol(#{
				protocol: "kafka",
				binding: #{
					topic: "order-events",
					bindingVersion: "0.5.0"
				}
			})
			@security(#{
				name: "orderAuth",
				scheme: #{
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT"
				}
			})
			@publish
			op publishOrderPlaced(): OrderPlaced;

			// === Payment Processing ===
			model PaymentProcessed {
				paymentId: string;
				orderId: string;
				amount: float64;
				currency: string;
				method: "credit_card" | "debit_card" | "paypal" | "bank_transfer";
				status: "success" | "failed" | "pending";
				transactionId: string;
				processedAt: utcDateTime;
			}

			@channel("payments.processed")
			@protocol(#{
				protocol: "kafka",
				binding: #{
					topic: "payment-events",
					bindingVersion: "0.5.0"
				}
			})
			@security(#{
				name: "paymentAuth",
				scheme: #{
					type: "oauth2",
				flows: #{
						clientCredentials: #{
							tokenUrl: "https://auth.ecommerce.com/oauth/token",
							availableScopes: #{
								paymentsRead: "Read payment data",
								paymentsWrite: "Process payments"
							}
						}
					}
				}
			})
			@publish
			op publishPaymentProcessed(): PaymentProcessed;

			// === Shipping & Fulfillment ===
			model ShipmentCreated {
				shipmentId: string;
				orderId: string;
				carrier: string;
				trackingNumber: string;
				items: {
					productId: string;
					sku: string;
					quantity: int32;
				}[];
				estimatedDelivery: utcDateTime;
				createdAt: utcDateTime;
			}

			@channel("shipping.shipment.created")
			@protocol(#{
				protocol: "kafka",
				binding: #{
					topic: "shipment-events",
					bindingVersion: "0.5.0"
				}
			})
			@publish
			op publishShipmentCreated(): ShipmentCreated;

			model ShipmentStatusUpdate {
				shipmentId: string;
				orderId: string;
				status: "in_transit" | "out_for_delivery" | "delivered" | "failed" | "returned";
				location: string;
				timestamp: utcDateTime;
			}

			@channel("shipping.status.updated")
			@protocol(#{
				protocol: "ws",
				binding: #{ method: "GET", bindingVersion: "0.1.0" }
			})
			@subscribe
			op subscribeShipmentStatus(): ShipmentStatusUpdate;

			// === Customer Notifications (Webhooks) ===
			model CustomerNotification {
				notificationId: string;
				customerId: string;
				type: "order_confirmed" | "payment_success" | "shipment_update" | "delivery_complete";
				title: string;
				message: string;
				data: string;
				timestamp: utcDateTime;
			}

			@channel("webhooks.customer.notifications")
			@protocol(#{
				protocol: "http",
				binding: #{
					type: "request",
					method: "POST"
				}
			})
			@security(#{
				name: "webhookAuth",
				scheme: #{
					type: "httpApiKey",
					in: "header",
					name: "X-Webhook-Secret"
				}
			})
			@subscribe
			op receiveCustomerNotifications(): CustomerNotification;
		`,
    );

    const program = await host.compile("./main.tsp");
    const diagnostics = await host.diagnose("./main.tsp", {
      emit: ["@lars-artmann/typespec-asyncapi"],
    });

    const outputFiles = Array.from(host.fs.keys());
    const asyncApiFile = outputFiles.find(
      (f) => f.includes("asyncapi") && (f.endsWith(".json") || f.endsWith(".yaml")),
    );

    expect(asyncApiFile).toBeDefined();

    if (asyncApiFile) {
      const content = host.fs.get(asyncApiFile) as string;
      const spec = content.startsWith("{") ? JSON.parse(content) : require("yaml").parse(content);

      // Validate e-commerce event domains
      const schemas = spec.components?.schemas || {};

      // Product catalog
      expect(schemas.Product).toBeDefined();
      expect(schemas.Product.properties.variants.type).toBe("array");

      // Inventory
      expect(schemas.InventoryUpdate).toBeDefined();
      expect(schemas.InventoryUpdate.properties.reason.enum).toContain("sale");

      // Orders
      expect(schemas.OrderPlaced).toBeDefined();
      expect(schemas.OrderPlaced.properties.items.type).toBe("array");
      expect(schemas.OrderPlaced.properties.shippingAddress.type).toBe("object");

      // Payments
      expect(schemas.PaymentProcessed).toBeDefined();
      expect(schemas.PaymentProcessed.properties.status.enum).toEqual([
        "success",
        "failed",
        "pending",
      ]);

      // Shipping
      expect(schemas.ShipmentCreated).toBeDefined();
      expect(schemas.ShipmentStatusUpdate).toBeDefined();
      expect(schemas.ShipmentStatusUpdate.properties.status.enum).toContain("delivered");

      // Notifications
      expect(schemas.CustomerNotification).toBeDefined();

      // Validate operations (at least 9 operations)
      const operations = spec.operations || {};
      expect(Object.keys(operations).length).toBeGreaterThanOrEqual(9);

      // Validate channels
      const channels = spec.channels || {};
      expect(Object.keys(channels).length).toBeGreaterThanOrEqual(9);

      // Validate security schemes (JWT, OAuth2, API Key)
      const securitySchemes = spec.components?.securitySchemes || {};
      expect(Object.keys(securitySchemes).length).toBeGreaterThanOrEqual(3);

      // Validate protocol diversity (Kafka, WebSocket, HTTP)
      const channelValues = Object.values(channels);
      const serialized = JSON.stringify(channelValues);
      const hasKafka = serialized.includes("kafka");
      const hasWebSocket = serialized.includes("ws");
      const hasHTTP = serialized.includes("http");
      expect(hasKafka).toBe(true);
      expect(hasWebSocket).toBe(true);
      expect(hasHTTP).toBe(true);

      // Validate against AsyncAPI 3.1 JSON Schema
      const valid = validate(spec);
      if (!valid) {
        console.error("Schema validation errors:", JSON.stringify(validate.errors, null, 2));
      }
      expect(valid).toBe(true);
    }
  });
});
