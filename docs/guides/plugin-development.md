# Plugin Development Guide

This guide shows you how to create custom protocol plugins for the TypeSpec AsyncAPI Emitter. The plugin system allows you to extend support for new protocols and binding specifications.

## Plugin Architecture Overview

The TypeSpec AsyncAPI Emitter uses a simple, extensible plugin architecture:

- **Plugin Interface**: Minimal `ProtocolPlugin` interface with optional methods
- **Effect.TS Native**: All plugin methods return `Effect.Effect` types for consistency
- **Registry Pattern**: Simple Map-based plugin registry with lazy loading
- **AsyncAPI Compliant**: Support for AsyncAPI 3.0 protocol binding specifications

## Plugin Interface

```typescript
import { Effect } from "effect";
import type { AsyncAPIProtocolType } from "@larsartmann/typespec-asyncapi";

export interface ProtocolPlugin {
  readonly name: AsyncAPIProtocolType;
  readonly version: string;

  // Optional binding generators
  generateOperationBinding?: (operation: unknown) => Effect.Effect<Record<string, unknown>, Error>;
  generateMessageBinding?: (message: unknown) => Effect.Effect<Record<string, unknown>, Error>;
  generateServerBinding?: (server: unknown) => Effect.Effect<Record<string, unknown>, Error>;

  // Optional validation
  validateConfig?: (config: unknown) => Effect.Effect<boolean, Error>;
}
```

## Creating Your First Plugin

Let's create an MQTT plugin following AsyncAPI MQTT Binding v0.2.0 specification.

### 1. Plugin Structure

Create `mqtt-plugin.ts`:

```typescript
import { Effect } from "effect";
import type { ProtocolPlugin } from "@larsartmann/typespec-asyncapi";

// MQTT binding types following AsyncAPI spec
interface MQTTOperationBinding {
  qos?: 0 | 1 | 2;
  retain?: boolean;
  messageExpiryInterval?: number;
  bindingVersion?: string;
}

interface MQTTMessageBinding {
  payloadFormatIndicator?: 0 | 1;
  correlationData?: string;
  contentType?: string;
  responseTopic?: string;
  bindingVersion?: string;
}

interface MQTTServerBinding {
  clientId?: string;
  cleanSession?: boolean;
  lastWill?: {
    topic: string;
    qos: 0 | 1 | 2;
    message: string;
    retain?: boolean;
  };
  keepAlive?: number;
  bindingVersion?: string;
}
```

### 2. Plugin Implementation

```typescript
export const mqttPlugin: ProtocolPlugin = {
  name: "mqtt",
  version: "1.0.0",

  generateOperationBinding: (operation: unknown) =>
    Effect.gen(function* () {
      yield* Effect.log("🔧 Generating MQTT operation binding");

      // Extract operation-specific data
      // In real implementation, you'd extract from TypeSpec operation
      const binding: MQTTOperationBinding = {
        qos: 1, // Default QoS level
        retain: false,
        messageExpiryInterval: 60, // 60 seconds
        bindingVersion: "0.2.0"
      };

      return { mqtt: binding };
    }),

  generateMessageBinding: (message: unknown) =>
    Effect.gen(function* () {
      yield* Effect.log("📨 Generating MQTT message binding");

      const binding: MQTTMessageBinding = {
        payloadFormatIndicator: 1, // UTF-8 string
        contentType: "application/json",
        bindingVersion: "0.2.0"
      };

      return { mqtt: binding };
    }),

  generateServerBinding: (server: unknown) =>
    Effect.gen(function* () {
      yield* Effect.log("🖥️  Generating MQTT server binding");

      const binding: MQTTServerBinding = {
        clientId: "typespec-asyncapi-client",
        cleanSession: true,
        keepAlive: 60,
        bindingVersion: "0.2.0"
      };

      return { mqtt: binding };
    }),

  validateConfig: (config: unknown) =>
    Effect.gen(function* () {
      yield* Effect.log("✅ Validating MQTT configuration");

      // Implement validation logic
      if (typeof config === 'object' && config !== null) {
        const mqttConfig = config as Record<string, unknown>;

        // Validate QoS levels
        if ('qos' in mqttConfig) {
          const qos = mqttConfig.qos;
          if (typeof qos === 'number' && [0, 1, 2].includes(qos)) {
            return true;
          }
          return false;
        }

        return true;
      }

      return false;
    })
};
```

