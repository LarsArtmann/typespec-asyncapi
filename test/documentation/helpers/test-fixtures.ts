/**
 * Test Fixtures for TypeSpec-AsyncAPI Documentation Tests
 * 
 * Provides comprehensive test data generators, mock TypeSpec code snippets,
 * expected AsyncAPI outputs, and edge case scenarios for BDD testing.
 * 
 * TODO: CRITICAL FILE SIZE ISSUE - 1717 lines is MASSIVE for a test fixtures file
 * TODO: Split into separate files: coreFixtures.ts, edgeCaseFixtures.ts, validationFixtures.ts
 * TODO: Extract TypeSpecFixtures, AsyncAPIFixtures, EdgeCaseFixtures into separate modules
 * TODO: Remove ALL 'any' types - use proper AsyncAPI type definitions
 * TODO: Extract magic strings to constants (e.g., "3.0.0", "1.0.0", channel names)
 * TODO: Add proper type safety for test data structures
 * TODO: Implement fixture factories using builder pattern instead of massive objects
 * TODO: Add JSDoc documentation for all exported fixtures
 * TODO: Consider using faker.js for more realistic test data generation
 * TODO: Add validation for generated fixtures to ensure they're valid AsyncAPI
 */

import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js"

/**
 * TypeSpec code snippets for all documentation examples
 */
