# Schemas & Models: Advanced TypeSpec to AsyncAPI Transformation Patterns

## Overview

This document focuses on advanced schema transformation patterns, showing how TypeSpec models become AsyncAPI message schemas and component schemas. These patterns are essential for creating maintainable, evolvable event-driven APIs.

## Schema Organization Strategies

### Component Schema Architecture

```typespec
// TypeSpec: Reusable models
model BaseEntity {
  id: string;
  version: int32;
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

model User extends BaseEntity {
  email: string;
  name: string;
  status: "active" | "inactive" | "suspended";
}

model Order extends BaseEntity {
  userId: string;
  amount: decimal;
  currency: string;
  items: OrderItem[];
}

model OrderItem {
  productId: string;
  quantity: int32;
  unitPrice: decimal;
}
```

```yaml
# AsyncAPI: Component schema organization
components:
  schemas:
    # Base schemas for reuse
    BaseEntity:
      type: object
      properties:
        id:
          type: string
          format: uuid
          description: Unique entity identifier
        version:
          type: integer
          format: int32
          description: Entity version for optimistic locking
        createdAt:
          type: string
          format: date-time
          description: Entity creation timestamp
        updatedAt:
          type: string
          format: date-time
          description: Last modification timestamp
      required: [id, version, createdAt, updatedAt]

    # Domain entities
    User:
      allOf:
        - $ref: '#/components/schemas/BaseEntity'
        - type: object
          properties:
            email:
              type: string
              format: email
              description: User's email address
            name:
              type: string
              minLength: 1
              maxLength: 100
              description: User's display name
            status:
              type: string
              enum: [active, inactive, suspended]
              description: User account status
          required: [email, name, status]

    Order:
      allOf:
        - $ref: '#/components/schemas/BaseEntity'
        - type: object
          properties:
            userId:
              type: string
              format: uuid
              description: ID of the user who placed the order
            amount:
              type: string
              format: decimal
              pattern: '^\\d+\\.\\d{2}$'
              description: Total order amount
            currency:
              type: string
              pattern: '^[A-Z]{3}$'
              description: ISO 4217 currency code
            items:
              type: array
              items:
                $ref: '#/components/schemas/OrderItem'
              minItems: 1
              description: Items in the order
          required: [userId, amount, currency, items]

    OrderItem:
      type: object
      properties:
        productId:
          type: string
          format: uuid
          description: Product identifier
        quantity:
          type: integer
          format: int32
          minimum: 1
          description: Quantity ordered
        unitPrice:
          type: string
          format: decimal
          pattern: '^\\d+\\.\\d{2}$'
          description: Price per unit
      required: [productId, quantity, unitPrice]
```

## Message Schema Patterns

### Event Message Structure

```typespec
// TypeSpec: Event message models
@message({
  name: "UserRegisteredEvent",
  title: "User Registration Event",
  contentType: "application/json"
})
model UserRegisteredEvent {
  // Event metadata
  eventId: string;
  eventType: "user.registered";
  eventVersion: "1.0";
  occurredAt: utcDateTime;

  // Correlation and tracing
  correlationId?: string;
  causationId?: string;
  traceId?: string;

  // Event payload
  user: UserData;
  registrationContext: RegistrationContext;
}

model UserData {
  id: string;
  email: string;
  name: string;
  registeredAt: utcDateTime;
}

model RegistrationContext {
  source: "web" | "mobile" | "api";
  ipAddress: string;
  userAgent?: string;
  referrer?: string;
}
```

```yaml
# AsyncAPI: Event message with metadata
components:
  messages:
    UserRegisteredEvent:
      name: UserRegisteredEvent
      title: User Registration Event
      summary: Fired when a new user registers
      contentType: application/json
      headers:
        type: object
        properties:
          eventType:
            type: string
            const: user.registered
          eventVersion:
            type: string
            const: "1.0"
      payload:
        $ref: '#/components/schemas/UserRegisteredEventPayload'
      examples:
        - name: Web registration
          summary: User registering via web interface
          headers:
            eventType: user.registered
            eventVersion: "1.0"
          payload:
            eventId: "evt_01234567-89ab-cdef-0123-456789abcdef"
            eventType: user.registered
            eventVersion: "1.0"
            occurredAt: "2023-12-25T10:30:00Z"
            correlationId: "corr_123"
            user:
              id: "usr_01234567-89ab-cdef-0123-456789abcdef"
              email: "user@example.com"
              name: "John Doe"
              registeredAt: "2023-12-25T10:30:00Z"
            registrationContext:
              source: web
              ipAddress: "192.168.1.1"
              userAgent: "Mozilla/5.0..."

  schemas:
    UserRegisteredEventPayload:
      type: object
      properties:
        eventId:
          type: string
          format: uuid
          description: Unique event identifier
        eventType:
          type: string
          const: user.registered
          description: Event type discriminator
        eventVersion:
          type: string
          const: "1.0"
          description: Event schema version
        occurredAt:
          type: string
          format: date-time
          description: When the event occurred
        correlationId:
          type: string
          description: Request correlation identifier
        causationId:
          type: string
          description: ID of the event that caused this event
        traceId:
          type: string
          description: Distributed tracing identifier
        user:
          $ref: '#/components/schemas/UserData'
        registrationContext:
          $ref: '#/components/schemas/RegistrationContext'
      required: [eventId, eventType, eventVersion, occurredAt, user, registrationContext]
```

