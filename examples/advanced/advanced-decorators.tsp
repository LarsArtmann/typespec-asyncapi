import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

/**
 * Advanced Decorators Example
 * 
 * This example demonstrates advanced TypeSpec AsyncAPI features
 * including message decorators, protocol bindings, and security schemes.
 */

namespace AdvancedDecorators;

/**
 * User profile with message metadata
 */
@message({
  name: "UserProfile",
  title: "User Profile Information",
  contentType: "application/json",
  description: "Complete user profile data including preferences and metadata"
})
model UserProfile {
  userId: string;
  email: string;
  username: string;
  preferences: UserPreferences;
  lastUpdated: utcDateTime;
}

/**
 * User preferences model
 */
model UserPreferences {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  theme: "light" | "dark" | "auto";
}

/**
 * Notification settings
 */
model NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  marketing: boolean;
}

/**
 * Privacy settings
 */
model PrivacySettings {
  profileVisible: boolean;
  showEmail: boolean;
  allowDataCollection: boolean;
}

/**
 * User registration event with protocol binding
 */
@protocol({
  protocol: "kafka",
  binding: {
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
op publishUserRegistered(): UserRegistration;

/**
 * User registration event model
 */
model UserRegistration {
  userId: string;
  email: string;
  username: string;
  timestamp: utcDateTime;
  metadata: RegistrationMetadata;
}

/**
 * Registration metadata
 */
model RegistrationMetadata {
  source: string;
  campaign?: string;
  userAgent?: string;
  ipAddress: string;
}

/**
 * Authentication event with security
 */
@security({
  name: "oauth2",
  scheme: {
    type: "oauth2",
    flows: {
      authorizationCode: {
        authorizationUrl: "https://auth.example.com/oauth/authorize",
        tokenUrl: "https://auth.example.com/oauth/token",
        scopes: ["profile", "email"]
      }
    }
  }
})
@protocol({
  protocol: "websocket",
  binding: {
    method: "POST",
    query: {
      type: "auth"
    },
    headers: {
      "Sec-WebSocket-Protocol": "auth-v2"
    }
  }
})
@channel("user.authenticated")
@publish
op publishUserAuthenticated(): UserAuthentication;

/**
 * User authentication event model
 */
model UserAuthentication {
  userId: string;
  sessionId: string;
  token: string;
  expiresAt: utcDateTime;
  timestamp: utcDateTime;
}

/**
 * Subscribe to user updates with message correlation
 */
@correlationId({
  location: "$message.header#/correlationId",
  description: "Correlation ID for tracking user update events across services"
})
@channel("user.updates.{userId}")
@subscribe
op onUserUpdated(userId: string): UserUpdateEvent;

/**
 * User update event model
 */
model UserUpdateEvent {
  userId: string;
  updateType: "profile" | "preferences" | "privacy";
  changes: UserChanges;
  timestamp: utcDateTime;
}

/**
 * User changes tracking
 */
model UserChanges {
  previousValues: Record<string>;
  newValues: Record<string>;
  updatedBy: string;
}

/**
 * User notification with tags
 */
@tags(["user", "notification", "email"])
@channel("user.notifications.{userId}")
@publish
op publishUserNotification(userId: string): UserNotification;

/**
 * User notification model
 */
model UserNotification {
  userId: string;
  notificationId: string;
  type: "email" | "sms" | "push" | "in-app";
  title: string;
  content: string;
  data?: Record<string>;
  timestamp: utcDateTime;
}

/**
 * Order event with complex message structure
 */
@message({
  name: "OrderEvent",
  title: "Order Processing Event",
  contentType: "application/json",
  description: "Order status and processing events for e-commerce platform"
})
@protocol({
  protocol: "http",
  binding: {
    method: "POST",
    path: "/webhooks/orders",
    headers: {
      "X-Event-Source": "order-service"
    }
  }
})
@tags(["order", "e-commerce", "payment"])
@channel("order.events")
@publish
op publishOrderEvent(): OrderEvent;

/**
 * Order event model
 */
model OrderEvent {
  orderId: string;
  userId: string;
  eventType: "created" | "updated" | "paid" | "shipped" | "delivered" | "cancelled";
  orderData: OrderData;
  timestamp: utcDateTime;
}

/**
 * Order data structure
 */
model OrderData {
  totalAmount: float64;
  currency: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
}

/**
 * Order item details
 */
model OrderItem {
  productId: string;
  quantity: int32;
  price: float64;
  name: string;
}

/**
 * Address information
 */
model Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}