# Advanced Patterns: Complex TypeSpec to AsyncAPI Mapping Scenarios

## Overview

This document covers advanced event-driven architecture patterns and how they map from TypeSpec to AsyncAPI. These patterns include event sourcing, CQRS, saga patterns, streaming architectures, and complex message routing scenarios.

## Event Sourcing Patterns

### Event Store Design

```typespec
// TypeSpec: Event sourcing pattern
namespace EventStore {
  // Base event interface
  interface DomainEvent {
    eventId: string;
    aggregateId: string;
    aggregateVersion: int32;
    eventType: string;
    occurredAt: utcDateTime;
    metadata: EventMetadata;
  }

  // User aggregate events
  @discriminator("eventType")
  union UserEvent extends DomainEvent {
    created: UserCreatedEvent,
    updated: UserUpdatedEvent,
    deactivated: UserDeactivatedEvent,
    reactivated: UserReactivatedEvent
  }

  model UserCreatedEvent extends DomainEvent {
    eventType: "user.created";
    data: UserCreatedData;
  }

  model UserUpdatedEvent extends DomainEvent {
    eventType: "user.updated";
    data: UserUpdatedData;
    changes: ChangeSet;
  }

  model ChangeSet {
    changedFields: string[];
    previousValues: Record<unknown>;
    newValues: Record<unknown>;
  }

  // Event store operations
  @channel("eventstore.{aggregateType}")
  @publish
  op appendEvents(
    @path aggregateType: string,
    @body events: DomainEvent[]
  ): void;

  @channel("eventstore.{aggregateType}.{aggregateId}")
  @subscribe
  op replayEvents(
    @path aggregateType: string,
    @path aggregateId: string,
    @query fromVersion?: int32
  ): DomainEvent[];
}
```

```yaml
# AsyncAPI: Event sourcing infrastructure
channels:
  eventstore-append:
    address: eventstore.{aggregateType}
    parameters:
      aggregateType:
        description: Type of aggregate (user, order, etc.)
        schema:
          type: string
          enum: [user, order, payment, inventory]
    description: Event append stream for event sourcing

  eventstore-replay:
    address: eventstore.{aggregateType}.{aggregateId}
    parameters:
      aggregateType:
        schema:
          type: string
      aggregateId:
        schema:
          type: string
          format: uuid
    description: Event replay stream for specific aggregate

operations:
  appendEvents:
    action: send
    channel:
      $ref: '#/channels/eventstore-append'
    summary: Append events to event store
    description: Atomically append events to aggregate stream

  replayEvents:
    action: receive
    channel:
      $ref: '#/channels/eventstore-replay'
    summary: Replay aggregate events
    description: Replay all events for aggregate from specified version

components:
  messages:
    DomainEvent:
      name: DomainEvent
      payload:
        oneOf:
          - $ref: '#/components/schemas/UserCreatedEvent'
          - $ref: '#/components/schemas/UserUpdatedEvent'
          - $ref: '#/components/schemas/UserDeactivatedEvent'
          - $ref: '#/components/schemas/UserReactivatedEvent'
        discriminator:
          propertyName: eventType

  schemas:
    DomainEvent:
      type: object
      properties:
        eventId:
          type: string
          format: uuid
          description: Unique event identifier
        aggregateId:
          type: string
          format: uuid
          description: Aggregate root identifier
        aggregateVersion:
          type: integer
          format: int32
          description: Version for optimistic concurrency
        eventType:
          type: string
          description: Discriminator for event type
        occurredAt:
          type: string
          format: date-time
        metadata:
          $ref: '#/components/schemas/EventMetadata'
      required: [eventId, aggregateId, aggregateVersion, eventType, occurredAt]
      discriminator:
        propertyName: eventType
```

## CQRS (Command Query Responsibility Segregation)

### Command and Query Separation

