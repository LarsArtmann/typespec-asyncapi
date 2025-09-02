/**
 * Comprehensive TypeSpec AsyncAPI Example
 * 
 * This example demonstrates all 5 supported protocols:
 * - Kafka: Event streaming and message queues
 * - WebSocket: Real-time bidirectional communication  
 * - MQTT: IoT and lightweight messaging
 * - AMQP: Enterprise message queuing
 * - HTTP: REST-like asynchronous operations
 *
 * Each protocol showcases its unique features and binding configurations.
 */

import "@larsartmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

/**
 * =============================================================================
 * COMMON MESSAGE MODELS
 * =============================================================================
 */

/** Base event model with common metadata */
@message("Base event with tracking metadata")
model BaseEvent {
  /** Unique event identifier */
  eventId: string;
  
  /** Event timestamp in ISO 8601 format */
  timestamp: utcDateTime;
  
  /** Event source system or service */
  source: string;
  
  /** Event version for compatibility */
  version: string;
  
  /** Event correlation ID for tracing */
  @correlationId
  correlationId?: string;
}

/** User-related event payload */
model UserPayload {
  /** User unique identifier */
  userId: string;
  
  /** User email address */
  email: string;
  
  /** User full name */
  name: string;
  
  /** User creation timestamp */
  createdAt: utcDateTime;
  
  /** User status */
  status: "active" | "inactive" | "suspended";
}

/** Order-related event payload */
model OrderPayload {
  /** Order unique identifier */
  orderId: string;
  
  /** Customer user ID */
  customerId: string;
  
  /** Order total amount */
  totalAmount: decimal;
  
  /** Order currency code */
  currency: string;
  
  /** Order status */
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  
  /** Order items */
  items: OrderItem[];
}

/** Order item details */
model OrderItem {
  /** Product identifier */
  productId: string;
  
  /** Product name */
  productName: string;
  
  /** Item quantity */
  quantity: int32;
  
  /** Unit price */
  unitPrice: decimal;
}

/** IoT sensor data */
model SensorData {
  /** Sensor unique identifier */
  sensorId: string;
  
  /** Sensor location */
  location: string;
  
  /** Temperature reading in Celsius */
  temperature: float64;
  
  /** Humidity reading as percentage */
  humidity: float64;
  
  /** Pressure reading in hPa */
  pressure: float64;
  
  /** Battery level percentage */
  batteryLevel: float64;
  
  /** Data quality indicator */
  quality: "excellent" | "good" | "fair" | "poor";
}

/** Notification message */
model NotificationPayload {
  /** Recipient user ID */
  userId: string;
  
  /** Notification type */
  type: "email" | "sms" | "push" | "in_app";
  
  /** Notification title */
  title: string;
  
  /** Notification body content */
  body: string;
  
  /** Notification priority */
  priority: "low" | "normal" | "high" | "urgent";
  
  /** Additional notification data */
  data?: Record<unknown>;
}

/**
 * =============================================================================
 * KAFKA PROTOCOL - Event Streaming Platform
 * =============================================================================
 */

@server("kafka-production", {
  url: "kafka://kafka.production.com:9092",
  protocol: "kafka",
  description: "Production Kafka cluster for high-throughput event streaming",
  variables: {
    cluster: {
      description: "Kafka cluster environment",
      default: "production",
      enum: ["development", "staging", "production"]
    }
  }
})
@server("kafka-development", {
  url: "kafka://localhost:9092", 
  protocol: "kafka",
  description: "Development Kafka cluster"
})
namespace KafkaExamples;

/** User lifecycle events */
@message("User created event")
model UserCreatedEvent extends BaseEvent {
  /** Event type identifier */
  eventType: "user.created";
  
  /** User data payload */
  payload: UserPayload;
}

@message("User updated event")
model UserUpdatedEvent extends BaseEvent {
  eventType: "user.updated";
  payload: UserPayload & {
    /** Fields that were updated */
    updatedFields: string[];
  };
}

/** Order lifecycle events */
@message("Order placed event")
model OrderPlacedEvent extends BaseEvent {
  eventType: "order.placed";
  payload: OrderPayload;
}

