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
    namespace LargePerformanceService {
      ${Array.from({ length: operationCount }, (_, i) => `
        @channel("channel-${i}")
        @publish
        op operation${i}(data: Model${i % modelCount}): void;
      `).join('\n')}
    }
    
    ${Array.from({ length: modelCount }, (_, i) => `
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
    namespace ComplexProtocolService {
      
      @channel("multi-protocol-channel")
      @publish
      op publishComplexMessage(msg: ComplexMessage): void;
    }
    
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
    namespace AdvancedEventSourcingService {
      
      @channel("event-store/{aggregateId}")
      @publish
      op appendEvent(aggregateId: string, event: DomainEvent): void;
      
      @channel("projections/{viewName}")
      @subscribe
      op subscribeProjection(viewName: string): ProjectionUpdate;
      
      @channel("snapshots/{aggregateId}")
      @publish
      op saveSnapshot(aggregateId: string, snapshot: AggregateSnapshot): void;
    }
    
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
    
    model ProjectionUpdate {
      projectionName: string;
      lastProcessedEvent: int64;
      updatedData: Record<string>;
    }
    
    model AggregateSnapshot {
      aggregateId: string;
      aggregateType: string;
      version: int64;
      snapshotData: Record<string>;
      createdAt: utcDateTime;
    }
  `,

  advancedCQRS: `
    namespace CQRSService {
      
      @channel("commands/{commandType}")
      @publish
      op sendCommand(commandType: string, command: Command): void;
      
      @channel("queries/{queryType}")
      @publish  
      op sendQuery(queryType: string, query: Query): void;
      
      @channel("events/{eventType}")
      @subscribe
      op handleEvent(eventType: string): DomainEvent;
      
      @channel("query-results/{correlationId}")
      @subscribe
      op receiveQueryResult(correlationId: string): QueryResult;
    }
    
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
    
    model Query {
      queryId: string;
      queryType: string;
      parameters: Record<string>;
      correlationId: string;
    }
    
    model QueryResult {
      queryId: string;
      data: Record<string>;
      correlationId: string;
      executedAt: utcDateTime;
    }
  `,

  advancedSaga: `
    namespace SagaOrchestrationService {
      
      @channel("saga/{sagaId}/start")
      @publish
      op startSaga(sagaId: string, saga: SagaDefinition): void;
      
      @channel("saga/{sagaId}/step/{stepId}")
      @publish
      op executeStep(sagaId: string, stepId: string, step: SagaStep): void;
      
      @channel("saga/{sagaId}/compensate/{stepId}")
      @publish
      op compensateStep(sagaId: string, stepId: string, compensation: Compensation): void;
      
      @channel("saga/{sagaId}/complete")
      @subscribe
      op sagaCompleted(sagaId: string): SagaCompleted;
      
      @channel("saga/{sagaId}/failed")
      @subscribe  
      op sagaFailed(sagaId: string): SagaFailed;
    }
    
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
    
    model Compensation {
      stepId: string;
      reason: string;
      compensationData: Record<string>;
    }
    
    model SagaCompleted {
      sagaId: string;
      completedAt: utcDateTime;
      finalState: Record<string>;
    }
    
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
  // Alpha Compatible E-commerce Example
  exampleEcommerce: `
    namespace ECommerceService;
    
    model OrderItem {
      productId: string;
      quantity: int32;
      unitPrice: float64;
    }
    
    model Address {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    }
    
    model OrderCreatedEvent {
      orderId: string;
      customerId: string;
      orderItems: OrderItem[];
      totalAmount: float64;
      orderDate: utcDateTime;
      shippingAddress: Address;
      billingAddress: Address;
    }
    
    model InventoryReservedEvent {
      orderId: string;
      productId: string;
      quantity: int32;
      warehouseId: string;
      reservedAt: utcDateTime;
    }
    
    model PaymentProcessedEvent {
      orderId: string;
      paymentId: string;
      amount: float64;
      currency: string;
      paymentMethod: string;
      processedAt: utcDateTime;
    }
    
    model OrderShippedEvent {
      orderId: string;
      trackingNumber: string;
      carrier: string;
      shippedAt: utcDateTime;
    }
    
    // Order Creation Flow
    @channel("orders/created")
    @publish
    op publishOrderCreated(event: OrderCreatedEvent): void;
    
    // Inventory Updates
    @channel("inventory/reserved")
    @subscribe
    op handleInventoryReserved(): InventoryReservedEvent;
    
    // Payment Processing
    @channel("payments/processed") 
    @subscribe
    op handlePaymentProcessed(): PaymentProcessedEvent;
    
    // Shipping Updates
    @channel("orders/{orderId}/shipping")
    @publish
    op publishOrderShipped(orderId: string, event: OrderShippedEvent): void;
  `,

  exampleIoT: `
    namespace IoTDeviceService;
    
    model TelemetryData {
      deviceId: string;
      timestamp: utcDateTime;
      temperature: float64;
      humidity: float64;
      batteryLevel: float64;
    }
    
    model DeviceCommand {
      commandId: string;
      command: string;
      parameters: Record<string>;
    }
    
    model DeviceStatus {
      deviceId: string;
      status: "online" | "offline" | "maintenance";
      lastSeen: utcDateTime;
    }
    
    model AggregatedDeviceMetrics {
      deviceType: string;
      totalDevices: int32;
      avgTemperature: float64;
    }
    
    // Device Telemetry
    @channel("devices/{deviceId}/telemetry")
    @publish
    op publishTelemetry(deviceId: string, telemetry: TelemetryData): void;
    
    // Device Commands
    @channel("devices/{deviceId}/commands")
    @subscribe
    op receiveDeviceCommand(deviceId: string): DeviceCommand;
    
    // Device Status Updates
    @channel("devices/{deviceId}/status")
    @publish
    op publishDeviceStatus(deviceId: string, status: DeviceStatus): void;
    
    // Aggregated Analytics
    @channel("analytics/device-metrics")
    @subscribe
    op handleAggregatedMetrics(): AggregatedDeviceMetrics;
  `,

  exampleFinancial: `
    namespace FinancialTradingService;
    
    model MarketDataUpdate {
      symbol: string;
      price: float64;
      volume: int64;
      timestamp: utcDateTime;
    }
    
    model NewOrder {
      orderId: string;
      symbol: string;
      quantity: int32;
      price: float64;
      side: "buy" | "sell";
    }
    
    model TradeExecution {
      tradeId: string;
      orderId: string;
      symbol: string;
      quantity: int32;
      price: float64;
      timestamp: utcDateTime;
    }
    
    // Market Data Feed
    @channel("market-data/{symbol}/quotes")
    @subscribe
    op subscribeMarketData(symbol: string): MarketDataUpdate;
    
    // Order Management
    @channel("orders/new")
    @publish
    op submitOrder(order: NewOrder): void;
      
    // Trade Executions
    @channel("trades/executed")
    @subscribe
    op handleTradeExecution(): TradeExecution;
  `
}

/**
 * Common test data generators for performance testing
 * TEMPORARILY DISABLED due to TypeScript parsing conflicts with template literals
 */
export class TestDataGenerator {
  static generateTestService(name: string, operationCount: number): string {
    return 'namespace TestService; model TestModel { id: string; }'
  }

  static generateExpectedAsyncAPI(title: string, operationCount: number): AsyncAPIObject {
    const channels: Record<string, any> = {}
    const operations: Record<string, any> = {}
    const messages: Record<string, any> = {}
    
    for (let i = 0; i < operationCount; i++) {
      const channelName = 'channel-' + i
      const modelName = 'TestModel' + i
      const opName = 'operation' + i
      
      channels[channelName] = {
        address: channelName,
        messages: {
          [modelName]: {
            $ref: '#/components/messages/' + modelName
          }
        }
      }
      
      operations[opName] = {
        action: "send",
        channel: {
          $ref: '#/channels/' + channelName
        }
      }
      
      messages[modelName] = {
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