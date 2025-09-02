# Protocol Bindings: TypeSpec to AsyncAPI Protocol-Specific Mappings

## Overview

This document details how TypeSpec `@protocol` decorators map to AsyncAPI protocol bindings, covering all major messaging protocols supported by AsyncAPI. Protocol bindings enable protocol-specific configurations that go beyond the generic AsyncAPI specification.

## Kafka Bindings

### Basic Kafka Configuration

```typespec
// TypeSpec: Kafka protocol binding
@protocol({
  type: "kafka",
  topic: "user-events",
  partition: 3,
  replicas: 2,
  compressionType: "gzip",
  acks: "all",
  retries: 3,
  batchSize: 16384,
  lingerMs: 5
})
@channel("user.events")
@publish
op publishUserEvent(@body event: UserEvent): void;

@protocol({
  type: "kafka",
  groupId: "user-event-processors",
  autoOffsetReset: "earliest",
  enableAutoCommit: false,
  maxPollRecords: 500
})
@channel("user.events")
@subscribe
op processUserEvent(): UserEvent;
```

```yaml
# AsyncAPI: Kafka bindings
channels:
  user.events:
    address: user-events
    bindings:
      kafka:
        topic: user-events
        partitions: 3
        replicas: 2
        configs:
          cleanup.policy: delete
          retention.ms: 604800000
          compression.type: gzip
        bindingVersion: "0.4.0"

operations:
  publishUserEvent:
    action: send
    channel:
      $ref: '#/channels/user.events'
    bindings:
      kafka:
        acks: all
        key:
          type: string
          description: Message key for partitioning
        schemaIdLocation: header
        schemaIdPayloadEncoding: confluent
        clientId: user-event-publisher
        bindingVersion: "0.4.0"
    messages:
      - $ref: '#/channels/user.events/messages/UserEvent'

  processUserEvent:
    action: receive
    channel:
      $ref: '#/channels/user.events'
    bindings:
      kafka:
        groupId: user-event-processors
        clientId: user-event-processor
        autoOffsetReset: earliest
        bindingVersion: "0.4.0"

servers:
  kafka-cluster:
    host: localhost:9092
    protocol: kafka
    description: Kafka cluster
    bindings:
      kafka:
        schemaRegistryUrl: http://localhost:8081
        schemaRegistryVendor: confluent
        bindingVersion: "0.4.0"
```

### Advanced Kafka Patterns

```typespec
// TypeSpec: Advanced Kafka configuration
@protocol({
  type: "kafka",
  topic: "orders.{environment}",
  partitionKey: "customerId",
  headers: {
    "schema-version": "2.0",
    "content-encoding": "gzip",
    "message-type": "order.created"
  },
  schemaRegistry: {
    url: "http://schema-registry:8081",
    subject: "orders-value",
    version: "latest"
  },
  transactional: true,
  idempotence: true
})
@channel("orders.created")
@publish
op publishOrderCreated(@body order: OrderCreatedEvent): void;

// Exactly-once processing
@protocol({
  type: "kafka",
  groupId: "order-processors",
  enableAutoCommit: false,
  isolationLevel: "read_committed",
  processingGuarantee: "exactly_once"
})
@channel("orders.created")
@subscribe
op processOrderCreated(): OrderCreatedEvent;
```

