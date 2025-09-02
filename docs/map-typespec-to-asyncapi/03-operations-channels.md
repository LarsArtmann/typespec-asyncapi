# Operations & Channels: TypeSpec to AsyncAPI Event-Driven Mapping

## Overview

This document explains how TypeSpec operations transform into AsyncAPI's event-driven architecture, focusing on channels, operations, and message flow patterns. Understanding this mapping is essential for designing effective asynchronous APIs.

## Fundamental Concepts

### TypeSpec Operations vs AsyncAPI Operations

| Aspect | TypeSpec | AsyncAPI |
|--------|----------|----------|
| **Purpose** | Method-like operations | Message flow actions |
| **Direction** | Request → Response | Send/Receive messages |
| **Timing** | Often synchronous thinking | Always asynchronous |
| **Identification** | Operation name | Channel + Operation combination |

## Basic Operation Mapping

### Publish Operations (Send Messages)

```typespec
// TypeSpec: Publishing an event
@channel("user.events")
@publish
op userRegistered(@body user: UserRegisteredEvent): void;

@channel("order.events")
@publish
op orderCreated(@body order: OrderCreatedEvent): void;
```

```yaml
# AsyncAPI Result
channels:
  user.events:
    address: user.events
    messages:
      UserRegisteredMessage:
        $ref: '#/components/messages/UserRegisteredMessage'
        
  order.events:
    address: order.events
    messages:
      OrderCreatedMessage:
        $ref: '#/components/messages/OrderCreatedMessage'

operations:
  userRegistered:
    action: send
    channel:
      $ref: '#/channels/user.events'
    summary: User registration event
    messages:
      - $ref: '#/channels/user.events/messages/UserRegisteredMessage'
      
  orderCreated:
    action: send
    channel:
      $ref: '#/channels/order.events'
    summary: Order creation event
    messages:
      - $ref: '#/channels/order.events/messages/OrderCreatedMessage'

components:
  messages:
    UserRegisteredMessage:
      name: UserRegisteredEvent
      title: User Registration Event
      contentType: application/json
      payload:
        $ref: '#/components/schemas/UserRegisteredEvent'
        
    OrderCreatedMessage:
      name: OrderCreatedEvent
      title: Order Creation Event
      contentType: application/json
      payload:
        $ref: '#/components/schemas/OrderCreatedEvent'
```

### Subscribe Operations (Receive Messages)

```typespec
// TypeSpec: Subscribing to events
@channel("user.events")
@subscribe
op handleUserRegistered(): UserRegisteredEvent;

@channel("payment.events")
@subscribe
op handlePaymentProcessed(): PaymentProcessedEvent;
```

```yaml
# AsyncAPI Result
operations:
  handleUserRegistered:
    action: receive
    channel:
      $ref: '#/channels/user.events'
    summary: Handle user registration events
    messages:
      - $ref: '#/channels/user.events/messages/UserRegisteredMessage'
      
  handlePaymentProcessed:
    action: receive
    channel:
      $ref: '#/channels/payment.events'
    summary: Handle payment processing events
    messages:
      - $ref: '#/channels/payment.events/messages/PaymentProcessedMessage'
```

## Channel Path Patterns

### Static Channel Paths

```typespec
// TypeSpec
@channel("user.events")
@publish
op publishUserEvent(@body event: UserEvent): void;

@channel("system.alerts")
@publish  
op publishSystemAlert(@body alert: SystemAlert): void;
```

```yaml
# AsyncAPI
channels:
  user.events:
    address: user.events
    description: User-related events
    
  system.alerts:
    address: system.alerts
    description: System alert notifications
```

### Parameterized Channel Paths

```typespec
// TypeSpec with path parameters
@channel("user/{userId}/notifications")
@publish
op sendUserNotification(
  @path userId: string,
  @body notification: Notification
): void;

@channel("tenant/{tenantId}/orders/{orderId}")
@subscribe
op handleOrderUpdate(@path tenantId: string, @path orderId: string): OrderUpdate;
```

