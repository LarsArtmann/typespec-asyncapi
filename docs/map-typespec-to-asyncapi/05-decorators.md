# Decorators: TypeSpec to AsyncAPI Feature Mapping

## Overview

This document provides comprehensive mapping of TypeSpec decorators to AsyncAPI features, showing how decorators transform into specific AsyncAPI specification elements. Understanding these mappings is essential for effective TypeSpec to AsyncAPI transformation.

## AsyncAPI-Specific Decorators

### @channel - Channel Definition

```typespec
// TypeSpec: Channel decorator usage
@channel("user.events")
@publish
op publishUserEvent(@body event: UserEvent): void;

@channel("user/{userId}/notifications")
@subscribe
op handleUserNotification(@path userId: string): UserNotification;

@channel("orders.processing.{priority}")
@publish
op processOrder(@path priority: "high" | "normal" | "low", @body order: Order): void;
```

```yaml
# AsyncAPI: Channel creation
channels:
  user.events:
    address: user.events
    description: User-related events channel
    messages:
      UserEvent:
        $ref: '#/components/messages/UserEvent'

  user-notifications:
    address: user/{userId}/notifications
    description: User-specific notifications
    parameters:
      userId:
        description: Target user ID
        schema:
          type: string
          format: uuid
    messages:
      UserNotification:
        $ref: '#/components/messages/UserNotification'

  orders-processing:
    address: orders.processing.{priority}
    description: Order processing by priority
    parameters:
      priority:
        description: Processing priority level
        schema:
          type: string
          enum: [high, normal, low]
    messages:
      Order:
        $ref: '#/components/messages/Order'
```

### @publish - Send Operation

```typespec
// TypeSpec: Publish decorator
@channel("events.user")
@publish
@doc("Publishes user lifecycle events")
@summary("User Event Publisher")
op publishUserEvent(@body event: UserLifecycleEvent): void;

// With additional metadata
@channel("events.order")
@publish
@operationId("publishOrderEvent")
@tag("order-management")
@tag("high-volume")
op publishOrderEvent(@body event: OrderEvent): void;
```

```yaml
# AsyncAPI: Send operations
operations:
  publishUserEvent:
    action: send
    channel:
      $ref: '#/channels/events.user'
    title: User Event Publisher
    summary: User Event Publisher
    description: Publishes user lifecycle events
    messages:
      - $ref: '#/channels/events.user/messages/UserLifecycleEvent'

  publishOrderEvent:
    action: send
    channel:
      $ref: '#/channels/events.order'
    operationId: publishOrderEvent
    tags:
      - name: order-management
      - name: high-volume
    messages:
      - $ref: '#/channels/events.order/messages/OrderEvent'
```

### @subscribe - Receive Operation

```typespec
// TypeSpec: Subscribe decorator
@channel("events.user")
@subscribe
@doc("Handles incoming user events for processing")
@summary("User Event Handler")
op handleUserEvent(): UserLifecycleEvent;

// With error handling
@channel("events.payment")
@subscribe
@doc("Processes payment events with error handling")
op processPaymentEvent(): PaymentEvent | PaymentError;
```

```yaml
# AsyncAPI: Receive operations
operations:
  handleUserEvent:
    action: receive
    channel:
      $ref: '#/channels/events.user'
    title: User Event Handler
    summary: User Event Handler
    description: Handles incoming user events for processing
    messages:
      - $ref: '#/channels/events.user/messages/UserLifecycleEvent'

  processPaymentEvent:
    action: receive
    channel:
      $ref: '#/channels/events.payment'
    title: Payment Event Processor
    description: Processes payment events with error handling
    messages:
      - $ref: '#/channels/events.payment/messages/PaymentEvent'
      - $ref: '#/channels/events.payment/messages/PaymentError'
```

### @message - Message Configuration