```yaml
# AsyncAPI: Advanced Kafka configuration
channels:
  orders.created:
    address: orders.{environment}
    parameters:
      environment:
        schema:
          type: string
          enum: [dev, staging, prod]
    bindings:
      kafka:
        topic: orders.{environment}
        partitions: 12
        replicas: 3
        configs:
          cleanup.policy: delete
          retention.ms: 2592000000
          compression.type: gzip
          min.insync.replicas: 2
        bindingVersion: "0.4.0"

operations:
  publishOrderCreated:
    action: send
    channel:
      $ref: '#/channels/orders.created'
    bindings:
      kafka:
        acks: all
        retries: 2147483647
        maxInFlightRequestsPerConnection: 1
        enableIdempotence: true
        transactionTimeout: 60000
        key:
          type: string
          description: Customer ID for consistent partitioning
        schemaIdLocation: header
        schemaIdPayloadEncoding: confluent
        bindingVersion: "0.4.0"
    messages:
      - $ref: '#/components/messages/OrderCreatedEvent'
        bindings:
          kafka:
            headers:
              type: object
              properties:
                schema-version:
                  type: string
                  const: "2.0"
                content-encoding:
                  type: string
                  const: gzip
                message-type:
                  type: string
                  const: order.created
            bindingVersion: "0.4.0"

  processOrderCreated:
    action: receive
    channel:
      $ref: '#/channels/orders.created'
    bindings:
      kafka:
        groupId: order-processors
        autoOffsetReset: earliest
        enableAutoCommit: false
        isolationLevel: read_committed
        bindingVersion: "0.4.0"
```

## AMQP Bindings

### Basic AMQP Configuration

```typespec
// TypeSpec: AMQP protocol binding
@protocol({
  type: "amqp",
  exchange: "user.events.exchange",
  exchangeType: "topic",
  routingKey: "user.{action}.{userId}",
  queue: "user.event.queue",
  durable: true,
  autoDelete: false,
  deliveryMode: 2,
  priority: 5,
  expiration: "300000",
  deadLetterExchange: "user.events.dlx"
})
@channel("user.events")
@publish
op publishUserEvent(@body event: UserEvent): void;

@protocol({
  type: "amqp",
  queue: "user.event.queue",
  consumerTag: "user-event-consumer",
  noAck: false,
  exclusive: false,
  prefetchCount: 10
})
@channel("user.events")
@subscribe
op processUserEvent(): UserEvent;
```

```yaml
# AsyncAPI: AMQP bindings
channels:
  user.events:
    address: user.events.exchange
    bindings:
      amqp:
        is: routingKey
        exchange:
          name: user.events.exchange
          type: topic
          durable: true
          autoDelete: false
          vhost: "/"
        queue:
          name: user.event.queue
          durable: true
          exclusive: false
          autoDelete: false
          vhost: "/"
          arguments:
            x-dead-letter-exchange: user.events.dlx
            x-message-ttl: 300000
        bindingVersion: "0.2.0"

operations:
  publishUserEvent:
    action: send
    channel:
      $ref: '#/channels/user.events'
    bindings:
      amqp:
        expiration: 300000
        priority: 5
        deliveryMode: 2
        mandatory: true
        replyTo: user.events.reply
        timestamp: true
        bindingVersion: "0.2.0"

  processUserEvent:
    action: receive
    channel:
      $ref: '#/channels/user.events'
    bindings:
      amqp:
        ack: true
        bindingVersion: "0.2.0"

servers:
  amqp-broker:
    host: rabbitmq.example.com:5672
    protocol: amqp
    description: RabbitMQ message broker
    bindings:
      amqp:
        vhost: "/"
        bindingVersion: "0.2.0"
```

### AMQP Advanced Patterns

```typespec
// TypeSpec: Advanced AMQP with dead letter queues
@protocol({
  type: "amqp",
  exchange: "orders.exchange",
  exchangeType: "headers",
  routingKey: "",
  headers: {
    "order-type": "premium",
    "region": "us-east-1"
  },
  queue: "premium.orders.queue",
  qos: {
    prefetchCount: 1,
    prefetchSize: 0,
    global: false
  },
  retry: {
    maxRetries: 3,
    retryDelay: 5000,
    deadLetterQueue: "premium.orders.dlq"
  }
})
@channel("premium.orders")
@subscribe
op processPremiumOrder(): PremiumOrder;

// Publisher confirms
@protocol({
  type: "amqp",
  exchange: "notifications.exchange",
  routingKey: "notification.{type}.{priority}",
  publisherConfirms: true,
  mandatory: true,
  immediate: false
})
@channel("notifications")
@publish
op sendNotification(@body notification: Notification): void;
```

