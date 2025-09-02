/**
 * Documentation Test Suite: 09-examples.md
 * BDD tests validating complete real-world examples
 */

import { describe, expect, it, beforeEach } from "bun:test"
import { createTypeSpecTestCompiler } from "./helpers/typespec-compiler.js"
import { createAsyncAPIValidator } from "./helpers/asyncapi-validator.js"
import { TypeSpecFixtures } from "./helpers/test-fixtures.js"

describe("Documentation: Complete Examples Validation", () => {
  let compiler: ReturnType<typeof createTypeSpecTestCompiler>
  let validator: ReturnType<typeof createAsyncAPIValidator>

  beforeEach(() => {
    compiler = createTypeSpecTestCompiler()
    validator = createAsyncAPIValidator()
  })

  describe("GIVEN E-commerce Order Processing example", () => {
    describe("WHEN compiling complete e-commerce system", () => {
      it("THEN should generate comprehensive AsyncAPI specification", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.exampleEcommerce,
          emitAsyncAPI: true
        })

        compiler.validateCompilationSuccess(result)
        
        // Validate service info
        expect(result.asyncapi!.info.title).toBe("E-Commerce Order Processing Service")
        expect(result.asyncapi!.info.version).toBe("1.0.0")
        
        // Validate channels
        const channels = result.asyncapi!.channels!
        expect(channels["orders/created"]).toBeDefined()
        expect(channels["inventory/reserved"]).toBeDefined()
        expect(channels["payments/processed"]).toBeDefined()
        expect(channels["orders/{orderId}/shipping"]).toBeDefined()
      })

      it("THEN should validate protocol bindings for different services", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.exampleEcommerce,
          emitAsyncAPI: true
        })

        // Kafka bindings for order events
        const orderChannel = result.asyncapi!.channels!["orders/created"]
        expect(orderChannel.bindings?.kafka?.topic).toBe("orders.created")
        expect(orderChannel.bindings?.kafka?.partitionKey).toBe("customerId")

        // AMQP bindings for shipping
        const shippingChannel = result.asyncapi!.channels!["orders/{orderId}/shipping"]
        expect(shippingChannel.bindings?.amqp?.exchange).toBe("shipping.exchange")
        expect(shippingChannel.bindings?.amqp?.routingKey).toBe("order.shipped")
      })

      it("THEN should validate complex message schemas", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.exampleEcommerce,
          emitAsyncAPI: true
        })

        const messages = result.asyncapi!.components!.messages!
        
        // Order created event
        const orderCreatedEvent = messages.OrderCreatedEvent
        expect(orderCreatedEvent.payload.properties!.orderId).toEqual({ type: "string" })
        expect(orderCreatedEvent.payload.properties!.customerId).toEqual({ type: "string" })
        expect(orderCreatedEvent.payload.properties!.orderItems).toEqual({
          type: "array",
          items: { $ref: "#/components/schemas/OrderItem" }
        })
        expect(orderCreatedEvent.payload.properties!.totalAmount).toEqual({ type: "number", format: "double" })

        // Payment processed event
        const paymentEvent = messages.PaymentProcessedEvent
        expect(paymentEvent.payload.properties!.paymentMethod).toEqual({
          type: "string",
          enum: ["credit_card", "paypal", "bank_transfer"]
        })
        expect(paymentEvent.payload.properties!.status).toEqual({
          type: "string",
          enum: ["success", "failed", "pending"]
        })
      })

      it("THEN should handle address composition correctly", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.exampleEcommerce,
          emitAsyncAPI: true
        })

        const addressSchema = result.asyncapi!.components!.schemas!.Address
        expect(addressSchema.properties!.street).toEqual({ type: "string" })
        expect(addressSchema.properties!.city).toEqual({ type: "string" })
        expect(addressSchema.properties!.state).toEqual({ type: "string" })
        expect(addressSchema.properties!.zipCode).toEqual({ type: "string" })
        expect(addressSchema.properties!.country).toEqual({ type: "string" })
        expect(addressSchema.required).toEqual(["street", "city", "state", "zipCode", "country"])
      })

      it("THEN should validate complete workflow operations", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.exampleEcommerce,
          emitAsyncAPI: true
        })

        const operations = result.asyncapi!.operations!
        expect(operations.publishOrderCreated.action).toBe("send")
        expect(operations.handleInventoryReserved.action).toBe("receive")
        expect(operations.handlePaymentProcessed.action).toBe("receive")
        expect(operations.publishOrderShipped.action).toBe("send")
      })
    })

    describe("WHEN validating e-commerce business rules", () => {
      it("THEN should ensure order processing integrity", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.exampleEcommerce,
          emitAsyncAPI: true
        })

        const validation = await validator.validateAsyncAPI(result.asyncapi!, {
          strict: true,
          validateSemantic: true,
          customRules: [{
            name: "E-commerce Business Rules",
            description: "Validates e-commerce specific business rules",
            validate: (asyncapi) => {
              const errors: string[] = []
              const messages = asyncapi.components?.messages || {}
              
              // Validate order events have required fields
              if (messages.OrderCreatedEvent) {
                const orderEvent = messages.OrderCreatedEvent.payload
                const required = orderEvent.required || []
                if (!required.includes("orderId")) {
                  errors.push("OrderCreatedEvent must have orderId as required field")
                }
                if (!required.includes("customerId")) {
                  errors.push("OrderCreatedEvent must have customerId as required field")
                }
              }

              // Validate payment events have amount validation
              if (messages.PaymentProcessedEvent) {
                const paymentEvent = messages.PaymentProcessedEvent.payload
                if (!paymentEvent.properties?.amount) {
                  errors.push("PaymentProcessedEvent must include amount field")
                }
              }

              return errors
            }
          }]
        })

        expect(validation.isValid).toBe(true)
        expect(validation.errors).toHaveLength(0)
      })
    })
  })

  describe("GIVEN IoT Device Management example", () => {
    describe("WHEN compiling IoT system", () => {
      it("THEN should generate IoT-specific AsyncAPI specification", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.exampleIoT,
          emitAsyncAPI: true
        })

        compiler.validateCompilationSuccess(result)
        
        // Validate IoT service info
        expect(result.asyncapi!.info.title).toBe("IoT Device Management Service")
        expect(result.asyncapi!.info.version).toBe("2.0.0")
        
        // Validate IoT channels
        const channels = result.asyncapi!.channels!
        expect(channels["devices/{deviceId}/telemetry"]).toBeDefined()
        expect(channels["devices/{deviceId}/commands"]).toBeDefined()
        expect(channels["devices/{deviceId}/status"]).toBeDefined()
        expect(channels["analytics/device-metrics"]).toBeDefined()
      })

      it("THEN should validate MQTT protocol bindings", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.exampleIoT,
          emitAsyncAPI: true
        })

        // MQTT bindings for telemetry
        const telemetryChannel = result.asyncapi!.channels!["devices/{deviceId}/telemetry"]
        expect(telemetryChannel.bindings?.mqtt?.qos).toBe(1)
        expect(telemetryChannel.bindings?.mqtt?.retain).toBe(false)

        // MQTT bindings for commands with higher QoS
        const commandChannel = result.asyncapi!.channels!["devices/{deviceId}/commands"]
        expect(commandChannel.bindings?.mqtt?.qos).toBe(2)
        expect(commandChannel.bindings?.mqtt?.retain).toBe(true)
      })

      it("THEN should handle sensor data structures", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.exampleIoT,
          emitAsyncAPI: true
        })

        const messages = result.asyncapi!.components!.messages!
        
        // Telemetry data structure
        const telemetryMessage = messages.TelemetryData
        expect(telemetryMessage.payload.properties!.deviceId).toEqual({ type: "string" })
        expect(telemetryMessage.payload.properties!.timestamp).toEqual({ type: "string", format: "date-time" })
        expect(telemetryMessage.payload.properties!.sensors).toEqual({
          type: "array",
          items: { $ref: "#/components/schemas/SensorReading" }
        })

        // Sensor reading structure
        const sensorReading = result.asyncapi!.components!.schemas!.SensorReading
        expect(sensorReading.properties!.sensorType).toEqual({
          type: "string",
          enum: ["temperature", "humidity", "pressure", "motion", "light"]
        })
        expect(sensorReading.properties!.value).toEqual({ type: "number", format: "double" })
        expect(sensorReading.properties!.unit).toEqual({ type: "string" })
      })

      it("THEN should handle geolocation data", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.exampleIoT,
          emitAsyncAPI: true
        })

        const geoLocation = result.asyncapi!.components!.schemas!.GeoLocation
        expect(geoLocation.properties!.latitude).toEqual({ type: "number", format: "double" })
        expect(geoLocation.properties!.longitude).toEqual({ type: "number", format: "double" })
        expect(geoLocation.properties!.altitude).toEqual({ type: "number", format: "double" })
        expect(geoLocation.properties!.accuracy).toEqual({ type: "number", format: "double" })
      })

      it("THEN should validate device command patterns", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.exampleIoT,
          emitAsyncAPI: true
        })

        const deviceCommand = result.asyncapi!.components!.messages!.DeviceCommand
        expect(deviceCommand.payload.properties!.commandType).toEqual({
          type: "string",
          enum: ["reboot", "update_config", "change_reporting_interval", "run_diagnostic"]
        })
        expect(deviceCommand.payload.properties!.priority).toEqual({
          type: "string", 
          enum: ["low", "normal", "high", "critical"]
        })
      })
    })

    describe("WHEN handling IoT aggregation patterns", () => {
      it("THEN should support analytics and aggregation", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.exampleIoT,
          emitAsyncAPI: true
        })

        const aggregatedMetrics = result.asyncapi!.components!.messages!.AggregatedDeviceMetrics
        expect(aggregatedMetrics.payload.properties!.deviceType).toEqual({ type: "string" })
        expect(aggregatedMetrics.payload.properties!.totalDevices).toEqual({ type: "integer", format: "int32" })
        expect(aggregatedMetrics.payload.properties!.activeDevices).toEqual({ type: "integer", format: "int32" })
        
        const timeWindow = result.asyncapi!.components!.schemas!.TimeWindow
        expect(timeWindow.properties!.startTime).toEqual({ type: "string", format: "date-time" })
        expect(timeWindow.properties!.endTime).toEqual({ type: "string", format: "date-time" })
        expect(timeWindow.properties!.intervalMinutes).toEqual({ type: "integer", format: "int32" })
      })
    })
  })

  describe("GIVEN Financial Trading System example", () => {
    describe("WHEN compiling trading system", () => {
      it("THEN should generate high-frequency trading AsyncAPI specification", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.exampleFinancial,
          emitAsyncAPI: true
        })

        compiler.validateCompilationSuccess(result)
        
        // Validate trading service info
        expect(result.asyncapi!.info.title).toBe("Financial Trading System")
        expect(result.asyncapi!.info.version).toBe("3.1.0")
        
        // Validate trading channels
        const channels = result.asyncapi!.channels!
        expect(channels["market-data/{symbol}/quotes"]).toBeDefined()
        expect(channels["orders/new"]).toBeDefined()
        expect(channels["trades/executed"]).toBeDefined()
        expect(channels["risk/alerts/{accountId}"]).toBeDefined()
        expect(channels["portfolio/{accountId}/updates"]).toBeDefined()
      })

      it("THEN should validate WebSocket bindings for market data", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.exampleFinancial,
          emitAsyncAPI: true
        })

        const marketDataChannel = result.asyncapi!.channels!["market-data/{symbol}/quotes"]
        expect(marketDataChannel.bindings?.ws?.method).toBe("GET")
        expect(marketDataChannel.bindings?.ws?.query?.symbols).toBe("string")
        expect(marketDataChannel.bindings?.ws?.query?.depth).toBe("number")
      })

      it("THEN should handle high-frequency data structures", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.exampleFinancial,
          emitAsyncAPI: true
        })

        const messages = result.asyncapi!.components!.messages!
        
        // Market data update
        const marketData = messages.MarketDataUpdate
        expect(marketData.payload.properties!.symbol).toEqual({ type: "string" })
        expect(marketData.payload.properties!.timestamp).toEqual({ type: "string", format: "date-time" })
        expect(marketData.payload.properties!.sequence).toEqual({ type: "integer", format: "int64" })
        expect(marketData.payload.properties!.marketStatus).toEqual({
          type: "string",
          enum: ["open", "closed", "pre_market", "after_hours"]
        })

        // Price level structure
        const priceLevel = result.asyncapi!.components!.schemas!.PriceLevel
        expect(priceLevel.properties!.price).toEqual({ type: "number", format: "double" })
        expect(priceLevel.properties!.quantity).toEqual({ type: "number", format: "double" })
      })

      it("THEN should validate order management structures", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.exampleFinancial,
          emitAsyncAPI: true
        })

        const orderRequest = result.asyncapi!.components!.messages!.OrderRequest
        expect(orderRequest.payload.properties!.side).toEqual({
          type: "string",
          enum: ["buy", "sell"]
        })
        expect(orderRequest.payload.properties!.orderType).toEqual({
          type: "string",
          enum: ["market", "limit", "stop", "stop_limit"]
        })
        expect(orderRequest.payload.properties!.timeInForce).toEqual({
          type: "string",
          enum: ["day", "gtc", "ioc", "fok"]
        })
      })

      it("THEN should handle risk management alerts", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.exampleFinancial,
          emitAsyncAPI: true
        })

        const riskAlert = result.asyncapi!.components!.messages!.RiskAlert
        expect(riskAlert.payload.properties!.alertType).toEqual({
          type: "string",
          enum: ["position_limit", "loss_limit", "margin_call", "concentration"]
        })
        expect(riskAlert.payload.properties!.severity).toEqual({
          type: "string",
          enum: ["info", "warning", "critical"]
        })
        expect(riskAlert.payload.properties!.requiresAction).toEqual({ type: "boolean" })
      })
    })

    describe("WHEN validating trading system performance", () => {
      it("THEN should ensure low-latency configurations", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.exampleFinancial,
          emitAsyncAPI: true
        })

        // Validate Kafka configurations for performance
        const orderChannel = result.asyncapi!.channels!["orders/new"]
        expect(orderChannel.bindings?.kafka?.acks).toBe("all")
        expect(orderChannel.bindings?.kafka?.retries).toBe(0) // No retries for low latency
        expect(orderChannel.bindings?.kafka?.partitionKey).toBe("accountId")

        const validation = await validator.validateAsyncAPI(result.asyncapi!, {
          strict: true,
          validateSemantic: true
        })

        expect(validation.isValid).toBe(true)
      })
    })
  })

  describe("GIVEN cross-example validation", () => {
    describe("WHEN comparing all examples", () => {
      it("THEN should demonstrate consistent patterns across domains", async () => {
        const examples = [
          { name: "E-commerce", code: TypeSpecFixtures.exampleEcommerce },
          { name: "IoT", code: TypeSpecFixtures.exampleIoT },
          { name: "Financial", code: TypeSpecFixtures.exampleFinancial }
        ]

        for (const example of examples) {
          const result = await compiler.compileTypeSpec({
            code: example.code,
            emitAsyncAPI: true
          })

          compiler.validateCompilationSuccess(result)

          // All examples should have proper service info
          expect(result.asyncapi!.info.title).toBeDefined()
          expect(result.asyncapi!.info.version).toBeDefined()

          // All examples should have channels and operations
          expect(Object.keys(result.asyncapi!.channels!).length).toBeGreaterThan(0)
          expect(Object.keys(result.asyncapi!.operations!).length).toBeGreaterThan(0)

          // All examples should have message components
          expect(Object.keys(result.asyncapi!.components!.messages!).length).toBeGreaterThan(0)

          // All examples should validate against AsyncAPI 3.0
          const validation = await validator.validateAsyncAPI(result.asyncapi!, {
            strict: true
          })
          expect(validation.isValid).toBe(true)
        }
      })

      it("THEN should demonstrate domain-specific optimizations", async () => {
        // E-commerce: Order processing workflow
        const ecommerceResult = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.exampleEcommerce,
          emitAsyncAPI: true
        })
        expect(ecommerceResult.asyncapi!.channels!["orders/created"]).toBeDefined()

        // IoT: Device telemetry streams
        const iotResult = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.exampleIoT,
          emitAsyncAPI: true
        })
        expect(iotResult.asyncapi!.channels!["devices/{deviceId}/telemetry"]).toBeDefined()

        // Financial: High-frequency trading
        const financialResult = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.exampleFinancial,
          emitAsyncAPI: true
        })
        expect(financialResult.asyncapi!.channels!["market-data/{symbol}/quotes"]).toBeDefined()
      })
    })
  })
})