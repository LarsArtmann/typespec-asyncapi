# Getting Started with TypeSpec AsyncAPI Emitter

Welcome to the TypeSpec AsyncAPI Emitter! This guide will get you up and running with generating AsyncAPI 3.0 specifications from TypeSpec definitions.

## Prerequisites

- **Node.js 20+** - Modern JavaScript runtime
- **TypeScript knowledge** - Basic familiarity with TypeScript
- **Event-driven architecture** - Understanding of async messaging patterns

## Quick Installation

```bash
# Install TypeSpec AsyncAPI emitter
npm install @larsartmann/typespec-asyncapi

# Install TypeSpec compiler (if not already installed)
npm install @typespec/compiler

# Optional: Install AsyncAPI CLI for validation
npm install -g @asyncapi/cli
```

## Your First AsyncAPI Spec

### 1. Create a TypeSpec File

Create `user-events.tsp`:

```typespec
import "@larsartmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

// Define server configuration
@server("production", {
  url: "kafka://events.company.com:9092",
  protocol: "kafka",
  description: "Production Kafka cluster"
})
@server("development", {
  url: "ws://localhost:8080/events",
  protocol: "websockets",
  description: "Development WebSocket server"
})
namespace UserEvents;

// Define message payload models
model UserCreatedPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: utcDateTime;
  accountType: "free" | "premium" | "enterprise";
  metadata?: {
    source: "web" | "mobile" | "api";
    campaign?: string;
  };
}

model UserUpdatedPayload {
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  updatedAt: utcDateTime;
  changes: string[];
}

// Define channels and operations
@channel("user.lifecycle.created")
@message({
  name: "UserCreatedEvent",
  title: "User Created",
  description: "Emitted when a new user account is created",
  contentType: "application/json"
})
@publish
op publishUserCreated(): UserCreatedPayload;

@channel("user.lifecycle.updated")
@message({
  name: "UserUpdatedEvent", 
  title: "User Updated",
  description: "Emitted when user information is updated"
})
@subscribe
op subscribeToUserUpdates(): UserUpdatedPayload;
```

### 2. Generate AsyncAPI Specification

```bash
# Compile TypeSpec to AsyncAPI
npx tsp compile user-events.tsp --emit @larsartmann/typespec-asyncapi

# Check output directory
ls tsp-output/@larsartmann/typespec-asyncapi/
# Should show: asyncapi.json, asyncapi.yaml
```

### 3. Validate Generated Specification

```bash
# Validate with AsyncAPI CLI (if installed)
asyncapi validate tsp-output/@larsartmann/typespec-asyncapi/asyncapi.yaml

# Expected output:
# ✓ File tsp-output/@larsartmann/typespec-asyncapi/asyncapi.yaml is valid AsyncAPI 3.0.0 document.
```

## Generated Output

Your TypeSpec definition will generate a complete AsyncAPI 3.0 specification:

```yaml
asyncapi: 3.0.0
info:
  title: UserEvents
  version: 1.0.0
servers:
  production:
    host: events.company.com:9092
    protocol: kafka
    description: Production Kafka cluster
  development:
    host: localhost:8080
    protocol: websockets
    pathname: /events
    description: Development WebSocket server
channels:
  'user.lifecycle.created':
    messages:
      UserCreatedEvent:
        name: UserCreatedEvent
        title: User Created
        description: Emitted when a new user account is created
        contentType: application/json
        payload:
          type: object
          properties:
            userId:
              type: string
            email:
              type: string
            firstName:
              type: string
            lastName:
              type: string
            createdAt:
              type: string
              format: date-time
            accountType:
              enum: [free, premium, enterprise]
            metadata:
              type: object
              properties:
                source:
                  enum: [web, mobile, api]
                campaign:
                  type: string
              required: [source]
          required: [userId, email, firstName, lastName, createdAt, accountType]
operations:
  publishUserCreated:
    action: send
    channel:
      $ref: '#/channels/user.lifecycle.created'
  subscribeToUserUpdates:
    action: receive
    channel:
      $ref: '#/channels/user.lifecycle.updated'
```

## Core Concepts

### 1. Decorators Overview

| Decorator | Purpose | Example |
|-----------|---------|---------|
| `@channel(path)` | Define channel routing | `@channel("user.events")` |
| `@publish` | Mark as send operation | `@publish op sendMessage()` |
| `@subscribe` | Mark as receive operation | `@subscribe op receiveMessage()` |
| `@message(config)` | Message metadata | `@message({title: "User Event"})` |
| `@server(name, config)` | Server definition | `@server("prod", {url: "..."})` |
| `@protocol(config)` | Protocol bindings | `@protocol({protocol: "kafka"})` |
| `@security(config)` | Security schemes | `@security({type: "bearer"})` |

### 2. Channel Organization

Organize channels hierarchically:

```typespec
// Good: Clear hierarchy
@channel("user.lifecycle.created")
@channel("user.lifecycle.updated")  
@channel("user.lifecycle.deleted")

@channel("order.payment.initiated")
@channel("order.payment.completed")
@channel("order.payment.failed")

// Avoid: Flat structure
@channel("user-created")
@channel("user-updated")
@channel("payment-done")
```

### 3. Message Design Patterns

Design messages with clear structure:

```typespec
// Good: Structured message with metadata
model OrderEventPayload {
  // Event metadata
  eventId: string;
  eventType: "created" | "updated" | "cancelled";
  timestamp: utcDateTime;
  version: "1.0";
  
  // Business data
  order: OrderData;
  
  // Tracing context (optional)
  traceId?: string;
  correlationId?: string;
}

// Good: Versioned message models
model UserEventV1 {
  userId: string;
  email: string;
}

model UserEventV2 extends UserEventV1 {
  firstName: string;
  lastName: string;
  createdAt: utcDateTime;
}
```