```typespec
// TypeSpec: Message decorator
@message({
  name: "UserRegisteredEvent",
  title: "User Registration Event",
  summary: "Fired when a new user registers",
  contentType: "application/json",
  description: "Contains all data related to user registration including metadata",
  examples: [{
    eventId: "evt_123",
    user: { id: "usr_456", email: "user@example.com" }
  }]
})
model UserRegisteredEvent {
  eventId: string;
  timestamp: utcDateTime;
  user: UserData;
}

// Message with headers
@message({
  name: "OrderProcessingCommand",
  title: "Order Processing Command",
  contentType: "application/json",
  headers: {
    priority: { type: "string", enum: ["high", "normal", "low"] },
    traceId: { type: "string", format: "uuid" }
  },
  correlationId: {
    location: "$message.payload#/correlationId"
  }
})
model OrderProcessingCommand {
  correlationId: string;
  orderId: string;
  action: "create" | "update" | "cancel";
}
```

```yaml
# AsyncAPI: Message definitions
components:
  messages:
    UserRegisteredEvent:
      name: UserRegisteredEvent
      title: User Registration Event
      summary: Fired when a new user registers
      description: Contains all data related to user registration including metadata
      contentType: application/json
      payload:
        $ref: '#/components/schemas/UserRegisteredEvent'
      examples:
        - name: Sample user registration
          payload:
            eventId: "evt_123"
            user:
              id: "usr_456"
              email: "user@example.com"

    OrderProcessingCommand:
      name: OrderProcessingCommand
      title: Order Processing Command
      contentType: application/json
      headers:
        type: object
        properties:
          priority:
            type: string
            enum: [high, normal, low]
          traceId:
            type: string
            format: uuid
      correlationId:
        location: $message.payload#/correlationId
        description: Correlation identifier for request-reply pattern
      payload:
        $ref: '#/components/schemas/OrderProcessingCommand'
```

### @protocol - Protocol Bindings

```typespec
// TypeSpec: Protocol-specific bindings
@protocol({
  type: "kafka",
  topic: "user-events",
  partitionKey: "userId",
  headers: {
    "schema-version": "1.0",
    "content-encoding": "gzip"
  },
  acks: "all",
  retries: 3
})
@channel("user.events")
@publish
op publishUserEvent(@body event: UserEvent): void;

// AMQP protocol binding
@protocol({
  type: "amqp",
  exchange: "orders.exchange",
  routingKey: "orders.created",
  deliveryMode: 2,
  priority: 10,
  expiration: "300000",
  messageId: true
})
@channel("orders.created")
@publish
op publishOrderCreated(@body order: OrderCreatedEvent): void;

// WebSocket protocol binding
@protocol({
  type: "websocket",
  method: "POST",
  path: "/events",
  headers: {
    "Authorization": "Bearer {token}"
  },
  query: {
    "version": "v1"
  }
})
@channel("realtime.events")
@subscribe
op handleRealtimeEvent(): RealtimeEvent;
```

```yaml
# AsyncAPI: Protocol bindings
channels:
  user.events:
    address: user-events
    bindings:
      kafka:
        topic: user-events
        partitions: 3
        replicas: 2
        bindingVersion: "0.4.0"
    messages:
      UserEvent:
        bindings:
          kafka:
            key:
              type: string
              description: User ID for partitioning
            schemaIdLocation: header
            schemaIdPayloadEncoding: confluent
            bindingVersion: "0.4.0"

operations:
  publishUserEvent:
    action: send
    channel:
      $ref: '#/channels/user.events'
    bindings:
      kafka:
        groupId: user-event-publishers
        clientId: user-service
        acks: all
        retries: 3
        bindingVersion: "0.4.0"

  publishOrderCreated:
    action: send
    channel:
      $ref: '#/channels/orders.created'
    bindings:
      amqp:
        expiration: 300000
        priority: 10
        deliveryMode: 2
        mandatory: true
        bindingVersion: "0.2.0"

  handleRealtimeEvent:
    action: receive
    bindings:
      ws:
        method: POST
        query:
          type: object
          properties:
            version:
              type: string
              const: v1
        headers:
          type: object
          properties:
            Authorization:
              type: string
              pattern: '^Bearer .+'
        bindingVersion: "0.1.0"
```

### @security - Security Schemes