```typespec
// TypeSpec: CQRS pattern
namespace CQRS {
  // Command side
  namespace Commands {
    interface Command {
      commandId: string;
      commandType: string;
      correlationId?: string;
      issuedAt: utcDateTime;
      issuedBy: string;
    }

    model CreateUserCommand extends Command {
      commandType: "user.create";
      data: CreateUserData;
    }

    model UpdateUserCommand extends Command {
      commandType: "user.update";
      userId: string;
      data: UpdateUserData;
      expectedVersion: int32;
    }

    // Command handlers
    @channel("commands.user")
    @subscribe
    op handleCreateUser(): CreateUserCommand;

    @channel("commands.user")
    @subscribe
    op handleUpdateUser(): UpdateUserCommand;
  }

  // Query side
  namespace Queries {
    interface Query {
      queryId: string;
      queryType: string;
      correlationId?: string;
      requestedAt: utcDateTime;
      requestedBy: string;
    }

    model GetUserQuery extends Query {
      queryType: "user.get";
      userId: string;
    }

    model SearchUsersQuery extends Query {
      queryType: "user.search";
      criteria: UserSearchCriteria;
      pagination: PaginationRequest;
    }

    // Query handlers
    @channel("queries.user.get")
    @subscribe
    op handleGetUser(): GetUserQuery;

    @channel("queries.user.search")
    @subscribe
    op handleSearchUsers(): SearchUsersQuery;

    // Query results
    @channel("queries.user.get.results")
    @publish
    op returnUserResult(@body result: UserQueryResult): void;

    @channel("queries.user.search.results")
    @publish
    op returnSearchResults(@body results: UserSearchResults): void;
  }

  // Read model updates
  namespace ReadModels {
    @channel("readmodels.user.updates")
    @subscribe
    op updateUserReadModel(): UserEvent;

    @channel("readmodels.user.projections")
    @publish
    op publishProjectionUpdate(@body update: ProjectionUpdate): void;
  }
}
```

```yaml
# AsyncAPI: CQRS implementation
channels:
  commands.user:
    address: commands.user
    description: User command processing
    messages:
      CreateUserCommand:
        $ref: '#/components/messages/CreateUserCommand'
      UpdateUserCommand:
        $ref: '#/components/messages/UpdateUserCommand'

  queries.user.get:
    address: queries.user.get
    description: Single user queries

  queries.user.search:
    address: queries.user.search
    description: User search queries

  queries.user.get.results:
    address: queries.user.get.results
    description: Single user query results

  queries.user.search.results:
    address: queries.user.search.results
    description: User search results

  readmodels.user.updates:
    address: readmodels.user.updates
    description: Events for read model updates

  readmodels.user.projections:
    address: readmodels.user.projections
    description: Read model projection updates

operations:
  # Command side
  handleCreateUser:
    action: receive
    channel:
      $ref: '#/channels/commands.user'
    summary: Handle user creation commands
    tags:
      - name: command-side
      - name: user-management

  handleUpdateUser:
    action: receive
    channel:
      $ref: '#/channels/commands.user'
    summary: Handle user update commands
    tags:
      - name: command-side
      - name: user-management

  # Query side
  handleGetUser:
    action: receive
    channel:
      $ref: '#/channels/queries.user.get'
    summary: Handle single user queries
    tags:
      - name: query-side
      - name: user-management

  returnUserResult:
    action: send
    channel:
      $ref: '#/channels/queries.user.get.results'
    summary: Return single user query results
    tags:
      - name: query-side
      - name: user-management

  # Read model side
  updateUserReadModel:
    action: receive
    channel:
      $ref: '#/channels/readmodels.user.updates'
    summary: Update user read models from events
    tags:
      - name: read-model
      - name: user-management

tags:
  - name: command-side
    description: Command processing operations
  - name: query-side
    description: Query processing operations
  - name: read-model
    description: Read model maintenance operations
```

## Saga Pattern (Process Manager)

### Orchestrated Saga

