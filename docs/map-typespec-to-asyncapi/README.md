# TypeSpec to AsyncAPI Mapping Guide

Comprehensive documentation for mapping TypeSpec definitions to AsyncAPI 3.0 specifications using the TypeSpec AsyncAPI emitter.

## Quick Navigation

| Document                                                   | Focus                  | Key Topics                                                  |
| ---------------------------------------------------------- | ---------------------- | ----------------------------------------------------------- |
| **[01-core-concepts.md](01-core-concepts.md)**             | Foundational mapping   | Services→Applications, Namespaces→Channels, Philosophy      |
| **[02-data-types.md](02-data-types.md)**                   | Type system mapping    | Primitives, Objects, Arrays, Unions, Enums → JSON Schema    |
| **[03-operations-channels.md](03-operations-channels.md)** | Event-driven patterns  | @publish/@subscribe → Channels/Operations                   |
| **[04-schemas-models.md](04-schemas-models.md)**           | Schema transformation  | Event Sourcing, Versioning, Message Envelopes               |
| **[05-decorators.md](05-decorators.md)**                   | Decorator mapping      | @channel, @protocol, @security, @server → AsyncAPI features |
| **[06-protocol-bindings.md](06-protocol-bindings.md)**     | Protocol configuration | Kafka, AMQP, WebSocket, MQTT, HTTP, SNS/SQS bindings        |
| **[07-advanced-patterns.md](07-advanced-patterns.md)**     | Complex architectures  | Event Sourcing, CQRS, Sagas, Stream Processing              |
| **[08-best-practices.md](08-best-practices.md)**           | Design guidelines      | Conventions, Performance, Security, Anti-patterns           |
| **[09-examples.md](09-examples.md)**                       | Real-world examples    | E-Commerce, IoT, Financial complete implementations         |

## Quick Reference

### Essential TypeSpec Decorators

```typescript
@service({ title: "Order Service" })      // → AsyncAPI info section
@channel("orders/{orderId}")              // → AsyncAPI channel definition
@publish                                  // → AsyncAPI "send" operation
@subscribe                               // → AsyncAPI "receive" operation
@message("OrderCreated")                 // → AsyncAPI message component
@protocol("kafka", { ... })              // → AsyncAPI protocol bindings
@security("oauth2", { ... })             // → AsyncAPI security schemes
@server("production", { ... })           // → AsyncAPI server definition
```

### Common Type Mappings

| TypeSpec            | AsyncAPI JSON Schema                            | Notes             |
| ------------------- | ----------------------------------------------- | ----------------- |
| `string`            | `{"type": "string"}`                            | Basic string type |
| `int32`             | `{"type": "integer", "format": "int32"}`        | 32-bit integer    |
| `Record<string, T>` | `{"type": "object", "additionalProperties": T}` | Dynamic objects   |
| `T[]`               | `{"type": "array", "items": T}`                 | Arrays            |
| `T \| U`            | `{"oneOf": [T, U]}`                             | Union types       |

### Message Pattern Templates

#### Event Notification

```typescript
@message("UserRegistered")
model UserRegistered {
  userId: string;
  email: string;
  registeredAt: utcDateTime;
}
```

#### Command Message

```typescript
@message("CreateOrder")
model CreateOrder {
  customerId: string;
  items: OrderItem[];
  metadata: RequestMetadata;
}
```

#### Event Sourcing Event

```typescript
@message("OrderCreated")
model OrderCreated extends DomainEvent {
  aggregateId: string;
  aggregateVersion: int32;
  eventType: "OrderCreated";
  payload: OrderCreatedPayload;
}
```

### Protocol Quick Setup

#### Kafka Configuration

```typescript
@protocol("kafka", {
  topic: "orders",
  partitionKey: "customerId",
  replicationFactor: 3
})
```

#### AMQP Configuration

```typescript
@protocol("amqp", {
  exchange: "orders.exchange",
  routingKey: "order.created",
  deliveryMode: 2
})
```

#### WebSocket Configuration

```typescript
@protocol("ws", {
  method: "GET",
  query: {
    customerId: "string"
  }
})
```

## Getting Started