@message("Order status changed event") 
model OrderStatusChangedEvent extends BaseEvent {
  eventType: "order.status.changed";
  payload: OrderPayload & {
    /** Previous order status */
    previousStatus: string;
  };
}

// Kafka Operations - Event Publishing
@channel("users.events")
@protocol("kafka", {
  topic: "users.events",
  partitions: 12,
  replicas: 3,
  retentionMs: 604800000, // 7 days
  cleanupPolicy: "delete"
})
@publish
op publishUserCreated(): UserCreatedEvent;

@channel("users.events") 
@protocol("kafka", {
  topic: "users.events"
})
@publish
op publishUserUpdated(): UserUpdatedEvent;

@channel("orders.events")
@protocol("kafka", {
  topic: "orders.events", 
  partitions: 24,
  replicas: 3,
  retentionMs: 2592000000, // 30 days
  cleanupPolicy: "delete",
  compression: "snappy"
})
@publish
op publishOrderPlaced(): OrderPlacedEvent;

@channel("orders.events")
@protocol("kafka", {
  topic: "orders.events"
})
@publish
op publishOrderStatusChanged(): OrderStatusChangedEvent;

// Kafka Operations - Event Consumption
@channel("users.events")
@protocol("kafka", {
  topic: "users.events",
  consumerGroup: "user-service-consumers",
  autoOffsetReset: "earliest"
})
@subscribe
op consumeUserEvents(): UserCreatedEvent | UserUpdatedEvent;

@channel("orders.events")
@protocol("kafka", {
  topic: "orders.events",
  consumerGroup: "order-processing-consumers", 
  autoOffsetReset: "latest",
  maxPollRecords: 500
})
@subscribe
op consumeOrderEvents(): OrderPlacedEvent | OrderStatusChangedEvent;

/**
 * =============================================================================
 * WEBSOCKET PROTOCOL - Real-time Bidirectional Communication
 * =============================================================================
 */

@server("websocket-production", {
  url: "wss://api.production.com/ws",
  protocol: "websocket",
  description: "Production WebSocket server for real-time communication"
})
@server("websocket-development", {
  url: "ws://localhost:8080/ws",
  protocol: "websocket", 
  description: "Development WebSocket server"
})
namespace WebSocketExamples;

/** Real-time chat message */
@message("Chat message")
model ChatMessage {
  /** Message unique identifier */
  messageId: string;
  
  /** Room or channel ID */
  roomId: string;
  
  /** Sender user ID */
  senderId: string;
  
  /** Sender display name */
  senderName: string;
  
  /** Message content */
  content: string;
  
  /** Message type */
  messageType: "text" | "image" | "file" | "system";
  
  /** Message timestamp */
  timestamp: utcDateTime;
  
  /** Message metadata */
  metadata?: Record<unknown>;
}

/** Live trading data */
@message("Trading data update")
model TradingUpdate {
  /** Trading symbol (e.g., AAPL, TSLA) */
  symbol: string;
  
  /** Current price */
  price: decimal;
  
  /** Price change from previous */
  change: decimal;
  
  /** Price change percentage */
  changePercent: decimal;
  
  /** Trading volume */
  volume: int64;
  
  /** Market timestamp */
  timestamp: utcDateTime;
  
  /** Bid price */
  bid?: decimal;
  
  /** Ask price */
  ask?: decimal;
}

/** System notification */
@message("System notification")
model SystemNotification {
  /** Notification type */
  type: "info" | "warning" | "error" | "success";
  
  /** Notification message */
  message: string;
  
  /** Additional data */
  data?: Record<unknown>;
  
  /** Notification timestamp */
  timestamp: utcDateTime;
}

// WebSocket Operations - Bidirectional Communication
@channel("chat/{roomId}")
@protocol("websocket", {
  method: "GET",
  query: {
    token: "string",
    version: "string"
  },
  headers: {
    "User-Agent": "string",
    "X-Client-Version": "string"
  }
})
@publish
@subscribe
op chatInRoom(roomId: string): ChatMessage;