### Command Message Structure

```typespec
// TypeSpec: Command message models
@message({
  name: "CreateOrderCommand",
  title: "Create Order Command",
  contentType: "application/json"
})
model CreateOrderCommand {
  // Command metadata
  commandId: string;
  commandType: "order.create";
  commandVersion: "1.0";
  requestedAt: utcDateTime;
  requestedBy: string;

  // Idempotency and correlation
  idempotencyKey: string;
  correlationId?: string;

  // Command payload
  order: CreateOrderRequest;
  validationRules?: ValidationRule[];
}

model CreateOrderRequest {
  userId: string;
  items: OrderItemRequest[];
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod: PaymentMethodRequest;

  // Optional metadata
  couponCode?: string;
  notes?: string;
  priority: "normal" | "expedited" = "normal";
}

model OrderItemRequest {
  productId: string;
  @minValue(1)
  quantity: int32;

  // Optional customizations
  customizations?: Record<string>;
  specialInstructions?: string;
}
```

```yaml
# AsyncAPI: Command message structure
components:
  messages:
    CreateOrderCommand:
      name: CreateOrderCommand
      title: Create Order Command
      summary: Command to create a new order
      contentType: application/json
      headers:
        type: object
        properties:
          commandType:
            type: string
            const: order.create
          commandVersion:
            type: string
            const: "1.0"
          idempotencyKey:
            type: string
            description: Idempotency key for duplicate prevention
        required: [commandType, commandVersion, idempotencyKey]
      payload:
        $ref: '#/components/schemas/CreateOrderCommandPayload'

  schemas:
    CreateOrderCommandPayload:
      type: object
      properties:
        commandId:
          type: string
          format: uuid
        commandType:
          type: string
          const: order.create
        commandVersion:
          type: string
          const: "1.0"
        requestedAt:
          type: string
          format: date-time
        requestedBy:
          type: string
          description: ID of user requesting the command
        idempotencyKey:
          type: string
          description: Unique key for idempotency
        correlationId:
          type: string
          description: Request correlation ID
        order:
          $ref: '#/components/schemas/CreateOrderRequest'
        validationRules:
          type: array
          items:
            $ref: '#/components/schemas/ValidationRule'
      required: [commandId, commandType, commandVersion, requestedAt, requestedBy, idempotencyKey, order]
```

## Schema Evolution Patterns

### Versioned Schema Strategy

```typespec
// TypeSpec: Versioned event schemas
namespace Events.V1 {
  @message({ name: "UserCreated", version: "1.0" })
  model UserCreatedV1 {
    eventId: string;
    user: {
      id: string;
      email: string;
      name: string;
    };
  }
}

namespace Events.V2 {
  @message({ name: "UserCreated", version: "2.0" })
  model UserCreatedV2 {
    eventId: string;
    eventVersion: "2.0";
    user: {
      id: string;
      email: string;
      name: {
        first: string;
        last: string;
      };
      // New field - optional for backward compatibility
      preferences?: UserPreferences;
    };
    // New metadata
    metadata: EventMetadata;
  }

  model UserPreferences {
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      sms: boolean;
    };
  }

  model EventMetadata {
    source: string;
    timestamp: utcDateTime;
    version: string;
  }
}
```

