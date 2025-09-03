// Example: Comprehensive User Events AsyncAPI specification
// This demonstrates ALL decorators working together in a real-world scenario

import "@lars-artmann/typespec-asyncapi";

using AsyncAPI;

@asyncapi({
  info: {
    title: "User Events API - Complete Example",
    version: "2.0.0",
    description: "Comprehensive event-driven API demonstrating all AsyncAPI decorators",
    contact: {
      name: "API Support Team",
      email: "support@example.com"
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT"
    }
  },
  servers: {
    production: {
      host: "events.example.com",
      protocol: "kafka",
      description: "Production Kafka cluster with SASL authentication"
    },
    staging: {
      host: "events-staging.example.com", 
      protocol: "kafka",
      description: "Staging environment for testing"
    },
    websocketDev: {
      host: "ws://localhost:8080",
      protocol: "websocket",
      description: "Development WebSocket server for real-time events"
    }
  }
})
namespace UserEvents;

// === USER CREATED EVENT (Kafka with Security and Protocol Bindings) ===

model UserCreatedPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: utcDateTime;
  accountType: "free" | "premium" | "enterprise";
  metadata?: {
    source: string;
    campaign?: string;
    traceId?: string;
  };
}

@channel("user.lifecycle.created")
model UserCreatedChannel {
  @message({
    name: "UserCreatedEvent",
    title: "User Account Created",
    description: "Triggered when a new user account is successfully created",
    contentType: "application/json",
    examples: [{
      name: "Free Account Creation",
      summary: "New free tier user registration",
      payload: {
        userId: "user-12345",
        email: "john.doe@example.com",
        firstName: "John",
        lastName: "Doe",
        createdAt: "2024-01-15T10:30:00Z",
        accountType: "free",
        metadata: {
          source: "website",
          campaign: "spring-promotion-2024"
        }
      }
    }]
  })
  payload: UserCreatedPayload;
}