```yaml
# AsyncAPI with channel parameters
channels:
  user-notifications:
    address: user/{userId}/notifications
    parameters:
      userId:
        description: Unique user identifier
        schema:
          type: string
          format: uuid
    messages:
      NotificationMessage:
        $ref: '#/components/messages/NotificationMessage'
        
  tenant-order-updates:
    address: tenant/{tenantId}/orders/{orderId}
    parameters:
      tenantId:
        description: Tenant identifier
        schema:
          type: string
      orderId:
        description: Order identifier
        schema:
          type: string
          format: uuid
    messages:
      OrderUpdateMessage:
        $ref: '#/components/messages/OrderUpdateMessage'

operations:
  sendUserNotification:
    action: send
    channel:
      $ref: '#/channels/user-notifications'
    bindings:
      # Channel parameter values from operation parameters
      
  handleOrderUpdate:
    action: receive
    channel:
      $ref: '#/channels/tenant-order-updates'
```

### Hierarchical Channel Organization

```typespec
// TypeSpec namespace organization
namespace ECommerce.Orders {
  @channel("orders.lifecycle.created")
  @publish
  op orderCreated(@body order: OrderCreatedEvent): void;
  
  @channel("orders.lifecycle.updated") 
  @publish
  op orderUpdated(@body order: OrderUpdatedEvent): void;
  
  @channel("orders.lifecycle.completed")
  @publish
  op orderCompleted(@body order: OrderCompletedEvent): void;
}

namespace ECommerce.Inventory {
  @channel("inventory.stock.depleted")
  @publish
  op stockDepleted(@body item: StockDepletedEvent): void;
  
  @channel("inventory.stock.replenished")
  @publish
  op stockReplenished(@body item: StockReplenishedEvent): void;
}
```

```yaml
# AsyncAPI organized channels
channels:
  orders.lifecycle.created:
    address: orders.lifecycle.created
    description: Order creation events
    
  orders.lifecycle.updated:
    address: orders.lifecycle.updated
    description: Order update events
    
  orders.lifecycle.completed:
    address: orders.lifecycle.completed
    description: Order completion events
    
  inventory.stock.depleted:
    address: inventory.stock.depleted
    description: Stock depletion notifications
    
  inventory.stock.replenished:
    address: inventory.stock.replenished
    description: Stock replenishment notifications
```

## Message Flow Patterns

### One-Way Message Flow

```typespec
// TypeSpec: Fire-and-forget pattern
@channel("audit.logs")
@publish
op logAuditEvent(@body event: AuditEvent): void;

// No corresponding subscribe operation needed
```

```yaml
# AsyncAPI: Send-only operation
operations:
  logAuditEvent:
    action: send
    channel:
      $ref: '#/channels/audit.logs'
    summary: Log audit events (fire-and-forget)
```

### Request-Reply Pattern

```typespec
// TypeSpec: Request-reply using correlation
@channel("user.queries")
@publish
op requestUserInfo(@body query: UserQuery): void;

@channel("user.responses") 
@subscribe
op receiveUserInfo(): UserInfoResponse;

model UserQuery {
  correlationId: string;
  userId: string;
}

model UserInfoResponse {
  correlationId: string;
  user: User;
}
```

```yaml
# AsyncAPI: Request-reply with correlation
channels:
  user.queries:
    address: user.queries
    messages:
      UserQueryMessage:
        correlationId:
          description: Correlation ID for request-reply
          location: $message.payload#/correlationId
        payload:
          $ref: '#/components/schemas/UserQuery'
          
  user.responses:
    address: user.responses  
    messages:
      UserInfoResponseMessage:
        correlationId:
          description: Correlation ID for request-reply
          location: $message.payload#/correlationId
        payload:
          $ref: '#/components/schemas/UserInfoResponse'

operations:
  requestUserInfo:
    action: send
    channel:
      $ref: '#/channels/user.queries'
    reply:
      channel:
        $ref: '#/channels/user.responses'
        
  receiveUserInfo:
    action: receive
    channel:
      $ref: '#/channels/user.responses'
```

### Event Streaming Pattern