```typespec
// TypeSpec: Security configurations
@security({
  name: "apiKey",
  type: "apiKey",
  in: "header",
  keyName: "x-api-key",
  description: "API key for service authentication"
})
@channel("secure.events")
@publish
op publishSecureEvent(@body event: SecureEvent): void;

// OAuth2 security
@security({
  name: "oauth2",
  type: "oauth2",
  flows: {
    clientCredentials: {
      tokenUrl: "https://auth.example.com/oauth/token",
      scopes: {
        "events:write": "Publish events",
        "events:read": "Subscribe to events"
      }
    }
  }
})
@channel("protected.events")
@subscribe
op handleProtectedEvent(): ProtectedEvent;

// Multiple security schemes
@security([
  { name: "apiKey" },
  { name: "oauth2", scopes: ["events:write"] }
])
@channel("multi.auth.events")
@publish
op publishAuthEvent(@body event: AuthEvent): void;
```

```yaml
# AsyncAPI: Security scheme definitions
components:
  securitySchemes:
    apiKey:
      type: apiKey
      in: header
      name: x-api-key
      description: API key for service authentication

    oauth2:
      type: oauth2
      flows:
        clientCredentials:
          tokenUrl: https://auth.example.com/oauth/token
          scopes:
            events:write: Publish events
            events:read: Subscribe to events

operations:
  publishSecureEvent:
    action: send
    channel:
      $ref: '#/channels/secure.events'
    security:
      - apiKey: []

  handleProtectedEvent:
    action: receive
    channel:
      $ref: '#/channels/protected.events'
    security:
      - oauth2:
          - events:read

  publishAuthEvent:
    action: send
    channel:
      $ref: '#/channels/multi.auth.events'
    security:
      - apiKey: []
      - oauth2:
          - events:write
```

### @server - Server Configuration

```typespec
// TypeSpec: Server definitions
@server("development", {
  url: "kafka://localhost:9092",
  protocol: "kafka",
  description: "Local development Kafka cluster",
  variables: {
    port: {
      default: "9092",
      description: "Kafka broker port"
    }
  }
})
@server("production", {
  url: "kafka://kafka.{environment}.example.com:9092",
  protocol: "kafka",
  description: "Production Kafka cluster",
  variables: {
    environment: {
      default: "prod",
      enum: ["prod", "staging"],
      description: "Environment identifier"
    }
  }
})
namespace EventSystem;

// WebSocket server
@server("websocket", {
  url: "wss://events.example.com/ws",
  protocol: "wss",
  description: "WebSocket event streaming server",
  security: [
    { scheme: "bearer", scopes: ["events:stream"] }
  ]
})
namespace RealtimeEvents;
```

```yaml
# AsyncAPI: Server definitions
servers:
  development:
    host: localhost:9092
    protocol: kafka
    description: Local development Kafka cluster
    variables:
      port:
        default: "9092"
        description: Kafka broker port
    bindings:
      kafka:
        schemaRegistryUrl: http://localhost:8081
        schemaRegistryVendor: confluent

  production:
    host: kafka.{environment}.example.com:9092
    protocol: kafka
    description: Production Kafka cluster
    variables:
      environment:
        default: prod
        enum: [prod, staging]
        description: Environment identifier
    bindings:
      kafka:
        schemaRegistryUrl: https://schema-registry.{environment}.example.com
        schemaRegistryVendor: confluent

  websocket:
    host: events.example.com
    pathname: /ws
    protocol: wss
    description: WebSocket event streaming server
    security:
      - bearer:
          - events:stream
    bindings:
      ws:
        headers:
          type: object
          properties:
            Authorization:
              type: string
              pattern: '^Bearer .+'
```

## Standard TypeSpec Decorators

### Documentation Decorators

```typespec
// TypeSpec: Documentation decorators
@doc("Comprehensive user management event system handling registration, updates, and lifecycle events")
@summary("User Management Events")
@example({
  user: {
    id: "usr_123",
    email: "user@example.com",
    status: "active"
  },
  metadata: {
    source: "web-app",
    timestamp: "2023-12-25T10:30:00Z"
  }
})
@deprecated("Use UserEventV2 instead. Will be removed in v3.0")
@externalDocs("https://docs.example.com/user-events", "User Events Documentation")
model UserEvent {
  @doc("Unique event identifier for tracking and correlation")
  @example("evt_01234567-89ab-cdef-0123-456789abcdef")
  eventId: string;

  @doc("User data at the time of the event")
  user: UserData;

  @doc("Additional event context and metadata")
  metadata: EventMetadata;
}

@operationId("publishUserLifecycleEvent")
@doc("Publishes events related to user lifecycle changes including registration, activation, and deactivation")
@summary("User Lifecycle Event Publisher")
@example({
  parameters: {},
  returnType: void
})
@deprecated("Use publishUserEventV2 instead")
@channel("user.lifecycle")
@publish
op publishUserEvent(@body event: UserEvent): void;
```