export const TypeSpecFixtures = {
  //TODO: MONOLITHIC ARCHITECTURE DISASTER - 1,728 LINES IN SINGLE FILE IS INSANE!
  //TODO: CRITICAL SPLIT REQUIRED - Break into CoreFixtures, EdgeCaseFixtures, PerformanceFixtures modules!
  //TODO: MAINTENANCE NIGHTMARE - Finding specific fixtures in 1,728 lines is IMPOSSIBLE!
  //TODO: DUPLICATE CODE EVERYWHERE - Same patterns repeated 50+ times without abstraction!
  //TODO: TYPE SAFETY CATASTROPHE - Using 'any' types and Record<string> instead of proper interfaces!
  
  // Core Concepts Fixtures
  coreConceptsService: `
    @service({
      //TODO: HARDCODED SERVICE TITLE! "Order Service" should be SERVICE_TITLE constant!
      //TODO: MAGIC STRING HELL - This title is duplicated in AsyncAPIFixtures without abstraction!
      title: "Order Service",
      //TODO: HARDCODED VERSION DISASTER - "1.0.0" appears 50+ times in this file!
      //TODO: VERSION UPDATE NIGHTMARE - Changing version requires editing 50+ locations!
      version: "1.0.0"
    })
    namespace OrderService {
      //TODO: HARDCODED CHANNEL PATTERN! "orders/{orderId}" should be ORDERS_CHANNEL_TEMPLATE constant!
      //TODO: MAGIC STRING DUPLICATION - This channel pattern repeated without abstraction!
      @channel("orders/{orderId}")
      @publish
      op createOrder(@path orderId: string, @body order: CreateOrderRequest): CreateOrderResponse;
      
      //TODO: ANOTHER HARDCODED CHANNEL! "orders/{orderId}/status" should be ORDER_STATUS_CHANNEL_TEMPLATE!
      //TODO: BRITTLE HARDCODED PATHS - Channel names scattered throughout without central management!
      @channel("orders/{orderId}/status")
      @subscribe  
      op orderStatusUpdated(@path orderId: string): OrderStatusEvent;
    }
    
    model CreateOrderRequest {
      //TODO: HARDCODED PROPERTY NAMES! "customerId" should be standardized across all models!
      //TODO: TYPE SAFETY VIOLATION - Using raw 'string' instead of branded types like CustomerId!
      customerId: string;
      items: OrderItem[];
    }
    
    model OrderItem {
      //TODO: MORE HARDCODED PROPERTY NAMES! "productId", "quantity", "price" need standardization!
      //TODO: PRIMITIVE OBSESSION - Using raw primitives instead of domain types like ProductId!
      productId: string;
      quantity: int32;
      price: float64;
    }
    
    model CreateOrderResponse {
      orderId: string;
      //TODO: HARDCODED STATUS VALUES! "pending"|"confirmed"|"rejected" should be OrderStatus enum!
      //TODO: MAGIC STRING ENUM - Status values hardcoded without proper type safety!
      status: "pending" | "confirmed" | "rejected";
    }
    
    //TODO: HARDCODED MESSAGE NAME! "OrderStatusEvent" should be MESSAGE_NAMES.ORDER_STATUS constant!
    @message("OrderStatusEvent")
    model OrderStatusEvent {
      //TODO: DUPLICATE PROPERTY PATTERNS - orderId/status/timestamp pattern repeated everywhere!
      //TODO: NO INHERITANCE - Should extend BaseEvent with common fields!
      orderId: string;
      status: string;
      timestamp: utcDateTime;
    }
  `,

  // Data Types Fixtures
  dataTypesPrimitives: `
    @service({ title: "Data Types Service" })
    namespace DataTypesService {
      
      @message("PrimitiveTypesMessage")
      model PrimitiveTypesMessage {
        stringField: string;
        int32Field: int32;
        int64Field: int64;
        float32Field: float32;
        float64Field: float64;
        booleanField: boolean;
        dateTimeField: utcDateTime;
        durationField: duration;
        urlField: url;
      }
      
      @message("ArrayTypesMessage")
      model ArrayTypesMessage {
        stringArray: string[];
        numberArray: int32[];
        objectArray: OrderItem[];
      }
      
      @message("UnionTypesMessage")
      model UnionTypesMessage {
        statusUnion: "active" | "inactive" | "pending";
        typeUnion: string | int32 | boolean;
      }
      
      @message("OptionalFieldsMessage")
      model OptionalFieldsMessage {
        requiredField: string;
        optionalField?: string;
        nullableField: string | null;
      }
    }
  `,

  dataTypesRecords: `
    @service({ title: "Records Service" })
    namespace RecordsService {
      
      @message("RecordTypesMessage")
      model RecordTypesMessage {
        dynamicObject: Record<string>;
        typedRecord: Record<UserProfile>;
        nestedRecord: Record<Record<string>>;
      }
      
      model UserProfile {
        name: string;
        age: int32;
        email: string;
      }
    }
  `,

  dataTypesEnums: `
    @service({ title: "Enums Service" })
    namespace EnumsService {
      
      enum OrderStatus {
        Pending: "pending",
        Processing: "processing", 
        Shipped: "shipped",
        Delivered: "delivered",
        Cancelled: "cancelled"
      }
      
      enum Priority {
        Low: 1,
        Medium: 2,
        High: 3,
        Critical: 4
      }
      
      @message("EnumMessage")
      model EnumMessage {
        status: OrderStatus;
        priority: Priority;
      }
    }
  `,

  // Operations & Channels Fixtures
  operationsPublishSubscribe: `
    @service({ title: "Event Service" })
    namespace EventService {
      
      @channel("user-events")
      @publish
      op publishUserEvent(@body event: UserEvent): void;
      
      @channel("user-events") 
      @subscribe
      op subscribeToUserEvents(): UserEvent;
      
      @channel("orders/{orderId}/updates")
      @publish
      op publishOrderUpdate(@path orderId: string, @body update: OrderUpdate): void;
      
      @channel("orders/{orderId}/updates")
      @subscribe
      op subscribeToOrderUpdates(@path orderId: string): OrderUpdate;
    }
    
    @message("UserEvent")
    model UserEvent {
      userId: string;
      eventType: "login" | "logout" | "profile_updated";
      timestamp: utcDateTime;
      metadata: Record<string>;
    }
    
    @message("OrderUpdate")
    model OrderUpdate {
      orderId: string;
      status: string;
      updatedAt: utcDateTime;
      changes: Record<string>;
    }
  `,

  operationsRequestReply: `
    @service({ title: "Request Reply Service" })
    namespace RequestReplyService {
      
      @channel("order-requests")
      @publish
      op requestOrderValidation(@body request: OrderValidationRequest): void;
      
      @channel("order-responses")
      @subscribe
      op receiveOrderValidation(): OrderValidationResponse;
    }
    
    @message("OrderValidationRequest")
    model OrderValidationRequest {
      orderId: string;
      items: OrderItem[];
      correlationId: string;
    }
    
    @message("OrderValidationResponse")
    model OrderValidationResponse {
      orderId: string;
      isValid: boolean;
      errors: string[];
      correlationId: string;
    }
  `,

  // Schema & Models Fixtures
  schemasEventSourcing: `
    @service({ title: "Event Sourcing Service" })
    namespace EventSourcingService {
      
      @message("DomainEvent")
      model DomainEvent {
        eventId: string;
        aggregateId: string;
        aggregateVersion: int32;
        eventType: string;
        occurredAt: utcDateTime;
        payload: Record<string>;
      }
      
      @message("OrderCreatedEvent")
      model OrderCreatedEvent extends DomainEvent {
        eventType: "OrderCreated";
        payload: OrderCreatedPayload;
      }
      
      model OrderCreatedPayload {
        customerId: string;
        items: OrderItem[];
        totalAmount: float64;
      }
      
      @message("OrderCancelledEvent") 
      model OrderCancelledEvent extends DomainEvent {
        eventType: "OrderCancelled";
        payload: OrderCancelledPayload;
      }
      
      model OrderCancelledPayload {
        reason: string;
        cancelledBy: string;
      }
    }
  `,

  schemasVersioning: `
    @service({ title: "Versioned Schema Service" })
    namespace VersionedSchemaService {
      
      @message("UserEventV1")
      model UserEventV1 {
        schemaVersion: "1.0";
        userId: string;
        action: string;
        timestamp: utcDateTime;
      }
      
      @message("UserEventV2")
      model UserEventV2 {
        schemaVersion: "2.0";
        userId: string;
        action: string;
        timestamp: utcDateTime;
        metadata: UserEventMetadata;
      }
      
      model UserEventMetadata {
        sessionId: string;
        userAgent: string;
        ipAddress: string;
      }
    }
  `,

  // Decorators Fixtures  
  decoratorsChannel: `
    @service({ title: "Channel Decorators Service" })
    namespace ChannelDecoratorsService {
      
      @channel("simple-channel")
      @publish
      op publishSimple(@body data: SimpleMessage): void;
      
      @channel("parameterized/{userId}/events/{eventType}")
      @subscribe
      op subscribeParameterized(@path userId: string, @path eventType: string): ParameterizedMessage;
    }
    
    @message("SimpleMessage")
    model SimpleMessage {
      content: string;
    }
    
    @message("ParameterizedMessage")
    model ParameterizedMessage {
      userId: string;
      eventType: string;
      payload: Record<string>;
    }
  `,

  decoratorsMessage: `
    @service({ title: "Message Decorators Service" })
    namespace MessageDecoratorsService {
      
      @channel("messages")
      @publish
      op publishMessage(@body msg: MessageWithDecorators): void;
    }
    
    @message("MessageWithDecorators")
    model MessageWithDecorators {
      @header
      messageId: string;
      
      @header
      correlationId?: string;
      
      payload: MessagePayload;
      
      @correlationId
      traceId: string;
    }
    
    model MessagePayload {
      data: string;
      timestamp: utcDateTime;
    }
  `,

  decoratorsProtocol: `
    @service({ title: "Protocol Decorators Service" })  
    namespace ProtocolDecoratorsService {
      
      @channel("kafka-topic")
      @protocol("kafka", {
        topic: "user-events",
        partitionKey: "userId", 
        replicationFactor: 3
      })
      @publish
      op publishToKafka(@body event: KafkaEvent): void;
      
      @channel("amqp-queue")
      @protocol("amqp", {
        exchange: "events.exchange",
        routingKey: "user.created",
        deliveryMode: 2
      })
      @subscribe
      op subscribeFromAMQP(): AMQPEvent;
    }
    
    @message("KafkaEvent")
    model KafkaEvent {
      userId: string;
      eventData: Record<string>;
    }
    
    @message("AMQPEvent")
    model AMQPEvent {
      eventType: string;
      payload: Record<string>;
    }
  `,

  decoratorsSecurity: `
    @service({ title: "Security Decorators Service" })
    namespace SecurityDecoratorsService {
      
      @channel("secure-channel")
      @security("oauth2", {
        flows: {
          clientCredentials: {
            tokenUrl: "https://auth.example.com/token",
            scopes: {
              "read:messages": "Read messages",
              "write:messages": "Write messages"
            }
          }
        }
      })
      @publish
      op publishSecure(@body msg: SecureMessage): void;
      
      @channel("api-key-channel")
      @security("apiKey", {
        type: "apiKey",
        in: "header",
        name: "X-API-Key"
      })
      @subscribe
      op subscribeSecure(): SecureMessage;
    }
    
    @message("SecureMessage")
    model SecureMessage {
      content: string;
      sensitive: boolean;
    }
  `,

  decoratorsServer: `
    @service({ title: "Server Decorators Service" })
    namespace ServerDecoratorsService {
      
      @server("production", {
        url: "kafka://prod-cluster.example.com:9092",
        protocol: "kafka",
        description: "Production Kafka cluster"
      })
      @server("staging", {
        url: "kafka://staging-cluster.example.com:9092", 
        protocol: "kafka",
        description: "Staging Kafka cluster"
      })
      @channel("multi-server-channel")
      @publish
      op publishMultiServer(@body msg: MultiServerMessage): void;
    }
    
    @message("MultiServerMessage")
    model MultiServerMessage {
      environment: "production" | "staging";
      data: Record<string>;
    }
  `,

  // Protocol Bindings Fixtures
  protocolKafka: `
    @service({ title: "Kafka Protocol Service" })
    namespace KafkaProtocolService {
      
      @channel("user-events")
      @protocol("kafka", {
        topic: "user-events",
        partitions: 12,
        replicationFactor: 3,
        retentionMs: 604800000,
        cleanupPolicy: "delete"
      })
      @publish
      op publishUserEvent(@body event: UserEvent): void;
      
      @channel("order-events")
      @protocol("kafka", {
        topic: "order-events", 
        partitionKey: "customerId",
        headers: {
          "Content-Type": "application/json",
          "Schema-Version": "1.0"
        }
      })
      @subscribe
      op subscribeOrderEvents(): OrderEvent;
    }
  `,

  protocolAMQP: `
    @service({ title: "AMQP Protocol Service" })
    namespace AMQPProtocolService {
      
      @channel("notifications")
      @protocol("amqp", {
        exchange: "notifications.topic",
        exchangeType: "topic",
        routingKey: "user.notification",
        queue: "user-notifications",
        durable: true,
        autoDelete: false,
        exclusive: false
      })
      @publish
      op publishNotification(@body notification: Notification): void;
      
      @channel("dead-letter")
      @protocol("amqp", {
        exchange: "dlx.exchange",
        routingKey: "failed.message",
        ttl: 86400000,
        maxRetries: 3
      })
      @subscribe
      op processDeadLetter(): FailedMessage;
    }
  `,

  protocolWebSocket: `
    @service({ title: "WebSocket Protocol Service" })
    namespace WebSocketProtocolService {
      
      @channel("live-updates/{userId}")
      @protocol("ws", {
        method: "GET",
        query: {
          token: "string",
          version: "string"
        },
        headers: {
          "Sec-WebSocket-Protocol": "chat"
        }
      })
      @subscribe
      op subscribeLiveUpdates(@path userId: string): LiveUpdate;
      
      @channel("chat/{roomId}")
      @protocol("ws", {
        bindings: {
          query: {
            type: "object", 
            properties: {
              auth: { type: "string" }
            }
          }
        }
      })
      @publish
      op sendChatMessage(@path roomId: string, @body message: ChatMessage): void;
    }
  `,

  // Advanced Patterns Fixtures
  advancedEventSourcing: `
    @service({ title: "Advanced Event Sourcing Service" })
    namespace AdvancedEventSourcingService {
      
      @channel("event-store/{aggregateId}")
      @publish
      op appendEvent(@path aggregateId: string, @body event: DomainEvent): void;
      
      @channel("projections/{viewName}")
      @subscribe
      op subscribeProjection(@path viewName: string): ProjectionUpdate;
      
      @channel("snapshots/{aggregateId}")
      @publish
      op saveSnapshot(@path aggregateId: string, @body snapshot: AggregateSnapshot): void;
    }
    
    @message("DomainEvent")
    model DomainEvent {
      eventId: string;
      aggregateId: string; 
      aggregateType: string;
      aggregateVersion: int64;
      eventType: string;
      eventVersion: int32;
      occurredAt: utcDateTime;
      causationId?: string;
      correlationId?: string;
      payload: Record<string>;
      metadata: EventMetadata;
    }
    
    model EventMetadata {
      userId?: string;
      sessionId?: string;
      traceId: string;
      source: string;
    }
    
    @message("ProjectionUpdate")
    model ProjectionUpdate {
      projectionName: string;
      lastProcessedEvent: int64;
      updatedData: Record<string>;
    }
    
    @message("AggregateSnapshot")
    model AggregateSnapshot {
      aggregateId: string;
      aggregateType: string;
      version: int64;
      snapshotData: Record<string>;
      createdAt: utcDateTime;
    }
  `,

  advancedCQRS: `
    @service({ title: "CQRS Service" })
    namespace CQRSService {
      
      @channel("commands/{commandType}")
      @publish
      op sendCommand(@path commandType: string, @body command: Command): void;
      
      @channel("queries/{queryType}")
      @publish  
      op sendQuery(@path queryType: string, @body query: Query): void;
      
      @channel("events/{eventType}")
      @subscribe
      op handleEvent(@path eventType: string): DomainEvent;
      
      @channel("query-results/{correlationId}")
      @subscribe
      op receiveQueryResult(@path correlationId: string): QueryResult;
    }
    
    @message("Command")
    model Command {
      commandId: string;
      commandType: string;
      aggregateId: string;
      payload: Record<string>;
      metadata: CommandMetadata;
    }
    
    model CommandMetadata {
      userId: string;
      timestamp: utcDateTime;
      correlationId: string;
      expectedVersion?: int64;
    }
    
    @message("Query")
    model Query {
      queryId: string;
      queryType: string;
      parameters: Record<string>;
      correlationId: string;
    }
    
    @message("QueryResult")
    model QueryResult {
      queryId: string;
      data: Record<string>;
      correlationId: string;
      executedAt: utcDateTime;
    }
  `,

  advancedSaga: `
    @service({ title: "Saga Orchestration Service" })
    namespace SagaOrchestrationService {
      
      @channel("saga/{sagaId}/start")
      @publish
      op startSaga(@path sagaId: string, @body saga: SagaDefinition): void;
      
      @channel("saga/{sagaId}/step/{stepId}")
      @publish
      op executeStep(@path sagaId: string, @path stepId: string, @body step: SagaStep): void;
      
      @channel("saga/{sagaId}/compensate/{stepId}")
      @publish
      op compensateStep(@path sagaId: string, @path stepId: string, @body compensation: Compensation): void;
      
      @channel("saga/{sagaId}/complete")
      @subscribe
      op sagaCompleted(@path sagaId: string): SagaCompleted;
      
      @channel("saga/{sagaId}/failed")
      @subscribe  
      op sagaFailed(@path sagaId: string): SagaFailed;
    }
    
    @message("SagaDefinition")
    model SagaDefinition {
      sagaId: string;
      sagaType: string;
      steps: SagaStep[];
      timeoutMs: int64;
      retryPolicy: RetryPolicy;
    }
    
    model SagaStep {
      stepId: string;
      stepType: string;
      action: Record<string>;
      compensation?: Record<string>;
      timeout?: int64;
    }
    
    model RetryPolicy {
      maxRetries: int32;
      backoffMultiplier: float64;
      maxBackoffMs: int64;
    }
    
    @message("Compensation")
    model Compensation {
      stepId: string;
      reason: string;
      compensationData: Record<string>;
    }
    
    @message("SagaCompleted")
    model SagaCompleted {
      sagaId: string;
      completedAt: utcDateTime;
      finalState: Record<string>;
    }
    
    @message("SagaFailed")
    model SagaFailed {
      sagaId: string;
      failedAt: utcDateTime;
      error: string;
      failedStep: string;
    }
  `,

  // Best Practices Fixtures
  bestPracticesNaming: `
    @service({ title: "Naming Conventions Service" })
    namespace NamingConventionsService {
      
      // Good: Descriptive, follows kebab-case for channels
      @channel("user-profile-updates")
      @publish
      op publishUserProfileUpdate(@body event: UserProfileUpdatedEvent): void;
      
      // Good: Clear action-oriented operation names
      @channel("order-fulfillment-requests") 
      @subscribe
      op processOrderFulfillmentRequest(): OrderFulfillmentRequestedEvent;
      
      // Good: Descriptive message names with Event suffix
      @channel("inventory-level-changes")
      @publish
      op publishInventoryLevelChange(@body event: InventoryLevelChangedEvent): void;
    }
    
    // Good: Clear, descriptive model names
    @message("UserProfileUpdatedEvent")
    model UserProfileUpdatedEvent {
      userId: string;
      updatedFields: string[];
      previousValues: Record<string>;
      newValues: Record<string>;
      updatedAt: utcDateTime;
      updatedBy: string;
    }
    
    @message("OrderFulfillmentRequestedEvent")
    model OrderFulfillmentRequestedEvent {
      orderId: string;
      customerId: string;
      warehouseId: string;
      items: FulfillmentItem[];
      requestedBy: utcDateTime;
      priority: "standard" | "expedited" | "urgent";
    }
    
    model FulfillmentItem {
      productId: string;
      quantity: int32;
      warehouseLocation: string;
    }
    
    @message("InventoryLevelChangedEvent")
    model InventoryLevelChangedEvent {
      productId: string;
      warehouseId: string;
      previousLevel: int32;
      newLevel: int32;
      changeReason: "sale" | "restock" | "adjustment" | "damage";
      changedAt: utcDateTime;
    }
  `,

  // Examples Fixtures (E-commerce, IoT, Financial)
  exampleEcommerce: `
    @service({
      title: "E-Commerce Order Processing Service",
      version: "1.0.0",
      description: "Handles order lifecycle events for e-commerce platform"
    })
    namespace ECommerceService {
      
      // Order Creation Flow
      @channel("orders/created")
      @protocol("kafka", {
        topic: "orders.created",
        partitionKey: "customerId"
      })
      @publish
      op publishOrderCreated(@body event: OrderCreatedEvent): void;
      
      // Inventory Updates
      @channel("inventory/reserved")
      @protocol("kafka", {
        topic: "inventory.reserved",
        partitionKey: "warehouseId"
      })
      @subscribe
      op handleInventoryReserved(): InventoryReservedEvent;
      
      // Payment Processing
      @channel("payments/processed") 
      @protocol("kafka", {
        topic: "payments.processed",
        partitionKey: "orderId"
      })
      @subscribe
      op handlePaymentProcessed(): PaymentProcessedEvent;
      
      // Shipping Updates
      @channel("orders/{orderId}/shipping")
      @protocol("amqp", {
        exchange: "shipping.exchange",
        routingKey: "order.shipped"
      })
      @publish
      op publishOrderShipped(@path orderId: string, @body event: OrderShippedEvent): void;
    }
    
    @message("OrderCreatedEvent")
    model OrderCreatedEvent {
      orderId: string;
      customerId: string;
      orderItems: OrderItem[];
      totalAmount: float64;
      currency: string;
      shippingAddress: Address;
      billingAddress: Address;
      createdAt: utcDateTime;
      expectedDeliveryDate: utcDateTime;
    }
    
    model OrderItem {
      productId: string;
      productName: string;
      sku: string;
      quantity: int32;
      unitPrice: float64;
      totalPrice: float64;
    }
    
    model Address {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    }
    
    @message("InventoryReservedEvent")
    model InventoryReservedEvent {
      orderId: string;
      warehouseId: string;
      items: ReservedItem[];
      reservedAt: utcDateTime;
      reservationExpiry: utcDateTime;
    }
    
    model ReservedItem {
      productId: string;
      quantity: int32;
      warehouseLocation: string;
    }
    
    @message("PaymentProcessedEvent")
    model PaymentProcessedEvent {
      orderId: string;
      paymentId: string;
      amount: float64;
      currency: string;
      paymentMethod: "credit_card" | "paypal" | "bank_transfer";
      status: "success" | "failed" | "pending";
      processedAt: utcDateTime;
      transactionId?: string;
    }
    
    @message("OrderShippedEvent")
    model OrderShippedEvent {
      orderId: string;
      trackingNumber: string;
      carrier: string;
      estimatedDelivery: utcDateTime;
      shippedAt: utcDateTime;
      warehouseId: string;
    }
  `,

  exampleIoT: `
    @service({
      title: "IoT Device Management Service",
      version: "2.0.0", 
      description: "Manages IoT device telemetry, commands, and lifecycle events"
    })
    namespace IoTDeviceService {
      
      // Device Telemetry
      @channel("devices/{deviceId}/telemetry")
      @protocol("mqtt", {
        qos: 1,
        retain: false,
        topicTemplate: "devices/{deviceId}/telemetry"
      })
      @publish
      op publishTelemetry(@path deviceId: string, @body telemetry: TelemetryData): void;
      
      // Device Commands
      @channel("devices/{deviceId}/commands")
      @protocol("mqtt", {
        qos: 2,
        retain: true
      })
      @subscribe
      op receiveDeviceCommand(@path deviceId: string): DeviceCommand;
      
      // Device Status Updates
      @channel("devices/{deviceId}/status")
      @protocol("mqtt", {
        qos: 1,
        retain: true,
        lastWill: {
          topic: "devices/{deviceId}/status",
          message: '{"status": "offline", "timestamp": "{{timestamp}}"}'
        }
      })
      @publish
      op publishDeviceStatus(@path deviceId: string, @body status: DeviceStatus): void;
      
      // Aggregated Analytics
      @channel("analytics/device-metrics")
      @protocol("kafka", {
        topic: "device.metrics.aggregated",
        partitionKey: "deviceType"
      })
      @subscribe
      op handleAggregatedMetrics(): AggregatedDeviceMetrics;
    }
    
    @message("TelemetryData")
    model TelemetryData {
      deviceId: string;
      timestamp: utcDateTime;
      sensors: SensorReading[];
      batteryLevel?: float64;
      signalStrength?: int32;
      location?: GeoLocation;
      metadata: Record<string>;
    }
    
    model SensorReading {
      sensorType: "temperature" | "humidity" | "pressure" | "motion" | "light";
      value: float64;
      unit: string;
      accuracy?: float64;
      calibrationDate?: utcDateTime;
    }
    
    model GeoLocation {
      latitude: float64;
      longitude: float64;
      altitude?: float64;
      accuracy?: float64;
    }
    
    @message("DeviceCommand")
    model DeviceCommand {
      commandId: string;
      deviceId: string;
      commandType: "reboot" | "update_config" | "change_reporting_interval" | "run_diagnostic";
      parameters: Record<string>;
      expiresAt?: utcDateTime;
      priority: "low" | "normal" | "high" | "critical";
      issuedAt: utcDateTime;
    }
    
    @message("DeviceStatus")
    model DeviceStatus {
      deviceId: string;
      status: "online" | "offline" | "maintenance" | "error";
      lastSeen: utcDateTime;
      firmwareVersion: string;
      hardwareVersion: string;
      errorCode?: string;
      errorMessage?: string;
    }
    
    @message("AggregatedDeviceMetrics")
    model AggregatedDeviceMetrics {
      deviceType: string;
      timeWindow: TimeWindow;
      totalDevices: int32;
      activeDevices: int32;
      averageValues: Record<float64>;
      anomalies: DeviceAnomaly[];
      calculatedAt: utcDateTime;
    }
    
    model TimeWindow {
      startTime: utcDateTime;
      endTime: utcDateTime;
      intervalMinutes: int32;
    }
    
    model DeviceAnomaly {
      deviceId: string;
      anomalyType: string;
      severity: "low" | "medium" | "high" | "critical";
      detectedAt: utcDateTime;
      description: string;
    }
  `,

  exampleFinancial: `
    @service({
      title: "Financial Trading System",
      version: "3.1.0",
      description: "High-frequency trading system with real-time market data and order processing"
    })
    namespace FinancialTradingService {
      
      // Market Data Feed
      @channel("market-data/{symbol}/quotes")
      @protocol("ws", {
        method: "GET",
        query: {
          symbols: "string",
          depth: "number"
        }
      })
      @subscribe
      op subscribeMarketData(@path symbol: string): MarketDataUpdate;
      
      // Order Management
      @channel("orders/new")
      @protocol("kafka", {
        topic: "orders.new",
        partitionKey: "accountId",
        acks: "all",
        retries: 0
      })
      @publish
      op submitOrder(@body order: OrderRequest): void;
      
      // Trade Executions
      @channel("trades/executed")
      @protocol("kafka", {
        topic: "trades.executed",
        partitionKey: "symbol"
      })
      @subscribe
      op handleTradeExecution(): TradeExecuted;
      
      // Risk Notifications
      @channel("risk/alerts/{accountId}")
      @protocol("amqp", {
        exchange: "risk.alerts",
        routingKey: "account.risk.{severity}",
        priority: 255
      })
      @publish
      op publishRiskAlert(@path accountId: string, @body alert: RiskAlert): void;
      
      // Portfolio Updates  
      @channel("portfolio/{accountId}/updates")
      @protocol("ws", {
        headers: {
          "Authorization": "Bearer {{token}}"
        }
      })
      @publish
      op publishPortfolioUpdate(@path accountId: string, @body update: PortfolioUpdate): void;
    }
    
    @message("MarketDataUpdate")
    model MarketDataUpdate {
      symbol: string;
      timestamp: utcDateTime;
      bid: PriceLevel[];
      ask: PriceLevel[];
      lastTrade?: LastTrade;
      marketStatus: "open" | "closed" | "pre_market" | "after_hours";
      sequence: int64;
    }
    
    model PriceLevel {
      price: float64;
      quantity: float64;
      orderCount?: int32;
    }
    
    model LastTrade {
      price: float64;
      quantity: float64;
      timestamp: utcDateTime;
      side: "buy" | "sell";
    }
    
    @message("OrderRequest")
    model OrderRequest {
      orderId: string;
      accountId: string;
      symbol: string;
      side: "buy" | "sell";
      orderType: "market" | "limit" | "stop" | "stop_limit";
      quantity: float64;
      price?: float64;
      stopPrice?: float64;
      timeInForce: "day" | "gtc" | "ioc" | "fok";
      submittedAt: utcDateTime;
      clientOrderId?: string;
    }
    
    @message("TradeExecuted")
    model TradeExecuted {
      tradeId: string;
      orderId: string;
      accountId: string;
      symbol: string;
      side: "buy" | "sell";
      quantity: float64;
      price: float64;
      executedAt: utcDateTime;
      commission: float64;
      fees: TradeFees;
      venue: string;
    }
    
    model TradeFees {
      regulatory: float64;
      clearing: float64;
      exchange: float64;
      total: float64;
    }
    
    @message("RiskAlert")
    model RiskAlert {
      alertId: string;
      accountId: string;
      alertType: "position_limit" | "loss_limit" | "margin_call" | "concentration";
      severity: "info" | "warning" | "critical";
      message: string;
      currentValue: float64;
      thresholdValue: float64;
      triggeredAt: utcDateTime;
      requiresAction: boolean;
    }
    
    @message("PortfolioUpdate")
    model PortfolioUpdate {
      accountId: string;
      positions: Position[];
      cashBalance: float64;
      totalValue: float64;
      dayPnL: float64;
      unrealizedPnL: float64;
      marginUsed: float64;
      marginAvailable: float64;
      updatedAt: utcDateTime;
    }
    
    model Position {
      symbol: string;
      quantity: float64;
      averagePrice: float64;
      currentPrice: float64;
      unrealizedPnL: float64;
      dayPnL: float64;
      marketValue: float64;
    }
  `
}

