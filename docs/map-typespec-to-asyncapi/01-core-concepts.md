# Core Concepts: TypeSpec to AsyncAPI Mapping

## Overview

This document establishes the foundational mapping between TypeSpec and AsyncAPI, explaining how the core concepts and architectural patterns of each technology correspond to create effective event-driven API specifications.

## Philosophical Alignment

### TypeSpec: API-First Design Language
- **Purpose**: Type-safe API definition with multi-protocol support
- **Paradigm**: Declarative, strongly-typed, code-generation focused
- **Scope**: HTTP REST, gRPC, JSON Schema, and event-driven APIs
- **Strength**: Type safety, reusability, tooling integration

### AsyncAPI: Event-Driven Architecture Specification
- **Purpose**: Standardized description of event-driven and asynchronous APIs
- **Paradigm**: Message-oriented, channel-based, protocol-agnostic
- **Scope**: Message queues, streaming, pub/sub, WebSockets, IoT
- **Strength**: Event flow documentation, protocol bindings, tooling ecosystem

## Core Concept Mappings

### 1. Application Structure

| TypeSpec Concept | AsyncAPI Equivalent | Mapping Strategy |
|-----------------|-------------------|------------------|
| `@service()` namespace | AsyncAPI root document | Service becomes the application root |
| Nested namespaces | Logical channel organization | Namespaces structure channel groupings |
| Multiple services | Multiple AsyncAPI documents | One service = one AsyncAPI spec |

#### Example:
```typespec
// TypeSpec
@service({ title: "User Events", version: "1.0.0" })
namespace UserManagement {
  namespace Events {
    // User-related events
  }
  namespace Notifications {
    // Notification events
  }
}
```

```yaml
# AsyncAPI
asyncapi: 3.0.0
info:
  title: User Events
  version: 1.0.0
channels:
  userEvents:
    # Events from UserManagement.Events
  userNotifications:
    # Events from UserManagement.Notifications
```

### 2. Type System Mapping

| TypeSpec Type | AsyncAPI Schema | Notes |
|--------------|----------------|-------|
| `model` | `components/schemas` | Direct 1:1 mapping |
| `interface` | Channel organization | Groups related operations |
| `operation` | `operations` + `channels` | Creates both operation and channel |
| `enum` | JSON Schema `enum` | Direct type mapping |
| `union` | `oneOf` / `anyOf` | Depends on discriminator |

### 3. Communication Patterns

#### TypeSpec Request/Response → AsyncAPI Message Flow

**TypeSpec Perspective:**
- Operations define message exchange
- Return types become message payloads
- Parameters become message headers/properties

**AsyncAPI Perspective:**
- Channels define communication paths
- Operations define message direction (send/receive)
- Messages define payload structure

#### Pattern Mapping:
```typespec
// TypeSpec: Event Publishing
@channel("user.events")
@publish
op userRegistered(@body user: User): void;

// TypeSpec: Event Subscription
@channel("user.events")
@subscribe
op handleUserRegistered(): User;
```

```yaml
# AsyncAPI Result
channels:
  user.events:
    address: user.events
    messages:
      userMessage:
        payload:
          $ref: '#/components/schemas/User'

operations:
  userRegistered:
    action: send
    channel:
      $ref: '#/channels/user.events'
  
  handleUserRegistered:
    action: receive
    channel:
      $ref: '#/channels/user.events'
```

### 4. Metadata and Documentation

| TypeSpec Decorator | AsyncAPI Field | Purpose |
|-------------------|----------------|---------|
| `@doc()` | `description` | Human-readable documentation |
| `@summary()` | `summary` | Brief description |
| `@example()` | `examples` | Usage examples |
| `@deprecated()` | `deprecated: true` | Deprecation marking |

### 5. Server and Protocol Configuration

```typespec
// TypeSpec
@server("kafka://localhost:9092", "Kafka Development")
@server("wss://events.example.com", "WebSocket Production")
namespace EventSystem;
```

```yaml
# AsyncAPI
servers:
  development:
    host: localhost:9092
    protocol: kafka
    description: Kafka Development
  production:
    host: events.example.com
    protocol: wss
    description: WebSocket Production
```