```yaml
# AsyncAPI: Multiple schema versions
components:
  schemas:
    # Version 1.0 - Legacy support
    UserCreatedV1:
      type: object
      properties:
        eventId:
          type: string
          format: uuid
        user:
          type: object
          properties:
            id:
              type: string
              format: uuid
            email:
              type: string
              format: email
            name:
              type: string
          required: [id, email, name]
      required: [eventId, user]
      x-schema-version: "1.0"

    # Version 2.0 - Current version
    UserCreatedV2:
      type: object
      properties:
        eventId:
          type: string
          format: uuid
        eventVersion:
          type: string
          const: "2.0"
        user:
          type: object
          properties:
            id:
              type: string
              format: uuid
            email:
              type: string
              format: email
            name:
              type: object
              properties:
                first:
                  type: string
                last:
                  type: string
              required: [first, last]
            preferences:
              $ref: '#/components/schemas/UserPreferences'
          required: [id, email, name]
        metadata:
          $ref: '#/components/schemas/EventMetadata'
      required: [eventId, eventVersion, user, metadata]
      x-schema-version: "2.0"

  messages:
    UserCreated:
      name: UserCreated
      title: User Created Event
      payload:
        oneOf:
          - $ref: '#/components/schemas/UserCreatedV1'
          - $ref: '#/components/schemas/UserCreatedV2'
        discriminator:
          propertyName: eventVersion
          mapping:
            "1.0": '#/components/schemas/UserCreatedV1'
            "2.0": '#/components/schemas/UserCreatedV2'
```

### Additive Evolution Pattern

```typespec
// TypeSpec: Additive changes only
model UserEvent {
  // Core fields (never removed)
  eventId: string;
  userId: string;
  timestamp: utcDateTime;

  // V1.0 fields
  email: string;
  name: string;

  // V1.1 additions (all optional)
  phoneNumber?: string;

  // V1.2 additions (all optional)
  address?: Address;
  preferences?: UserPreferences;

  // V1.3 additions (all optional)
  socialProfiles?: SocialProfile[];
  verificationStatus?: "pending" | "verified" | "rejected";
}
```

```yaml
# AsyncAPI: Additive-only schema
UserEvent:
  type: object
  properties:
    # Core fields - present in all versions
    eventId:
      type: string
      format: uuid
      description: Unique event identifier
    userId:
      type: string
      format: uuid
      description: User identifier
    timestamp:
      type: string
      format: date-time
      description: Event occurrence time

    # V1.0 fields - always required
    email:
      type: string
      format: email
    name:
      type: string

    # V1.1 additions - optional
    phoneNumber:
      type: string
      x-schema-added-in: "1.1"

    # V1.2 additions - optional
    address:
      $ref: '#/components/schemas/Address'
      x-schema-added-in: "1.2"
    preferences:
      $ref: '#/components/schemas/UserPreferences'
      x-schema-added-in: "1.2"

    # V1.3 additions - optional
    socialProfiles:
      type: array
      items:
        $ref: '#/components/schemas/SocialProfile'
      x-schema-added-in: "1.3"
    verificationStatus:
      type: string
      enum: [pending, verified, rejected]
      x-schema-added-in: "1.3"

  required: [eventId, userId, timestamp, email, name]
  x-schema-version: "1.3"
  x-schema-evolution: "additive-only"
```

## Polymorphic Schema Patterns

### Abstract Base Types

```typespec
// TypeSpec: Polymorphic event hierarchy
@discriminator("eventType")
union DomainEvent {
  userEvent: UserEvent,
  orderEvent: OrderEvent,
  paymentEvent: PaymentEvent,
  systemEvent: SystemEvent
}

@discriminator("type")
union UserEvent {
  created: UserCreatedEvent,
  updated: UserUpdatedEvent,
  deleted: UserDeletedEvent
}

model UserCreatedEvent {
  eventType: "domain";
  type: "user.created";
  eventId: string;
  timestamp: utcDateTime;
  user: User;
}

model UserUpdatedEvent {
  eventType: "domain";
  type: "user.updated";
  eventId: string;
  timestamp: utcDateTime;
  userId: string;
  changes: UserChangeSet;
}

model UserChangeSet {
  changedFields: string[];
  previousValues: Record<unknown>;
  newValues: Record<unknown>;
}
```