@channel("trading/live")
@protocol("websocket", {
  query: {
    symbols: "string", // Comma-separated list
    token: "string"
  }
})
@subscribe
op subscribeTradingUpdates(): TradingUpdate;

@channel("notifications/{userId}")
@protocol("websocket", {
  headers: {
    "Authorization": "Bearer {token}"
  }
})
@subscribe
op subscribeNotifications(userId: string): SystemNotification;

@channel("heartbeat")
@protocol("websocket", {})
@publish
@subscribe
op heartbeat(): { timestamp: utcDateTime; clientId: string };

/**
 * =============================================================================
 * MQTT PROTOCOL - IoT and Lightweight Messaging
 * =============================================================================
 */

@server("mqtt-production", {
  url: "mqtt://mqtt.iot.com:1883",
  protocol: "mqtt",
  description: "Production MQTT broker for IoT devices"
})
@server("mqtt-secure", {
  url: "mqtts://secure-mqtt.iot.com:8883",
  protocol: "mqtt",
  description: "Secure MQTT broker with TLS"
})
namespace MqttExamples;

/** IoT sensor reading */
@message("Sensor reading")
model SensorReading extends SensorData {
  /** Reading timestamp */
  readingTime: utcDateTime;
}

/** Device status report */
@message("Device status")
model DeviceStatus {
  /** Device unique identifier */
  deviceId: string;
  
  /** Device type */
  deviceType: "sensor" | "actuator" | "gateway" | "controller";
  
  /** Device online status */
  online: boolean;
  
  /** Last seen timestamp */
  lastSeen: utcDateTime;
  
  /** Device battery level */
  batteryLevel?: float64;
  
  /** Device firmware version */
  firmwareVersion: string;
  
  /** Device location */
  location?: {
    latitude: float64;
    longitude: float64;
    altitude?: float64;
  };
}

/** Device command */
@message("Device command")
model DeviceCommand {
  /** Command unique identifier */
  commandId: string;
  
  /** Target device ID */
  deviceId: string;
  
  /** Command type */
  command: "restart" | "update" | "configure" | "calibrate" | "sleep";
  
  /** Command parameters */
  parameters?: Record<unknown>;
  
  /** Command timeout in seconds */
  timeout?: int32;
  
  /** Command priority */
  priority: "low" | "normal" | "high" | "urgent";
}

// MQTT Operations - IoT Data Collection
@channel("sensors/temperature/{sensorId}")
@protocol("mqtt", {
  qos: 1,
  retain: true,
  messageExpiry: 300 // 5 minutes
})
@publish
op publishTemperatureReading(sensorId: string): SensorReading;

@channel("sensors/+/status")
@protocol("mqtt", {
  qos: 2,
  retain: true
})
@subscribe
op subscribeAllSensorStatus(): DeviceStatus;

@channel("devices/{deviceId}/command")
@protocol("mqtt", {
  qos: 1,
  retain: false
})
@publish
op sendDeviceCommand(deviceId: string): DeviceCommand;

@channel("sensors/bulk/+")
@protocol("mqtt", {
  qos: 0,
  retain: false,
  topicAlias: 1
})
@subscribe
op subscribeBulkSensorData(): SensorReading[];

// MQTT v5.0 Features
@channel("telemetry/{region}/weather")
@protocol("mqtt", {
  qos: 1,
  retain: true,
  userProperties: {
    region: "string",
    dataType: "weather",
    format: "json"
  },
  responseInformation: "weather/response",
  correlationData: "correlation-key"
})
@publish
op publishWeatherData(region: string): SensorReading & {
  weatherType: "sunny" | "cloudy" | "rainy" | "snowy";
  windSpeed: float64;
  windDirection: int32;
};

/**
 * =============================================================================
 * AMQP PROTOCOL - Enterprise Message Queuing
 * =============================================================================
 */