/**
 * Expected AsyncAPI outputs for validation testing
 */
export const AsyncAPIFixtures = {
  
  coreConceptsExpected: {
    //TODO: HARDCODED VERSION STRINGS EVERYWHERE! "3.0.0" is DUPLICATED throughout this MASSIVE file!
    //TODO: MAGIC STRING DISASTER - AsyncAPI version should be ASYNCAPI_VERSION constant!
    //TODO: MAINTENANCE NIGHTMARE - Version updates require changing 10+ locations in this file!
    //TODO: COPY-PASTE PROGRAMMING - Same version strings pasted everywhere without abstraction!
    asyncapi: "3.0.0",
    info: {
      //TODO: MORE HARDCODED BULLSHIT - "1.0.0" repeated ad nauseam throughout test fixtures!
      //TODO: DRY VIOLATION - Service version should be SERVICE_VERSION constant!
      title: "Order Service",
      version: "1.0.0"
    },
    channels: {
      "orders/{orderId}": {
        address: "orders/{orderId}",
        parameters: {
          orderId: {
            schema: { type: "string" }
          }
        },
        messages: {
          "createOrder": {
            $ref: "#/components/messages/CreateOrderRequest"
          }
        }
      },
      "orders/{orderId}/status": {
        address: "orders/{orderId}/status",
        parameters: {
          orderId: {
            schema: { type: "string" }
          }
        },
        messages: {
          "OrderStatusEvent": {
            $ref: "#/components/messages/OrderStatusEvent"
          }
        }
      }
    },
    operations: {
      createOrder: {
        action: "send",
        channel: {
          $ref: "#/channels/orders~1{orderId}"
        }
      },
      orderStatusUpdated: {
        action: "receive", 
        channel: {
          $ref: "#/channels/orders~1{orderId}~1status"
        }
      }
    },
    components: {
      schemas: {},
      messages: {
        CreateOrderRequest: {
          payload: {
            type: "object",
            properties: {
              customerId: { type: "string" },
              items: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/OrderItem"
                }
              }
            },
            required: ["customerId", "items"]
          }
        },
        OrderStatusEvent: {
          payload: {
            type: "object",
            properties: {
              orderId: { type: "string" },
              status: { type: "string" },
              timestamp: { type: "string", format: "date-time" }
            },
            required: ["orderId", "status", "timestamp"]
          }
        }
      },
      securitySchemes: {}
    }
  },

  dataTypesPrimitivesExpected: {
    asyncapi: "3.0.0",
    info: {
      title: "Data Types Service"
    },
    channels: {},
    operations: {},
    components: {
      schemas: {},
      messages: {
        PrimitiveTypesMessage: {
          payload: {
            type: "object",
            properties: {
              stringField: { type: "string" },
              int32Field: { type: "integer", format: "int32" },
              int64Field: { type: "integer", format: "int64" },
              float32Field: { type: "number", format: "float" },
              float64Field: { type: "number", format: "double" },
              booleanField: { type: "boolean" },
              dateTimeField: { type: "string", format: "date-time" },
              durationField: { type: "string", format: "duration" },
              urlField: { type: "string", format: "uri" }
            },
            required: [
              "stringField", "int32Field", "int64Field", "float32Field",
              "float64Field", "booleanField", "dateTimeField", "durationField", "urlField"
            ]
          }
        },
        ArrayTypesMessage: {
          payload: {
            type: "object", 
            properties: {
              stringArray: {
                type: "array",
                items: { type: "string" }
              },
              numberArray: {
                type: "array", 
                items: { type: "integer", format: "int32" }
              },
              objectArray: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/OrderItem"
                }
              }
            },
            required: ["stringArray", "numberArray", "objectArray"]
          }
        }
      },
      securitySchemes: {}
    }
  }
}