// Kafka protocol binding with authentication (AsyncAPI Kafka Binding v0.5.0)
@protocol({
  protocol: "kafka",
  binding: {
    topic: "user-lifecycle-events",
    key: "userId",
    groupId: "user-service-consumers",
    clientId: "user-event-publisher",
    schemaIdLocation: "header",
    schemaLookupStrategy: "TopicRecordNameStrategy",
    bindingVersion: "0.5.0"
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
op publishUserCreated(): UserCreatedChannel;

// Consumer operation for user creation events (AsyncAPI Kafka Binding v0.5.0)
@protocol({
  protocol: "kafka",
  binding: {
    topic: "user-lifecycle-events",
    groupId: "notification-service",
    clientId: "notification-consumer",
    bindingVersion: "0.5.0"
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
op subscribeToUserCreated(): UserCreatedChannel;

// === REAL-TIME NOTIFICATIONS (WebSocket with HTTP Bearer Auth) ===

model NotificationPayload {
  userId: string;
  type: "user_created" | "user_updated" | "user_deleted" | "welcome_email";
  title: string;
  message: string;
  timestamp: utcDateTime;
  priority: "low" | "medium" | "high" | "critical";
  actionUrl?: string;
}

@channel("notifications.{userId}.live")
model LiveNotificationChannel {
  @message({
    name: "LiveNotification",
    title: "Real-time User Notification",
    description: "Live notifications pushed to connected users via WebSocket",
    contentType: "application/json"
  })
  payload: NotificationPayload;
}

// WebSocket real-time notifications with JWT authentication (AsyncAPI WebSocket Binding v0.1.0)
@protocol({
  protocol: "websocket",
  binding: {
    method: "GET",
    query: {
      type: "object",
      properties: {
        token: { type: "string" }
      },
      required: ["token"]
    },
    headers: {
      type: "object",
      properties: {
        "X-Client-Version": { type: "string" },
        "X-Device-Type": { type: "string" }
      }
    },
    bindingVersion: "0.1.0"
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
op subscribeLiveNotifications(): LiveNotificationChannel;

// === HTTP API EVENTS (REST-like events with API Key) ===

model UserPreferencesPayload {
  userId: string;
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    theme: "light" | "dark" | "auto";
    language: string;
    timezone: string;
  };
  updatedAt: utcDateTime;
}

@channel("user.preferences.changed")
model PreferencesChannel {
  @message({
    name: "UserPreferencesChanged",
    title: "User Preferences Updated", 
    description: "Event fired when user updates their account preferences"
  })
  payload: UserPreferencesPayload;
}

// HTTP webhook delivery with API key authentication (AsyncAPI HTTP Binding v0.3.0)
@protocol({
  protocol: "http",
  binding: {
    type: "request",
    method: "POST",
    headers: {
      type: "object",
      properties: {
        "Content-Type": { type: "string", enum: ["application/json"] },
        "X-Event-Type": { type: "string", enum: ["user.preferences.changed"] }
      }
    },
    statusCode: 200,
    bindingVersion: "0.3.0"
  }
})
@security({
  name: "apiKeyAuth",
  scheme: {
    type: "apiKey",
    in: "header"
  }
})
@publish
op publishPreferencesChanged(): PreferencesChannel;

// === MQTT SENSOR DATA (IoT Device Events) ===

model DeviceStatusPayload {
  deviceId: string;
  userId: string;
  status: "online" | "offline" | "maintenance" | "error";
  batteryLevel?: int32;
  signalStrength?: int32;
  location?: {
    latitude: float64;
    longitude: float64;
  };
  lastSeen: utcDateTime;
}

@channel("devices.{deviceId}.status")
model DeviceStatusChannel {
  @message({
    name: "DeviceStatus",
    title: "IoT Device Status Update",
    description: "Status updates from IoT devices associated with user accounts"
  })
  payload: DeviceStatusPayload;
}

// MQTT protocol for IoT devices (AsyncAPI MQTT Binding v0.2.0)
@protocol({
  protocol: "mqtt",
  binding: {
    qos: 1,
    retain: true,
    messageExpiryInterval: 60,
    bindingVersion: "0.2.0"
  }
})
@publish
op publishDeviceStatus(): DeviceStatusChannel;

@subscribe
op subscribeDeviceStatus(): DeviceStatusChannel;

// === OAUTH2 PROTECTED ANALYTICS EVENTS ===

model UserAnalyticsPayload {
  userId: string;
  sessionId: string;
  eventType: "page_view" | "button_click" | "feature_usage" | "conversion";
  eventData: Record<unknown>;
  timestamp: utcDateTime;
  userAgent?: string;
  ipAddress?: string;
}

@channel("analytics.user.events")
model AnalyticsChannel {
  @message({
    name: "UserAnalyticsEvent",
    title: "User Analytics Event",
    description: "Analytics events for user behavior tracking and insights"
  })
  payload: UserAnalyticsPayload;
}

// OAuth2 client credentials for analytics service
@security({
  name: "oauth2Analytics",
  scheme: {
    type: "oauth2",
    flows: {
      clientCredentials: {
        tokenUrl: "https://auth.example.com/oauth/token",
        scopes: {
          "analytics:read": "Read analytics events",
          "analytics:write": "Write analytics events"
        }
      }
    }
  }
})
@publish
op publishAnalyticsEvent(): AnalyticsChannel;

@security({
  name: "oauth2Analytics",
  scheme: {
    type: "oauth2",
    flows: {
      clientCredentials: {
        tokenUrl: "https://auth.example.com/oauth/token",
        scopes: {
          "analytics:read": "Read analytics events"
        }
      }
    }
  }
})
@subscribe
op subscribeAnalyticsEvents(): AnalyticsChannel;

// === ADDITIONAL EXAMPLES ===
// Note: Redis bindings are not part of official AsyncAPI bindings specification
// but can be implemented as custom bindings following AsyncAPI extension patterns