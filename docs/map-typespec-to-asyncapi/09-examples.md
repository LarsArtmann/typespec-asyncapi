# Complete Examples: End-to-End TypeSpec to AsyncAPI Transformations

## Overview

This document provides complete, working examples of TypeSpec specifications and their resulting AsyncAPI documents. These examples demonstrate real-world patterns and serve as reference implementations.

## Example 1: E-Commerce Order Processing System

### TypeSpec Definition

```typespec
import "@larsartmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

@service({
  title: "E-Commerce Order Processing",
  version: "1.0.0",
  description: "Event-driven order processing system for e-commerce platform"
})
@server("kafka-cluster", {
  url: "kafka://kafka.ecommerce.com:9092",
  protocol: "kafka",
  description: "Production Kafka cluster"
})
namespace ECommerce.OrderProcessing;

// Domain Models
model Customer {
  id: string;
  email: string;
  name: string;
  tier: "standard" | "premium" | "vip";
}

model Product {
  id: string;
  sku: string;
  name: string;
  price: decimal;
  category: string;
}

model OrderItem {
  productId: string;
  quantity: int32;
  unitPrice: decimal;
  totalPrice: decimal;
}

model Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Event Models
@message({
  name: "OrderCreatedEvent",
  title: "Order Created Event",
  description: "Fired when a new order is successfully created",
  contentType: "application/json"
})
model OrderCreatedEvent {
  eventId: string;
  eventType: "order.created";
  eventVersion: "1.0";
  occurredAt: utcDateTime;

  // Order data
  orderId: string;
  customerId: string;
  orderNumber: string;
  orderTotal: decimal;
  currency: "USD" | "EUR" | "GBP";

  // Order details
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;

  // Metadata
  source: "web" | "mobile" | "api";
  correlationId?: string;
}

@message({
  name: "PaymentProcessedEvent",
  title: "Payment Processed Event",
  description: "Fired when payment processing completes"
})
model PaymentProcessedEvent {
  eventId: string;
  eventType: "payment.processed";
  eventVersion: "1.0";
  occurredAt: utcDateTime;

  // Payment data
  paymentId: string;
  orderId: string;
  amount: decimal;
  currency: string;
  status: "succeeded" | "failed" | "requires_action";

  // Payment method
  paymentMethod: {
    type: "card" | "bank_transfer" | "digital_wallet";
    last4?: string;
    brand?: string;
  };

  correlationId?: string;
}

@message({
  name: "InventoryReservedEvent",
  title: "Inventory Reserved Event",
  description: "Fired when inventory is successfully reserved for an order"
})
model InventoryReservedEvent {
  eventId: string;
  eventType: "inventory.reserved";
  eventVersion: "1.0";
  occurredAt: utcDateTime;

  reservationId: string;
  orderId: string;
  items: {
    productId: string;
    quantityReserved: int32;
    reservationExpiry: utcDateTime;
  }[];

  correlationId?: string;
}

// Operations
@protocol({
  type: "kafka",
  topic: "ecommerce.orders.events",
  partitionKey: "customerId",
  acks: "all",
  retries: 3
})
@channel("orders.events")
@publish
op publishOrderEvent(@body event: OrderCreatedEvent): void;

@protocol({
  type: "kafka",
  topic: "ecommerce.payments.events",
  partitionKey: "orderId",
  acks: "all"
})
@channel("payments.events")
@publish
op publishPaymentEvent(@body event: PaymentProcessedEvent): void;

@protocol({
  type: "kafka",
  groupId: "inventory-service",
  autoOffsetReset: "earliest"
})
@channel("orders.events")
@subscribe
op handleOrderCreated(): OrderCreatedEvent;

@protocol({
  type: "kafka",
  topic: "ecommerce.inventory.events",
  partitionKey: "orderId"
})
@channel("inventory.events")
@publish
op publishInventoryEvent(@body event: InventoryReservedEvent): void;

@protocol({
  type: "kafka",
  groupId: "payment-service"
})
@channel("payments.events")
@subscribe
op handlePaymentProcessed(): PaymentProcessedEvent;
```

