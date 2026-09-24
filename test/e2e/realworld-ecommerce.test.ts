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

import { asJsonSchema } from "../utils/type-guards.js";
import Ajv from "ajv";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";
import { createAsyncAPITestHost } from "../utils/test-helpers.js";
import { LATEST_BINDING_VERSIONS } from "../../src/constants/binding-versions.js";

const asyncApiSchema = JSON.parse(
  readFileSync(
    join(
      import.meta.dirname,
      "..",
      "..",
      "node_modules",
      "@asyncapi",
      "specs",
      "schemas",
      "3.1.0-without-$id.json",
    ),
    "utf8",
  ),
);

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true, strict: false });
const validate = ajv.compile(asyncApiSchema);

describe("e2E: Real-World E-Commerce System", () => {
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
					bindingVersion: "${LATEST_BINDING_VERSIONS.kafka}"				}
			})
			@publish
			op publishProductCreated(): Product;

			@channel("catalog.product.updated")
			@protocol(#{
				protocol: "kafka",
				binding: #{ topic: "product-events", bindingVersion: "${LATEST_BINDING_VERSIONS.kafka}" }			})
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
					bindingVersion: "${LATEST_BINDING_VERSIONS.kafka}"				}
			})
			@publish
			op publishInventoryUpdate(): InventoryUpdate;

			@channel("inventory.low-stock.alert")
			@protocol(#{
				protocol: "ws",
				binding: #{ method: "GET", bindingVersion: "${LATEST_BINDING_VERSIONS.ws}" }			})
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
					bindingVersion: "${LATEST_BINDING_VERSIONS.kafka}"				}
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
					bindingVersion: "${LATEST_BINDING_VERSIONS.kafka}"				}
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
					bindingVersion: "${LATEST_BINDING_VERSIONS.kafka}"				}
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
				binding: #{ method: "GET", bindingVersion: "${LATEST_BINDING_VERSIONS.ws}" }			})
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

    await host.compile("./main.tsp");
    await host.diagnose("./main.tsp");

    const outputFiles = [...host.fs.keys()];
    const asyncApiFile = outputFiles.find(
      (f) =>
        f.includes("asyncapi") && (f.endsWith(".json") || f.endsWith(".yaml")),
    );

    expect(asyncApiFile).toBeDefined();

    if (!asyncApiFile) {
      throw new Error("AsyncAPI output file was not generated.");
    }
    const content = host.fs.get(asyncApiFile) as string;
    const spec = content.startsWith("{")
      ? JSON.parse(content)
      : YAML.parse(content);

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
    expect(
      asJsonSchema(schemas.OrderPlaced.properties.items, "items").type,
    ).toBe("array");
    expect(schemas.OrderPlaced.properties.shippingAddress.type).toBe("object");

    // Payments
    expect(schemas.PaymentProcessed).toBeDefined();
    expect(schemas.PaymentProcessed.properties.status.enum).toStrictEqual([
      "success",
      "failed",
      "pending",
    ]);

    // Shipping
    expect(schemas.ShipmentCreated).toBeDefined();
    expect(schemas.ShipmentStatusUpdate).toBeDefined();
    expect(schemas.ShipmentStatusUpdate.properties.status.enum).toContain(
      "delivered",
    );

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

    // Validate protocol diversity (Kafka, WebSocket, HTTP) via channel/operation bindings
    const allProtos = new Set<string>();
    for (const ch of Object.values(channels)) {
      const bindings = (ch as Record<string, unknown>).bindings as
        Record<string, unknown> | undefined;
      if (bindings) {
        for (const proto of Object.keys(bindings)) {
          allProtos.add(proto);
        }
      }
    }
    for (const op of Object.values(operations)) {
      const bindings = (op as Record<string, unknown>).bindings as
        Record<string, unknown> | undefined;
      if (bindings) {
        for (const proto of Object.keys(bindings)) {
          allProtos.add(proto);
        }
      }
    }
    expect(allProtos).toContain("kafka");
    expect(allProtos).toContain("ws");
    expect(allProtos).toContain("http");

    // Validate against AsyncAPI 3.1 JSON Schema
    const valid = validate(spec);
    if (!valid) {
      console.error(
        "Schema validation errors:",
        JSON.stringify(validate.errors, null, 2),
      );
    }
    expect(valid).toBeTruthy();
  });
});
