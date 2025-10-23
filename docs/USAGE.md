# 📖 TypeSpec AsyncAPI Emitter - Production Usage Guide

**Production-ready TypeSpec to AsyncAPI 3.0 generation with comprehensive examples**

## Table of Contents
- [Quick Start](#quick-start)
- [Basic Usage Examples](#basic-usage-examples)
- [Advanced Usage Examples](#advanced-usage-examples)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Quick Start

### Installation

```bash
# Install the emitter (Alpha v0.0.1)
npm install @lars-artmann/typespec-asyncapi@alpha

# Or with Bun
bun add @lars-artmann/typespec-asyncapi@alpha
```

### Minimal Example

Create `minimal.tsp`:
```typespec
import "@lars-artmann/typespec-asyncapi";

using AsyncAPI;

@channel("user.signup")
@asyncAPI("User Signup Events")
op userSignedUp(): void;
```

Generate AsyncAPI:
```bash
tsp compile minimal.tsp --emit @typespec/asyncapi
```

Output: `tsp-output/@lars-artmann/typespec-asyncapi/AsyncAPI.yaml`

---

## Basic Usage Examples

### Example 1: Simple Message Channel

**Use Case:** Basic pub/sub event notification

**TypeSpec Definition (`simple-event.tsp`):**
```typespec
import "@lars-artmann/typespec-asyncapi";
using AsyncAPI;

// Define message model
model UserCreatedEvent {
  userId: string;
  email: string;
  createdAt: utcDateTime;
}

// Define publish operation
@channel("user.created")
@publish
@asyncAPI("User created notification")
op userCreated(...UserCreatedEvent): void;
```

**Generate AsyncAPI:**
```bash
tsp compile simple-event.tsp --emit @typespec/asyncapi
```

**Output Structure:**
```yaml
asyncapi: 3.0.0
info:
  title: AsyncAPI Specification
  version: 1.0.0
channels:
  user.created:
    address: user.created
    messages:
      UserCreatedEvent:
        payload:
          type: object
          properties:
            userId: { type: string }
            email: { type: string }
            createdAt: { type: string, format: date-time }
operations:
  userCreated:
    action: send
    channel:
      $ref: '#/channels/user.created'
```

---

### Example 2: Kafka Event Streaming

**Use Case:** High-throughput Kafka event streaming with protocol bindings

**TypeSpec Definition (`kafka-events.tsp`):**
```typespec
import "@lars-artmann/typespec-asyncapi";
using AsyncAPI;

model OrderEvent {
  orderId: string;
  customerId: string;
  amount: float64;
  status: "pending" | "completed" | "cancelled";
  timestamp: utcDateTime;
}

@server("kafka-broker", "kafka://localhost:9092")
@channel("orders.events")
@protocol("kafka")
@publish
op orderEvent(...OrderEvent): void;
```

**Generate AsyncAPI:**
```bash
tsp compile kafka-events.tsp --emit @typespec/asyncapi

# Output location
ls tsp-output/@lars-artmann/typespec-asyncapi/AsyncAPI.yaml
```

**Key Features:**
- ✅ Kafka protocol binding
- ✅ Server configuration
- ✅ Union types for status enum
- ✅ Type-safe float64 amounts

---

### Example 3: WebSocket Real-Time Updates

**Use Case:** Real-time WebSocket notifications with bidirectional communication

**TypeSpec Definition (`websocket-chat.tsp`):**
```typespec
import "@lars-artmann/typespec-asyncapi";
using AsyncAPI;

model ChatMessage {
  messageId: string;
  userId: string;
  roomId: string;
  content: string;
  timestamp: utcDateTime;
}

model ChatTypingIndicator {
  userId: string;
  roomId: string;
  isTyping: boolean;
}

@server("websocket", "ws://localhost:8080/chat")
@protocol("ws")
namespace ChatAPI {
  @channel("chat.messages")
  @publish
  op sendMessage(...ChatMessage): void;

  @channel("chat.messages")
  @subscribe
  op receiveMessage(): ChatMessage;

  @channel("chat.typing")
  @publish
  op sendTyping(...ChatTypingIndicator): void;

  @channel("chat.typing")
  @subscribe
  op receiveTyping(): ChatTypingIndicator;
}
```

**Generate AsyncAPI:**
```bash
tsp compile websocket-chat.tsp --emit @typespec/asyncapi
```

**Key Features:**
- ✅ Bidirectional communication (publish + subscribe)
- ✅ WebSocket protocol binding
- ✅ Namespace organization
- ✅ Multiple message types per channel

---

### Example 4: HTTP Webhooks with Security

**Use Case:** Secure webhook callbacks with API key authentication

**TypeSpec Definition (`webhooks.tsp`):**
```typespec
import "@lars-artmann/typespec-asyncapi";
using AsyncAPI;

model WebhookPayload {
  eventType: string;
  data: Record<string>;
  signature: string;
  timestamp: utcDateTime;
}

@server("webhook-server", "https://api.example.com/webhooks")
@protocol("http")
@security("api-key", {
  type: "apiKey",
  in: "header",
  name: "X-API-Key"
})
@channel("webhooks.notifications")
@subscribe
op receiveWebhook(): WebhookPayload;
```

**Generate AsyncAPI:**
```bash
tsp compile webhooks.tsp --emit @typespec/asyncapi
```

**Output Features:**
- ✅ HTTPS webhook endpoint
- ✅ API key security scheme
- ✅ Header-based authentication
- ✅ Generic payload with Record<string>

---

### Example 5: MQTT IoT Device Events

**Use Case:** IoT device telemetry with MQTT protocol

**TypeSpec Definition (`iot-telemetry.tsp`):**
```typespec
import "@lars-artmann/typespec-asyncapi";
using AsyncAPI;

model DeviceTelemetry {
  deviceId: string;
  temperature: float32;
  humidity: float32;
  batteryLevel: int32;
  location?: {
    latitude: float64;
    longitude: float64;
  };
  timestamp: utcDateTime;
}

model DeviceAlert {
  deviceId: string;
  alertType: "temperature" | "battery" | "offline";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
}

@server("mqtt-broker", "mqtt://iot.example.com:1883")
@protocol("mqtt")
namespace IoTEvents {
  @channel("devices/telemetry")
  @publish
  op publishTelemetry(...DeviceTelemetry): void;

  @channel("devices/alerts")
  @subscribe
  op receiveAlert(): DeviceAlert;
}
```

**Generate AsyncAPI:**
```bash
tsp compile iot-telemetry.tsp --emit @typespec/asyncapi
```

**Key Features:**
- ✅ MQTT protocol for IoT
- ✅ Optional nested objects (location?)
- ✅ Float32/Int32 type precision
- ✅ Union types for enums
- ✅ Namespace organization

---

### Example 6: Multi-Protocol Microservices

**Use Case:** Enterprise microservices with multiple protocols and security

**TypeSpec Definition (`microservices.tsp`):**
```typespec
import "@lars-artmann/typespec-asyncapi";
using AsyncAPI;

model OrderCreated {
  orderId: string;
  customerId: string;
  items: Array<{
    productId: string;
    quantity: int32;
    price: float64;
  }>;
  total: float64;
}

model PaymentProcessed {
  orderId: string;
  transactionId: string;
  amount: float64;
  status: "success" | "failed" | "pending";
}

// Kafka for order events
@server("kafka", "kafka://kafka.internal:9092")
@protocol("kafka")
@channel("orders.created")
@publish
op publishOrder(...OrderCreated): void;

// WebSocket for real-time updates
@server("websocket", "wss://api.example.com/updates")
@protocol("ws")
@security("oauth2", {
  type: "oauth2",
  flows: {
    clientCredentials: {
      tokenUrl: "https://auth.example.com/token",
      scopes: {
        "orders:read": "Read order updates"
      }
    }
  }
})
@channel("updates.payments")
@subscribe
op subscribePayments(): PaymentProcessed;
```

**Generate AsyncAPI:**
```bash
tsp compile microservices.tsp --emit @typespec/asyncapi
```

**Key Features:**
- ✅ Multiple protocols (Kafka + WebSocket)
- ✅ Multiple servers
- ✅ OAuth2 client credentials flow
- ✅ Complex nested arrays
- ✅ Enterprise security patterns

---

## CI/CD Integration

### GitHub Actions Example

**`.github/workflows/asyncapi.yml`:**
```yaml
name: Generate AsyncAPI Specification

on:
  push:
    branches: [main]
    paths:
      - '**/*.tsp'

jobs:
  generate-asyncapi:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          npm install @typespec/compiler
          npm install @lars-artmann/typespec-asyncapi@alpha

      - name: Generate AsyncAPI spec
        run: |
          tsp compile api.tsp --emit @typespec/asyncapi

      - name: Upload AsyncAPI artifact
        uses: actions/upload-artifact@v3
        with:
          name: asyncapi-spec
          path: tsp-output/@lars-artmann/typespec-asyncapi/AsyncAPI.yaml

      - name: Validate AsyncAPI spec
        run: |
          npm install -g @asyncapi/cli
          asyncapi validate tsp-output/@lars-artmann/typespec-asyncapi/AsyncAPI.yaml
```

### GitLab CI Example

**`.gitlab-ci.yml`:**
```yaml
generate-asyncapi:
  image: node:20
  script:
    - npm install @typespec/compiler @lars-artmann/typespec-asyncapi@alpha
    - tsp compile api.tsp --emit @typespec/asyncapi
    - npx @asyncapi/cli validate tsp-output/@lars-artmann/typespec-asyncapi/AsyncAPI.yaml
  artifacts:
    paths:
      - tsp-output/@lars-artmann/typespec-asyncapi/AsyncAPI.yaml
```

---

## Troubleshooting

### Issue: Output file not found

**Problem:**
```bash
$ tsp compile api.tsp --emit @typespec/asyncapi
# No output file generated
```

**Solutions:**
1. Check emitter is installed:
   ```bash
   npm list @lars-artmann/typespec-asyncapi
   ```

2. Verify TypeSpec file has decorators:
   ```typespec
   import "@lars-artmann/typespec-asyncapi";
   using AsyncAPI;
   ```

3. Check output location:
   ```bash
   ls -la tsp-output/@lars-artmann/typespec-asyncapi/
   ```

### Issue: Missing decorators

**Problem:**
```
Error: @channel decorator not found
```

**Solution:**
Ensure import statement at top of .tsp file:
```typespec
import "@lars-artmann/typespec-asyncapi";
using AsyncAPI;
```

### Issue: Invalid AsyncAPI output

**Problem:**
Generated YAML fails AsyncAPI validation

**Solutions:**
1. Validate your TypeSpec syntax:
   ```bash
   npx tsc --noEmit api.tsp
   ```

2. Check for required fields in models

3. Verify channel names are valid (no spaces)

4. Use `@asyncAPI()` decorator for operation descriptions

---

## Best Practices

### 1. Organize with Namespaces

**Good:**
```typespec
namespace UserEvents {
  @channel("users.created")
  @publish
  op userCreated(...UserCreatedEvent): void;
}

namespace OrderEvents {
  @channel("orders.created")
  @publish
  op orderCreated(...OrderCreatedEvent): void;
}
```

### 2. Use Type-Safe Enums

**Good:**
```typespec
model OrderStatus {
  status: "pending" | "processing" | "completed" | "cancelled";
}
```

**Bad:**
```typespec
model OrderStatus {
  status: string; // Too permissive
}
```

### 3. Document Operations

**Good:**
```typespec
@channel("orders.created")
@publish
@asyncAPI("Publishes order creation events to notify downstream services")
op orderCreated(...OrderCreatedEvent): void;
```

### 4. Use Semantic Channel Names

**Good:**
- `users.created`
- `orders.payment.processed`
- `notifications.email.sent`

**Bad:**
- `channel1`
- `my-channel`
- `test_channel_123`

### 5. Separate Models from Operations

**Good:**
```typespec
// models.tsp
model UserEvent { ... }
model OrderEvent { ... }

// operations.tsp
import "./models.tsp";

@channel("users.created")
op userCreated(...UserEvent): void;
```

---

## Output Formats

### YAML Output (default)

Location: `tsp-output/@lars-artmann/typespec-asyncapi/AsyncAPI.yaml`

### JSON Output

Use `--output-format json` flag (if supported by your TypeSpec version):
```bash
tsp compile api.tsp --emit @typespec/asyncapi --output-format json
```

---

## Next Steps

- 📖 See [README.md](../README.md) for feature overview
- 🐛 Report issues: [GitHub Issues](https://github.com/LarsArtmann/typespec-asyncapi/issues)
- 📊 Check [examples/](../examples/) for more real-world examples
- 🔍 Review [AsyncAPI 3.0 Specification](https://www.asyncapi.com/docs/reference/specification/v3.0.0)

---

**Production Status:** ✅ Ready for AsyncAPI 3.0 generation
**Last Updated:** 2025-10-07
**Version:** Alpha v0.0.1

🤖 Generated with [Claude Code](https://claude.com/claude-code)