```yaml
# AsyncAPI: Polymorphic event system
components:
  schemas:
    # Root discriminated union
    DomainEvent:
      oneOf:
        - $ref: '#/components/schemas/UserEvent'
        - $ref: '#/components/schemas/OrderEvent'
        - $ref: '#/components/schemas/PaymentEvent'
        - $ref: '#/components/schemas/SystemEvent'
      discriminator:
        propertyName: eventType
        mapping:
          user: '#/components/schemas/UserEvent'
          order: '#/components/schemas/OrderEvent'
          payment: '#/components/schemas/PaymentEvent'
          system: '#/components/schemas/SystemEvent'

    # User event discriminated union
    UserEvent:
      oneOf:
        - $ref: '#/components/schemas/UserCreatedEvent'
        - $ref: '#/components/schemas/UserUpdatedEvent'
        - $ref: '#/components/schemas/UserDeletedEvent'
      discriminator:
        propertyName: type
        mapping:
          user.created: '#/components/schemas/UserCreatedEvent'
          user.updated: '#/components/schemas/UserUpdatedEvent'
          user.deleted: '#/components/schemas/UserDeletedEvent'

    # Concrete event types
    UserCreatedEvent:
      type: object
      properties:
        eventType:
          type: string
          const: user
        type:
          type: string
          const: user.created
        eventId:
          type: string
          format: uuid
        timestamp:
          type: string
          format: date-time
        user:
          $ref: '#/components/schemas/User'
      required: [eventType, type, eventId, timestamp, user]

    UserUpdatedEvent:
      type: object
      properties:
        eventType:
          type: string
          const: user
        type:
          type: string
          const: user.updated
        eventId:
          type: string
          format: uuid
        timestamp:
          type: string
          format: date-time
        userId:
          type: string
          format: uuid
        changes:
          $ref: '#/components/schemas/UserChangeSet'
      required: [eventType, type, eventId, timestamp, userId, changes]
```

## Complex Validation Patterns

### Cross-Field Validation

```typespec
// TypeSpec: Models with complex validation
model PaymentRequest {
  @minValue(0.01)
  amount: decimal;

  currency: "USD" | "EUR" | "GBP";

  method: PaymentMethod;

  // Conditional validation based on method
  cardDetails?: CardDetails;
  bankDetails?: BankDetails;
  digitalWalletDetails?: DigitalWalletDetails;
}

@discriminator("type")
union PaymentMethod {
  card: CardPayment,
  bank: BankPayment,
  wallet: WalletPayment
}

model CardPayment {
  type: "card";
  provider: "visa" | "mastercard" | "amex";
}

model CardDetails {
  @pattern("^[0-9]{4}$")
  lastFourDigits: string;

  @minLength(2)
  @maxLength(2)
  expiryMonth: string;

  @minLength(4)
  @maxLength(4)
  expiryYear: string;

  @pattern("^[A-Za-z ]+$")
  cardholderName: string;
}
```

```yaml
# AsyncAPI: Complex validation schemas
components:
  schemas:
    PaymentRequest:
      type: object
      properties:
        amount:
          type: string
          format: decimal
          pattern: '^\\d+\\.\\d{2}$'
          description: Amount to charge (minimum 0.01)
          x-minimum-value: "0.01"
        currency:
          type: string
          enum: [USD, EUR, GBP]
          description: ISO 4217 currency code
        method:
          $ref: '#/components/schemas/PaymentMethod'
        cardDetails:
          $ref: '#/components/schemas/CardDetails'
          description: Required when method.type is 'card'
        bankDetails:
          $ref: '#/components/schemas/BankDetails'
          description: Required when method.type is 'bank'
        digitalWalletDetails:
          $ref: '#/components/schemas/DigitalWalletDetails'
          description: Required when method.type is 'wallet'
      required: [amount, currency, method]
      # JSON Schema doesn't support conditional requirements natively
      # Implementation should validate method-specific details
      x-validation-rules:
        - if:
            properties:
              method:
                properties:
                  type:
                    const: card
          then:
            required: [cardDetails]
        - if:
            properties:
              method:
                properties:
                  type:
                    const: bank
          then:
            required: [bankDetails]
        - if:
            properties:
              method:
                properties:
                  type:
                    const: wallet
          then:
            required: [digitalWalletDetails]

    CardDetails:
      type: object
      properties:
        lastFourDigits:
          type: string
          pattern: '^[0-9]{4}$'
          description: Last four digits of the card
        expiryMonth:
          type: string
          pattern: '^(0[1-9]|1[0-2])$'
          description: Expiry month (01-12)
        expiryYear:
          type: string
          pattern: '^20[2-9][0-9]$'
          description: Expiry year (2020+)
        cardholderName:
          type: string
          pattern: '^[A-Za-z ]+$'
          minLength: 2
          maxLength: 50
          description: Name on the card
      required: [lastFourDigits, expiryMonth, expiryYear, cardholderName]
```