### Generated AsyncAPI Document

```yaml
asyncapi: 3.0.0
info:
  title: E-Commerce Order Processing
  version: 1.0.0
  description: Event-driven order processing system for e-commerce platform

servers:
  kafka-cluster:
    host: kafka.ecommerce.com:9092
    protocol: kafka
    description: Production Kafka cluster
    bindings:
      kafka:
        bindingVersion: "0.4.0"

channels:
  orders.events:
    address: ecommerce.orders.events
    description: Order lifecycle events
    messages:
      OrderCreatedEvent:
        $ref: '#/components/messages/OrderCreatedEvent'
    bindings:
      kafka:
        topic: ecommerce.orders.events
        partitions: 12
        replicas: 3
        bindingVersion: "0.4.0"

  payments.events:
    address: ecommerce.payments.events
    description: Payment processing events
    messages:
      PaymentProcessedEvent:
        $ref: '#/components/messages/PaymentProcessedEvent'
    bindings:
      kafka:
        topic: ecommerce.payments.events
        partitions: 6
        replicas: 3
        bindingVersion: "0.4.0"

  inventory.events:
    address: ecommerce.inventory.events
    description: Inventory management events
    messages:
      InventoryReservedEvent:
        $ref: '#/components/messages/InventoryReservedEvent'
    bindings:
      kafka:
        topic: ecommerce.inventory.events
        partitions: 6
        replicas: 3
        bindingVersion: "0.4.0"

operations:
  publishOrderEvent:
    action: send
    channel:
      $ref: '#/channels/orders.events'
    summary: Publish order creation events
    bindings:
      kafka:
        acks: all
        retries: 3
        key:
          type: string
          description: Customer ID for partitioning
        bindingVersion: "0.4.0"

  publishPaymentEvent:
    action: send
    channel:
      $ref: '#/channels/payments.events'
    summary: Publish payment processing events
    bindings:
      kafka:
        acks: all
        key:
          type: string
          description: Order ID for partitioning
        bindingVersion: "0.4.0"

  handleOrderCreated:
    action: receive
    channel:
      $ref: '#/channels/orders.events'
    summary: Handle order creation events
    bindings:
      kafka:
        groupId: inventory-service
        autoOffsetReset: earliest
        bindingVersion: "0.4.0"

  publishInventoryEvent:
    action: send
    channel:
      $ref: '#/channels/inventory.events'
    summary: Publish inventory reservation events
    bindings:
      kafka:
        key:
          type: string
          description: Order ID for partitioning
        bindingVersion: "0.4.0"

  handlePaymentProcessed:
    action: receive
    channel:
      $ref: '#/channels/payments.events'
    summary: Handle payment processing events
    bindings:
      kafka:
        groupId: payment-service
        bindingVersion: "0.4.0"

components:
  messages:
    OrderCreatedEvent:
      name: OrderCreatedEvent
      title: Order Created Event
      summary: Order Created Event
      description: Fired when a new order is successfully created
      contentType: application/json
      payload:
        $ref: '#/components/schemas/OrderCreatedEvent'
      examples:
        - name: Standard Order
          payload:
            eventId: "evt_01HGW2E4Q9Z8J7K6L5M4N3P2R1"
            eventType: "order.created"
            eventVersion: "1.0"
            occurredAt: "2023-12-25T10:30:00Z"
            orderId: "ord_01HGW2E4Q9Z8J7K6L5M4N3P2R1"
            customerId: "cus_01HGW2E4Q9Z8J7K6L5M4N3P2R1"
            orderNumber: "ORD-2023-001234"
            orderTotal: "149.99"
            currency: "USD"
            items:
              - productId: "prod_smartphone_x1"
                quantity: 1
                unitPrice: "149.99"
                totalPrice: "149.99"
            source: "web"

  schemas:
    OrderCreatedEvent:
      type: object
      properties:
        eventId:
          type: string
          format: uuid
          description: Unique event identifier
        eventType:
          type: string
          const: "order.created"
        eventVersion:
          type: string
          const: "1.0"
        occurredAt:
          type: string
          format: date-time
        orderId:
          type: string
          format: uuid
        customerId:
          type: string
          format: uuid
        orderNumber:
          type: string
          pattern: '^ORD-[0-9]{4}-[0-9]{6}$'
        orderTotal:
          type: string
          format: decimal
          pattern: '^\\d+\\.\\d{2}$'
        currency:
          type: string
          enum: [USD, EUR, GBP]
        items:
          type: array
          items:
            $ref: '#/components/schemas/OrderItem'
          minItems: 1
        shippingAddress:
          $ref: '#/components/schemas/Address'
        billingAddress:
          $ref: '#/components/schemas/Address'
        source:
          type: string
          enum: [web, mobile, api]
        correlationId:
          type: string
          format: uuid
      required:
        - eventId
        - eventType
        - eventVersion
        - occurredAt
        - orderId
        - customerId
        - orderNumber
        - orderTotal
        - currency
        - items
        - shippingAddress
        - billingAddress
        - source
```