```yaml
# AsyncAPI: Advanced AMQP patterns
channels:
  premium.orders:
    address: orders.exchange
    bindings:
      amqp:
        is: queue
        exchange:
          name: orders.exchange
          type: headers
          durable: true
          autoDelete: false
        queue:
          name: premium.orders.queue
          durable: true
          exclusive: false
          autoDelete: false
          arguments:
            x-max-retries: 3
            x-dead-letter-exchange: premium.orders.dlx
            x-dead-letter-routing-key: failed
        bindingVersion: "0.2.0"

operations:
  processPremiumOrder:
    action: receive
    channel:
      $ref: '#/channels/premium.orders'
    bindings:
      amqp:
        ack: true
        bindingVersion: "0.2.0"
    messages:
      - $ref: '#/components/messages/PremiumOrder'
        bindings:
          amqp:
            contentEncoding: gzip
            messageType: premium.order
            headers:
              type: object
              properties:
                order-type:
                  type: string
                  const: premium
                region:
                  type: string
                  const: us-east-1
            bindingVersion: "0.2.0"

  sendNotification:
    action: send
    channel:
      $ref: '#/channels/notifications'
    bindings:
      amqp:
        mandatory: true
        deliveryMode: 2
        bindingVersion: "0.2.0"

servers:
  rabbitmq-cluster:
    host: rabbitmq-cluster.example.com:5672
    protocol: amqp
    description: RabbitMQ cluster with HA
    bindings:
      amqp:
        vhost: "/production"
        bindingVersion: "0.2.0"
```

## WebSocket Bindings

### Basic WebSocket Configuration

```typespec
// TypeSpec: WebSocket protocol binding
@protocol({
  type: "websocket",
  method: "GET",
  path: "/events/{userId}",
  query: {
    "version": "v1",
    "format": "json"
  },
  headers: {
    "Authorization": "Bearer {token}",
    "X-Client-Version": "1.0"
  },
  subprotocol: "events.v1"
})
@channel("user.events")
@subscribe
op subscribeUserEvents(@path userId: string): UserEvent;

@protocol({
  type: "websocket",
  method: "POST",
  path: "/commands",
  headers: {
    "Content-Type": "application/json"
  }
})
@channel("user.commands")
@publish
op sendUserCommand(@body command: UserCommand): void;
```

```yaml
# AsyncAPI: WebSocket bindings
channels:
  user.events:
    address: /events/{userId}
    parameters:
      userId:
        schema:
          type: string
          format: uuid
    bindings:
      ws:
        method: GET
        query:
          type: object
          properties:
            version:
              type: string
              const: v1
            format:
              type: string
              const: json
        headers:
          type: object
          properties:
            Authorization:
              type: string
              pattern: '^Bearer .+'
            X-Client-Version:
              type: string
        bindingVersion: "0.1.0"

operations:
  subscribeUserEvents:
    action: receive
    channel:
      $ref: '#/channels/user.events'
    bindings:
      ws:
        bindingVersion: "0.1.0"

  sendUserCommand:
    action: send
    channel:
      $ref: '#/channels/user.commands'
    bindings:
      ws:
        method: POST
        headers:
          type: object
          properties:
            Content-Type:
              type: string
              const: application/json
        bindingVersion: "0.1.0"

servers:
  websocket-server:
    host: api.example.com
    pathname: /ws
    protocol: wss
    description: WebSocket event server
    bindings:
      ws:
        subprotocol: events.v1
        bindingVersion: "0.1.0"
```

## MQTT Bindings

### Basic MQTT Configuration

```typespec
// TypeSpec: MQTT protocol binding
@protocol({
  type: "mqtt",
  topic: "sensors/{deviceId}/temperature",
  qos: 1,
  retain: true,
  messageExpiryInterval: 3600,
  responseTopic: "sensors/{deviceId}/commands",
  correlationData: true
})
@channel("sensor.temperature")
@publish
op publishTemperature(@path deviceId: string, @body data: TemperatureReading): void;

@protocol({
  type: "mqtt",
  topic: "sensors/+/temperature",
  qos: 2,
  cleanSession: false,
  sessionExpiryInterval: 7200,
  receiveMaximum: 100
})
@channel("sensor.temperature")
@subscribe
op processTemperature(): TemperatureReading;
```

