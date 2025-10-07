/**
 * Real-world scenario integration tests for AsyncAPI emitter
 */

import { describe, it, expect } from "bun:test";
import { compileAsyncAPISpecWithoutErrors, parseAsyncAPIOutput, AsyncAPIAssertions } from "../utils/test-helpers";
//TODO: this file is getting to big split it up

describe("Real-World AsyncAPI Scenarios", () => {
  describe("E-commerce Event System", () => {
    it("should handle complete e-commerce event flow", async () => {
      const source = `
        @doc("E-commerce event-driven system")
        namespace EcommerceEvents;
        
        @doc("User account information")
        model User {
          @doc("Unique user identifier")
          id: string;
          
          @doc("User email address")
          email: string;
          
          @doc("User account status")
          status: "active" | "suspended" | "deleted";
          
          @doc("Account creation timestamp")
          createdAt: utcDateTime;
        }
        
        @doc("Product catalog item")
        model Product {
          @doc("Product SKU")
          sku: string;
          
          @doc("Product name")
          name: string;
          
          @doc("Product price in cents")
          priceInCents: int32;
          
          @doc("Product category")
          category: string;
          
          @doc("Stock quantity")
          stockQuantity: int32;
        }
        
        @doc("Shopping cart order")
        model Order {
          @doc("Order identifier")
          orderId: string;
          
          @doc("Customer user ID")
          userId: string;
          
          @doc("Order items")
          items: OrderItem[];
          
          @doc("Total amount in cents")
          totalAmountInCents: int32;
          
          @doc("Order status")
          status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
          
          @doc("Order creation timestamp")
          createdAt: utcDateTime;
        }
        
        @doc("Individual order item")
        model OrderItem {
          @doc("Product SKU")
          sku: string;
          
          @doc("Item quantity")
          quantity: int32;
          
          @doc("Unit price in cents")
          unitPriceInCents: int32;
        }
        
        @doc("Payment transaction")
        model Payment {
          @doc("Payment ID")
          paymentId: string;
          
          @doc("Related order ID")
          orderId: string;
          
          @doc("Payment amount in cents")
          amountInCents: int32;
          
          @doc("Payment method")
          paymentMethod: "credit_card" | "paypal" | "bank_transfer";
          
          @doc("Payment status")
          status: "pending" | "completed" | "failed" | "refunded";
          
          @doc("Payment timestamp")
          processedAt: utcDateTime;
        }
        
        // User events
        @channel("users.registered")
        @doc("Published when a new user registers")
        op publishUserRegistered(): User;
        
        @channel("users.status_changed")
        @doc("Published when user status changes")
        op publishUserStatusChanged(): User;
        
        // Product events
        @channel("products.created")
        @doc("Published when new product is added")
        op publishProductCreated(): Product;
        
        @channel("products.stock_updated")
        @doc("Published when product stock changes")
        op publishProductStockUpdated(): Product;
        
        // Order events
        @channel("orders.placed")
        @doc("Published when order is placed")
        op publishOrderPlaced(): Order;
        
        @channel("orders.status_changed")
        @doc("Published when order status updates")
        op publishOrderStatusChanged(): Order;
        
        // Payment events
        @channel("payments.processed")
        @doc("Published when payment is processed")
        op publishPaymentProcessed(): Payment;
        
        @channel("payments.failed")
        @doc("Published when payment fails")
        op publishPaymentFailed(): Payment;
        
        // Subscription events for microservices
        @channel("user.{userId}.orders")
        @doc("Subscribe to orders for specific user")
        op subscribeUserOrders(userId: string): Order;
        
        @channel("inventory.updates")
        @doc("Subscribe to inventory updates")
        op subscribeInventoryUpdates(): Product;
      `;
      
      const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source, {
        "output-file": "ecommerce-system",
        "file-type": "json"
      });
      
      const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "ecommerce-system.json");
      
      // Validate overall structure
      expect(AsyncAPIAssertions.hasValidStructure(asyncapiDoc)).toBe(true);
      
      // Validate all schemas are generated
      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "User")).toBe(true);
      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "Product")).toBe(true);
      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "Order")).toBe(true);
      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "OrderItem")).toBe(true);
      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "Payment")).toBe(true);
      
      // Validate key operations
      expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "publishUserRegistered")).toBe(true);
      expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "publishOrderPlaced")).toBe(true);
      expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "publishPaymentProcessed")).toBe(true);
      expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "subscribeUserOrders")).toBe(true);
      
      // Validate complex schema properties
      expect(AsyncAPIAssertions.schemaHasProperty(asyncapiDoc, "Order", "items")).toBe(true);
      expect(AsyncAPIAssertions.schemaHasProperty(asyncapiDoc, "Order", "totalAmountInCents")).toBe(true);
      expect(AsyncAPIAssertions.schemaHasProperty(asyncapiDoc, "Payment", "paymentMethod")).toBe(true);
      
      // Validate required fields
      const orderSchema = asyncapiDoc.components.schemas.Order;
      expect(orderSchema.required).toContain("orderId");
      expect(orderSchema.required).toContain("userId");
      expect(orderSchema.required).toContain("items");
      expect(orderSchema.required).toContain("status");
      
      Effect.log("✅ E-commerce system validation passed");
    });
  });

  describe("IoT Sensor Network", () => {
    it("should handle IoT sensor data events", async () => {
      const source = `
        @doc("IoT sensor network event system")
        namespace IoTEvents;
        
        @doc("Geographic location")
        model Location {
          @doc("Latitude coordinate")
          latitude: float64;
          
          @doc("Longitude coordinate") 
          longitude: float64;
          
          @doc("Altitude in meters")
          altitude?: float64;
        }
        
        @doc("Sensor device information")
        model SensorDevice {
          @doc("Unique device identifier")
          deviceId: string;
          
          @doc("Device type")
          deviceType: "temperature" | "humidity" | "pressure" | "motion" | "light";
          
          @doc("Device firmware version")
          firmwareVersion: string;
          
          @doc("Device location")
          location: Location;
          
          @doc("Device status")
          status: "online" | "offline" | "maintenance" | "error";
          
          @doc("Last heartbeat timestamp")
          lastHeartbeat: utcDateTime;
        }
        
        @doc("Sensor measurement reading")
        model SensorReading {
          @doc("Source device ID")
          deviceId: string;
          
          @doc("Measurement timestamp")
          timestamp: utcDateTime;
          
          @doc("Measured value")
          value: float64;
          
          @doc("Measurement unit")
          unit: string;
          
          @doc("Reading quality score")
          qualityScore: float32;
          
          @doc("Additional metadata")
          metadata?: {
            calibrationDate?: utcDateTime;
            batteryLevel?: float32;
            signalStrength?: int32;
          };
        }
        
        @doc("System alert")
        model SystemAlert {
          @doc("Alert identifier")
          alertId: string;
          
          @doc("Source device ID")
          deviceId: string;
          
          @doc("Alert severity")
          severity: "info" | "warning" | "critical" | "emergency";
          
          @doc("Alert message")
          message: string;
          
          @doc("Alert category")
          category: "hardware" | "network" | "data_quality" | "threshold";
          
          @doc("Alert timestamp")
          timestamp: utcDateTime;
          
          @doc("Alert resolution status")
          resolved: boolean;
        }
        
        // Device management events
        @channel("devices.registered")
        @doc("Published when new sensor device is registered")
        op publishDeviceRegistered(): SensorDevice;
        
        @channel("devices.status_changed")
        @doc("Published when device status changes")
        op publishDeviceStatusChanged(): SensorDevice;
        
        // Sensor data events
        @channel("sensors.temperature.readings")
        @doc("Temperature sensor readings")
        op publishTemperatureReading(): SensorReading;
        
        @channel("sensors.humidity.readings")
        @doc("Humidity sensor readings")
        op publishHumidityReading(): SensorReading;
        
        @channel("sensors.motion.events")
        @doc("Motion detection events")
        op publishMotionDetected(): SensorReading;
        
        // Alert events
        @channel("system.alerts.critical")
        @doc("Critical system alerts")
        op publishCriticalAlert(): SystemAlert;
        
        @channel("system.alerts.warnings")
        @doc("System warnings")
        op publishWarningAlert(): SystemAlert;
        
        // Subscription channels for monitoring
        @channel("device.{deviceId}.readings")
        @doc("Subscribe to readings from specific device")
        op subscribeDeviceReadings(deviceId: string): SensorReading;
        
        @channel("location.{zone}.sensors")
        @doc("Subscribe to sensors in geographic zone")
        op subscribeZoneSensors(zone: string): SensorReading;
        
        @channel("alerts.{severity}")
        @doc("Subscribe to alerts by severity level")
        op subscribeAlertsBySeverity(severity: string): SystemAlert;
      `;
      
      const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source, {
        "output-file": "iot-system",
        "file-type": "json"
      });
      
      const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "iot-system.json");
      
      // Validate IoT-specific structures
      expect(AsyncAPIAssertions.hasValidStructure(asyncapiDoc)).toBe(true);
      
      // Validate IoT schemas
      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "Location")).toBe(true);
      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "SensorDevice")).toBe(true);
      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "SensorReading")).toBe(true);
      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "SystemAlert")).toBe(true);
      
      // Validate nested properties
      expect(AsyncAPIAssertions.schemaHasProperty(asyncapiDoc, "SensorDevice", "location")).toBe(true);
      expect(AsyncAPIAssertions.schemaHasProperty(asyncapiDoc, "SensorReading", "metadata")).toBe(true);
      
      // Validate parameterized subscriptions
      expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "subscribeDeviceReadings")).toBe(true);
      expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "subscribeZoneSensors")).toBe(true);
      expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "subscribeAlertsBySeverity")).toBe(true);
      
      // Validate data type handling
      const sensorReadingSchema = asyncapiDoc.components.schemas.SensorReading;
      expect(sensorReadingSchema.properties.value.type).toBe("number");
      expect(sensorReadingSchema.properties.qualityScore.type).toBe("number");
      
      Effect.log("✅ IoT system validation passed");
    });
  });

  describe("Financial Trading System", () => {
    it("should handle high-frequency trading events", async () => {
      const source = `
        @doc("Financial trading system events")
        namespace TradingEvents;
        
        @doc("Financial instrument")
        model Instrument {
          @doc("Instrument symbol (e.g., AAPL, MSFT)")
          symbol: string;
          
          @doc("Instrument type")
          instrumentType: "stock" | "option" | "future" | "forex" | "crypto";
          
          @doc("Exchange identifier")
          exchange: string;
          
          @doc("Currency denomination")
          currency: string;
          
          @doc("Trading status")
          tradingStatus: "active" | "suspended" | "halted" | "closed";
        }
        
        @doc("Market data price tick")
        model PriceTick {
          @doc("Instrument symbol")
          symbol: string;
          
          @doc("Bid price")
          bidPrice: float64;
          
          @doc("Ask price") 
          askPrice: float64;
          
          @doc("Last trade price")
          lastPrice: float64;
          
          @doc("Bid size")
          bidSize: int64;
          
          @doc("Ask size")
          askSize: int64;
          
          @doc("Trade volume")
          volume: int64;
          
          @doc("High-precision timestamp (microseconds)")
          timestamp: utcDateTime;
          
          @doc("Exchange timestamp")
          exchangeTimestamp: utcDateTime;
        }
        
        @doc("Trade execution")
        model TradeExecution {
          @doc("Unique trade identifier")
          tradeId: string;
          
          @doc("Order identifier")
          orderId: string;
          
          @doc("Instrument symbol")
          symbol: string;
          
          @doc("Trade side")
          side: "buy" | "sell";
          
          @doc("Executed quantity")
          quantity: int64;
          
          @doc("Execution price")
          price: float64;
          
          @doc("Execution timestamp")
          executionTime: utcDateTime;
          
          @doc("Counterparty information")
          counterparty?: string;
          
          @doc("Commission charged")
          commission: float64;
        }
        
        @doc("Risk management alert")
        model RiskAlert {
          @doc("Alert identifier")
          alertId: string;
          
          @doc("Risk type")
          riskType: "position_limit" | "loss_limit" | "exposure_limit" | "volatility";
          
          @doc("Affected symbol or portfolio")
          subject: string;
          
          @doc("Alert severity")
          severity: "low" | "medium" | "high" | "critical";
          
          @doc("Risk threshold breached")
          threshold: float64;
          
          @doc("Current value")
          currentValue: float64;
          
          @doc("Alert message")
          message: string;
          
          @doc("Alert timestamp")
          timestamp: utcDateTime;
        }
        
        // High-frequency market data
        @channel("market.{symbol}.ticks")
        @doc("Real-time price ticks for symbol")
        op publishPriceTick(): PriceTick;
        
        @channel("market.{exchange}.instruments")
        @doc("Instrument updates by exchange")
        op publishInstrumentUpdate(): Instrument;
        
        // Trade execution events
        @channel("trades.executed")
        @doc("Trade execution notifications")
        op publishTradeExecuted(): TradeExecution;
        
        @channel("trades.{symbol}.executed")
        @doc("Symbol-specific trade executions")
        op publishSymbolTradeExecuted(): TradeExecution;
        
        // Risk management
        @channel("risk.alerts")
        @doc("Risk management alerts")
        op publishRiskAlert(): RiskAlert;
        
        @channel("risk.critical")
        @doc("Critical risk alerts requiring immediate action")
        op publishCriticalRiskAlert(): RiskAlert;
        
        // Subscription feeds for traders
        @channel("feed.level1.{symbol}")
        @doc("Level 1 market data subscription")
        op subscribeLevel1Data(symbol: string): PriceTick;
        
        @channel("feed.trades.{symbol}")
        @doc("Trade feed subscription")
        op subscribeTradeFeeds(symbol: string): TradeExecution;
        
        @channel("portfolio.{userId}.alerts")
        @doc("User-specific risk alerts")
        op subscribeUserRiskAlerts(userId: string): RiskAlert;
      `;
      
      const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source, {
        "output-file": "trading-system",
        "file-type": "json"
      });
      
      const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "trading-system.json");
      
      // Validate trading system structure
      expect(AsyncAPIAssertions.hasValidStructure(asyncapiDoc)).toBe(true);
      
      // Validate financial schemas
      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "Instrument")).toBe(true);
      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "PriceTick")).toBe(true);
      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "TradeExecution")).toBe(true);
      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "RiskAlert")).toBe(true);
      
      // Validate high-frequency data structures
      const priceTickSchema = asyncapiDoc.components.schemas.PriceTick;
      expect(priceTickSchema.properties.bidPrice.type).toBe("number");
      expect(priceTickSchema.properties.askPrice.type).toBe("number");
      expect(priceTickSchema.properties.volume.type).toBe("number");
      expect(priceTickSchema.properties.timestamp.format).toBe("date-time");
      
      // Validate subscription channels
      expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "subscribeLevel1Data")).toBe(true);
      expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "subscribeTradeFeeds")).toBe(true);
      expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "subscribeUserRiskAlerts")).toBe(true);
      
      // Validate critical operations
      expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "publishCriticalRiskAlert")).toBe(true);
      expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "publishTradeExecuted")).toBe(true);
      
      Effect.log("✅ Trading system validation passed");
    });
  });

  describe("Multi-tenant SaaS Platform", () => {
    it("should handle tenant-isolated events", async () => {
      const source = `
        @doc("Multi-tenant SaaS platform events")
        namespace SaaSEvents;
        
        @doc("Tenant organization")
        model Tenant {
          @doc("Tenant identifier")
          tenantId: string;
          
          @doc("Tenant name")
          name: string;
          
          @doc("Subscription plan")
          plan: "starter" | "professional" | "enterprise";
          
          @doc("Tenant status")
          status: "active" | "suspended" | "cancelled";
          
          @doc("Creation timestamp")
          createdAt: utcDateTime;
        }
        
        @doc("Tenant user account")
        model TenantUser {
          @doc("User identifier")
          userId: string;
          
          @doc("Tenant identifier")
          tenantId: string;
          
          @doc("User email")
          email: string;
          
          @doc("User role")
          role: "owner" | "admin" | "member" | "viewer";
          
          @doc("User status")
          status: "active" | "invited" | "suspended";
        }
        
        @doc("Application usage metrics")
        model UsageMetrics {
          @doc("Tenant identifier")
          tenantId: string;
          
          @doc("Metric type")
          metricType: "api_calls" | "storage_usage" | "active_users" | "feature_usage";
          
          @doc("Metric value")
          value: float64;
          
          @doc("Measurement timestamp")
          timestamp: utcDateTime;
          
          @doc("Measurement period")
          period: "hourly" | "daily" | "monthly";
        }
        
        @doc("Feature usage event")
        model FeatureUsage {
          @doc("Tenant identifier")
          tenantId: string;
          
          @doc("User identifier")
          userId: string;
          
          @doc("Feature name")
          featureName: string;
          
          @doc("Usage timestamp")
          timestamp: utcDateTime;
          
          @doc("Session identifier")
          sessionId: string;
          
          @doc("Additional context")
          context?: {
            ip?: string;
            userAgent?: string;
            referrer?: string;
          };
        }
        
        // Tenant lifecycle events
        @channel("tenants.created")
        @doc("Published when new tenant is created")
        op publishTenantCreated(): Tenant;
        
        @channel("tenants.{tenantId}.users.added")
        @doc("Published when user is added to tenant")
        op publishTenantUserAdded(): TenantUser;
        
        @channel("tenants.{tenantId}.plan.changed")
        @doc("Published when tenant changes subscription plan")
        op publishTenantPlanChanged(): Tenant;
        
        // Usage tracking events
        @channel("usage.metrics")
        @doc("Published usage metrics for all tenants")
        op publishUsageMetrics(): UsageMetrics;
        
        @channel("tenants.{tenantId}.feature.used")
        @doc("Published when tenant uses a feature")
        op publishFeatureUsed(): FeatureUsage;
        
        // Tenant-specific subscriptions
        @channel("tenant.{tenantId}.events")
        @doc("Subscribe to all events for specific tenant")
        op subscribeTenantEvents(tenantId: string): FeatureUsage;
        
        @channel("tenant.{tenantId}.users.{userId}.activity")
        @doc("Subscribe to specific user activity within tenant")
        op subscribeUserActivity(tenantId: string, userId: string): FeatureUsage;
        
        @channel("billing.{tenantId}.usage")
        @doc("Subscribe to tenant usage for billing")
        op subscribeTenantUsage(tenantId: string): UsageMetrics;
      `;
      
      const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source, {
        "output-file": "saas-platform",
        "file-type": "json"
      });
      
      const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "saas-platform.json");
      
      // Validate SaaS platform structure
      expect(AsyncAPIAssertions.hasValidStructure(asyncapiDoc)).toBe(true);
      
      // Validate multi-tenant schemas
      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "Tenant")).toBe(true);
      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "TenantUser")).toBe(true);
      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "UsageMetrics")).toBe(true);
      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "FeatureUsage")).toBe(true);
      
      // Validate tenant isolation in channels
      expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "subscribeTenantEvents")).toBe(true);
      expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "subscribeUserActivity")).toBe(true);
      expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "subscribeTenantUsage")).toBe(true);
      
      // Validate schema relationships
      const tenantUserSchema = asyncapiDoc.components.schemas.TenantUser;
      expect(tenantUserSchema.required).toContain("tenantId");
      expect(tenantUserSchema.required).toContain("userId");
      expect(tenantUserSchema.required).toContain("role");
      
      const usageMetricsSchema = asyncapiDoc.components.schemas.UsageMetrics;
      expect(usageMetricsSchema.required).toContain("tenantId");
      expect(usageMetricsSchema.required).toContain("metricType");
      
      Effect.log("✅ SaaS platform validation passed");
    });
  });
});