## Example 2: IoT Device Management System

### TypeSpec Definition

```typespec
import "@larsartmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

@service({
  title: "IoT Device Management System",
  version: "2.0.0",
  description: "Real-time IoT device monitoring and management"
})
@server("mqtt-broker", {
  url: "mqtt://iot.example.com:1883",
  protocol: "mqtt",
  description: "MQTT broker for IoT communications"
})
@server("websocket-gateway", {
  url: "wss://iot-gateway.example.com/ws",
  protocol: "wss",
  description: "WebSocket gateway for real-time monitoring"
})
namespace IoT.DeviceManagement;

// Device Models
enum DeviceType {
  TemperatureSensor: "temperature_sensor",
  HumiditySensor: "humidity_sensor",
  MotionDetector: "motion_detector",
  SmartThermostat: "smart_thermostat",
  SecurityCamera: "security_camera"
}

enum DeviceStatus {
  Online: "online",
  Offline: "offline",
  Maintenance: "maintenance",
  Error: "error"
}

model DeviceLocation {
  building: string;
  floor: string;
  room: string;
  coordinates?: {
    latitude: float64;
    longitude: float64;
  };
}

// Telemetry Models
model SensorReading {
  deviceId: string;
  timestamp: utcDateTime;
  sensorType: string;
  value: float64;
  unit: string;
  quality: "good" | "poor" | "bad";
}

@message({
  name: "DeviceTelemetryEvent",
  title: "Device Telemetry Data",
  description: "Real-time telemetry data from IoT devices"
})
model DeviceTelemetryEvent {
  eventId: string;
  eventType: "device.telemetry";
  timestamp: utcDateTime;

  deviceId: string;
  deviceType: DeviceType;
  location: DeviceLocation;

  readings: SensorReading[];
  batteryLevel?: int32;
  signalStrength?: int32;
}

@message({
  name: "DeviceStatusEvent",
  title: "Device Status Change",
  description: "Device online/offline status changes"
})
model DeviceStatusEvent {
  eventId: string;
  eventType: "device.status.changed";
  timestamp: utcDateTime;

  deviceId: string;
  deviceType: DeviceType;
  previousStatus: DeviceStatus;
  currentStatus: DeviceStatus;
  reason?: string;
  location: DeviceLocation;
}

@message({
  name: "DeviceCommandEvent",
  title: "Device Command",
  description: "Commands sent to devices"
})
model DeviceCommandEvent {
  commandId: string;
  commandType: "configure" | "restart" | "update_firmware" | "calibrate";
  targetDeviceId: string;
  issuedAt: utcDateTime;
  parameters?: Record<unknown>;
  correlationId?: string;
}

// MQTT Operations for Device Communication
@protocol({
  type: "mqtt",
  topic: "devices/{deviceId}/telemetry",
  qos: 1,
  retain: false
})
@channel("device.telemetry")
@subscribe
op receiveDeviceTelemetry(@path deviceId: string): DeviceTelemetryEvent;

@protocol({
  type: "mqtt",
  topic: "devices/{deviceId}/status",
  qos: 2,
  retain: true
})
@channel("device.status")
@subscribe
op receiveDeviceStatus(@path deviceId: string): DeviceStatusEvent;

@protocol({
  type: "mqtt",
  topic: "devices/{deviceId}/commands",
  qos: 1,
  retain: false
})
@channel("device.commands")
@publish
op sendDeviceCommand(@path deviceId: string, @body command: DeviceCommandEvent): void;

// WebSocket Operations for Real-time Dashboard
@protocol({
  type: "websocket",
  path: "/realtime/telemetry",
  headers: {
    "Authorization": "Bearer {token}"
  }
})
@channel("realtime.telemetry")
@publish
op streamTelemetryData(@body telemetry: DeviceTelemetryEvent): void;

@protocol({
  type: "websocket",
  path: "/realtime/alerts",
  headers: {
    "Authorization": "Bearer {token}"
  }
})
@channel("realtime.alerts")
@publish
op streamAlerts(@body alert: DeviceAlertEvent): void;

@message({
  name: "DeviceAlertEvent",
  title: "Device Alert",
  description: "Critical alerts from devices"
})
model DeviceAlertEvent {
  alertId: string;
  alertType: "temperature_high" | "battery_low" | "connection_lost" | "sensor_fault";
  severity: "low" | "medium" | "high" | "critical";
  deviceId: string;
  message: string;
  timestamp: utcDateTime;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: utcDateTime;
}
```