/**
 * Edge cases and boundary conditions for testing
 */
export const EdgeCaseFixtures = {
  
  emptyService: `
    @service({ title: "Empty Service" })
    namespace EmptyService {
      // No operations or models
    }
  `,
  
  invalidTypeSpecSyntax: `
    @service({ title: "Invalid Service" })
    namespace InvalidService {
      @channel("invalid-channel"
      @publish
      op invalidOp(@body data: NonExistentModel): void;
    }
  `,
  
  missingDecorators: `
    namespace NoServiceDecorator {
      op operationWithoutChannel(@body data: SimpleModel): void;
    }
    
    model SimpleModel {
      field: string;
    }
  `,

  circularReferences: `
    @service({ title: "Circular References Service" })
    namespace CircularReferencesService {
      @channel("circular")
      @publish
      op publishCircular(@body data: ModelA): void;
    }
    
    model ModelA {
      reference: ModelB;
    }
    
    model ModelB {
      reference: ModelA;
    }
  `,

  deeplyNestedModels: `
    @service({ title: "Deeply Nested Service" })
    namespace DeeplyNestedService {
      @channel("nested")
      @publish
      op publishNested(@body data: Level1): void;
    }
    
    model Level1 {
      level2: Level2;
    }
    
    model Level2 {
      level3: Level3;
    }
    
    model Level3 {
      level4: Level4;
    }
    
    model Level4 {
      level5: Level5;
    }
    
    model Level5 {
      deepValue: string;
    }
  `,

  largeNumberOfFields: `
    @service({ title: "Large Model Service" })
    namespace LargeModelService {
      @channel("large")
      @publish
      op publishLarge(@body data: LargeModel): void;
    }
    
    model LargeModel {
      field001: string; field002: string; field003: string; field004: string; field005: string;
      field006: string; field007: string; field008: string; field009: string; field010: string;
      field011: int32; field012: int32; field013: int32; field014: int32; field015: int32;
      field016: float64; field017: float64; field018: float64; field019: float64; field020: float64;
      field021: boolean; field022: boolean; field023: boolean; field024: boolean; field025: boolean;
    }
  `,

  conflictingNames: `
    @service({ title: "Name Conflicts Service" })
    namespace NameConflictsService {
      @channel("conflict")
      @publish
      op publishConflict(@body data: Message): void;
    }
    
    @message("Message")
    model Message {
      message: string;
      Message: string;
      MESSAGE: string;
    }
  `
}