## Schema Composition Patterns

### Mixin Patterns

```typespec
// TypeSpec: Mixin models
model Timestamped {
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

model Versioned {
  version: int32;
  etag: string;
}

model Auditable {
  createdBy: string;
  updatedBy: string;
  auditTrail: AuditEntry[];
}

// Composed entity
model Product is Timestamped, Versioned, Auditable {
  id: string;
  name: string;
  description: string;
  price: decimal;
  category: ProductCategory;
}

model AuditEntry {
  action: "create" | "update" | "delete";
  timestamp: utcDateTime;
  userId: string;
  changes: Record<unknown>;
}
```

```yaml
# AsyncAPI: Composition with allOf
components:
  schemas:
    # Reusable trait schemas
    Timestamped:
      type: object
      properties:
        createdAt:
          type: string
          format: date-time
          description: Creation timestamp
        updatedAt:
          type: string
          format: date-time
          description: Last update timestamp
      required: [createdAt, updatedAt]

    Versioned:
      type: object
      properties:
        version:
          type: integer
          format: int32
          description: Version number for optimistic locking
        etag:
          type: string
          description: Entity tag for caching
      required: [version, etag]

    Auditable:
      type: object
      properties:
        createdBy:
          type: string
          format: uuid
          description: ID of user who created the entity
        updatedBy:
          type: string
          format: uuid
          description: ID of user who last updated the entity
        auditTrail:
          type: array
          items:
            $ref: '#/components/schemas/AuditEntry'
          description: Complete audit trail
      required: [createdBy, updatedBy, auditTrail]

    # Composed entity using allOf
    Product:
      allOf:
        - $ref: '#/components/schemas/Timestamped'
        - $ref: '#/components/schemas/Versioned'
        - $ref: '#/components/schemas/Auditable'
        - type: object
          properties:
            id:
              type: string
              format: uuid
              description: Unique product identifier
            name:
              type: string
              minLength: 1
              maxLength: 100
              description: Product name
            description:
              type: string
              maxLength: 1000
              description: Product description
            price:
              type: string
              format: decimal
              pattern: '^\\d+\\.\\d{2}$'
              description: Product price
            category:
              $ref: '#/components/schemas/ProductCategory'
          required: [id, name, price, category]
```

## Performance-Optimized Schema Patterns

### Lazy Loading Schema

```typespec
// TypeSpec: Schemas optimized for lazy loading
model OrderSummary {
  id: string;
  userId: string;
  status: OrderStatus;
  totalAmount: decimal;
  itemCount: int32;
  createdAt: utcDateTime;

  // Lazy-loaded details (separate message/endpoint)
  _links?: {
    details: string;  // URL to get full details
    items: string;    // URL to get order items
    history: string;  // URL to get order history
  };
}

model OrderDetails extends OrderSummary {
  // Full order information
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  history: OrderHistoryEntry[];

  // Remove links since we have full data
  _links?: never;
}
```

```yaml
# AsyncAPI: Optimized for different use cases
components:
  schemas:
    # Lightweight summary for lists
    OrderSummary:
      type: object
      properties:
        id:
          type: string
          format: uuid
        userId:
          type: string
          format: uuid
        status:
          $ref: '#/components/schemas/OrderStatus'
        totalAmount:
          type: string
          format: decimal
        itemCount:
          type: integer
          format: int32
          minimum: 1
        createdAt:
          type: string
          format: date-time
        _links:
          type: object
          properties:
            details:
              type: string
              format: uri
              description: Link to full order details
            items:
              type: string
              format: uri
              description: Link to order items
            history:
              type: string
              format: uri
              description: Link to order history
          description: HATEOAS links for lazy loading
      required: [id, userId, status, totalAmount, itemCount, createdAt]
      x-schema-purpose: "summary"

    # Full details for individual access
    OrderDetails:
      allOf:
        - $ref: '#/components/schemas/OrderSummary'
        - type: object
          properties:
            items:
              type: array
              items:
                $ref: '#/components/schemas/OrderItem'
              description: Complete order items
            shippingAddress:
              $ref: '#/components/schemas/Address'
            billingAddress:
              $ref: '#/components/schemas/Address'
            paymentMethod:
              $ref: '#/components/schemas/PaymentMethod'
            history:
              type: array
              items:
                $ref: '#/components/schemas/OrderHistoryEntry'
              description: Complete order history
          required: [items, shippingAddress, paymentMethod, history]
      x-schema-purpose: "details"
```