### 3. Plugin Registration

```typescript
// In your application code
import { pluginRegistry } from "@larsartmann/typespec-asyncapi";
import { mqttPlugin } from "./mqtt-plugin.js";

// Register the plugin
const registerMqttPlugin = () =>
  pluginRegistry.register(mqttPlugin);

// Call during initialization
await registerMqttPlugin();
```

## Advanced Plugin Examples

### 1. Redis Streams Plugin

```typescript
export const redisPlugin: ProtocolPlugin = {
  name: "redis",
  version: "1.0.0",

  generateOperationBinding: (operation: unknown) =>
    Effect.gen(function* () {
      yield* Effect.log("🔧 Generating Redis Streams operation binding");

      // Redis Streams specific binding
      const binding = {
        stream: "events-stream",
        consumerGroup: "service-consumers",
        consumer: "service-instance-1",
        acknowledgment: true,
        maxLength: 10000,
        bindingVersion: "0.1.0"
      };

      return { redis: binding };
    }),

  generateMessageBinding: (message: unknown) =>
    Effect.gen(function* () {
      const binding = {
        messageId: "auto", // Redis auto-generates
        ttl: 3600, // 1 hour TTL
        compression: "gzip",
        bindingVersion: "0.1.0"
      };

      return { redis: binding };
    })
};
```

### 2. AWS SQS Plugin

```typescript
export const sqsPlugin: ProtocolPlugin = {
  name: "sqs",
  version: "1.0.0",

  generateOperationBinding: (operation: unknown) =>
    Effect.gen(function* () {
      yield* Effect.log("🔧 Generating AWS SQS operation binding");

      const binding = {
        queueUrl: "https://sqs.us-east-1.amazonaws.com/123456789/my-queue",
        region: "us-east-1",
        messageGroupId: "user-events",
        messageDeduplicationId: "auto",
        visibilityTimeout: 30,
        bindingVersion: "0.1.0"
      };

      return { sqs: binding };
    }),

  generateServerBinding: (server: unknown) =>
    Effect.gen(function* () {
      const binding = {
        region: "us-east-1",
        accessKey: "${AWS_ACCESS_KEY}",
        secretKey: "${AWS_SECRET_KEY}",
        endpoint: "https://sqs.us-east-1.amazonaws.com",
        bindingVersion: "0.1.0"
      };

      return { sqs: binding };
    }),

  validateConfig: (config: unknown) =>
    Effect.gen(function* () {
      // Validate AWS SQS configuration
      const sqsConfig = config as Record<string, unknown>;

      const requiredFields = ['queueUrl', 'region'];
      const hasRequired = requiredFields.every(field => field in sqsConfig);

      return hasRequired;
    })
};
```

## Working with TypeSpec Data

### 1. Extracting TypeSpec Operation Data

```typescript
import type { Operation } from "@typespec/compiler";

const extractOperationData = (operation: Operation) => {
  return {
    name: operation.name,
    namespace: operation.namespace?.name,
    parameters: operation.parameters,
    returnType: operation.returnType,
    // ... extract other relevant data
  };
};

export const advancedPlugin: ProtocolPlugin = {
  name: "advanced",
  version: "1.0.0",

  generateOperationBinding: (operation: unknown) =>
    Effect.gen(function* () {
      // Cast to TypeSpec Operation type
      const tsOperation = operation as Operation;
      const opData = extractOperationData(tsOperation);

      yield* Effect.log(`Processing operation: ${opData.name}`);

      // Generate binding based on operation data
      const binding = {
        operationName: opData.name,
        namespace: opData.namespace,
        // ... protocol-specific configuration
      };

      return { advanced: binding };
    })
};
```

### 2. Processing Message Models