```yaml
# AsyncAPI: Documentation mapping
components:
  schemas:
    UserEvent:
      type: object
      title: User Management Events
      description: Comprehensive user management event system handling registration, updates, and lifecycle events
      deprecated: true
      x-deprecation-message: "Use UserEventV2 instead. Will be removed in v3.0"
      externalDocs:
        url: https://docs.example.com/user-events
        description: User Events Documentation
      properties:
        eventId:
          type: string
          format: uuid
          description: Unique event identifier for tracking and correlation
          example: "evt_01234567-89ab-cdef-0123-456789abcdef"
        user:
          $ref: '#/components/schemas/UserData'
          description: User data at the time of the event
        metadata:
          $ref: '#/components/schemas/EventMetadata'
          description: Additional event context and metadata
      examples:
        - user:
            id: "usr_123"
            email: "user@example.com"
            status: "active"
          metadata:
            source: "web-app"
            timestamp: "2023-12-25T10:30:00Z"

operations:
  publishUserEvent:
    operationId: publishUserLifecycleEvent
    action: send
    channel:
      $ref: '#/channels/user.lifecycle'
    title: User Lifecycle Event Publisher
    summary: User Lifecycle Event Publisher
    description: Publishes events related to user lifecycle changes including registration, activation, and deactivation
    deprecated: true
    x-deprecation-message: "Use publishUserEventV2 instead"
```

### Validation Decorators

```typespec
// TypeSpec: Validation decorators
model ValidatedEventData {
  @minLength(3)
  @maxLength(50)
  @pattern("^[a-zA-Z0-9_-]+$")
  @doc("Event name following naming conventions")
  eventName: string;

  @minValue(1)
  @maxValue(100)
  @doc("Event priority level")
  priority: int32;

  @minItems(1)
  @maxItems(10)
  @doc("Event tags for categorization")
  tags: string[];

  @format("email")
  @doc("Contact email for event owner")
  contactEmail: string;

  @secret
  @doc("Sensitive configuration data")
  secretData: string;

  @minProperties(1)
  @maxProperties(5)
  @doc("Additional event metadata")
  metadata: Record<string>;
}

// Array validation
model EventBatch {
  @minItems(1)
  @maxItems(100)
  @uniqueItems(true)
  events: ValidatedEventData[];

  @minLength(1)
  batchId: string;
}
```

```yaml
# AsyncAPI: Validation constraints
components:
  schemas:
    ValidatedEventData:
      type: object
      properties:
        eventName:
          type: string
          minLength: 3
          maxLength: 50
          pattern: '^[a-zA-Z0-9_-]+$'
          description: Event name following naming conventions
        priority:
          type: integer
          format: int32
          minimum: 1
          maximum: 100
          description: Event priority level
        tags:
          type: array
          items:
            type: string
          minItems: 1
          maxItems: 10
          description: Event tags for categorization
        contactEmail:
          type: string
          format: email
          description: Contact email for event owner
        secretData:
          type: string
          format: password
          description: Sensitive configuration data
          writeOnly: true
        metadata:
          type: object
          additionalProperties:
            type: string
          minProperties: 1
          maxProperties: 5
          description: Additional event metadata
      required: [eventName, priority, tags, contactEmail, secretData, metadata]

    EventBatch:
      type: object
      properties:
        events:
          type: array
          items:
            $ref: '#/components/schemas/ValidatedEventData'
          minItems: 1
          maxItems: 100
          uniqueItems: true
        batchId:
          type: string
          minLength: 1
      required: [events, batchId]
```

### Visibility Decorators

```typespec
// TypeSpec: Visibility decorators
model UserManagementEvent {
  @visibility("read")
  @doc("System-generated event ID")
  eventId: string;

  @visibility("create", "update")
  @doc("Event data provided by client")
  eventData: EventPayload;

  @visibility("create")
  @doc("Initial creation context")
  creationContext: CreationContext;

  @visibility("read")
  @doc("System processing metadata")
  systemMetadata: SystemMetadata;
}

// Usage in operations
@channel("user.events")
@publish
op createUserEvent(@body event: Create<UserManagementEvent>): void;

@channel("user.events.response")
@subscribe
op handleUserEventResponse(): Read<UserManagementEvent>;

@channel("user.events.update")
@publish
op updateUserEvent(@body event: Update<UserManagementEvent>): void;
```