### Generated AsyncAPI Document

```yaml
asyncapi: 3.0.0
info:
  title: IoT Device Management System
  version: 2.0.0
  description: Real-time IoT device monitoring and management

servers:
  mqtt-broker:
    host: iot.example.com:1883
    protocol: mqtt
    description: MQTT broker for IoT communications
    bindings:
      mqtt:
        clientId: iot-management-system
        cleanSession: false
        keepAlive: 60
        bindingVersion: "0.1.0"

  websocket-gateway:
    host: iot-gateway.example.com
    pathname: /ws
    protocol: wss
    description: WebSocket gateway for real-time monitoring
    bindings:
      ws:
        bindingVersion: "0.1.0"

channels:
  device.telemetry:
    address: devices/{deviceId}/telemetry
    parameters:
      deviceId:
        description: Unique device identifier
        schema:
          type: string
          pattern: '^[a-zA-Z0-9_-]+$'
    description: Device telemetry data stream
    bindings:
      mqtt:
        retain: false
        bindingVersion: "0.1.0"

  device.status:
    address: devices/{deviceId}/status
    parameters:
      deviceId:
        description: Unique device identifier
        schema:
          type: string
          pattern: '^[a-zA-Z0-9_-]+$'
    description: Device status updates
    bindings:
      mqtt:
        retain: true
        bindingVersion: "0.1.0"

  device.commands:
    address: devices/{deviceId}/commands
    parameters:
      deviceId:
        description: Target device identifier
        schema:
          type: string
          pattern: '^[a-zA-Z0-9_-]+$'
    description: Commands sent to devices
    bindings:
      mqtt:
        retain: false
        bindingVersion: "0.1.0"

  realtime.telemetry:
    address: /realtime/telemetry
    description: Real-time telemetry data stream
    bindings:
      ws:
        method: GET
        headers:
          type: object
          properties:
            Authorization:
              type: string
              pattern: '^Bearer .+'
        bindingVersion: "0.1.0"

  realtime.alerts:
    address: /realtime/alerts
    description: Real-time alert notifications
    bindings:
      ws:
        method: GET
        headers:
          type: object
          properties:
            Authorization:
              type: string
              pattern: '^Bearer .+'
        bindingVersion: "0.1.0"

operations:
  receiveDeviceTelemetry:
    action: receive
    channel:
      $ref: '#/channels/device.telemetry'
    summary: Receive device telemetry data
    bindings:
      mqtt:
        qos: 1
        bindingVersion: "0.1.0"

  receiveDeviceStatus:
    action: receive
    channel:
      $ref: '#/channels/device.status'
    summary: Receive device status updates
    bindings:
      mqtt:
        qos: 2
        bindingVersion: "0.1.0"

  sendDeviceCommand:
    action: send
    channel:
      $ref: '#/channels/device.commands'
    summary: Send commands to devices
    bindings:
      mqtt:
        qos: 1
        bindingVersion: "0.1.0"

  streamTelemetryData:
    action: send
    channel:
      $ref: '#/channels/realtime.telemetry'
    summary: Stream real-time telemetry to dashboards
    bindings:
      ws:
        bindingVersion: "0.1.0"

  streamAlerts:
    action: send
    channel:
      $ref: '#/channels/realtime.alerts'
    summary: Stream real-time alerts to monitoring systems
    bindings:
      ws:
        bindingVersion: "0.1.0"

components:
  messages:
    DeviceTelemetryEvent:
      name: DeviceTelemetryEvent
      title: Device Telemetry Data
      summary: Device Telemetry Data
      description: Real-time telemetry data from IoT devices
      contentType: application/json
      payload:
        $ref: '#/components/schemas/DeviceTelemetryEvent'
      examples:
        - name: Temperature Sensor Reading
          payload:
            eventId: "evt_temp_001"
            eventType: "device.telemetry"
            timestamp: "2023-12-25T10:30:00Z"
            deviceId: "temp_sensor_floor1_room101"
            deviceType: "temperature_sensor"
            location:
              building: "Building A"
              floor: "Floor 1"
              room: "Room 101"
            readings:
              - deviceId: "temp_sensor_floor1_room101"
                timestamp: "2023-12-25T10:30:00Z"
                sensorType: "temperature"
                value: 22.5
                unit: "celsius"
                quality: "good"
            batteryLevel: 87
            signalStrength: -45

  schemas:
    DeviceTelemetryEvent:
      type: object
      properties:
        eventId:
          type: string
          description: Unique event identifier
        eventType:
          type: string
          const: "device.telemetry"
        timestamp:
          type: string
          format: date-time
        deviceId:
          type: string
          pattern: '^[a-zA-Z0-9_-]+$'
        deviceType:
          $ref: '#/components/schemas/DeviceType'
        location:
          $ref: '#/components/schemas/DeviceLocation'
        readings:
          type: array
          items:
            $ref: '#/components/schemas/SensorReading'
          minItems: 1
        batteryLevel:
          type: integer
          format: int32
          minimum: 0
          maximum: 100
          description: Battery level percentage
        signalStrength:
          type: integer
          format: int32
          minimum: -120
          maximum: 0
          description: Signal strength in dBm
      required:
        - eventId
        - eventType
        - timestamp
        - deviceId
        - deviceType
        - location
        - readings

    DeviceType:
      type: string
      enum:
        - temperature_sensor
        - humidity_sensor
        - motion_detector
        - smart_thermostat
        - security_camera
```