```typespec
// TypeSpec: Saga orchestration pattern
namespace Sagas {
  // Saga state management
  model SagaState {
    sagaId: string;
    sagaType: string;
    currentStep: string;
    status: "started" | "running" | "completed" | "compensating" | "failed";
    createdAt: utcDateTime;
    updatedAt: utcDateTime;
    completedSteps: string[];
    compensatedSteps: string[];
    context: Record<unknown>;
  }

  // Order processing saga
  model OrderProcessingSaga extends SagaState {
    sagaType: "order.processing";
    orderId: string;
    customerId: string;
    paymentId?: string;
    inventoryReservationId?: string;
    shippingId?: string;
  }

  // Saga commands
  @discriminator("commandType")
  union SagaCommand {
    start: StartSagaCommand,
    stepCompleted: SagaStepCompletedCommand,
    stepFailed: SagaStepFailedCommand,
    compensate: CompensateSagaCommand
  }

  model StartSagaCommand {
    commandType: "saga.start";
    sagaId: string;
    sagaType: string;
    initialContext: Record<unknown>;
  }

  model SagaStepCompletedCommand {
    commandType: "saga.step.completed";
    sagaId: string;
    stepName: string;
    result: Record<unknown>;
  }

  // Saga orchestrator operations
  @channel("saga.orchestrator.commands")
  @subscribe
  op handleSagaCommand(): SagaCommand;

  @channel("saga.orchestrator.events")
  @publish
  op publishSagaEvent(@body event: SagaEvent): void;

  // Step execution
  @channel("saga.steps.{stepType}")
  @publish
  op executeStep(
    @path stepType: string,
    @body command: StepCommand
  ): void;

  @channel("saga.steps.{stepType}.results")
  @subscribe
  op handleStepResult(
    @path stepType: string
  ): StepResult;

  // Compensation
  @channel("saga.compensation.{stepType}")
  @publish
  op compensateStep(
    @path stepType: string,
    @body command: CompensationCommand
  ): void;
}
```

```yaml
# AsyncAPI: Saga pattern implementation
channels:
  saga.orchestrator.commands:
    address: saga.orchestrator.commands
    description: Commands to saga orchestrator

  saga.orchestrator.events:
    address: saga.orchestrator.events
    description: Events from saga orchestrator

  saga.steps.payment:
    address: saga.steps.payment
    description: Payment processing step

  saga.steps.payment.results:
    address: saga.steps.payment.results
    description: Payment step results

  saga.steps.inventory:
    address: saga.steps.inventory
    description: Inventory reservation step

  saga.steps.inventory.results:
    address: saga.steps.inventory.results
    description: Inventory step results

  saga.compensation.payment:
    address: saga.compensation.payment
    description: Payment compensation

  saga.compensation.inventory:
    address: saga.compensation.inventory
    description: Inventory compensation

operations:
  handleSagaCommand:
    action: receive
    channel:
      $ref: '#/channels/saga.orchestrator.commands'
    summary: Process saga orchestration commands
    description: |
      Handles saga lifecycle commands including start, step completion,
      step failure, and compensation initiation

  publishSagaEvent:
    action: send
    channel:
      $ref: '#/channels/saga.orchestrator.events'
    summary: Publish saga state changes
    description: |
      Publishes events about saga state changes for monitoring
      and external system integration

  executeStep:
    action: send
    channel:
      $ref: '#/channels/saga.steps.{stepType}'
    summary: Execute saga step
    description: Send command to execute a specific saga step

  handleStepResult:
    action: receive
    channel:
      $ref: '#/channels/saga.steps.{stepType}.results'
    summary: Handle saga step results
    description: Process results from saga step execution

  compensateStep:
    action: send
    channel:
      $ref: '#/channels/saga.compensation.{stepType}'
    summary: Execute compensation action
    description: Send command to compensate a previously executed step

components:
  schemas:
    SagaState:
      type: object
      properties:
        sagaId:
          type: string
          format: uuid
        sagaType:
          type: string
          enum: [order.processing, user.onboarding, payment.processing]
        currentStep:
          type: string
          description: Currently executing step
        status:
          type: string
          enum: [started, running, completed, compensating, failed]
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
        completedSteps:
          type: array
          items:
            type: string
          description: Successfully completed steps
        compensatedSteps:
          type: array
          items:
            type: string
          description: Steps that have been compensated
        context:
          type: object
          description: Saga execution context
          additionalProperties: {}
      required: [sagaId, sagaType, currentStep, status, createdAt, updatedAt]
```

## Event-Driven Microservices Communication

### Service-to-Service Events

