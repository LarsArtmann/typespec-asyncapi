/**
 * COMPLETE EXAMPLE: Production-Ready AsyncAPI 3.0 with TypeSpec
 * 
 * 🚀 QUICK START GUIDE:
 * 1. Copy this entire file to your project
 * 2. Modify the namespace name: `namespace YourCompanyAPI;`
 * 3. Update the domain models for your business entities
 * 4. Customize channel names and protocols for your architecture
 * 5. Compile: `npx tsp compile your-file.tsp --emit @larsartmann/typespec-asyncapi`
 * 
 * This example demonstrates WORKING decorators and real-world patterns:
 * ✅ @channel - Message routing with dynamic parameters  
 * ✅ @publish/@subscribe - Operation direction control
 * ✅ @message - Rich message metadata and examples
 * ✅ @protocol - Protocol-specific configurations
 * ✅ @security - Authentication schemes (OAuth2, API keys, SASL)
 * ✅ @server - Environment-specific server configs
 * 
 * PROTOCOLS COVERED:
 * 🔥 Apache Kafka - High-throughput event streaming
 * ⚡ WebSocket - Real-time user interactions
 * 🌐 HTTP - Webhook integrations
 * 📡 MQTT - IoT device communication
 */

import "@larsartmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

namespace CompleteExampleAPI;

// =============================================================================
// DOMAIN MODELS - Reusable data structures
// =============================================================================

model User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: utcDateTime;
  accountType: "free" | "premium" | "enterprise";
  status: "active" | "suspended" | "deleted";
}

model Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: decimal;
  currency: "USD" | "EUR" | "GBP";
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: utcDateTime;
  updatedAt?: utcDateTime;
}

model OrderItem {
  productId: string;
  name: string;
  quantity: int32;
  price: decimal;
}

model Notification {
  id: string;
  userId: string;
  type: "email" | "push" | "sms" | "in_app";
  title: string;
  message: string;
  priority: "low" | "medium" | "high" | "critical";
  scheduledAt?: utcDateTime;
  sentAt?: utcDateTime;
}

// =============================================================================
// KAFKA STREAMING - High-throughput event processing
// =============================================================================

// User lifecycle events
model UserCreatedPayload {
  user: User;
  metadata: {
    source: "web" | "mobile" | "api" | "admin";
    ipAddress?: string;
    userAgent?: string;
    traceId: string;
  };
}

@message({
  name: "UserCreated",
  title: "User Account Created",
  description: "Published when a new user account is successfully created",
  contentType: "application/json"
})
model UserCreatedMessage extends UserCreatedPayload {}

// Kafka events for user creation
@channel("user.lifecycle.created")
@protocol({
  protocol: "kafka",
  binding: {
    topic: "user-lifecycle-events",
    key: "user.id",
    groupId: "user-service-publishers"
  }
})
@security({
  name: "kafkaAuth",
  scheme: {
    type: "sasl",
    mechanism: "SCRAM-SHA-256"
  }
})
@publish
op publishUserCreated(): UserCreatedMessage;

@channel("user.lifecycle.created")
@protocol({
  protocol: "kafka",
  binding: {
    topic: "user-lifecycle-events",
    groupId: "notification-service"
  }
})
@security({
  name: "kafkaAuth",
  scheme: {
    type: "sasl",
    mechanism: "SCRAM-SHA-256"
  }
})
@subscribe
op subscribeToUserCreated(): UserCreatedMessage;

// Order processing events
model OrderStatusChangedPayload {
  order: Order;
  previousStatus: Order.status;
  changedBy: {
    userId?: string;
    system: string;
    reason: string;
  };
  timestamp: utcDateTime;
}

@message({
  name: "OrderStatusChanged",
  title: "Order Status Updated",
  description: "Published when an order status changes in the order lifecycle"
})
model OrderStatusMessage extends OrderStatusChangedPayload {}

@channel("order.status.changed")
@protocol({
  protocol: "kafka",
  binding: {
    topic: "order-events",
    key: "order.id"
  }
})
@security({
  name: "kafkaAuth",
  scheme: {
    type: "sasl",
    mechanism: "SCRAM-SHA-256"
  }
})
@publish
op publishOrderStatusChanged(): OrderStatusMessage;

@subscribe
op subscribeOrderStatusChanged(): OrderStatusMessage;

// =============================================================================
// WEBSOCKET REAL-TIME - Live user interactions
// =============================================================================

model LiveNotificationPayload {
  notification: Notification;
  userId: string;
  timestamp: utcDateTime;
  sessionId?: string;
}