## Example 3: Financial Trading System

### TypeSpec Definition

```typespec
import "@larsartmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

@service({
  title: "Financial Trading System",
  version: "1.0.0",
  description: "High-frequency trading and market data system"
})
@server("trading-kafka", {
  url: "kafka://trading-cluster.fintech.com:9092",
  protocol: "kafka",
  description: "High-performance trading Kafka cluster"
})
namespace FinTech.Trading;

// Trading Models
enum OrderSide {
  Buy: "buy",
  Sell: "sell"
}

enum OrderType {
  Market: "market",
  Limit: "limit",
  Stop: "stop",
  StopLimit: "stop_limit"
}

enum OrderStatus {
  Pending: "pending",
  PartiallyFilled: "partially_filled",
  Filled: "filled",
  Cancelled: "cancelled",
  Rejected: "rejected"
}

model TradingInstrument {
  symbol: string;
  instrumentType: "stock" | "option" | "future" | "forex";
  exchange: string;
  currency: string;
}

@message({
  name: "MarketDataEvent",
  title: "Market Data Update",
  description: "Real-time market data updates"
})
model MarketDataEvent {
  eventId: string;
  eventType: "market.data";
  timestamp: utcDateTime;

  instrument: TradingInstrument;
  bidPrice: decimal;
  askPrice: decimal;
  bidSize: int32;
  askSize: int32;
  lastPrice?: decimal;
  lastSize?: int32;
  volume24h: int64;
  sequenceNumber: int64;
}

@message({
  name: "OrderEvent",
  title: "Order Event",
  description: "Order lifecycle events"
})
model OrderEvent {
  eventId: string;
  eventType: "order.created" | "order.updated" | "order.filled" | "order.cancelled";
  timestamp: utcDateTime;

  orderId: string;
  clientOrderId: string;
  accountId: string;
  instrument: TradingInstrument;

  side: OrderSide;
  orderType: OrderType;
  status: OrderStatus;

  quantity: decimal;
  filledQuantity: decimal;
  remainingQuantity: decimal;

  price?: decimal;
  averageFillPrice?: decimal;

  correlationId?: string;
}

@message({
  name: "TradeExecutionEvent",
  title: "Trade Execution",
  description: "Trade execution notifications"
})
model TradeExecutionEvent {
  eventId: string;
  eventType: "trade.executed";
  timestamp: utcDateTime;

  tradeId: string;
  orderId: string;
  instrument: TradingInstrument;

  side: OrderSide;
  quantity: decimal;
  price: decimal;
  value: decimal;

  buyerAccountId: string;
  sellerAccountId: string;

  executionTime: utcDateTime;
  sequenceNumber: int64;
}

// High-frequency market data
@protocol({
  type: "kafka",
  topic: "trading.marketdata.{exchange}",
  partitionKey: "symbol",
  compressionType: "lz4",
  batchSize: 65536,
  lingerMs: 0  // Minimum latency
})
@channel("market.data")
@subscribe
op receiveMarketData(@path exchange: string): MarketDataEvent;

// Order processing
@protocol({
  type: "kafka",
  topic: "trading.orders",
  partitionKey: "accountId",
  acks: "all",
  enableIdempotence: true
})
@channel("orders")
@publish
op publishOrderEvent(@body order: OrderEvent): void;

@protocol({
  type: "kafka",
  groupId: "order-management-system",
  maxPollRecords: 1000
})
@channel("orders")
@subscribe
op processOrderEvent(): OrderEvent;

// Trade execution
@protocol({
  type: "kafka",
  topic: "trading.executions",
  partitionKey: "instrument.symbol",
  acks: "all"
})
@channel("executions")
@publish
op publishTradeExecution(@body trade: TradeExecutionEvent): void;

@protocol({
  type: "kafka",
  groupId: "risk-management-system"
})
@channel("executions")
@subscribe
op monitorTradeExecution(): TradeExecutionEvent;

// Real-time position updates
@protocol({
  type: "websocket",
  path: "/trading/positions/{accountId}",
  headers: {
    "Authorization": "Bearer {token}",
    "X-Trading-Session": "{sessionId}"
  }
})
@channel("positions.realtime")
@publish
op streamPositionUpdate(@path accountId: string, @body update: PositionUpdateEvent): void;

@message({
  name: "PositionUpdateEvent",
  title: "Position Update",
  description: "Real-time position updates"
})
model PositionUpdateEvent {
  eventId: string;
  eventType: "position.updated";
  timestamp: utcDateTime;

  accountId: string;
  instrument: TradingInstrument;

  position: decimal;
  averageCost: decimal;
  marketValue: decimal;
  unrealizedPnL: decimal;
  realizedPnL: decimal;

  lastUpdateTime: utcDateTime;
}
```