@server("amqp-production", {
  url: "amqp://rabbitmq.production.com:5672/api",
  protocol: "amqp",
  description: "Production RabbitMQ cluster for enterprise messaging"
})
@server("amqp-development", {
  url: "amqp://guest:guest@localhost:5672/",
  protocol: "amqp",
  description: "Development RabbitMQ instance"
})
namespace AmqpExamples;

/** Order processing command */
@message("Order processing command")
model ProcessOrderCommand {
  /** Command unique identifier */
  commandId: string;
  
  /** Order to process */
  order: OrderPayload;
  
  /** Processing priority */
  priority: 1 | 2 | 3 | 4 | 5; // 5 = highest priority
  
  /** Command timeout */
  timeout: int32;
  
  /** Retry count */
  retryCount?: int32;
  
  /** Processing options */
  options?: {
    validateInventory: boolean;
    sendConfirmation: boolean;
    updateAnalytics: boolean;
  };
}

/** Email notification command */
@message("Email notification command")
model SendEmailCommand {
  /** Email unique identifier */
  emailId: string;
  
  /** Recipient email address */
  to: string;
  
  /** Email subject */
  subject: string;
  
  /** Email body (HTML or text) */
  body: string;
  
  /** Email type */
  template: "welcome" | "confirmation" | "notification" | "marketing";
  
  /** Template variables */
  variables?: Record<unknown>;
  
  /** Email priority */
  priority: "bulk" | "normal" | "high";
  
  /** Scheduled send time */
  scheduledTime?: utcDateTime;
}

/** Error event for dead letter handling */
@message("Processing error event")
model ProcessingErrorEvent extends BaseEvent {
  eventType: "processing.error";
  
  /** Original message that failed */
  originalMessage: unknown;
  
  /** Error details */
  error: {
    message: string;
    stack?: string;
    code?: string;
  };
  
  /** Retry attempt count */
  retryCount: int32;
  
  /** Max retry attempts */
  maxRetries: int32;
}

// AMQP Operations - Enterprise Queuing
@channel("orders.processing.queue")
@protocol("amqp", {
  exchange: "orders.exchange",
  exchangeType: "topic", 
  routingKey: "order.process",
  queue: "orders.processing.queue",
  durable: true,
  exclusive: false,
  autoDelete: false,
  arguments: {
    "x-message-ttl": 300000, // 5 minutes
    "x-max-length": 10000,
    "x-dead-letter-exchange": "orders.dlx"
  }
})
@publish
op sendOrderForProcessing(): ProcessOrderCommand;

@channel("orders.processing.queue")
@protocol("amqp", {
  exchange: "orders.exchange",
  routingKey: "order.process", 
  consumerTag: "order-processor",
  prefetchCount: 10,
  ackMode: "manual"
})
@subscribe
op processOrders(): ProcessOrderCommand;

@channel("notifications.email.queue")
@protocol("amqp", {
  exchange: "notifications.exchange",
  exchangeType: "direct",
  routingKey: "email.send",
  queue: "notifications.email.queue",
  durable: true,
  priority: 5,
  arguments: {
    "x-max-priority": 5,
    "x-message-ttl": 3600000 // 1 hour
  }
})
@publish
op sendEmailNotification(): SendEmailCommand;

@channel("notifications.email.queue") 
@protocol("amqp", {
  exchange: "notifications.exchange",
  routingKey: "email.send",
  prefetchCount: 50,
  ackMode: "auto"
})
@subscribe
op processEmailNotifications(): SendEmailCommand;

// Dead Letter Queue handling
@channel("errors.dlq")
@protocol("amqp", {
  exchange: "errors.dlx",
  exchangeType: "fanout",
  queue: "errors.dlq",
  durable: true,
  arguments: {
    "x-message-ttl": 604800000 // 7 days
  }
})
@subscribe
op handleDeadLetters(): ProcessingErrorEvent;

/**
 * =============================================================================
 * HTTP PROTOCOL - Asynchronous REST Operations
 * =============================================================================
 */

@server("http-production", {
  url: "https://api.production.com/v1",
  protocol: "http",
  description: "Production HTTP API for asynchronous operations"
})
@server("http-development", {
  url: "http://localhost:3000/v1",
  protocol: "http",
  description: "Development HTTP API"
})
namespace HttpExamples;