/**
 * Performance test fixtures with large datasets
 */
export const PerformanceFixtures = {
  
  largeServiceDefinition: (operationCount: number, modelCount: number) => `
    @service({ title: "Large Performance Service" })
    namespace LargePerformanceService {
      ${Array.from({ length: operationCount }, (_, i) => `
        @channel("channel-${i}")
        @publish
        op operation${i}(@body data: Model${i % modelCount}): void;
      `).join('\n')}
    }
    
    ${Array.from({ length: modelCount }, (_, i) => `
      @message("Model${i}")
      model Model${i} {
        field1: string;
        field2: int32;
        field3: float64;
        field4: boolean;
        field5: utcDateTime;
      }
    `).join('\n')}
  `,

  complexProtocolBindings: `
    @service({ title: "Complex Protocol Service" })
    namespace ComplexProtocolService {
      
      @channel("multi-protocol-channel")
      @protocol("kafka", {
        topic: "complex-topic",
        partitions: 100,
        replicationFactor: 5,
        config: {
          "retention.ms": "604800000",
          "cleanup.policy": "compact,delete", 
          "compression.type": "lz4",
          "max.message.bytes": "10485760"
        }
      })
      @protocol("amqp", {
        exchange: "complex-exchange",
        exchangeType: "topic", 
        routingKey: "complex.routing.key",
        queue: "complex-queue",
        arguments: {
          "x-message-ttl": 3600000,
          "x-max-length": 100000,
          "x-dead-letter-exchange": "dlx",
          "x-dead-letter-routing-key": "failed"
        }
      })
      @security("oauth2", {
        flows: {
          clientCredentials: {
            tokenUrl: "https://auth.complex.example.com/oauth/token",
            scopes: {
              "read": "Read access",
              "write": "Write access",
              "admin": "Admin access"
            }
          },
          authorizationCode: {
            authorizationUrl: "https://auth.complex.example.com/oauth/authorize",
            tokenUrl: "https://auth.complex.example.com/oauth/token"
          }
        }
      })
      @publish
      op publishComplexMessage(@body msg: ComplexMessage): void;
    }
    
    @message("ComplexMessage")
    model ComplexMessage {
      metadata: ComplexMetadata;
      payload: Record<Record<string>>;
      attachments: Attachment[];
    }
    
    model ComplexMetadata {
      messageId: string;
      correlationId: string;
      causationId: string;
      timestamp: utcDateTime;
      version: string;
      source: string;
      headers: Record<string>;
    }
    
    model Attachment {
      filename: string;
      contentType: string;
      size: int64;
      checksum: string;
      data: bytes;
    }
  `
}