### Generated AsyncAPI Document

```yaml
asyncapi: 3.0.0
info:
  title: Financial Trading System
  version: 1.0.0
  description: High-frequency trading and market data system

servers:
  trading-kafka:
    host: trading-cluster.fintech.com:9092
    protocol: kafka
    description: High-performance trading Kafka cluster
    bindings:
      kafka:
        schemaRegistryUrl: https://schema-registry.fintech.com
        bindingVersion: "0.4.0"

channels:
  market.data:
    address: trading.marketdata.{exchange}
    parameters:
      exchange:
        description: Trading exchange identifier
        schema:
          type: string
          enum: [NYSE, NASDAQ, CME, CBOE]
    description: High-frequency market data stream
    bindings:
      kafka:
        partitions: 100
        replicas: 3
        configs:
          compression.type: lz4
          min.insync.replicas: 2
          unclean.leader.election.enable: false
        bindingVersion: "0.4.0"

  orders:
    address: trading.orders
    description: Order lifecycle events
    bindings:
      kafka:
        partitions: 50
        replicas: 3
        configs:
          compression.type: gzip
          retention.ms: 604800000
        bindingVersion: "0.4.0"

  executions:
    address: trading.executions
    description: Trade execution events
    bindings:
      kafka:
        partitions: 25
        replicas: 3
        configs:
          compression.type: gzip
          cleanup.policy: compact
        bindingVersion: "0.4.0"

  positions.realtime:
    address: /trading/positions/{accountId}
    parameters:
      accountId:
        description: Trading account identifier
        schema:
          type: string
          format: uuid
    description: Real-time position updates
    bindings:
      ws:
        method: GET
        headers:
          type: object
          properties:
            Authorization:
              type: string
              pattern: '^Bearer .+'
            X-Trading-Session:
              type: string
              format: uuid
        bindingVersion: "0.1.0"

operations:
  receiveMarketData:
    action: receive
    channel:
      $ref: '#/channels/market.data'
    summary: Receive high-frequency market data
    bindings:
      kafka:
        groupId: market-data-consumers
        autoOffsetReset: latest
        enableAutoCommit: false
        maxPollRecords: 10000
        fetchMinBytes: 1048576
        bindingVersion: "0.4.0"
    x-performance:
      latencyTarget: 1ms
      throughputTarget: 1000000msg/s

  publishOrderEvent:
    action: send
    channel:
      $ref: '#/channels/orders'
    summary: Publish order lifecycle events
    bindings:
      kafka:
        acks: all
        retries: 2147483647
        enableIdempotence: true
        maxInFlightRequestsPerConnection: 1
        batchSize: 16384
        compressionType: gzip
        bindingVersion: "0.4.0"
    x-performance:
      latencyTarget: 5ms

  processOrderEvent:
    action: receive
    channel:
      $ref: '#/channels/orders'
    summary: Process order events
    bindings:
      kafka:
        groupId: order-management-system
        enableAutoCommit: false
        maxPollRecords: 1000
        bindingVersion: "0.4.0"

  publishTradeExecution:
    action: send
    channel:
      $ref: '#/channels/executions'
    summary: Publish trade executions
    bindings:
      kafka:
        acks: all
        compressionType: gzip
        key:
          type: string
          description: Instrument symbol for partitioning
        bindingVersion: "0.4.0"

  monitorTradeExecution:
    action: receive
    channel:
      $ref: '#/channels/executions'
    summary: Monitor trade executions for risk management
    bindings:
      kafka:
        groupId: risk-management-system
        autoOffsetReset: earliest
        bindingVersion: "0.4.0"

  streamPositionUpdate:
    action: send
    channel:
      $ref: '#/channels/positions.realtime'
    summary: Stream real-time position updates
    bindings:
      ws:
        bindingVersion: "0.1.0"
    x-performance:
      latencyTarget: 10ms

components:
  messages:
    MarketDataEvent:
      name: MarketDataEvent
      title: Market Data Update
      summary: Market Data Update
      description: Real-time market data updates
      contentType: application/json
      payload:
        $ref: '#/components/schemas/MarketDataEvent'
      x-performance:
        compressionRatio: 0.3
        avgSizeBytes: 150

  schemas:
    MarketDataEvent:
      type: object
      properties:
        eventId:
          type: string
          format: uuid
        eventType:
          type: string
          const: market.data
        timestamp:
          type: string
          format: date-time
        instrument:
          $ref: '#/components/schemas/TradingInstrument'
        bidPrice:
          type: string
          format: decimal
          pattern: '^\\d+\\.\\d{4}$'
        askPrice:
          type: string
          format: decimal
          pattern: '^\\d+\\.\\d{4}$'
        bidSize:
          type: integer
          format: int32
          minimum: 0
        askSize:
          type: integer
          format: int32
          minimum: 0
        lastPrice:
          type: string
          format: decimal
          pattern: '^\\d+\\.\\d{4}$'
        lastSize:
          type: integer
          format: int32
          minimum: 0
        volume24h:
          type: integer
          format: int64
          minimum: 0
        sequenceNumber:
          type: integer
          format: int64
          description: Monotonic sequence number for ordering
      required:
        - eventId
        - eventType
        - timestamp
        - instrument
        - bidPrice
        - askPrice
        - bidSize
        - askSize
        - volume24h
        - sequenceNumber

x-performance-requirements:
  latency:
    market-data-processing: 1ms
    order-processing: 5ms
    trade-execution: 2ms
    position-updates: 10ms
  throughput:
    market-data-ingestion: 1000000msg/s
    order-processing: 10000msg/s
    trade-execution: 50000msg/s
  availability:
    target: 99.99%
    downtime-budget: 52.56min/year
```

