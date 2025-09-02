/**
 * Performance Test Fixtures for TypeSpec-AsyncAPI
 * 
 * Large datasets, performance testing scenarios, and complex protocol bindings.
 * Split from massive 1822-line test-fixtures.ts for maintainability.
 */

import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js"

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
 * Advanced patterns for performance testing
 */
export const AdvancedPatternFixtures = {
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
  `
}

/**
 * Real-world example fixtures for performance testing
 */
export const RealWorldExamples = {
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
 * Common test data generators for performance testing
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