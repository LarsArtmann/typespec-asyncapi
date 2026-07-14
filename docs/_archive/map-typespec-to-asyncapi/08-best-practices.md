# Best Practices: TypeSpec to AsyncAPI Design Guidelines

## Overview

This document provides comprehensive best practices for designing effective TypeSpec to AsyncAPI mappings. These guidelines ensure maintainable, scalable, and interoperable event-driven APIs.

## Design Philosophy

### API-First Development

**✅ Start with Domain Events**

```typespec
// Good: Domain-driven event design
namespace UserManagement {
  @message({
    name: "UserRegisteredEvent",
    description: "Fired when a new user completes registration"
  })
  model UserRegisteredEvent {
    userId: string;
    registrationTimestamp: utcDateTime;
    registrationMethod: "email" | "social" | "phone";
    userData: UserRegistrationData;
  }
}
```

**❌ Technology-First Design**

```typespec
// Bad: Implementation-driven design
@channel("kafka.topic.user")
@publish
op sendMessage(@body data: Record<unknown>): void;
```

### Event Storming to TypeSpec

**✅ Model Business Processes**

```typespec
// Good: Business process modeling
namespace OrderFulfillment {
  // Command
  model PlaceOrderCommand {
    customerId: string;
    items: OrderItem[];
    paymentMethod: PaymentMethod;
  }

  // Events (past tense, business outcomes)
  model OrderPlacedEvent { /* ... */ }
  model PaymentAuthorizedEvent { /* ... */ }
  model InventoryReservedEvent { /* ... */ }
  model OrderShippedEvent { /* ... */ }
  model OrderDeliveredEvent { /* ... */ }
}
```

## Naming Conventions

### Channel Naming Strategy

**✅ Hierarchical Naming**

```typespec
// Good: Clear hierarchy and purpose
@channel("ecommerce.orders.lifecycle.created")
@channel("ecommerce.orders.lifecycle.updated")
@channel("ecommerce.orders.lifecycle.shipped")
@channel("ecommerce.inventory.stock.depleted")
@channel("ecommerce.inventory.stock.replenished")
@channel("ecommerce.payments.transactions.authorized")
```

**❌ Flat or Unclear Naming**

```typespec
// Bad: Unclear purpose and organization
@channel("orders")
@channel("order-stuff")
@channel("order_processing_queue")
@channel("orderEvents123")
```

### Operation Naming Patterns

**✅ Action-Oriented Names**

```typespec
// Good: Clear intent and direction
@publish op publishOrderCreated(@body event: OrderCreatedEvent): void;
@publish op notifyPaymentCompleted(@body event: PaymentCompletedEvent): void;
@subscribe op handleInventoryDepleted(): InventoryDepletedEvent;
@subscribe op processUserRegistration(): UserRegisteredEvent;
```

**❌ Generic or Unclear Names**

```typespec
// Bad: Unclear intent
@publish op send(@body data: unknown): void;
@subscribe op process(): unknown;
@publish op doStuff(@body event: Event): void;
```

### Message and Model Naming

**✅ Domain Language**

```typespec
// Good: Uses ubiquitous language
model CustomerRegisteredEvent {
  customerId: CustomerId;          // Domain type
  registrationChannel: Channel;    // Domain enum
  customerProfile: CustomerProfile;
  registrationContext: RegistrationContext;
}

model ProductCatalogUpdatedEvent {
  catalogId: CatalogId;
  updateType: CatalogUpdateType;
  affectedProducts: ProductId[];
  updateMetadata: CatalogUpdateMetadata;
}
```

**❌ Technical Language**

```typespec
// Bad: Implementation-focused naming
model DataRecord {
  id: string;
  payload: Record<unknown>;
  timestamp: utcDateTime;
}
```

## Schema Design Excellence

### Message Structure Patterns

**✅ Consistent Event Envelope**

```typespec
// Good: Standardized event structure
model BaseEvent {
  // Event identification
  eventId: string;
  eventType: string;
  eventVersion: string;

  // Timing information
  occurredAt: utcDateTime;
  processedAt?: utcDateTime;

  // Tracing and correlation
  correlationId?: string;
  causationId?: string;
  traceId?: string;

  // Source information
  source: string;
  sourceVersion: string;
}

model UserRegisteredEvent extends BaseEvent {
  eventType: "user.registered";
  eventVersion: "1.0";

  // Business data
  user: UserData;
  registrationContext: RegistrationContext;
}
```