```typescript
import type { Model } from "@typespec/compiler";

const extractMessageData = (model: Model) => {
  return {
    name: model.name,
    properties: model.properties,
    decorators: model.decorators,
    // ... extract schema information
  };
};

const processMessageBinding = (message: unknown) =>
  Effect.gen(function* () {
    const model = message as Model;
    const msgData = extractMessageData(model);

    // Create binding based on message structure
    const binding = {
      messageName: msgData.name,
      schemaType: "json-schema",
      validation: "strict",
      // ... additional message configuration
    };

    return { custom: binding };
  });
```

## Plugin Configuration Patterns

### 1. Configuration Schema

```typescript
import { Effect } from "effect";

// Define configuration schema
interface PluginConfig {
  endpoint: string;
  authentication: {
    type: "apiKey" | "oauth2" | "basic";
    credentials: Record<string, string>;
  };
  options: {
    timeout?: number;
    retries?: number;
    compression?: boolean;
  };
}

const validatePluginConfig = (config: unknown): Effect.Effect<PluginConfig, Error> =>
  Effect.gen(function* () {
    // Type-safe configuration validation
    if (typeof config !== 'object' || config === null) {
      return yield* Effect.fail(new Error("Config must be an object"));
    }

    const cfg = config as Record<string, unknown>;

    if (typeof cfg.endpoint !== 'string') {
      return yield* Effect.fail(new Error("endpoint is required and must be a string"));
    }

    // ... additional validation

    return cfg as PluginConfig;
  });
```

### 2. Environment-Based Configuration

```typescript
export const environmentAwarePlugin: ProtocolPlugin = {
  name: "environment-aware",
  version: "1.0.0",

  generateServerBinding: (server: unknown) =>
    Effect.gen(function* () {
      // Environment-specific configuration
      const environment = process.env.NODE_ENV || "development";

      const binding = environment === "production"
        ? {
            url: process.env.PROD_SERVER_URL,
            ssl: true,
            connectionPool: 10
          }
        : {
            url: "localhost:8080",
            ssl: false,
            connectionPool: 2
          };

      return { "environment-aware": { ...binding, environment } };
    })
};
```

## Testing Your Plugin

### 1. Unit Tests

```typescript
import { Effect } from "effect";
import { mqttPlugin } from "./mqtt-plugin.js";

describe("MQTT Plugin", () => {
  it("should generate operation binding", async () => {
    const mockOperation = { name: "publishMessage" };

    const result = await Effect.runPromise(
      mqttPlugin.generateOperationBinding!(mockOperation)
    );

    expect(result).toEqual({
      mqtt: {
        qos: 1,
        retain: false,
        messageExpiryInterval: 60,
        bindingVersion: "0.2.0"
      }
    });
  });

  it("should validate configuration", async () => {
    const validConfig = { qos: 1, retain: true };

    const isValid = await Effect.runPromise(
      mqttPlugin.validateConfig!(validConfig)
    );

    expect(isValid).toBe(true);
  });
});
```

### 2. Integration Tests

```typescript
import { pluginRegistry } from "@larsartmann/typespec-asyncapi";
import { mqttPlugin } from "./mqtt-plugin.js";

describe("Plugin Integration", () => {
  beforeAll(async () => {
    await Effect.runPromise(pluginRegistry.register(mqttPlugin));
  });

  it("should register plugin successfully", async () => {
    const plugin = await Effect.runPromise(
      pluginRegistry.getPlugin("mqtt")
    );

    expect(plugin).toBeDefined();
    expect(plugin?.name).toBe("mqtt");
    expect(plugin?.version).toBe("1.0.0");
  });
});
```

## Publishing Your Plugin

### 1. Package Structure

```
my-asyncapi-plugin/
├── src/
│   ├── index.ts          # Plugin exports
│   ├── mqtt-plugin.ts    # Plugin implementation
│   └── types.ts          # Type definitions
├── dist/                 # Compiled output
├── test/                 # Test files
├── README.md            # Plugin documentation
├── package.json         # NPM package configuration
└── tsconfig.json        # TypeScript configuration
```

### 2. Package Configuration

