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
 * Base user registration data
 */
model UserRegistration {
  userId: string;
  email: string;
  username: string;
  timestamp: utcDateTime;
}

/**
 * User registration event with complete user information and metadata
 */
@message(#{
  name: "UserRegistered",
  title: "User Registration Event",
  contentType: "application/json",
  description: "Emitted when a new user registers for the service"
})
model UserRegistered {
  userId: string;
  email: string;
  username: string;
  timestamp: utcDateTime;
  metadata: UserMetadata;
  registeredAt: utcDateTime;
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
@message(#{
  name: "OrderCreated",
  title: "Order Created Event",
  contentType: "application/json",
  description: "Emitted when a new order is created in the e-commerce system"
})
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
@protocol(#{
  protocol: "kafka",
  binding: #{
    topic: "user.registrations",
    key: "userId",
    partitions: 6,
    replicas: 3,
    acks: "all",
    compression: "gzip"
  }
})
@channel("user.registered")
@publish
op publishUserRegistered(): UserRegistered;

/**
 * Publish order created events to order management topic
 */
@protocol(#{
  protocol: "kafka",
  binding: #{
    topic: "orders.created",
    key: "orderId",
    partitions: 12,
    replicas: 3,
    acks: "all",
    retentionMs: 604800000 // 7 days
  }
})
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