**❌ Inconsistent Structure**

```typespec
// Bad: Different structures for different events
model UserEvent {
  id: string;
  when: utcDateTime;
  userData: User;
}

model OrderEvent {
  eventIdentifier: string;
  timestamp: utcDateTime;
  orderInfo: OrderData;
  metadata: Record<unknown>;
}
```

### Schema Evolution Strategy

**✅ Additive-Only Changes**

```typespec
// Good: Backward compatible evolution
model UserEventV1 {
  userId: string;
  name: string;
  email: string;
  // v1.0 fields
}

model UserEventV2 extends UserEventV1 {
  // v2.0 additions (all optional for backward compatibility)
  phoneNumber?: string;
  preferences?: UserPreferences;

  // v2.1 additions
  socialProfiles?: SocialProfile[];
}
```

**❌ Breaking Changes**

```typespec
// Bad: Breaking changes
model UserEventV2 {
  userId: string;
  fullName: string;        // Changed from 'name'
  emailAddress: string;    // Changed from 'email'
  isActive: boolean;       // New required field
}
```

### Validation Best Practices

**✅ Comprehensive Validation**

```typespec
// Good: Business rule validation
model OrderCreatedEvent {
  @format("uuid")
  orderId: string;

  @format("uuid")
  customerId: string;

  @minItems(1)
  @maxItems(50)
  items: OrderItem[];

  @minValue(0.01)
  totalAmount: decimal;

  @pattern("^[A-Z]{3}$")
  currency: string;

  @doc("Order creation timestamp")
  @example("2023-12-25T10:30:00Z")
  createdAt: utcDateTime;
}

model OrderItem {
  @format("uuid")
  productId: string;

  @minValue(1)
  @maxValue(1000)
  quantity: int32;

  @minValue(0.01)
  unitPrice: decimal;
}
```

## Operation Design Patterns

### Request-Reply Patterns

**✅ Proper Correlation**

```typespec
// Good: Clear request-reply with correlation
namespace UserQuery {
  model UserQueryRequest {
    queryId: string;
    correlationId: string;
    userId: string;
    requestedFields: string[];
  }

  model UserQueryResponse {
    queryId: string;
    correlationId: string;  // Same as request
    user?: UserData;
    error?: QueryError;
    respondedAt: utcDateTime;
  }

  @channel("users.queries")
  @publish
  op requestUserData(@body query: UserQueryRequest): void;

  @channel("users.query-responses")
  @subscribe
  op receiveUserData(): UserQueryResponse;
}
```

### Event Sourcing Patterns

**✅ Proper Aggregate Design**

```typespec
// Good: Well-designed aggregate events
namespace OrderAggregate {
  interface OrderEvent {
    aggregateId: string;
    aggregateVersion: int32;
    eventType: string;
    occurredAt: utcDateTime;
  }

  model OrderCreatedEvent extends OrderEvent {
    eventType: "order.created";
    customerId: string;
    items: OrderItem[];
    totalAmount: decimal;
  }

  model OrderItemAddedEvent extends OrderEvent {
    eventType: "order.item.added";
    item: OrderItem;
    newTotalAmount: decimal;
  }

  model OrderCancelledEvent extends OrderEvent {
    eventType: "order.cancelled";
    reason: CancellationReason;
    cancelledBy: string;
  }
}
```

## Protocol Configuration Excellence

### Kafka Best Practices

**✅ Production-Ready Configuration**

```typespec
// Good: Comprehensive Kafka configuration
@protocol({
  type: "kafka",
  topic: "orders.events",
  partitionKey: "customerId",

  // Reliability settings
  acks: "all",
  retries: 2147483647,
  enableIdempotence: true,
  maxInFlightRequestsPerConnection: 1,

  // Performance settings
  batchSize: 16384,
  compressionType: "lz4",
  lingerMs: 5,

  // Schema registry
  schemaRegistry: {
    url: "https://schema-registry.production.com",
    subject: "orders-events-value",
    version: "latest"
  }
})
@channel("orders.events")
@publish
op publishOrderEvent(@body event: OrderEvent): void;
```

**❌ Minimal Configuration**

```typespec
// Bad: Insufficient configuration
@protocol({ type: "kafka" })
@channel("events")
@publish
op publish(@body data: unknown): void;
```

### Security Configuration

**✅ Comprehensive Security**