```json
{
  "name": "@your-org/typespec-asyncapi-mqtt-plugin",
  "version": "1.0.0",
  "description": "MQTT protocol plugin for TypeSpec AsyncAPI Emitter",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "keywords": [
    "typespec",
    "asyncapi",
    "mqtt",
    "plugin",
    "event-driven"
  ],
  "peerDependencies": {
    "@larsartmann/typespec-asyncapi": "^0.1.0",
    "effect": "^3.17.0"
  },
  "devDependencies": {
    "@larsartmann/typespec-asyncapi": "^0.1.0",
    "effect": "^3.17.0",
    "typescript": "^5.9.0"
  }
}
```

### 3. Plugin Documentation

Create comprehensive README with:

````markdown
# TypeSpec AsyncAPI MQTT Plugin

MQTT protocol plugin for TypeSpec AsyncAPI Emitter following AsyncAPI MQTT Binding v0.2.0 specification.

## Installation

```bash
bun add @your-org/typespec-asyncapi-mqtt-plugin
````

## Usage

```typescript
import { pluginRegistry } from "@larsartmann/typespec-asyncapi";
import { mqttPlugin } from "@your-org/typespec-asyncapi-mqtt-plugin";

// Register plugin
await pluginRegistry.register(mqttPlugin);
```

## TypeSpec Usage

```typespec
@protocol({
  protocol: "mqtt",
  binding: {
    qos: 1,
    retain: false
  }
})
@channel("sensors/temperature")
@publish
op publishTemperature(): TemperatureReading;
```

````

## Best Practices

### 1. Plugin Development

- **Follow AsyncAPI Specifications**: Implement bindings according to official AsyncAPI binding specs
- **Type Safety**: Use TypeScript strict mode and comprehensive type definitions
- **Effect.TS Patterns**: Leverage Effect.TS for error handling and composition
- **Validation**: Implement thorough configuration validation
- **Testing**: Write comprehensive unit and integration tests

### 2. Error Handling

```typescript
const robustPlugin: ProtocolPlugin = {
  name: "robust",
  version: "1.0.0",

  generateOperationBinding: (operation: unknown) =>
    Effect.gen(function* () {
      try {
        // Attempt binding generation
        const binding = yield* generateBinding(operation);
        return { robust: binding };
      } catch (error) {
        // Log error and provide fallback
        yield* Effect.log(`Binding generation failed: ${error}`);
        return { robust: { fallback: true } };
      }
    }),

  validateConfig: (config: unknown) =>
    Effect.gen(function* () {
      return yield* Effect.try(() => {
        // Validation logic that might throw
        return validateConfiguration(config);
      }).pipe(
        Effect.mapError(error => new Error(`Config validation failed: ${error}`)),
        Effect.orElse(() => Effect.succeed(false))
      );
    })
};
````

### 3. Performance Optimization

- **Lazy Loading**: Load plugin resources only when needed
- **Caching**: Cache expensive computations
- **Memory Management**: Clean up resources properly
- **Async Operations**: Use Effect.TS async patterns for I/O operations

## Community Plugins

### Existing Plugins

- **Kafka Plugin** (Built-in) - Apache Kafka protocol support
- **WebSocket Plugin** (Built-in) - WebSocket protocol support
- **HTTP Plugin** (Built-in) - HTTP protocol support

### Community Contributions

- **MQTT Plugin** - MQTT v3.1.1 and v5.0 support
- **Redis Plugin** - Redis Streams and Pub/Sub
- **RabbitMQ Plugin** - AMQP 0.9.1 support
- **AWS SQS Plugin** - Amazon Simple Queue Service
- **Google Pub/Sub Plugin** - Google Cloud Pub/Sub

## Contributing

1. **Fork** the TypeSpec AsyncAPI repository
2. **Create** your plugin in a separate package
3. **Test** thoroughly with real-world scenarios
4. **Document** usage patterns and examples
5. **Share** with the community

## Resources

- **AsyncAPI Bindings**: https://github.com/asyncapi/bindings
- **Effect.TS Documentation**: https://effect.website/
- **TypeSpec Documentation**: https://typespec.io/
- **Plugin Examples**: https://github.com/LarsArtmann/typespec-asyncapi/tree/master/examples/plugins

---

**Happy plugin development! Build the future of AsyncAPI protocol support.**