## Schema Testing and Validation Patterns

### Schema Examples and Test Cases

```typespec
// TypeSpec: Well-documented models with examples
@example({
  eventId: "evt_123",
  eventType: "order.created",
  order: {
    id: "ord_456",
    userId: "usr_789",
    amount: "99.99",
    currency: "USD",
    items: [{
      productId: "prod_111",
      quantity: 2,
      unitPrice: "49.99"
    }]
  }
})
model OrderCreatedEvent {
  eventId: string;
  eventType: "order.created";
  timestamp: utcDateTime;
  order: OrderEventData;
}

model OrderEventData {
  id: string;
  userId: string;
  @pattern("^\\d+\\.\\d{2}$")
  amount: string;
  @pattern("^[A-Z]{3}$")
  currency: string;
  items: OrderItemEventData[];
}
```

```yaml
# AsyncAPI: Comprehensive examples
components:
  schemas:
    OrderCreatedEvent:
      type: object
      properties:
        eventId:
          type: string
          format: uuid
        eventType:
          type: string
          const: order.created
        timestamp:
          type: string
          format: date-time
        order:
          $ref: '#/components/schemas/OrderEventData'
      required: [eventId, eventType, timestamp, order]
      examples:
        - eventId: "evt_01234567-89ab-cdef-0123-456789abcdef"
          eventType: "order.created"
          timestamp: "2023-12-25T10:30:00Z"
          order:
            id: "ord_01234567-89ab-cdef-0123-456789abcdef"
            userId: "usr_01234567-89ab-cdef-0123-456789abcdef"
            amount: "99.99"
            currency: "USD"
            items:
              - productId: "prod_01234567-89ab-cdef-0123-456789abcdef"
                quantity: 2
                unitPrice: "49.99"

  messages:
    OrderCreatedEvent:
      name: OrderCreatedEvent
      payload:
        $ref: '#/components/schemas/OrderCreatedEvent'
      examples:
        - name: Standard order creation
          summary: Typical order with single item
          payload:
            eventId: "evt_01234567-89ab-cdef-0123-456789abcdef"
            eventType: "order.created"
            timestamp: "2023-12-25T10:30:00Z"
            order:
              id: "ord_01234567-89ab-cdef-0123-456789abcdef"
              userId: "usr_01234567-89ab-cdef-0123-456789abcdef"
              amount: "99.99"
              currency: "USD"
              items:
                - productId: "prod_01234567-89ab-cdef-0123-456789abcdef"
                  quantity: 2
                  unitPrice: "49.99"
        - name: Multi-item order
          summary: Order with multiple different items
          payload:
            eventId: "evt_98765432-10ab-cdef-0123-456789abcdef"
            eventType: "order.created"
            timestamp: "2023-12-25T14:15:00Z"
            order:
              id: "ord_98765432-10ab-cdef-0123-456789abcdef"
              userId: "usr_01234567-89ab-cdef-0123-456789abcdef"
              amount: "149.97"
              currency: "USD"
              items:
                - productId: "prod_111"
                  quantity: 1
                  unitPrice: "49.99"
                - productId: "prod_222"
                  quantity: 2
                  unitPrice: "49.99"
```

## Schema Documentation Best Practices

### 1. Consistent Naming

- Use clear, descriptive names: `UserRegisteredEvent`, `OrderCreatedCommand`
- Follow domain language: `Product`, `Customer`, `ShippingAddress`
- Be explicit about purpose: `CreateUserRequest` vs `UserCreatedEvent`

### 2. Comprehensive Descriptions

- Document business meaning, not just structure
- Include examples for complex formats
- Explain relationships and dependencies

### 3. Evolution Strategy

- Plan for backward compatibility from day one
- Use additive-only changes when possible
- Version schemas with clear migration paths

### 4. Validation Completeness

- Include all business rules as constraints
- Use format validators for structured data
- Document validation errors clearly

### 5. Performance Considerations

- Design for message size optimization
- Use references to avoid duplication
- Consider lazy loading patterns for large objects

## Next Steps

Understanding schema transformation patterns enables:

- **Decorator Mapping** - Specific TypeSpec decorator implementations
- **Protocol Bindings** - Protocol-specific schema adaptations
- **Advanced Patterns** - Complex event sourcing and CQRS patterns
- **Testing Strategies** - Schema validation and compatibility testing

---

_These schema patterns form the backbone of maintainable, evolvable event-driven APIs, ensuring messages are both machine-readable and human-understandable._