```typespec
// Good: Multi-layered security
@security({
  name: "oauth2",
  type: "oauth2",
  flows: {
    clientCredentials: {
      tokenUrl: "https://auth.example.com/oauth/token",
      scopes: {
        "orders:read": "Read order events",
        "orders:write": "Publish order events",
        "orders:admin": "Administrative access"
      }
    }
  }
})
@security({
  name: "apiKey",
  type: "apiKey",
  in: "header",
  keyName: "x-api-key"
})
@channel("orders.events")
@subscribe
op processOrderEvent(): OrderEvent;
```

## Error Handling Excellence

### Comprehensive Error Design

**✅ Rich Error Information**

```typespec
// Good: Comprehensive error handling
@error
model EventProcessingError {
  errorId: string;
  errorType: "validation" | "business" | "technical" | "timeout";
  errorCode: string;
  message: string;
  details?: ErrorDetails;
  timestamp: utcDateTime;
  retryable: boolean;
  retryAfter?: int32;
  correlationId?: string;
  traceId?: string;
}

model ValidationError extends EventProcessingError {
  errorType: "validation";
  validationFailures: ValidationFailure[];
}

model ValidationFailure {
  field: string;
  value?: unknown;
  constraint: string;
  message: string;
}
```

### Dead Letter Queue Patterns

**✅ Proper DLQ Configuration**

```typespec
// Good: Complete error handling setup
@protocol({
  type: "amqp",
  exchange: "orders.exchange",
  queue: "orders.processing",
  deadLetterExchange: "orders.dlx",
  deadLetterRoutingKey: "failed",
  maxRetries: 3,
  retryDelay: 5000
})
@channel("orders.processing")
@subscribe
op processOrder(): OrderEvent | OrderProcessingError;

@channel("orders.processing.dlq")
@subscribe
op handleFailedOrder(): FailedOrderEvent;
```

## Documentation Excellence

### Comprehensive Documentation

**✅ Rich Documentation**

```typespec
// Good: Comprehensive documentation
@doc("User lifecycle events representing key moments in user journey")
@summary("User Lifecycle Events")
@externalDocs("https://docs.example.com/user-events", "User Events Guide")
@example({
  eventId: "evt_01234567-89ab-cdef-0123-456789abcdef",
  eventType: "user.registered",
  occurredAt: "2023-12-25T10:30:00Z",
  user: {
    id: "usr_01234567-89ab-cdef-0123-456789abcdef",
    email: "user@example.com",
    registeredAt: "2023-12-25T10:30:00Z"
  }
})
@message({
  name: "UserLifecycleEvent",
  title: "User Lifecycle Event",
  contentType: "application/json",
  description: "Comprehensive event documenting user lifecycle changes with full context"
})
model UserLifecycleEvent {
  @doc("Unique event identifier for tracking and correlation")
  @example("evt_01234567-89ab-cdef-0123-456789abcdef")
  eventId: string;

  @doc("Event type discriminator following domain.action pattern")
  @example("user.registered")
  eventType: "user.registered" | "user.activated" | "user.deactivated" | "user.deleted";

  @doc("Precise timestamp when the event occurred in the source system")
  @example("2023-12-25T10:30:00Z")
  occurredAt: utcDateTime;

  @doc("Complete user data at the time of the event")
  user: UserEventData;

  @doc("Additional context about how and why the event occurred")
  context: EventContext;
}
```

## Testing Strategies

### Contract Testing

**✅ Comprehensive Testing Approach**

```typespec
// Good: Test-friendly design
@example({
  name: "successful-registration",
  description: "Typical successful user registration",
  value: {
    eventId: "evt_12345",
    eventType: "user.registered",
    user: { id: "usr_67890", email: "test@example.com" }
  }
})
@example({
  name: "registration-with-preferences",
  description: "Registration including user preferences",
  value: {
    eventId: "evt_54321",
    eventType: "user.registered",
    user: {
      id: "usr_09876",
      email: "premium@example.com",
      preferences: { notifications: true, marketing: false }
    }
  }
})
model UserRegisteredEvent {
  eventId: string;
  eventType: "user.registered";
  user: UserData;
  preferences?: UserPreferences;
}
```

## Performance Optimization

### Efficient Schema Design

**✅ Optimized for Performance**

```typespec
// Good: Performance-conscious design
model OptimizedEvent {
  // Fixed-size identifiers
  @format("uuid")
  eventId: string;

  @format("uuid")
  userId: string;

  // Compact timestamps
  @format("unix-timestamp")
  occurredAt: int64;

  // Bounded collections
  @maxItems(100)
  tags: string[];

  // Optional heavy data for lazy loading
  detailedData?: {
    href: string;  // Link to detailed data
  };
}
```