/** Webhook payload */
@message("Webhook payload")
model WebhookPayload {
  /** Webhook unique identifier */
  webhookId: string;
  
  /** Event that triggered the webhook */
  event: string;
  
  /** Event data */
  data: unknown;
  
  /** Webhook timestamp */
  timestamp: utcDateTime;
  
  /** Webhook signature for verification */
  signature?: string;
  
  /** Webhook version */
  version: string;
}

/** Callback response */
@message("Callback response")
model CallbackResponse {
  /** Operation unique identifier */
  operationId: string;
  
  /** Operation status */
  status: "pending" | "in_progress" | "completed" | "failed";
  
  /** Operation result */
  result?: unknown;
  
  /** Error information if failed */
  error?: {
    code: string;
    message: string;
  };
  
  /** Operation metadata */
  metadata?: Record<unknown>;
}

/** Long-running operation status */
@message("Operation status")
model OperationStatus {
  /** Operation unique identifier */
  operationId: string;
  
  /** Operation type */
  operationType: string;
  
  /** Current status */
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  
  /** Progress percentage (0-100) */
  progress: int32;
  
  /** Status message */
  message?: string;
  
  /** Operation start time */
  startedAt: utcDateTime;
  
  /** Operation completion time */
  completedAt?: utcDateTime;
  
  /** Estimated completion time */
  estimatedCompletion?: utcDateTime;
}

// HTTP Operations - Webhooks and Callbacks
@channel("/webhooks/orders")
@protocol("http", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Webhook-Signature": "string"
  },
  statusCodes: [200, 400, 401, 500]
})
@subscribe
op receiveOrderWebhook(): WebhookPayload;

@channel("/callbacks/payment")
@protocol("http", {
  method: "POST", 
  headers: {
    "Authorization": "Bearer {token}",
    "Content-Type": "application/json"
  }
})
@subscribe
op receivePaymentCallback(): CallbackResponse;

@channel("/operations/{operationId}/status")
@protocol("http", {
  method: "GET",
  headers: {
    "Accept": "application/json"
  },
  pathParameters: {
    operationId: "string"
  }
})
@publish
op getOperationStatus(operationId: string): OperationStatus;

// Server-Sent Events
@channel("/events/live")
@protocol("http", {
  method: "GET",
  headers: {
    "Accept": "text/event-stream",
    "Cache-Control": "no-cache"
  }
})
@subscribe
op subscribeLiveEvents(): {
  id: string;
  event: string;
  data: unknown;
  timestamp: utcDateTime;
};

/**
 * =============================================================================
 * SECURITY CONFIGURATIONS
 * =============================================================================
 */

@security("oauth2", {
  type: "oauth2",
  flows: {
    clientCredentials: {
      tokenUrl: "https://auth.production.com/oauth/token",
      scopes: {
        "read:events": "Read event data",
        "write:events": "Publish events", 
        "admin:system": "System administration"
      }
    },
    authorizationCode: {
      authorizationUrl: "https://auth.production.com/oauth/authorize",
      tokenUrl: "https://auth.production.com/oauth/token",
      scopes: {
        "read:events": "Read event data",
        "write:events": "Publish events"
      }
    }
  }
})

@security("apiKey", {
  type: "apiKey",
  in: "header",
  name: "X-API-Key"
})

@security("httpBearer", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT"
})

/**
 * =============================================================================
 * GLOBAL TAGS FOR CATEGORIZATION
 * =============================================================================
 */

@tags(["kafka", "event-streaming", "high-throughput"])
namespace KafkaExamples {}

@tags(["websocket", "real-time", "bidirectional"])
namespace WebSocketExamples {}

@tags(["mqtt", "iot", "lightweight", "publish-subscribe"])
namespace MqttExamples {}

@tags(["amqp", "enterprise", "message-queuing", "reliable"])
namespace AmqpExamples {}

@tags(["http", "webhooks", "callbacks", "rest-async"])
namespace HttpExamples {}