```typespec
// TypeSpec: Streaming events
@channel("sensor.data")
@subscribe
op processSensorStream(): SensorReading;

@channel("analytics.results")
@publish
op publishAnalytics(@body analytics: AnalyticsResult): void;

// Indicates streaming/continuous processing
@protocol({ 
  type: "kafka", 
  streaming: true,
  batchSize: 100 
})
@channel("data.stream")
@subscribe
op processDataBatch(): DataBatch;
```

```yaml
# AsyncAPI: Streaming operations
operations:
  processSensorStream:
    action: receive
    channel:
      $ref: '#/channels/sensor.data'
    summary: Continuously process sensor readings
    
  publishAnalytics:
    action: send
    channel:
      $ref: '#/channels/analytics.results'
    summary: Publish processed analytics results
    
  processDataBatch:
    action: receive
    channel:
      $ref: '#/channels/data.stream'
    summary: Process data in batches
    bindings:
      kafka:
        groupId: data-processing-service
        autoOffsetReset: earliest
```

## Operation Parameters and Message Construction

### Parameter Mapping Strategies

```typespec
// TypeSpec: Various parameter types
@channel("notifications/{userId}")
@publish
op sendNotification(
  @path userId: string,
  @header priority: "high" | "normal" | "low",
  @query immediate: boolean = false,
  @body notification: NotificationContent
): void;
```

```yaml
# AsyncAPI: Parameters become message parts
channels:
  user-notifications:
    address: notifications/{userId}
    parameters:
      userId:
        schema:
          type: string

operations:
  sendNotification:
    action: send
    channel:
      $ref: '#/channels/user-notifications'

components:
  messages:
    NotificationMessage:
      name: Notification
      headers:
        type: object
        properties:
          priority:
            type: string
            enum: [high, normal, low]
          immediate:
            type: boolean
            default: false
      payload:
        $ref: '#/components/schemas/NotificationContent'
```

### Complex Parameter Patterns

```typespec
// TypeSpec: Multiple parameter sources
@channel("orders/{tenantId}/process")
@publish
op processOrder(
  @path tenantId: string,
  @header("x-request-id") requestId: string,
  @header("x-trace-id") traceId?: string,
  @query priority: int32 = 1,
  @query dryRun: boolean = false,
  @body order: OrderProcessingRequest
): void;
```

```yaml
# AsyncAPI: Comprehensive message structure
components:
  messages:
    ProcessOrderMessage:
      name: ProcessOrder
      title: Process Order Command
      headers:
        type: object
        properties:
          x-request-id:
            type: string
            description: Unique request identifier
          x-trace-id:
            type: string
            description: Distributed tracing ID
          priority:
            type: integer
            format: int32
            default: 1
            minimum: 1
            maximum: 10
          dryRun:
            type: boolean
            default: false
            description: Execute in dry-run mode
        required: [x-request-id]
      payload:
        $ref: '#/components/schemas/OrderProcessingRequest'
```

## Interface-Based Organization

### Grouping Related Operations

```typespec
// TypeSpec: Interface for related operations
@channel("user")
interface UserEvents {
  @publish
  created(@body user: UserCreatedEvent): void;
  
  @publish  
  updated(@body user: UserUpdatedEvent): void;
  
  @publish
  deleted(@body user: UserDeletedEvent): void;
}

@channel("user")
interface UserCommands {
  @subscribe
  handleCreateUser(): CreateUserCommand;
  
  @subscribe
  handleUpdateUser(): UpdateUserCommand;
  
  @subscribe
  handleDeleteUser(): DeleteUserCommand;
}
```