```yaml
# AsyncAPI: MQTT bindings
channels:
  sensor.temperature:
    address: sensors/{deviceId}/temperature
    parameters:
      deviceId:
        schema:
          type: string
          pattern: '^[a-zA-Z0-9_-]+$'
    bindings:
      mqtt:
        retain: true
        bindingVersion: "0.1.0"

operations:
  publishTemperature:
    action: send
    channel:
      $ref: '#/channels/sensor.temperature'
    bindings:
      mqtt:
        qos: 1
        retain: true
        messageExpiryInterval: 3600
        responseTopic: sensors/{deviceId}/commands
        bindingVersion: "0.1.0"

  processTemperature:
    action: receive
    channel:
      $ref: '#/channels/sensor.temperature'
    bindings:
      mqtt:
        qos: 2
        bindingVersion: "0.1.0"

servers:
  mqtt-broker:
    host: mqtt.example.com:1883
    protocol: mqtt
    description: MQTT message broker
    bindings:
      mqtt:
        clientId: temperature-service
        cleanSession: false
        lastWill:
          topic: sensors/status
          qos: 1
          retain: true
          message: "Temperature service offline"
        keepAlive: 60
        bindingVersion: "0.1.0"
```

### MQTT 5 Advanced Features

```typespec
// TypeSpec: MQTT 5 with advanced features
@protocol({
  type: "mqtt5",
  topic: "devices/{deviceId}/telemetry",
  qos: 1,
  retain: false,
  userProperties: {
    "device-type": "sensor",
    "firmware-version": "1.2.3",
    "location": "factory-floor-1"
  },
  contentType: "application/cbor",
  payloadFormatIndicator: 1,
  messageExpiryInterval: 300,
  topicAlias: 42
})
@channel("device.telemetry")
@publish
op publishTelemetry(@body telemetry: DeviceTelemetry): void;
```

```yaml
# AsyncAPI: MQTT 5 bindings
operations:
  publishTelemetry:
    action: send
    channel:
      $ref: '#/channels/device.telemetry'
    bindings:
      mqtt:
        qos: 1
        retain: false
        messageExpiryInterval: 300
        bindingVersion: "0.1.0"
    messages:
      - $ref: '#/components/messages/DeviceTelemetry'
        bindings:
          mqtt:
            payloadFormatIndicator: 1
            contentType: application/cbor
            responseTopic: devices/{deviceId}/commands
            correlationData:
              type: string
            userProperties:
              - name: device-type
                value: sensor
              - name: firmware-version
                value: "1.2.3"
              - name: location
                value: factory-floor-1
            bindingVersion: "0.1.0"
```

## HTTP Bindings

### HTTP for Webhooks

```typespec
// TypeSpec: HTTP webhook binding
@protocol({
  type: "http",
  method: "POST",
  path: "/webhooks/user-events",
  headers: {
    "Content-Type": "application/json",
    "X-Webhook-Signature": "sha256={signature}",
    "User-Agent": "EventService/1.0"
  },
  statusCode: 200,
  timeout: 30000,
  retries: 3,
  retryBackoff: "exponential"
})
@channel("user.webhook")
@publish
op sendUserWebhook(@body event: UserWebhookEvent): void;

@protocol({
  type: "http", 
  method: "POST",
  path: "/events",
  query: {
    "version": "v1"
  },
  headers: {
    "Authorization": "Bearer {token}"
  },
  expectedStatusCodes: [200, 202]
})
@channel("incoming.events")
@subscribe
op receiveEvent(): IncomingEvent;
```

```yaml
# AsyncAPI: HTTP bindings
operations:
  sendUserWebhook:
    action: send
    channel:
      $ref: '#/channels/user.webhook'
    bindings:
      http:
        method: POST
        headers:
          type: object
          properties:
            Content-Type:
              type: string
              const: application/json
            X-Webhook-Signature:
              type: string
              pattern: '^sha256=.+'
            User-Agent:
              type: string
              const: EventService/1.0
        bindingVersion: "0.3.0"

  receiveEvent:
    action: receive
    channel:
      $ref: '#/channels/incoming.events'
    bindings:
      http:
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
        bindingVersion: "0.3.0"

channels:
  user.webhook:
    address: /webhooks/user-events
    bindings:
      http:
        method: POST
        bindingVersion: "0.3.0"

servers:
  webhook-server:
    host: webhooks.example.com
    protocol: https
    description: Webhook delivery service
```