```yaml
# AsyncAPI: Visibility through different message schemas
components:
  schemas:
    # Schema for creation (create + update visibility)
    UserManagementEventCreate:
      type: object
      properties:
        eventData:
          $ref: '#/components/schemas/EventPayload'
          description: Event data provided by client
        creationContext:
          $ref: '#/components/schemas/CreationContext'
          description: Initial creation context
      required: [eventData, creationContext]

    # Schema for reading (read visibility)
    UserManagementEventRead:
      type: object
      properties:
        eventId:
          type: string
          format: uuid
          description: System-generated event ID
        eventData:
          $ref: '#/components/schemas/EventPayload'
          description: Event data provided by client
        systemMetadata:
          $ref: '#/components/schemas/SystemMetadata'
          description: System processing metadata
      required: [eventId, eventData, systemMetadata]

    # Schema for updates (create + update visibility)
    UserManagementEventUpdate:
      type: object
      properties:
        eventData:
          $ref: '#/components/schemas/EventPayload'
          description: Event data provided by client
      required: [eventData]

  messages:
    CreateUserEvent:
      name: CreateUserEvent
      payload:
        $ref: '#/components/schemas/UserManagementEventCreate'

    UserEventResponse:
      name: UserEventResponse
      payload:
        $ref: '#/components/schemas/UserManagementEventRead'

    UpdateUserEvent:
      name: UpdateUserEvent
      payload:
        $ref: '#/components/schemas/UserManagementEventUpdate'
```

## Advanced Decorator Patterns

### Custom Decorator Extensions

```typespec
// TypeSpec: Custom decorator usage patterns
@tag("user-management")
@tag("high-priority")
@extension("x-rate-limit", { rpm: 1000, burst: 50 })
@extension("x-retry-policy", {
  maxRetries: 3,
  backoffStrategy: "exponential",
  initialDelay: 1000
})
@channel("user.high-priority")
@publish
op publishHighPriorityUserEvent(@body event: HighPriorityUserEvent): void;

// Tracing and observability
@extension("x-tracing", {
  serviceName: "user-service",
  spanName: "publish-order-event",
  tracingEnabled: true
})
@extension("x-monitoring", {
  metricsEnabled: true,
  alerting: {
    errorRate: { threshold: 0.05 },
    latency: { p99: 500 }
  }
})
@channel("orders.processing")
@publish
op publishOrderEvent(@body event: OrderEvent): void;
```

```yaml
# AsyncAPI: Custom extensions
operations:
  publishHighPriorityUserEvent:
    action: send
    channel:
      $ref: '#/channels/user.high-priority'
    tags:
      - name: user-management
      - name: high-priority
    x-rate-limit:
      rpm: 1000
      burst: 50
    x-retry-policy:
      maxRetries: 3
      backoffStrategy: exponential
      initialDelay: 1000

  publishOrderEvent:
    action: send
    channel:
      $ref: '#/channels/orders.processing'
    x-tracing:
      serviceName: user-service
      spanName: publish-order-event
      tracingEnabled: true
    x-monitoring:
      metricsEnabled: true
      alerting:
        errorRate:
          threshold: 0.05
        latency:
          p99: 500
```

### Conditional Decorator Application

```typespec
// TypeSpec: Environment-specific decorators
@server("development", {
  url: "kafka://localhost:9092",
  protocol: "kafka"
})
@server("production", {
  url: "kafka://prod-kafka.example.com:9092",
  protocol: "kafka"
})
namespace ConditionalEvents;

// Different protocols per environment
@protocol({
  type: "kafka",
  // Development settings
  ...(environment === "development" ? {
    acks: 1,
    retries: 1,
    batchSize: 10
  } : {}),
  // Production settings
  ...(environment === "production" ? {
    acks: "all",
    retries: 5,
    batchSize: 100,
    compressionType: "gzip"
  } : {})
})
@channel("events.conditional")
@publish
op publishConditionalEvent(@body event: ConditionalEvent): void;
```