```typespec
// TypeSpec: Microservices event communication
namespace Microservices {
  // Service boundaries
  namespace UserService {
    @channel("services.user.events")
    @publish
    op publishUserEvent(@body event: UserDomainEvent): void;

    @channel("services.user.commands")
    @subscribe
    op handleUserCommand(): UserCommand;
  }

  namespace OrderService {
    @channel("services.order.events")
    @publish
    op publishOrderEvent(@body event: OrderDomainEvent): void;

    // Listen to user events
    @channel("services.user.events")
    @subscribe
    op handleUserEvent(): UserDomainEvent;

    // Integration events
    @channel("integration.user.validated")
    @subscribe
    op handleUserValidated(): UserValidatedEvent;
  }

  namespace PaymentService {
    @channel("services.payment.events")
    @publish
    op publishPaymentEvent(@body event: PaymentDomainEvent): void;

    // Listen to order events
    @channel("services.order.events")
    @subscribe
    op handleOrderEvent(): OrderDomainEvent;
  }

  // Cross-service integration events
  namespace Integration {
    model IntegrationEvent {
      eventId: string;
      eventType: string;
      source: string;
      dataContentType: string;
      subject: string;
      time: utcDateTime;
      data: Record<unknown>;
    }

    @channel("integration.events")
    @publish
    op publishIntegrationEvent(@body event: IntegrationEvent): void;

    @channel("integration.events")
    @subscribe
    op handleIntegrationEvent(): IntegrationEvent;
  }
}
```

```yaml
# AsyncAPI: Microservices event architecture
channels:
  services.user.events:
    address: services.user.events
    description: User service domain events
    x-service: user-service

  services.user.commands:
    address: services.user.commands
    description: User service commands
    x-service: user-service

  services.order.events:
    address: services.order.events
    description: Order service domain events
    x-service: order-service

  services.payment.events:
    address: services.payment.events
    description: Payment service domain events
    x-service: payment-service

  integration.events:
    address: integration.events
    description: Cross-service integration events
    x-integration-layer: true

operations:
  # User Service
  publishUserEvent:
    action: send
    channel:
      $ref: '#/channels/services.user.events'
    x-service: user-service
    x-service-role: publisher

  handleUserCommand:
    action: receive
    channel:
      $ref: '#/channels/services.user.commands'
    x-service: user-service
    x-service-role: consumer

  # Order Service
  publishOrderEvent:
    action: send
    channel:
      $ref: '#/channels/services.order.events'
    x-service: order-service
    x-service-role: publisher

  handleUserEvent:
    action: receive
    channel:
      $ref: '#/channels/services.user.events'
    x-service: order-service
    x-service-role: consumer
    x-cross-service: true

  # Integration Layer
  publishIntegrationEvent:
    action: send
    channel:
      $ref: '#/channels/integration.events'
    x-integration-layer: true

  handleIntegrationEvent:
    action: receive
    channel:
      $ref: '#/channels/integration.events'
    x-integration-layer: true

# Service dependency mapping
x-service-dependencies:
  user-service:
    publishes:
      - services.user.events
    subscribes:
      - services.user.commands
  order-service:
    publishes:
      - services.order.events
    subscribes:
      - services.user.events
      - integration.user.validated
  payment-service:
    publishes:
      - services.payment.events
    subscribes:
      - services.order.events
```

## Stream Processing Patterns

### Real-Time Analytics Streams

```typespec
// TypeSpec: Stream processing pattern
namespace StreamProcessing {
  // Raw events
  model RawEvent {
    eventId: string;
    timestamp: utcDateTime;
    source: string;
    type: string;
    data: Record<unknown>;
  }

  // Processed events
  model ProcessedEvent {
    originalEventId: string;
    processingId: string;
    timestamp: utcDateTime;
    processingTimestamp: utcDateTime;
    source: string;
    type: string;
    enrichedData: Record<unknown>;
    metrics: ProcessingMetrics;
  }

  // Aggregated events
  model AggregatedEvent {
    aggregationId: string;
    windowStart: utcDateTime;
    windowEnd: utcDateTime;
    windowType: "tumbling" | "sliding" | "session";
    eventCount: int32;
    aggregations: Record<unknown>;
  }

  // Stream operations
  @protocol({
    type: "kafka",
    streaming: true,
    batchSize: 1000,
    processingTimeWindow: "5m"
  })
  @channel("streams.raw.events")
  @subscribe
  op consumeRawEvents(): RawEvent;

  @protocol({
    type: "kafka",
    streaming: true,
    partitionKey: "source"
  })
  @channel("streams.processed.events")
  @publish
  op publishProcessedEvents(@body events: ProcessedEvent[]): void;

  @protocol({
    type: "kafka",
    streaming: true,
    windowType: "tumbling",
    windowSize: "1h"
  })
  @channel("streams.aggregated.events")
  @publish
  op publishAggregatedEvents(@body events: AggregatedEvent[]): void;

  // Real-time notifications
  @protocol({
    type: "websocket",
    streaming: true
  })
  @channel("streams.realtime.notifications")
  @publish
  op publishRealtimeNotification(@body notification: RealtimeNotification): void;
}
```