## Architectural Principles

### 1. Message-Centric Design
- **TypeSpec Focus**: Operations and their input/output types
- **AsyncAPI Focus**: Messages flowing through channels
- **Mapping Strategy**: TypeSpec operations generate AsyncAPI messages and operations

### 2. Protocol Abstraction
- **TypeSpec Approach**: Protocol-agnostic definitions with emitter-specific output
- **AsyncAPI Approach**: Protocol-specific bindings within generic structure
- **Mapping Strategy**: TypeSpec `@protocol` decorators → AsyncAPI bindings

### 3. Schema Reusability
- **TypeSpec**: Models and templates enable reuse across operations
- **AsyncAPI**: Components section enables schema reuse across messages
- **Mapping Strategy**: TypeSpec models → `components/schemas`

## Semantic Differences

### 1. Synchronous vs Asynchronous Mindset

**TypeSpec:**
```typespec
// Request/response thinking
op getUser(id: string): User;
```

**AsyncAPI:**
```typespec
// Event-driven thinking
@channel("user.query")
@publish
op requestUser(@body query: UserQuery): void;

@channel("user.response")
@subscribe
op receiveUser(): UserResult;
```

### 2. Error Handling Philosophy

**TypeSpec:**
- Explicit error types in operation signatures
- HTTP status code patterns

**AsyncAPI:**
- Error messages as separate message types
- Dead letter queues and retry patterns

### 3. Versioning Strategies

**TypeSpec:**
```typespec
@versioned(Versions)
namespace API {
  @added(Versions.v2)
  op newFeature(): Result;
}
```

**AsyncAPI:**
```yaml
asyncapi: 3.0.0
info:
  version: 2.0.0
channels:
  newFeature:
    # Available from version 2.0.0
```

## Best Practices for Mapping

### 1. Namespace Organization
- Use TypeSpec namespaces to logically group related channels
- Map namespace hierarchy to AsyncAPI channel naming conventions
- Consider message routing patterns when organizing namespaces

### 2. Operation Naming
- Use verb-noun patterns: `userCreated`, `orderProcessed`
- Distinguish between commands (actions) and events (results)
- Include direction context: `publishOrder`, `receiveConfirmation`

### 3. Model Design
- Design models for message payloads, not just API resources
- Include metadata fields: timestamps, correlation IDs, trace IDs
- Consider serialization constraints for target protocols

### 4. Documentation Strategy
- Document message flow patterns, not just individual messages
- Include timing expectations and ordering guarantees
- Explain error handling and retry policies

## Common Mapping Challenges

### 1. Request/Reply Patterns
TypeSpec's synchronous operation model needs careful mapping to AsyncAPI's asynchronous patterns.

**Solution:**
```typespec
// Use correlation IDs and separate channels
@channel("orders.commands")
@publish
op placeOrder(@body order: OrderRequest): void;

@channel("orders.responses")
@subscribe
op orderConfirmation(): OrderResponse;
```

### 2. Streaming Operations
TypeSpec doesn't natively express streaming, requiring custom patterns.

**Solution:**
```typespec
// Use protocol decorators to indicate streaming
@protocol({ type: "kafka", streaming: true })
@channel("data.stream")
@subscribe
op processDataStream(): DataEvent;
```

### 3. Protocol-Specific Features
Some AsyncAPI features don't have TypeSpec equivalents.

**Solution:**
```typespec
// Use extension decorators for protocol-specific features
@protocol({
  type: "amqp",
  exchange: "user.events",
  routingKey: "user.created",
  durable: true
})
op publishUserEvent(@body user: User): void;
```

## Next Steps

This foundational mapping enables:
- **Data Type Mappings** - Detailed type system transformations
- **Operation Patterns** - Event-driven operation mapping strategies  
- **Schema Design** - Message and payload structure patterns
- **Decorator Usage** - Specific decorator to AsyncAPI feature mappings
- **Protocol Integration** - Protocol-specific binding configurations

---

*This document establishes the conceptual foundation. Subsequent documents dive deeper into specific mapping patterns and implementation details.*