### Lazy Loading Patterns

**✅ Efficient Data Access**

```typespec
// Good: HATEOAS for event data
model EventSummary {
  eventId: string;
  eventType: string;
  occurredAt: utcDateTime;

  // Links to detailed data
  _links: {
    self: { href: string };
    details: { href: string };
    related: { href: string };
  };
}

model EventDetails extends EventSummary {
  // Full event data loaded on demand
  payload: EventPayload;
  metadata: EventMetadata;
  relatedEvents: RelatedEvent[];

  // Remove links since we have full data
  _links?: never;
}
```

## Monitoring and Observability

### Metrics Integration

**✅ Observable Events**

```typespec
// Good: Built-in observability
@extension("x-metrics", {
  track: ["count", "latency", "errors"],
  dimensions: ["eventType", "source", "region"],
  alerting: {
    errorRate: { threshold: 0.05, window: "5m" },
    latency: { p99: 500, window: "1m" }
  }
})
@extension("x-tracing", {
  spanName: "process-user-event",
  attributes: ["userId", "eventType", "source"]
})
@channel("user.events")
@subscribe
op processUserEvent(): UserEvent;
```

## Organization and Governance

### Team Boundaries

**✅ Clear Ownership**

```typespec
// Good: Clear team boundaries and ownership
namespace UserService {
  @tag("user-team")
  @contact("user-team@example.com")
  interface UserEvents {
    // Events owned by user team
    @publish op userRegistered(@body event: UserRegisteredEvent): void;
    @publish op userProfileUpdated(@body event: UserProfileUpdatedEvent): void;
  }
}

namespace OrderService {
  @tag("order-team")
  @contact("order-team@example.com")
  interface OrderEvents {
    // Events owned by order team
    @subscribe op handleUserRegistered(): UserRegisteredEvent;  // Consumer only
    @publish op orderCreated(@body event: OrderCreatedEvent): void;  // Owner
  }
}
```

### API Versioning Strategy

**✅ Semantic Versioning**

```typespec
// Good: Clear versioning strategy
@version("2023-12-01")
namespace UserEventsV2 {
  @added(Versions.v2_0)
  model UserRegisteredEvent {
    eventId: string;
    eventVersion: "2.0";

    // v1.0 fields
    userId: string;
    email: string;

    // v2.0 additions (optional for compatibility)
    @added(Versions.v2_0)
    phoneNumber?: string;

    @added(Versions.v2_0)
    preferences?: UserPreferences;
  }
}
```

## Common Anti-Patterns to Avoid

### ❌ God Objects

```typespec
// Bad: Monolithic event with everything
model MegaEvent {
  // 50+ properties mixing different concerns
  userData: User;
  orderData: Order;
  paymentData: Payment;
  shippingData: Shipping;
  auditData: AuditInfo;
  // ... many more
}
```

### ❌ Anemic Events

```typespec
// Bad: Events without business meaning
model DataChanged {
  table: string;
  id: string;
  operation: "insert" | "update" | "delete";
  data: Record<unknown>;
}
```

### ❌ Technology Leakage

```typespec
// Bad: Implementation details in API
@channel("mysql.users.table")  // Database-specific
@publish
op publishDatabaseChange(@body change: DatabaseChangeEvent): void;
```

### ❌ Poor Error Handling

```typespec
// Bad: Generic error handling
@channel("events")
@subscribe
op process(): unknown;  // No error information

// What happens when processing fails? Unknown!
```

## Summary Checklist

### Design Quality ✅

- [ ] Events represent business outcomes, not technical operations
- [ ] Clear domain language throughout
- [ ] Consistent naming conventions
- [ ] Proper schema evolution strategy
- [ ] Comprehensive validation rules

### Technical Excellence ✅

- [ ] Protocol configurations optimized for production
- [ ] Security properly configured
- [ ] Error handling comprehensive
- [ ] Performance considerations addressed
- [ ] Monitoring and observability integrated

### Team Success ✅

- [ ] Clear ownership and boundaries
- [ ] Comprehensive documentation
- [ ] Testing strategy defined
- [ ] Versioning approach established
- [ ] Governance processes in place

---

_Following these best practices ensures TypeSpec to AsyncAPI mappings result in maintainable, scalable, and business-valuable event-driven APIs that serve organizations effectively over time._