1. **Start with [Core Concepts](01-core-concepts.md)** - Understand the philosophical mapping between TypeSpec and AsyncAPI
2. **Review [Data Types](02-data-types.md)** - Learn how TypeScript-style types map to JSON Schema
3. **Explore [Operations & Channels](03-operations-channels.md)** - Understand event-driven operation patterns
4. **Study [Examples](09-examples.md)** - See complete real-world implementations
5. **Reference [Best Practices](08-best-practices.md)** - Follow proven design patterns

## Common Workflows

### Defining a New Event-Driven Service

1. Define the service with `@service`
2. Create message models with `@message`
3. Define channels with `@channel`
4. Add operations with `@publish`/`@subscribe`
5. Configure protocols with `@protocol`
6. Add security with `@security`

### Adding Protocol Support

1. Review [Protocol Bindings](06-protocol-bindings.md) for your target protocol
2. Add `@protocol` decorators to channels
3. Configure protocol-specific settings
4. Test with AsyncAPI validation

### Implementing Advanced Patterns

1. Check [Advanced Patterns](07-advanced-patterns.md) for your architecture
2. Review [Schema Models](04-schemas-models.md) for data patterns
3. Follow [Best Practices](08-best-practices.md) for implementation
4. Validate against [Examples](09-examples.md)

## Architecture Patterns

### Event Sourcing

- Domain events as first-class messages
- Aggregate versioning and conflict resolution
- Event store as source of truth
- See: [Advanced Patterns](07-advanced-patterns.md#event-sourcing)

### CQRS (Command Query Responsibility Segregation)

- Separate command and query channels
- Command validation and event emission
- Read model projection patterns
- See: [Advanced Patterns](07-advanced-patterns.md#cqrs-patterns)

### Saga Orchestration

- Long-running business processes
- Compensation and rollback handling
- State machine coordination
- See: [Advanced Patterns](07-advanced-patterns.md#saga-patterns)

## Validation & Testing

### AsyncAPI Validation

```bash
# Compile TypeSpec to AsyncAPI
npx tsp compile --emit @typespec/asyncapi

# Validate generated AsyncAPI
npx @asyncapi/parser validate asyncapi.json
```

### Schema Testing

```typescript
// Test message schema compliance
const message = { userId: "123", email: "user@example.com" };
const isValid = validateSchema("UserRegistered", message);
```

## Performance Considerations

- **Channel Design**: Optimize partition keys for Kafka
- **Message Size**: Keep messages under protocol limits
- **Schema Evolution**: Use backward-compatible changes
- **Connection Management**: Pool connections for high throughput

## Security Patterns

- **Authentication**: OAuth2, API Keys, mutual TLS
- **Authorization**: Role-based access control
- **Message Encryption**: Transport and message-level security
- **Audit Logging**: Comprehensive event tracking

## Migration Strategies

### From OpenAPI to AsyncAPI

1. Identify async operations in OpenAPI
2. Convert webhooks to AsyncAPI channels
3. Transform callbacks to publish/subscribe patterns
4. Add protocol bindings for message brokers

### From Legacy Message Systems

1. Document existing message formats
2. Create TypeSpec models for messages
3. Add AsyncAPI decorators progressively
4. Validate schema compatibility

## Community & Resources

- **TypeSpec Documentation**: [typespec.io](https://typespec.io)
- **AsyncAPI Specification**: [asyncapi.com](https://asyncapi.com)
- **GitHub Repository**: TypeSpec AsyncAPI Emitter
- **Example Projects**: See [Examples](09-examples.md)

## Troubleshooting

### Common Issues

1. **Schema Validation Errors**: Check type mappings in [Data Types](02-data-types.md)
2. **Protocol Configuration**: Review [Protocol Bindings](06-protocol-bindings.md)
3. **Message Structure**: Validate against [Schema Models](04-schemas-models.md)
4. **Performance Issues**: Apply [Best Practices](08-best-practices.md)

### Debug Commands

```bash
# Verbose compilation
npx tsp compile --emit @typespec/asyncapi --verbose

# Schema validation
npx @asyncapi/parser validate --verbose asyncapi.json

# Type checking
npx tsc --noEmit --strict
```

---

**Next Steps**: Choose the document that matches your current need, or start with [Core Concepts](01-core-concepts.md) for a complete introduction to TypeSpec-AsyncAPI mapping patterns.