/**
 * Error scenarios for negative testing
 */
export const ErrorFixtures = {
  
  compilationErrors: [
    {
      name: "Missing closing brace",
      code: `
        @service({ title: "Broken Service" })
        namespace BrokenService {
          @channel("test")
          @publish
          op testOp(@body data: TestModel): void;
        
        model TestModel {
          field: string;
        // Missing closing brace
      `
    },
    {
      name: "Invalid decorator syntax",
      code: `
        @service({ title: "Invalid Decorator Service" })
        namespace InvalidDecoratorService {
          @channel(
          @publish
          op testOp(@body data: TestModel): void;
        }
        
        model TestModel {
          field: string;
        }
      `
    },
    {
      name: "Undefined model reference",
      code: `
        @service({ title: "Undefined Reference Service" })
        namespace UndefinedReferenceService {
          @channel("test")
          @publish
          op testOp(@body data: NonExistentModel): void;
        }
      `
    }
  ],

  validationErrors: [
    {
      name: "Invalid AsyncAPI version",
      asyncapi: {
        asyncapi: "2.0.0", // Should be 3.0.0
        info: { title: "Test", version: "1.0.0" },
        channels: {},
        operations: {},
        components: { schemas: {}, messages: {}, securitySchemes: {} }
      }
    },
    {
      name: "Missing required info fields",
      asyncapi: {
        asyncapi: "3.0.0",
        info: {}, // Missing title and version
        channels: {},
        operations: {},
        components: { schemas: {}, messages: {}, securitySchemes: {} }
      }
    },
    {
      name: "Channel reference mismatch",
      asyncapi: {
        asyncapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
        channels: {
          "existing-channel": {
            address: "existing-channel",
            messages: {}
          }
        },
        operations: {
          testOp: {
            action: "send",
            channel: { $ref: "#/channels/non-existent-channel" }
          }
        },
        components: { schemas: {}, messages: {}, securitySchemes: {} }
      }
    }
  ]
}