@message({
  name: "LiveNotification",
  title: "Real-time Notification",
  description: "Live notifications pushed to users via WebSocket"
})
model LiveNotificationMessage extends LiveNotificationPayload {}

@channel("notifications.{userId}.live")
@protocol({
  protocol: "websocket",
  binding: {
    method: "GET"
  }
})
@security({
  name: "bearerAuth",
  scheme: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT"
  }
})
@subscribe
op subscribeToLiveNotifications(): LiveNotificationMessage;

// Chat messages
model ChatMessagePayload {
  id: string;
  channelId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: utcDateTime;
  messageType: "text" | "image" | "file" | "system";
}

@message({
  name: "ChatMessage",
  title: "Real-time Chat Message",
  description: "Messages in real-time chat channels"
})
model ChatMessage extends ChatMessagePayload {}

@channel("chat.{channelId}.messages")
@protocol({
  protocol: "websocket",
  binding: {
    method: "GET"
  }
})
@security({
  name: "bearerAuth",
  scheme: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT"
  }
})
@publish
op sendChatMessage(): ChatMessage;

@subscribe
op receiveChatMessages(): ChatMessage;

// =============================================================================
// HTTP WEBHOOKS - External system integration
// =============================================================================

model WebhookPayload {
  event: string;
  timestamp: utcDateTime;
  data: Record<unknown>;
  signature: string;
  version: "1.0";
}

@message({
  name: "WebhookEvent",
  title: "External Webhook Event",
  description: "Events received from external systems via HTTP webhooks"
})
model WebhookMessage extends WebhookPayload {}

@channel("webhooks.external.events")
@protocol({
  protocol: "http",
  binding: {
    type: "request",
    method: "POST"
  }
})
@security({
  name: "apiKeyAuth",
  scheme: {
    type: "apiKey",
    in: "header",
    name: "X-API-Key"
  }
})
@subscribe
op receiveWebhookEvents(): WebhookMessage;

// =============================================================================
// MQTT IOT - Internet of Things device communication
// =============================================================================

model DeviceStatusPayload {
  deviceId: string;
  userId: string;
  deviceType: "sensor" | "actuator" | "gateway" | "controller";
  status: "online" | "offline" | "maintenance" | "error";
  batteryLevel?: int32;
  signalStrength?: int32;
  firmware: string;
  lastSeen: utcDateTime;
}

@message({
  name: "DeviceStatus",
  title: "IoT Device Status Update",
  description: "Status updates from IoT devices"
})
model DeviceStatusMessage extends DeviceStatusPayload {}

@channel("devices.{deviceId}.status")
@protocol({
  protocol: "mqtt",
  binding: {
    qos: 1,
    retain: true
  }
})
@publish
op publishDeviceStatus(): DeviceStatusMessage;

@subscribe
op subscribeToDeviceStatus(): DeviceStatusMessage;

// =============================================================================
// OAUTH2 ANALYTICS - High-security data processing
// =============================================================================

model AnalyticsEventPayload {
  eventId: string;
  userId?: string;
  sessionId: string;
  eventType: "page_view" | "button_click" | "form_submit" | "purchase";
  eventProperties: Record<unknown>;
  timestamp: utcDateTime;
}

@message({
  name: "AnalyticsEvent", 
  title: "User Analytics Event",
  description: "Analytics events for user behavior tracking"
})
model AnalyticsMessage extends AnalyticsEventPayload {}

@channel("analytics.events.raw")
@security({
  name: "oauth2Analytics",
  scheme: {
    type: "oauth2",
    flows: {
      clientCredentials: {
        tokenUrl: "https://auth.example.com/oauth2/token",
        scopes: {
          "analytics:write": "Write analytics events"
        }
      }
    }
  }
})
@publish
op publishAnalyticsEvent(): AnalyticsMessage;

@security({
  name: "oauth2Analytics",
  scheme: {
    type: "oauth2",
    flows: {
      clientCredentials: {
        tokenUrl: "https://auth.example.com/oauth2/token",
        scopes: {
          "analytics:read": "Read analytics events"
        }
      }
    }
  }
})
@subscribe
op subscribeToAnalyticsEvents(): AnalyticsMessage;

// =============================================================================
// SERVER CONFIGURATIONS - Environment-specific settings  
// =============================================================================

// Server configurations can be defined with @server decorator on the main namespace
// Example: @server("development", { host: "localhost:9092", protocol: "kafka" })
// Example: @server("production", { host: "api.example.com", protocol: "kafka" })
