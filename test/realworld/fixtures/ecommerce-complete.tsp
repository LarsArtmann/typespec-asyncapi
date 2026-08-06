// =============================================================================
// Pattern Source: typespec-eventsourcing/packages/tests-ecommerce/complete-ecommerce.tsp
//                  + Kernovia e-commerce patterns
// Pattern: Full e-commerce domain — complex cross-model references, multiple
//          operations, decimal types, deep model graphs, status enums,
//          arrays of named types, payment/shipping/inventory domains
// =============================================================================

@service(#{ title: "E-Commerce Platform" })
@server("kafka", #{ url: "kafka://ecommerce-broker:9092", protocol: "kafka" })
@defaultContentType("application/json")
namespace EcommercePlatform;

// --- Common types ---
scalar Sku extends string;
scalar OrderNumber extends string;
scalar Currency extends string;

// --- Address ---
model Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean = false;
}

// --- Product ---
model Product {
  sku: Sku;
  name: string;
  description: string;
  price: decimal;
  currency: "USD" | "EUR" | "GBP";
  category: string;
  tags: string[];
  stockQuantity: int32;
  status: "active" | "inactive" | "discontinued";
  images: string[];
  attributes: Record<string>;
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

// --- Customer ---
model Customer {
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  addresses: Address[];
  preferredCurrency: "USD" | "EUR" | "GBP" = "USD";
  loyaltyTier: "bronze" | "silver" | "gold" | "platinum" = "bronze";
  totalOrders: int32 = 0;
  totalSpent: decimal = 0;
  createdAt: utcDateTime;
}

// --- Order ---
model OrderItem {
  sku: Sku;
  productName: string;
  quantity: int32;
  unitPrice: decimal;
  totalPrice: decimal;
  productImage: string;
}

model Order {
  orderNumber: OrderNumber;
  customerId: string;
  items: OrderItem[];
  subtotal: decimal;
  taxAmount: decimal;
  shippingCost: decimal;
  discountAmount: decimal;
  totalAmount: decimal;
  currency: "USD" | "EUR" | "GBP";
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: string;
  notes: string;
  placedAt: utcDateTime;
  confirmedAt: utcDateTime;
  shippedAt: utcDateTime;
  deliveredAt: utcDateTime;
}

// --- Payment ---
model Payment {
  paymentId: string;
  orderNumber: OrderNumber;
  customerId: string;
  amount: decimal;
  currency: "USD" | "EUR" | "GBP";
  method: "credit_card" | "paypal" | "bank_transfer" | "crypto" | "apple_pay" | "google_pay";
  status: "pending" | "processing" | "completed" | "failed" | "refunded" | "partially_refunded";
  transactionId: string;
  failureReason: string;
  processedAt: utcDateTime;
  refundAmount: decimal;
  metadata: Record<string>;
}

// --- Shipping ---
model Shipment {
  shipmentId: string;
  orderNumber: OrderNumber;
  carrier: string;
  trackingNumber: string;
  status: "label_created" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered" | "returned";
  shippingAddress: Address;
  estimatedDelivery: utcDateTime;
  actualDelivery: utcDateTime;
  weight: float32;
  dimensions: {
    length: float32;
    width: float32;
    height: float32;
    unit: "cm" | "in";
  };
  cost: decimal;
  currency: "USD" | "EUR" | "GBP";
  events: ShipmentEvent[];
}

model ShipmentEvent {
  status: string;
  location: string;
  timestamp: utcDateTime;
  description: string;
}

// --- Inventory ---
model InventoryLevel {
  sku: Sku;
  warehouseId: string;
  quantity: int32;
  reservedQuantity: int32;
  availableQuantity: int32;
  reorderPoint: int32;
  reorderQuantity: int32;
  lastUpdated: utcDateTime;
}

model InventoryReservation {
  reservationId: string;
  sku: Sku;
  quantity: int32;
  orderNumber: OrderNumber;
  status: "active" | "released" | "consumed";
  expiresAt: utcDateTime;
}

// --- Cart ---
model Cart {
  cartId: string;
  customerId: string;
  items: CartItem[];
  subtotal: decimal;
  currency: "USD" | "EUR" | "GBP";
  expiresAt: utcDateTime;
}

model CartItem {
  sku: Sku;
  quantity: int32;
  unitPrice: decimal;
  addedAt: utcDateTime;
}

// --- Review ---
model ProductReview {
  reviewId: string;
  sku: Sku;
  customerId: string;
  rating: int32;
  title: string;
  body: string;
  verified: boolean = false;
  helpfulVotes: int32 = 0;
  createdAt: utcDateTime;
}

// --- AsyncAPI Operations: Product events ---
@doc("Product created")
@channel("products.created")
@publish
op publishProductCreated(): Product;

@doc("Product stock updated")
@channel("products.stock_updated")
@publish
op publishProductStockUpdated(): Product;

@doc("Product price changed")
@channel("products.price_changed")
@publish
op publishProductPriceChanged(): Product;

// --- AsyncAPI Operations: Order events ---
@doc("Order placed")
@channel("orders.placed")
@publish
op publishOrderPlaced(): Order;

@doc("Order status changed")
@channel("orders.status_changed")
@publish
op publishOrderStatusChanged(): Order;

@doc("Order cancelled")
@channel("orders.cancelled")
@publish
op publishOrderCancelled(): Order;

// --- AsyncAPI Operations: Payment events ---
@doc("Payment processed")
@channel("payments.processed")
@publish
op publishPaymentProcessed(): Payment;

@doc("Payment failed")
@channel("payments.failed")
@publish
op publishPaymentFailed(): Payment;

@doc("Payment refunded")
@channel("payments.refunded")
@publish
op publishPaymentRefunded(): Payment;

// --- AsyncAPI Operations: Shipping events ---
@doc("Shipment created")
@channel("shipments.created")
@publish
op publishShipmentCreated(): Shipment;

@doc("Shipment status updated")
@channel("shipments.status_updated")
@publish
op publishShipmentStatusUpdated(): Shipment;

// --- AsyncAPI Operations: Inventory events ---
@doc("Inventory level updated")
@channel("inventory.updated")
@publish
op publishInventoryUpdated(): InventoryLevel;

@doc("Inventory reserved")
@channel("inventory.reserved")
@publish
op publishInventoryReserved(): InventoryReservation;

// --- AsyncAPI Operations: Customer events ---
@doc("Customer registered")
@channel("customers.registered")
@publish
op publishCustomerRegistered(): Customer;

@doc("Cart updated")
@channel("cart.updated")
@publish
op publishCartUpdated(): Cart;

@doc("Review submitted")
@channel("reviews.submitted")
@publish
op publishReviewSubmitted(): ProductReview;

// --- AsyncAPI Operations: Subscriptions ---
@doc("Subscribe to order updates for a customer")
@channel("customer.{customerId}.orders")
@subscribe
op subscribeCustomerOrders(customerId: string): Order;

@doc("Subscribe to product updates")
@channel("product.{sku}.updates")
@subscribe
op subscribeProductUpdates(sku: string): Product;