/**
 * Common test data generators
 */
export class TestDataGenerator {
  
  /**
   * Generate test TypeSpec service with specified number of operations
   */
  static generateTestService(name: string, operationCount: number): string {
    const operations = Array.from({ length: operationCount }, (_, i) => `
      @channel("channel-${i}")
      @publish
      op operation${i}(@body data: TestModel${i}): void;
    `).join('\n')
    
    const models = Array.from({ length: operationCount }, (_, i) => `
      @message("TestModel${i}")
      model TestModel${i} {
        id: string;
        data: string;
        timestamp: utcDateTime;
      }
    `).join('\n')
    
    return `
      @service({ title: "${name}" })
      namespace ${name.replace(/\s+/g, '')} {
        ${operations}
      }
      
      ${models}
    `
  }

  /**
   * Generate expected AsyncAPI structure for test service
   */
  static generateExpectedAsyncAPI(title: string, operationCount: number): AsyncAPIObject {
    const channels: Record<string, any> = {}
    const operations: Record<string, any> = {}
    const messages: Record<string, any> = {}
    
    for (let i = 0; i < operationCount; i++) {
      channels[`channel-${i}`] = {
        address: `channel-${i}`,
        messages: {
          [`TestModel${i}`]: {
            $ref: `#/components/messages/TestModel${i}`
          }
        }
      }
      
      operations[`operation${i}`] = {
        action: "send",
        channel: {
          $ref: `#/channels/channel-${i}`
        }
      }
      
      messages[`TestModel${i}`] = {
        payload: {
          type: "object",
          properties: {
            id: { type: "string" },
            data: { type: "string" },
            timestamp: { type: "string", format: "date-time" }
          },
          required: ["id", "data", "timestamp"]
        }
      }
    }
    
    return {
      asyncapi: "3.0.0",
      info: {
        title: title,
        version: "1.0.0"
      },
      channels,
      operations,
      components: {
        schemas: {},
        messages,
        securitySchemes: {}
      }
    }
  }

  /**
   * Generate random test data for performance testing
   */
  static generateRandomTestData(size: "small" | "medium" | "large"): {
    operationCount: number
    modelCount: number
    channelCount: number
  } {
    const sizes = {
      small: { operationCount: 5, modelCount: 3, channelCount: 5 },
      medium: { operationCount: 25, modelCount: 15, channelCount: 25 },
      large: { operationCount: 100, modelCount: 50, channelCount: 100 }
    }
    
    return sizes[size]
  }
}