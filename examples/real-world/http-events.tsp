import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

/**
 * Real-World HTTP Events Example
 *
 * This example demonstrates a microservices architecture using HTTP webhooks
 * for inter-service communication and event-driven notifications.
 */

namespace Microservices;

/**
 * User account created event with complete profile information
 */
model UserAccountCreated {
  userId: string;
  email: string;
  username: string;
  profile: UserProfile;
  timestamp: utcDateTime;
}

/**
 * User profile details
 */
model UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
  timezone: string;
  locale: string;
}

/**
 * Order status updated event
 */
model OrderStatusUpdated {
  orderId: string;
  userId: string;
  oldStatus: string;
  newStatus: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  updatedBy: string;
  timestamp: utcDateTime;
}

/**
 * Payment webhook event from payment processor
 */
model PaymentWebhook {
  paymentId: string;
  orderId: string;
  amount: decimal;
  currency: string;
  status: "succeeded" | "failed" | "refunded" | "partially_refunded";
  gateway: "stripe" | "paypal" | "square" | "adyen";
  gatewayTransactionId: string;
  metadata?: PaymentMetadata;
  timestamp: utcDateTime;
}

/**
 * Additional payment metadata from gateway
 */
model PaymentMetadata {
  paymentMethod: string;
  last4?: string;
  brand?: string;
  bank?: string;
}

/**
 * Inventory update event
 */
model InventoryUpdated {
  productId: string;
  warehouseId: string;
  previousQuantity: int32;
  newQuantity: int32;
  operation: "added" | "removed" | "adjusted" | "reserved" | "released";
  reason: string;
  timestamp: utcDateTime;
}

/**
 * Shipping notification event
 */
model ShippingNotification {
  shipmentId: string;
  orderId: string;
  userId: string;
  carrier: "fedex" | "ups" | "dhl" | "usps" | "amazon";
  trackingNumber: string;
  status: "label_created" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered";
  estimatedDelivery: utcDateTime;
  timestamp: utcDateTime;
}

/**
 * System health check event
 */
model HealthCheck {
  service: string;
  status: "healthy" | "degraded" | "unhealthy";
  responseTime: int32;
  errorRate?: float32;
  timestamp: utcDateTime;
  details?: Record<string>;
}

/**
 * Publish user account creation events to notification service
 */
@channel("webhook.user.account.created")
@publish
op publishUserAccountCreated(): UserAccountCreated;

/**
 * Publish order status updates to notification service
 */
@channel("webhook.order.status.updated")
@publish
op publishOrderStatusUpdated(): OrderStatusUpdated;

/**
 * Publish payment webhook events for financial reconciliation
 */
@channel("webhook.payment.received")
@publish
op publishPaymentWebhook(): PaymentWebhook;

/**
 * Publish inventory updates to supply chain service
 */
@channel("webhook.inventory.updated")
@publish
op publishInventoryUpdated(): InventoryUpdated;

/**
 * Publish shipping notifications to customers
 */
@channel("webhook.shipping.notification")
@publish
op publishShippingNotification(): ShippingNotification;

/**
 * Publish health check events to monitoring service
 */
@channel("webhook.system.health")
@publish
op publishHealthCheck(): HealthCheck;

/**
 * Subscribe to user updates from authentication service
 */
@channel("webhook.user.profile.updated")
@subscribe
op onUserProfileUpdated(): UserProfileUpdated;

/**
 * User profile updated event from authentication service
 */
model UserProfileUpdated {
  userId: string;
  changes: ProfileChanges;
  updatedBy: string;
  timestamp: utcDateTime;
}

/**
 * Track what profile fields were updated
 */
model ProfileChanges {
  email?: string;
  username?: string;
  profile?: UserProfile;
  preferences?: UserPreferences;
}

/**
 * User notification preferences
 */
model UserPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  marketing: boolean;
}

/**
 * Subscribe to product updates from catalog service
 */
@channel("webhook.product.updated")
@subscribe
op onProductUpdated(): ProductUpdated;

/**
 * Product updated event from catalog service
 */
model ProductUpdated {
  productId: string;
  changes: ProductChanges;
  updatedBy: string;
  timestamp: utcDateTime;
}

/**
 * Track what product fields were updated
 */
model ProductChanges {
  name?: string;
  description?: string;
  price?: decimal;
  category?: string;
  tags?: string[];
  status?: "active" | "inactive" | "discontinued";
}