## SNS/SQS Bindings

### Amazon SNS/SQS Configuration

```typespec
// TypeSpec: AWS SNS/SQS bindings
@protocol({
  type: "sns",
  topicArn: "arn:aws:sns:us-east-1:123456789012:user-events",
  region: "us-east-1",
  messageAttributes: {
    "eventType": {
      "DataType": "String",
      "StringValue": "user.created"
    },
    "priority": {
      "DataType": "Number", 
      "StringValue": "1"
    }
  },
  messageDeduplicationId: true,
  messageGroupId: "user-events"
})
@channel("user.events.sns")
@publish
op publishToSNS(@body event: UserEvent): void;

@protocol({
  type: "sqs",
  queueUrl: "https://sqs.us-east-1.amazonaws.com/123456789012/user-events-queue",
  region: "us-east-1",
  visibilityTimeout: 300,
  messageRetentionPeriod: 1209600,
  maxReceiveCount: 3,
  deadLetterQueueUrl: "https://sqs.us-east-1.amazonaws.com/123456789012/user-events-dlq"
})
@channel("user.events.sqs")
@subscribe
op processFromSQS(): UserEvent;
```

```yaml
# AsyncAPI: SNS/SQS bindings
channels:
  user.events.sns:
    address: arn:aws:sns:us-east-1:123456789012:user-events
    bindings:
      sns:
        name: user-events
        policy:
          statements:
            - effect: Allow
              principal: "*"
              action: SNS:Subscribe
        bindingVersion: "0.1.0"

  user.events.sqs:
    address: https://sqs.us-east-1.amazonaws.com/123456789012/user-events-queue
    bindings:
      sqs:
        queue:
          name: user-events-queue
          fifoQueue: true
          deduplicationScope: messageGroup
          fifoThroughputLimit: perMessageGroupId
          deliveryDelay: 0
          visibilityTimeout: 300
          receiveMessageWaitTime: 0
          messageRetentionPeriod: 1209600
          redrivePolicy:
            deadLetterQueue:
              arn: arn:aws:sqs:us-east-1:123456789012:user-events-dlq
            maxReceiveCount: 3
        bindingVersion: "0.2.0"

operations:
  publishToSNS:
    action: send
    channel:
      $ref: '#/channels/user.events.sns'
    bindings:
      sns:
        bindingVersion: "0.1.0"
    messages:
      - $ref: '#/components/messages/UserEvent'
        bindings:
          sns:
            messageAttributes:
              eventType:
                type: string
                value: user.created
              priority:
                type: number
                value: 1
            bindingVersion: "0.1.0"

  processFromSQS:
    action: receive
    channel:
      $ref: '#/channels/user.events.sqs'
    bindings:
      sqs:
        visibilityTimeout: 300
        bindingVersion: "0.2.0"
```

## Google Pub/Sub Bindings

### Google Cloud Pub/Sub Configuration

```typespec
// TypeSpec: Google Pub/Sub binding
@protocol({
  type: "googlepubsub",
  topic: "projects/my-project/topics/user-events",
  subscription: "projects/my-project/subscriptions/user-event-processor",
  ackDeadlineSeconds: 600,
  retainAckedMessages: false,
  messageRetentionDuration: "604800s",
  messageOrdering: true,
  schema: {
    name: "projects/my-project/schemas/user-event-schema",
    encoding: "JSON"
  }
})
@channel("user.events.pubsub")
@subscribe
op processFromPubSub(): UserEvent;
```