```yaml
# AsyncAPI: Stream processing architecture
channels:
  streams.raw.events:
    address: streams.raw.events
    description: Raw event ingestion stream
    bindings:
      kafka:
        topic: raw-events
        partitions: 24
        replicas: 3
        configs:
          retention.ms: 259200000  # 3 days
          cleanup.policy: delete
        bindingVersion: "0.4.0"

  streams.processed.events:
    address: streams.processed.events
    description: Processed and enriched events
    bindings:
      kafka:
        topic: processed-events
        partitions: 12
        replicas: 3
        configs:
          retention.ms: 604800000  # 7 days
          cleanup.policy: delete
        bindingVersion: "0.4.0"

  streams.aggregated.events:
    address: streams.aggregated.events
    description: Time-windowed aggregations
    bindings:
      kafka:
        topic: aggregated-events
        partitions: 6
        replicas: 3
        configs:
          retention.ms: 2592000000  # 30 days
          cleanup.policy: compact
        bindingVersion: "0.4.0"

  streams.realtime.notifications:
    address: /realtime/notifications
    description: Real-time notification stream
    bindings:
      ws:
        bindingVersion: "0.1.0"

operations:
  consumeRawEvents:
    action: receive
    channel:
      $ref: '#/channels/streams.raw.events'
    summary: Consume raw events for processing
    bindings:
      kafka:
        groupId: stream-processors
        autoOffsetReset: latest
        enableAutoCommit: false
        maxPollRecords: 1000
        bindingVersion: "0.4.0"
    x-processing:
      type: continuous
      parallelism: 4
      checkpointInterval: 10000

  publishProcessedEvents:
    action: send
    channel:
      $ref: '#/channels/streams.processed.events'
    summary: Publish enriched events
    bindings:
      kafka:
        acks: all
        batchSize: 100
        compressionType: lz4
        bindingVersion: "0.4.0"
    x-processing:
      type: batch
      batchSize: 1000
      flushInterval: 5000

  publishAggregatedEvents:
    action: send
    channel:
      $ref: '#/channels/streams.aggregated.events'
    summary: Publish time-windowed aggregations
    bindings:
      kafka:
        acks: all
        compressionType: gzip
        bindingVersion: "0.4.0"
    x-processing:
      windowType: tumbling
      windowSize: PT1H
      watermarkDelay: PT5M

  publishRealtimeNotification:
    action: send
    channel:
      $ref: '#/channels/streams.realtime.notifications'
    summary: Push real-time notifications
    bindings:
      ws:
        bindingVersion: "0.1.0"
    x-processing:
      type: realtime
      latencyTarget: 100ms
```

## Complex Message Routing

### Content-Based Routing

