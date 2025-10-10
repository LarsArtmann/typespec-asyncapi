import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

/**
 * Real-World Kafka Events Example
 *
 * This example demonstrates a typical e-commerce platform event system
 * using Kafka as the message broker with proper AsyncAPI 3.0 specification.
 */

namespace ECommerce;

/**
 * User registration event with complete user information
 */
model UserRegistered {
  userId: string;
  email: string;
  username: string;
  timestamp: utcDateTime;
  metadata: UserMetadata;
}

/**
 * Additional user metadata for enrichment
 */
model UserMetadata {
  source: string;
  campaign?: string;
  userAgent?: string;
}

/**
 * Order created event with order details
 */
model OrderCreated {
  orderId: string;
  userId: string;
  totalAmount: decimal;
  items: OrderItem[];
  timestamp: utcDateTime;
}

/**
 * Individual order item
 */
model OrderItem {
  productId: string;
  quantity: int32;
  price: decimal;
}

/**
 * Payment processed event
 */
model PaymentProcessed {
  paymentId: string;
  orderId: string;
  userId: string;
  amount: decimal;
  status: "succeeded" | "failed" | "pending";
  timestamp: utcDateTime;
}

/**
 * Publish user registration events to user registration topic
 */
@channel("user.registered")
@publish
op publishUserRegistered(): UserRegistered;

/**
 * Publish order created events to order management topic
 */
@channel("order.created")
@publish
op publishOrderCreated(): OrderCreated;

/**
 * Publish payment processed events to payment topic
 */
@channel("payment.processed")
@publish
op publishPaymentProcessed(): PaymentProcessed;

/**
 * Subscribe to user updates from profile service
 */
@channel("user.updated")
@subscribe
op onUserUpdated(): UserUpdated;

/**
 * User updated event received from profile service
 */
model UserUpdated {
  userId: string;
  changes: UserChanges;
  timestamp: utcDateTime;
}

/**
 * Track what fields changed in user profile
 */
model UserChanges {
  email?: string;
  username?: string;
  preferences?: UserPreferences;
}

/**
 * User preferences
 */
model UserPreferences {
  notifications: NotificationSettings;
  marketing: MarketingSettings;
}

model NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
}

model MarketingSettings {
  newsletter: boolean;
  promotions: boolean;
  thirdParty: boolean;
}