## Advanced Features

### 1. Protocol Bindings

Add protocol-specific configurations:

```typespec
// Kafka protocol binding
@protocol({
  protocol: "kafka",
  binding: {
    topic: "user-events",
    key: "userId",
    groupId: "user-service",
    schemaIdLocation: "header",
    bindingVersion: "0.5.0"
  }
})
@channel("user.created")
@publish
op publishUserCreated(): UserCreatedMessage;

// WebSocket protocol binding  
@protocol({
  protocol: "websockets",
  binding: {
    method: "GET",
    query: {
      type: "object",
      properties: {
        token: { type: "string" }
      }
    },
    bindingVersion: "0.1.0"
  }
})
@channel("live.updates")
@subscribe
op subscribeLiveUpdates(): LiveUpdateMessage;
```

### 2. Security Schemes

Define authentication requirements:

```typespec
// JWT Bearer authentication
@security({
  name: "bearerAuth",
  scheme: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT"
  }
})
@channel("secure.events")
@publish
op publishSecureEvent(): SecureMessage;

// API Key authentication
@security({
  name: "apiKeyAuth",
  scheme: {
    type: "apiKey",
    in: "header"
  }
})
@channel("api.events")
@subscribe
op subscribeApiEvents(): ApiMessage;
```

### 3. Complex Message Schemas

Handle complex data structures:

```typespec
// Nested object structures
model Address {
  street: string;
  city: string;
  country: string;
  postalCode: string;
}

model Customer {
  customerId: string;
  name: string;
  email: string;
  addresses: Address[];
  preferences: {
    notifications: boolean;
    newsletter: boolean;
    language: "en" | "es" | "fr" | "de";
  };
}

// Union types for event payloads
model CreateCustomerEvent {
  eventType: "customer.created";
  customer: Customer;
}

model UpdateCustomerEvent {
  eventType: "customer.updated";
  customerId: string;
  changes: Customer; // Partial update
}

// Discriminated unions
@message({name: "CustomerEvent"})
model CustomerEventPayload {
  ...CreateCustomerEvent | UpdateCustomerEvent;
  timestamp: utcDateTime;
  source: string;
}
```

## Development Workflow

### 1. Project Setup

```bash
# Create new project
mkdir my-asyncapi-project
cd my-asyncapi-project

# Initialize package.json
npm init -y

# Install dependencies
npm install @larsartmann/typespec-asyncapi @typespec/compiler

# Create TypeSpec configuration
echo '{"emitters": {"@larsartmann/typespec-asyncapi": {}}}' > tspconfig.yaml
```

### 2. Development Cycle

```bash
# 1. Edit TypeSpec files
vim events.tsp

# 2. Generate AsyncAPI specs
npx tsp compile . --emit @larsartmann/typespec-asyncapi

# 3. Validate output
asyncapi validate tsp-output/@larsartmann/typespec-asyncapi/asyncapi.yaml

# 4. Preview in AsyncAPI Studio
open "https://studio.asyncapi.com/?load=file://$(pwd)/tsp-output/@larsartmann/typespec-asyncapi/asyncapi.yaml"
```

### 3. Integration with Build Tools

Add to `package.json`:

```json
{
  "scripts": {
    "build:asyncapi": "tsp compile . --emit @larsartmann/typespec-asyncapi",
    "validate:asyncapi": "asyncapi validate tsp-output/@larsartmann/typespec-asyncapi/asyncapi.yaml",
    "dev:asyncapi": "tsp compile . --emit @larsartmann/typespec-asyncapi --watch"
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Import Errors
```
Error: Cannot resolve import "@larsartmann/typespec-asyncapi"
```

**Solution:**
```bash
# Ensure package is installed
npm install @larsartmann/typespec-asyncapi

# Check package.json dependencies
npm list @larsartmann/typespec-asyncapi
```

#### 2. Compilation Errors
```
Error: Emitter "@larsartmann/typespec-asyncapi" not found
```

**Solution:**
```bash
# Verify emitter is properly installed
npx tsp compile --help | grep asyncapi

# Reinstall if needed
npm uninstall @larsartmann/typespec-asyncapi
npm install @larsartmann/typespec-asyncapi
```

#### 3. Validation Failures
```
Error: Invalid AsyncAPI specification
```

**Solution:**
```bash
# Check generated specification structure
cat tsp-output/@larsartmann/typespec-asyncapi/asyncapi.yaml

# Validate with more verbose output
asyncapi validate tsp-output/@larsartmann/typespec-asyncapi/asyncapi.yaml --verbose
```

### Getting Help

- **GitHub Issues**: [Report bugs and request features](https://github.com/LarsArtmann/typespec-asyncapi/issues)
- **Documentation**: [Complete API reference](../api/generate-api-docs.md)
- **Examples**: [Real-world usage patterns](../examples/)
- **Community**: [Join TypeSpec AsyncAPI discussions](https://github.com/LarsArtmann/typespec-asyncapi/discussions)

## Next Steps

1. **Explore Examples**: Check out [advanced examples](../examples/) for real-world patterns
2. **Learn Plugin Development**: [Create custom protocol plugins](plugin-development.md)  
3. **Contribute**: [Join the community](../CONTRIBUTING.md) and help improve the emitter
4. **Stay Updated**: Watch the [GitHub repository](https://github.com/LarsArtmann/typespec-asyncapi) for new releases

---

**🎉 Congratulations! You're now generating AsyncAPI specifications from TypeSpec!**

The combination of TypeSpec's type safety with AsyncAPI's event-driven specification creates a powerful foundation for building robust async APIs.