```typespec
// TypeSpec: Content-based routing pattern
namespace MessageRouting {
  // Message with routing metadata
  model RoutableMessage {
    messageId: string;
    messageType: string;
    priority: "low" | "normal" | "high" | "critical";
    region: "us-east" | "us-west" | "eu" | "asia";
    tenant: string;
    content: Record<unknown>;
    routingHints: RoutingHints;
  }

  model RoutingHints {
    targetServices: string[];
    excludeServices?: string[];
    routingRules?: RoutingRule[];
    ttl?: int32;
  }

  model RoutingRule {
    condition: string;  // JSONPath expression
    action: "route" | "filter" | "transform" | "enrich";
    target?: string;
    parameters?: Record<unknown>;
  }

  // Routing operations
  @channel("routing.ingress")
  @subscribe
  op receiveMessage(): RoutableMessage;

  // High priority routing
  @channel("routing.priority.high")
  @publish
  op routeHighPriority(@body message: RoutableMessage): void;

  // Regional routing
  @channel("routing.region.{region}")
  @publish
  op routeByRegion(
    @path region: string,
    @body message: RoutableMessage
  ): void;

  // Service-specific routing
  @channel("routing.service.{serviceName}")
  @publish
  op routeToService(
    @path serviceName: string,
    @body message: RoutableMessage
  ): void;

  // Dead letter queue
  @channel("routing.deadletter")
  @publish
  op routeToDeadLetter(@body message: FailedMessage): void;
}
```

```yaml
# AsyncAPI: Content-based routing system
channels:
  routing.ingress:
    address: routing.ingress
    description: Message ingress point for routing

  routing.priority.high:
    address: routing.priority.high
    description: High priority message route

  routing.region.us-east:
    address: routing.region.us-east
    description: US East region message route

  routing.region.us-west:
    address: routing.region.us-west
    description: US West region message route

  routing.region.eu:
    address: routing.region.eu
    description: Europe region message route

  routing.region.asia:
    address: routing.region.asia
    description: Asia region message route

  routing.service.user-service:
    address: routing.service.user-service
    description: Route to user service

  routing.service.order-service:
    address: routing.service.order-service
    description: Route to order service

  routing.deadletter:
    address: routing.deadletter
    description: Failed message routing

operations:
  receiveMessage:
    action: receive
    channel:
      $ref: '#/channels/routing.ingress'
    summary: Receive messages for routing
    x-routing:
      type: content-based
      rules:
        - condition: "$.priority == 'critical'"
          action: route
          target: routing.priority.high
        - condition: "$.region == 'us-east'"
          action: route
          target: routing.region.us-east
        - condition: "$.routingHints.targetServices[*] == 'user-service'"
          action: route
          target: routing.service.user-service

  routeHighPriority:
    action: send
    channel:
      $ref: '#/channels/routing.priority.high'
    summary: Route high priority messages
    x-routing:
      priority: 1

  routeByRegion:
    action: send
    channel:
      $ref: '#/channels/routing.region.{region}'
    summary: Route messages by region
    x-routing:
      type: regional

  routeToService:
    action: send
    channel:
      $ref: '#/channels/routing.service.{serviceName}'
    summary: Route messages to specific services
    x-routing:
      type: service-specific

  routeToDeadLetter:
    action: send
    channel:
      $ref: '#/channels/routing.deadletter'
    summary: Route failed messages to dead letter queue
    x-routing:
      type: error-handling

x-routing-configuration:
  rules:
    priority-routing:
      - condition: "priority == 'critical'"
        target: routing.priority.high
        weight: 100
      - condition: "priority == 'high'"
        target: routing.priority.high
        weight: 80
    regional-routing:
      - condition: "region == 'us-east'"
        target: routing.region.us-east
      - condition: "region == 'us-west'"
        target: routing.region.us-west
      - condition: "region == 'eu'"
        target: routing.region.eu
      - condition: "region == 'asia'"
        target: routing.region.asia
    service-routing:
      - condition: "messageType startsWith 'user.'"
        target: routing.service.user-service
      - condition: "messageType startsWith 'order.'"
        target: routing.service.order-service
```

## Error Handling and Resilience Patterns

### Circuit Breaker Pattern

```typespec
// TypeSpec: Circuit breaker and resilience
namespace Resilience {
  model ServiceHealth {
    serviceName: string;
    status: "healthy" | "degraded" | "unhealthy";
    circuitState: "closed" | "open" | "half-open";
    errorRate: float32;
    lastHealthCheck: utcDateTime;
    consecutiveFailures: int32;
  }

  // Health monitoring
  @channel("health.monitoring")
  @publish
  op reportHealthStatus(@body health: ServiceHealth): void;

  @channel("health.alerts")
  @subscribe
  op handleHealthAlert(): HealthAlert;

  // Circuit breaker events
  @channel("circuitbreaker.{serviceName}")
  @publish
  op reportCircuitBreakerState(
    @path serviceName: string,
    @body state: CircuitBreakerEvent
  ): void;

  // Retry and fallback
  @channel("retry.{operationType}")
  @subscribe
  op handleRetryableOperation(
    @path operationType: string
  ): RetryableMessage;

  @channel("fallback.{operationType}")
  @subscribe
  op handleFallbackOperation(
    @path operationType: string
  ): FallbackMessage;
}
```