## Usage Examples

### Compiling TypeSpec to AsyncAPI

```bash
# Install TypeSpec compiler and AsyncAPI emitter
bun add -g @typespec/compiler
bun add @larsartmann/typespec-asyncapi

# Compile TypeSpec to AsyncAPI
tsp compile ecommerce-orders.tsp --emit @larsartmann/typespec-asyncapi

# Output files:
# - asyncapi.yaml (AsyncAPI 3.0 specification)
# - asyncapi.json (JSON format)
```

### Integration with AsyncAPI Tools

```bash
# Validate generated AsyncAPI document
bun add -g @asyncapi/cli
asyncapi validate asyncapi.yaml

# Generate documentation
asyncapi generate fromTemplate asyncapi.yaml @asyncapi/html-template

# Generate client code
asyncapi generate fromTemplate asyncapi.yaml @asyncapi/nodejs-template
```

## Summary

These examples demonstrate:

1. **E-Commerce System**: Complete order processing workflow with Kafka
2. **IoT Device Management**: Multi-protocol (MQTT/WebSocket) real-time system
3. **Financial Trading**: High-performance, low-latency trading system

Each example shows:

- ✅ Proper TypeSpec modeling techniques
- ✅ Protocol-specific configurations
- ✅ Message design patterns
- ✅ Generated AsyncAPI quality
- ✅ Real-world complexity and scale

These serve as reference implementations for building production-ready event-driven systems with TypeSpec and AsyncAPI.

---

_These examples bridge the gap between theoretical mapping concepts and practical implementation, providing complete, working patterns for real-world event-driven architectures._