```yaml
# AsyncAPI: Operations grouped by channel
channels:
  user:
    address: user
    description: User-related events and commands
    messages:
      UserCreatedEvent:
        $ref: '#/components/messages/UserCreatedEvent'
      UserUpdatedEvent:
        $ref: '#/components/messages/UserUpdatedEvent'
      UserDeletedEvent:
        $ref: '#/components/messages/UserDeletedEvent'
      CreateUserCommand:
        $ref: '#/components/messages/CreateUserCommand'
      UpdateUserCommand:
        $ref: '#/components/messages/UpdateUserCommand'
      DeleteUserCommand:
        $ref: '#/components/messages/DeleteUserCommand'

operations:
  # Publish operations (events)
  created:
    action: send
    channel: { $ref: '#/channels/user' }
    summary: User created event
    
  updated:
    action: send
    channel: { $ref: '#/channels/user' }
    summary: User updated event
    
  deleted:
    action: send
    channel: { $ref: '#/channels/user' }
    summary: User deleted event
    
  # Subscribe operations (commands)
  handleCreateUser:
    action: receive
    channel: { $ref: '#/channels/user' }
    summary: Handle user creation command
    
  handleUpdateUser:
    action: receive
    channel: { $ref: '#/channels/user' }
    summary: Handle user update command
    
  handleDeleteUser:
    action: receive
    channel: { $ref: '#/channels/user' }
    summary: Handle user deletion command
```

## Error Handling in Operations

### Error Response Patterns

```typespec
// TypeSpec: Operations with error handling
@channel("order.processing")
@publish
op processOrder(@body order: OrderRequest): void;

@channel("order.results")
@subscribe
op handleOrderResult(): OrderResult | OrderError;

union OrderResult {
  success: OrderSuccessResult,
  failure: OrderFailureResult
}

@discriminator("status")
union OrderResponse {
  completed: CompletedOrder,
  failed: FailedOrder,
  retry: RetryableOrder
}
```

```yaml
# AsyncAPI: Error handling with message variants
channels:
  order.processing:
    address: order.processing
    messages:
      OrderRequest:
        $ref: '#/components/messages/OrderRequest'
        
  order.results:
    address: order.results
    messages:
      OrderResult:
        $ref: '#/components/messages/OrderResult'
      OrderError:
        $ref: '#/components/messages/OrderError'

components:
  messages:
    OrderResult:
      name: OrderResult
      payload:
        oneOf:
          - $ref: '#/components/schemas/OrderSuccessResult'
          - $ref: '#/components/schemas/OrderFailureResult'
          
    OrderResponse:
      name: OrderResponse
      payload:
        oneOf:
          - $ref: '#/components/schemas/CompletedOrder'
          - $ref: '#/components/schemas/FailedOrder'
          - $ref: '#/components/schemas/RetryableOrder'
        discriminator:
          propertyName: status
```

## Dead Letter Queue Patterns

```typespec
// TypeSpec: DLQ handling
@channel("orders.processing")
@publish
op processOrder(@body order: Order): void;

@channel("orders.deadletter")
@subscribe
op handleFailedOrder(): FailedOrderEvent;

model FailedOrderEvent {
  originalOrder: Order;
  failureReason: string;
  attemptCount: int32;
  lastAttemptAt: utcDateTime;
  nextRetryAt?: utcDateTime;
}
```

```yaml
# AsyncAPI: Dead letter queue configuration
channels:
  orders.processing:
    address: orders.processing
    bindings:
      amqp:
        is: queue
        queue:
          durable: true
          arguments:
            x-dead-letter-exchange: orders.dlx
            x-dead-letter-routing-key: failed
            x-message-ttl: 300000
            
  orders.deadletter:
    address: orders.deadletter
    description: Failed order processing events
    bindings:
      amqp:
        is: queue
        queue:
          durable: true
          exclusive: false
```

## Operation Documentation Patterns

### Comprehensive Operation Documentation

```typespec
// TypeSpec: Well-documented operations
@doc("Publishes user registration events to the user events stream")
@summary("User Registration Event Publisher")
@example({
  user: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "user@example.com",
    registeredAt: "2023-12-25T10:30:00Z"
  }
})
@channel("user.events")
@publish
op publishUserRegistration(@body user: UserRegistrationEvent): void;

@doc("Handles incoming user registration events for downstream processing")
@summary("User Registration Event Handler") 
@channel("user.events")
@subscribe
op handleUserRegistration(): UserRegistrationEvent;
```