```yaml
# AsyncAPI: Resilience patterns
channels:
  health.monitoring:
    address: health.monitoring
    description: Service health status reporting

  health.alerts:
    address: health.alerts
    description: Health alert notifications

  circuitbreaker.user-service:
    address: circuitbreaker.user-service
    description: User service circuit breaker events

  retry.payment-processing:
    address: retry.payment-processing
    description: Payment processing retry queue
    bindings:
      sqs:
        queue:
          name: payment-retry-queue
          visibilityTimeout: 300
          messageRetentionPeriod: 1209600
          redrivePolicy:
            deadLetterQueue:
              arn: arn:aws:sqs:region:account:payment-dlq
            maxReceiveCount: 5
        bindingVersion: "0.2.0"

  fallback.payment-processing:
    address: fallback.payment-processing
    description: Payment processing fallback queue

operations:
  reportHealthStatus:
    action: send
    channel:
      $ref: '#/channels/health.monitoring'
    x-resilience:
      pattern: health-monitoring
      checkInterval: 30s

  handleHealthAlert:
    action: receive
    channel:
      $ref: '#/channels/health.alerts'
    x-resilience:
      pattern: alerting
      escalation: true

  reportCircuitBreakerState:
    action: send
    channel:
      $ref: '#/channels/circuitbreaker.{serviceName}'
    x-resilience:
      pattern: circuit-breaker
      failureThreshold: 5
      recoveryTimeout: 60s

  handleRetryableOperation:
    action: receive
    channel:
      $ref: '#/channels/retry.{operationType}'
    x-resilience:
      pattern: retry
      maxRetries: 5
      backoffStrategy: exponential
      initialDelay: 1s
      maxDelay: 60s

  handleFallbackOperation:
    action: receive
    channel:
      $ref: '#/channels/fallback.{operationType}'
    x-resilience:
      pattern: fallback
      fallbackType: cached-response

x-resilience-configuration:
  circuit-breakers:
    user-service:
      failureThreshold: 5
      recoveryTimeout: 60s
      monitoringInterval: 10s
    payment-service:
      failureThreshold: 3
      recoveryTimeout: 120s
      monitoringInterval: 5s
  retry-policies:
    payment-processing:
      maxRetries: 5
      backoffStrategy: exponential
      retryableErrors: [timeout, connection-error, service-unavailable]
    data-processing:
      maxRetries: 3
      backoffStrategy: linear
      retryableErrors: [timeout, transient-error]
```

## Advanced Pattern Best Practices

### 1. Event Sourcing

- Design events for replay and projection rebuilding
- Version events for schema evolution
- Implement snapshotting for performance
- Use correlation IDs for request tracing

### 2. CQRS Implementation

- Separate read and write models completely
- Use eventual consistency between command and query sides
- Implement projection rebuilding capabilities
- Monitor read model lag and health

### 3. Saga Orchestration

- Design compensating actions for each step
- Implement saga state persistence and recovery
- Use correlation IDs for message routing
- Handle partial failures gracefully

### 4. Stream Processing

- Design for exactly-once processing semantics
- Implement proper watermarking for event time
- Handle out-of-order events appropriately
- Monitor processing lag and throughput

### 5. Message Routing

- Use consistent routing keys for partitioning
- Implement proper error handling and dead letter queues
- Monitor routing performance and success rates
- Design for horizontal scaling

## Next Steps

These advanced patterns enable:

- **Production Implementation** - Real-world deployment strategies
- **Performance Optimization** - Scaling and tuning approaches
- **Monitoring Integration** - Observability and alerting patterns
- **Testing Strategies** - Comprehensive testing approaches

---

_Advanced patterns transform simple message exchange into sophisticated, resilient, and scalable event-driven architectures that can handle enterprise-scale requirements._