```yaml
# AsyncAPI: Google Pub/Sub bindings
channels:
  user.events.pubsub:
    address: projects/my-project/topics/user-events
    bindings:
      googlepubsub:
        topic: projects/my-project/topics/user-events
        messageRetentionDuration: 604800s
        messageStoragePolicy:
          allowedPersistenceRegions: [us-central1, us-east1]
        schemaSettings:
          schema: projects/my-project/schemas/user-event-schema
          encoding: JSON
        bindingVersion: "0.1.0"

operations:
  processFromPubSub:
    action: receive
    channel:
      $ref: '#/channels/user.events.pubsub'
    bindings:
      googlepubsub:
        subscription: projects/my-project/subscriptions/user-event-processor
        ackDeadlineSeconds: 600
        messageRetentionDuration: 604800s
        retainAckedMessages: false
        enableMessageOrdering: true
        filter: 'attributes.eventType="user.created"'
        bindingVersion: "0.1.0"
```

## Multi-Protocol Patterns

### Protocol Switching

```typespec
// TypeSpec: Multi-protocol support
namespace MultiProtocol {
  // Development uses local Kafka
  @server("development", {
    url: "kafka://localhost:9092",
    protocol: "kafka"
  })
  // Production uses managed Kafka
  @server("production", { 
    url: "kafka://kafka.prod.example.com:9092",
    protocol: "kafka"
  })
  // Testing uses in-memory
  @server("testing", {
    url: "inmemory://events",
    protocol: "inmemory"
  })
  
  @protocol({
    type: "kafka",
    topic: "events.multi",
    // Environment-specific configurations
    ...(environment === "development" ? {
      partitions: 1,
      replicas: 1
    } : {
      partitions: 12,
      replicas: 3
    })
  })
  @channel("multi.events")
  @publish
  op publishEvent(@body event: MultiEvent): void;
}
```

```yaml
# AsyncAPI: Multi-environment protocol configuration
servers:
  development:
    host: localhost:9092
    protocol: kafka
    description: Development Kafka broker
    bindings:
      kafka:
        bindingVersion: "0.4.0"
        
  production:
    host: kafka.prod.example.com:9092
    protocol: kafka
    description: Production Kafka cluster
    bindings:
      kafka:
        schemaRegistryUrl: https://schema-registry.prod.example.com
        bindingVersion: "0.4.0"
        
  testing:
    host: inmemory
    protocol: inmemory
    description: In-memory testing broker

channels:
  multi.events:
    address: events.multi
    bindings:
      kafka:
        topic: events.multi
        # Production configuration
        partitions: 12
        replicas: 3
        configs:
          cleanup.policy: delete
          retention.ms: 604800000
        bindingVersion: "0.4.0"
        
# Alternative development configuration
x-development-overrides:
  channels:
    multi.events:
      bindings:
        kafka:
          partitions: 1
          replicas: 1
```

## Protocol-Specific Best Practices

### Kafka Optimization
- Use appropriate partitioning strategies for parallel processing
- Configure proper replication for fault tolerance
- Enable idempotence for exactly-once semantics
- Use schema registry for schema evolution

### AMQP Reliability
- Configure dead letter queues for failure handling
- Use publisher confirms for delivery guarantees
- Set appropriate QoS for flow control
- Design exchanges and routing for flexibility

### WebSocket Scalability
- Implement proper authentication and authorization
- Use subprotocols for message type discrimination
- Handle connection lifecycle events
- Implement heartbeat/ping for connection health

### MQTT Efficiency
- Use appropriate QoS levels for use case
- Leverage retained messages for state
- Implement proper session handling
- Use topic hierarchies effectively

### HTTP Webhook Reliability
- Implement proper signature verification
- Use exponential backoff for retries
- Handle webhook registration/unregistration
- Provide webhook testing endpoints

## Next Steps

Understanding protocol bindings enables:
- **Advanced Patterns** - Complex event-driven architectures
- **Performance Tuning** - Protocol-specific optimizations
- **Reliability Patterns** - Error handling and resilience
- **Production Deployment** - Real-world configuration management

---

*Protocol bindings bridge the gap between AsyncAPI's generic specification and the specific requirements of messaging protocols, enabling production-ready event-driven systems.*