```yaml
# AsyncAPI: Rich operation documentation
operations:
  publishUserRegistration:
    action: send
    channel: { $ref: '#/channels/user.events' }
    title: User Registration Event Publisher
    summary: User Registration Event Publisher
    description: Publishes user registration events to the user events stream
    
  handleUserRegistration:
    action: receive
    channel: { $ref: '#/channels/user.events' }
    title: User Registration Event Handler
    summary: User Registration Event Handler
    description: Handles incoming user registration events for downstream processing

components:
  messages:
    UserRegistrationEvent:
      name: UserRegistrationEvent
      examples:
        - name: Typical user registration
          payload:
            user:
              id: "550e8400-e29b-41d4-a716-446655440000"
              email: "user@example.com"
              registeredAt: "2023-12-25T10:30:00Z"
```

## Operational Metadata

### Operation Traits and Tags

```typespec
// TypeSpec: Operational metadata
@tag("user-management")
@tag("authentication")
@channel("auth.events")
@publish
op userAuthenticated(
  @header("x-auth-method") authMethod: "password" | "oauth" | "sso",
  @body event: UserAuthenticatedEvent
): void;

@tag("high-volume")
@tag("real-time")
@channel("metrics.data")
@subscribe
op processMetrics(): MetricDataPoint;
```

```yaml
# AsyncAPI: Tags and operational metadata
operations:
  userAuthenticated:
    action: send
    channel: { $ref: '#/channels/auth.events' }
    tags:
      - name: user-management
        description: User management operations
      - name: authentication
        description: Authentication-related operations
        
  processMetrics:
    action: receive
    channel: { $ref: '#/channels/metrics.data' }
    tags:
      - name: high-volume
        description: High-volume data processing
      - name: real-time
        description: Real-time processing requirements

tags:
  - name: user-management
    description: Operations related to user lifecycle management
  - name: authentication
    description: Authentication and authorization operations
  - name: high-volume
    description: Operations handling high message volumes
  - name: real-time
    description: Operations requiring real-time processing
```

## Best Practices

### 1. Channel Naming Conventions
- Use hierarchical dot notation: `domain.entity.action`
- Be consistent across the API: `user.events`, `order.events`
- Include direction context when needed: `user.commands`, `user.events`

### 2. Operation Organization
- Group related operations in interfaces
- Use clear action-oriented names: `publishOrder`, `handlePayment`
- Separate commands (actions) from events (results)

### 3. Message Flow Design
- Design for eventual consistency
- Use correlation IDs for request-reply patterns
- Plan for error handling and dead letter queues

### 4. Channel Parameters
- Use path parameters for routing: `tenant/{tenantId}/orders`
- Validate parameter formats and ranges
- Document parameter semantics clearly

### 5. Documentation Strategy
- Document message flow patterns, not just individual operations
- Include timing expectations and ordering guarantees
- Provide comprehensive examples for complex patterns

## Common Patterns and Anti-Patterns

### ✅ Good Patterns

```typespec
// Clear separation of concerns
@channel("orders.commands")
@subscribe
op handleOrderCommand(): OrderCommand;

@channel("orders.events")
@publish
op orderProcessed(@body event: OrderProcessedEvent): void;

// Proper correlation for request-reply
@channel("user.queries")
@publish
op queryUser(@body query: UserQuery): void; // Contains correlationId

@channel("user.responses")
@subscribe
op receiveUserResponse(): UserResponse; // Contains correlationId
```

### ❌ Anti-Patterns

```typespec
// Don't mix commands and events in same channel
@channel("orders") // Too generic
@publish
op something(@body data: unknown): void; // Unclear intent

// Don't ignore correlation in request-reply
@channel("queries")
@publish
op query(@body q: Query): void; // No correlation strategy

@channel("responses")
@subscribe  
op response(): Response; // Can't correlate with request
```

## Next Steps

Understanding operations and channels mapping enables:
- **Schema Design** - Message payload and header patterns
- **Decorator Usage** - Advanced decorator configurations
- **Protocol Bindings** - Protocol-specific operation features
- **Advanced Patterns** - Complex event-driven architectures

---

*This operations mapping forms the core of event-driven API design, transforming TypeSpec's operation-centric model into AsyncAPI's message-flow paradigm.*