```yaml
# AsyncAPI: Environment-specific configurations
servers:
  development:
    host: localhost:9092
    protocol: kafka
    description: Development Kafka cluster

  production:
    host: prod-kafka.example.com:9092
    protocol: kafka
    description: Production Kafka cluster

operations:
  publishConditionalEvent:
    action: send
    channel:
      $ref: '#/channels/events.conditional'
    # Development bindings
    x-development-bindings:
      kafka:
        acks: 1
        retries: 1
        batchSize: 10
    # Production bindings
    x-production-bindings:
      kafka:
        acks: all
        retries: 5
        batchSize: 100
        compressionType: gzip
```

## Decorator Composition Patterns

### Layered Decorator Application

```typespec
// TypeSpec: Base interface with common decorators
@tag("event-system")
@doc("Base interface for all event operations")
interface BaseEventOperations {
  // Common patterns defined here
}

// Specific implementation with additional decorators
@tag("user-events")
@security({ name: "apiKey" })
interface UserEventOperations extends BaseEventOperations {
  @channel("user.lifecycle")
  @publish
  @operationId("publishUserLifecycle")
  @doc("Publishes user lifecycle events")
  publishUserLifecycle(@body event: UserLifecycleEvent): void;

  @channel("user.lifecycle")
  @subscribe
  @operationId("handleUserLifecycle")
  @doc("Handles user lifecycle events")
  handleUserLifecycle(): UserLifecycleEvent;
}

// High-volume operations with performance decorators
@tag("high-volume")
@extension("x-performance", {
  batchingEnabled: true,
  maxBatchSize: 1000,
  flushInterval: 5000
})
interface HighVolumeOperations extends BaseEventOperations {
  @channel("metrics.data")
  @publish
  @protocol({
    type: "kafka",
    compressionType: "lz4",
    batchSize: 1000
  })
  publishMetricsBatch(@body events: MetricEvent[]): void;
}
```

```yaml
# AsyncAPI: Composed decorator effects
components:
  tags:
    - name: event-system
      description: Base event system operations
    - name: user-events
      description: User-related event operations
    - name: high-volume
      description: High-volume data processing operations

operations:
  publishUserLifecycle:
    operationId: publishUserLifecycle
    action: send
    channel:
      $ref: '#/channels/user.lifecycle'
    description: Publishes user lifecycle events
    tags:
      - event-system
      - user-events
    security:
      - apiKey: []

  handleUserLifecycle:
    operationId: handleUserLifecycle
    action: receive
    channel:
      $ref: '#/channels/user.lifecycle'
    description: Handles user lifecycle events
    tags:
      - event-system
      - user-events
    security:
      - apiKey: []

  publishMetricsBatch:
    action: send
    channel:
      $ref: '#/channels/metrics.data'
    tags:
      - event-system
      - high-volume
    bindings:
      kafka:
        compressionType: lz4
        batchSize: 1000
    x-performance:
      batchingEnabled: true
      maxBatchSize: 1000
      flushInterval: 5000
```

## Decorator Best Practices

### 1. Consistent Usage Patterns

- Always pair `@channel` with `@publish` or `@subscribe`
- Use `@message` for reusable message definitions
- Apply `@protocol` at the operation level for specific bindings

### 2. Documentation Strategy

- Use `@doc` for detailed descriptions
- Use `@summary` for brief overviews
- Include `@example` for complex message structures
- Add `@deprecated` with migration guidance

### 3. Security Configuration

- Define security schemes at the namespace level
- Apply security to operations, not just channels
- Use multiple security options for flexibility

### 4. Protocol Optimization

- Configure protocol bindings based on use case
- Use compression for high-volume channels
- Set appropriate retry and acknowledgment policies

### 5. Evolution Management

- Use extensions (`@extension`) for custom metadata
- Apply versioning consistently across related operations
- Plan decorator changes for backward compatibility

## Next Steps

Understanding decorator mapping enables:

- **Protocol Bindings** - Protocol-specific configurations
- **Advanced Patterns** - Complex event-driven architectures
- **Best Practices** - Comprehensive design guidelines
- **Real Examples** - Complete working implementations

---

_Decorators are the bridge between TypeSpec's declarative power and AsyncAPI's rich feature set, enabling precise control over every aspect of event-driven API specification._
