import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

namespace AdvancedDecorators;

@message(#{
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

model UserPreferences {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  theme: "light" | "dark" | "auto";
}

model NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  marketing: boolean;
}

model PrivacySettings {
  profileVisible: boolean;
  showEmail: boolean;
  allowDataCollection: boolean;
}

model UserRegistration {
  userId: string;
  email: string;
  username: string;
  timestamp: utcDateTime;
  metadata: RegistrationMetadata;
}

model RegistrationMetadata {
  source: string;
  campaign?: string;
  userAgent?: string;
  ipAddress: string;
}

@protocol(#{
  protocol: "kafka",
  binding: #{
    topic: "user.registrations",
    partitions: 6,
    replicas: 3,
    bindingVersion: "0.5.0"
  }
})
@channel("user.registered")
@publish
op publishUserRegistered(): UserRegistration;

model UserAuthentication {
  userId: string;
  sessionId: string;
  token: string;
  expiresAt: utcDateTime;
  timestamp: utcDateTime;
}

@security(#{
  name: "oauth2",
  scheme: #{
    type: "oauth2",
    flows: #{
      authorizationCode: #{
        authorizationUrl: "https://auth.example.com/oauth/authorize",
        tokenUrl: "https://auth.example.com/oauth/token",
        availableScopes: #{profile: "Access profile data", email: "Access email data"}
      }
    }
  }
})
@protocol(#{
  protocol: "ws",
  binding: #{
    method: "GET",
    query: #{
      type: "object",
      properties: #{
        auth: #{type: "string"}
      }
    },
    headers: #{
      type: "object",
      properties: #{
        secWebSocketProtocol: #{type: "string"}
      }
    },
    bindingVersion: "0.1.0"
  }
})
@channel("user.authenticated")
@publish
op publishUserAuthenticated(): UserAuthentication;

@correlationId("$message.header#/correlationId")
model UserUpdateEvent {
  userId: string;
  updateType: "profile" | "preferences" | "privacy";
  changes: UserChanges;
  timestamp: utcDateTime;
}

@channel("user.updates.{userId}")
@subscribe
op onUserUpdated(userId: string): UserUpdateEvent;

model UserChanges {
  previousValues: Record<string>;
  newValues: Record<string>;
  updatedBy: string;
}

model UserNotification {
  userId: string;
  notificationId: string;
  type: "email" | "sms" | "push" | "in-app";
  title: string;
  content: string;
  data?: Record<string>;
  timestamp: utcDateTime;
}

@tags(#["user", "notification", "email"])
@channel("user.notifications.{userId}")
@publish
op publishUserNotification(userId: string): UserNotification;

@message(#{
  name: "OrderEvent",
  title: "Order Processing Event",
  contentType: "application/json",
  description: "Order status and processing events for e-commerce platform"
})
model OrderEvent {
  orderId: string;
  userId: string;
  eventType: "created" | "updated" | "paid" | "shipped" | "delivered" | "cancelled";
  orderData: OrderData;
  timestamp: utcDateTime;
}

@protocol(#{
  protocol: "http",
  binding: #{
    method: "POST",
    bindingVersion: "0.3.0"
  }
})
@tags(#["order", "e-commerce", "payment"])
@channel("order.events")
@publish
op publishOrderEvent(): OrderEvent;

model OrderData {
  totalAmount: float64;
  currency: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
}

model OrderItem {
  productId: string;
  quantity: int32;
  price: float64;
  name: string;
}

model Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
