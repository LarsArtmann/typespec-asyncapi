/**
 * Enhanced Protocol Plugins Integration Tests
 * 
 * TASK M23: Test WebSocket plugin with real compilation
 * TASK M27: Test AMQP plugin with real compilation  
 * TASK M31: Test MQTT plugin with real compilation
 * 
 * Validates that all enhanced protocol plugins work correctly with
 * TypeSpec compilation and generate proper AsyncAPI bindings.
 */

import { describe, it, expect } from "bun:test"
import { Effect } from "effect"
// DISABLED: import from enhanced-websocket-plugin (file not found)
// DISABLED: import from enhanced-amqp-plugin (file not found)
// DISABLED: import from enhanced-mqtt-plugin (file not found)

describe("Enhanced Protocol Plugins Integration", () => {
  
  describe("TASK M23: Enhanced WebSocket Plugin", () => {
    
    it("should generate WebSocket operation binding", async () => {
      const testData = WebSocketTestingUtils.createTestOperationData()
      
      const result = await Effect.runPromise(
        enhancedWebSocketPlugin.generateOperationBinding!(testData)
      )
      
      expect(result).toEqual({})  // WebSocket doesn't have operation bindings
    })

    it("should generate WebSocket message binding", async () => {
      const testData = WebSocketTestingUtils.createTestOperationData()
      
      const result = await Effect.runPromise(
        enhancedWebSocketPlugin.generateMessageBinding!(testData.message!)
      )
      
      expect(WebSocketTestingUtils.validateBindingOutput(result)).toBe(true)
      expect(result).toHaveProperty("ws")
      expect(result.ws).toHaveProperty("bindingVersion", "0.1.0")
    })

    it("should validate WebSocket server configuration", async () => {
      const serverData = WebSocketTestingUtils.createTestServerData()
      
      const result = await Effect.runPromise(
        enhancedWebSocketPlugin.generateServerBinding!(serverData)
      )
      
      expect(result).toEqual({})  // WebSocket doesn't have server bindings
    })

    it("should validate WebSocket configuration", async () => {
      const config = {
        method: "GET" as const,
        query: { auth: "token", version: "1.0" },
        headers: { "Sec-WebSocket-Protocol": "chat" },
        maxMessageSize: 1048576,
        heartbeatInterval: 30000,
        connectionTimeout: 60000
      }

      const isValid = await Effect.runPromise(
        enhancedWebSocketPlugin.validateConfig!(config)
      )
      
      expect(isValid).toBe(true)
    })

    it("should reject invalid WebSocket configuration", async () => {
      const config = {
        method: "INVALID" as any,
        maxMessageSize: -1,
        heartbeatInterval: 0
      }

      const isValid = await Effect.runPromise(
        enhancedWebSocketPlugin.validateConfig!(config)
      )
      
      expect(isValid).toBe(false)
    })
  })

  describe("TASK M27: Enhanced AMQP Plugin", () => {
    
    it("should generate AMQP operation binding with routing configuration", async () => {
      const testData = AMQPTestingUtils.createTestOperationData()
      
      const result = await Effect.runPromise(
        enhancedAMQPPlugin.generateOperationBinding!(testData)
      )
      
      expect(AMQPTestingUtils.validateBindingOutput(result)).toBe(true)
      expect(result).toHaveProperty("amqp")
      expect(result.amqp).toHaveProperty("bindingVersion", "0.3.0")
      expect(result.amqp).toHaveProperty("deliveryMode", 2)
    })

    it("should generate AMQP message binding", async () => {
      const messageData = {
        config: {
          contentEncoding: "gzip",
          messageType: "order.created"
        }
      }
      
      const result = await Effect.runPromise(
        enhancedAMQPPlugin.generateMessageBinding!(messageData)
      )
      
      expect(AMQPTestingUtils.validateBindingOutput(result)).toBe(true)
      expect(result).toHaveProperty("amqp")
      expect(result.amqp).toHaveProperty("contentEncoding", "gzip")
      expect(result.amqp).toHaveProperty("messageType", "order.created")
    })

    it("should validate comprehensive AMQP configuration", async () => {
      const config = {
        exchange: {
          name: "orders.exchange",
          type: "topic" as const,
          durable: true,
          autoDelete: false
        },
        queue: {
          name: "order.processing.queue",
          durable: true,
          exclusive: false
        },
        routingKey: "order.created",
        deliveryMode: 2 as const,
        priority: 5,
        consumer: {
          prefetchCount: 10,
          prefetchSize: 0,
          noAck: false
        }
      }

      const isValid = await Effect.runPromise(
        enhancedAMQPPlugin.validateConfig!(config)
      )
      
      expect(isValid).toBe(true)
    })

    it("should reject invalid AMQP configuration", async () => {
      const config = {
        exchange: {
          name: "",  // Empty name should fail
          type: "invalid" as any
        },
        deliveryMode: 3 as any,  // Invalid delivery mode
        priority: 300  // Invalid priority (max 255)
      }

      const isValid = await Effect.runPromise(
        enhancedAMQPPlugin.validateConfig!(config)
      )
      
      expect(isValid).toBe(false)
    })

    it("should create Dead Letter Exchange configuration", () => {
      const dlxConfig = AMQPTestingUtils.createDLXConfig(
        "failed.orders.exchange", 
        "failed.order"
      )
      
      expect(dlxConfig).toEqual({
        exchange: "failed.orders.exchange",
        routingKey: "failed.order",
        arguments: {
          "x-message-ttl": 86400000,
          "x-max-retries": 3
        }
      })
    })
  })

  describe("TASK M31: Enhanced MQTT Plugin", () => {
    
    it("should generate MQTT operation binding with QoS settings", async () => {
      const testData = MQTTTestingUtils.createTestOperationData()
      
      const result = await Effect.runPromise(
        enhancedMQTTPlugin.generateOperationBinding!(testData)
      )
      
      expect(MQTTTestingUtils.validateBindingOutput(result)).toBe(true)
      expect(result).toHaveProperty("mqtt")
      expect(result.mqtt).toHaveProperty("bindingVersion", "0.2.0")
      expect(result.mqtt).toHaveProperty("qos", 1)
      expect(result.mqtt).toHaveProperty("retain", false)
    })

    it("should generate MQTT message binding with format indicators", async () => {
      const messageData = {
        config: {
          mqtt5: {
            correlationData: "correlation-123",
            responseInformation: "response/topic",
            messageExpiryInterval: 3600
          }
        }
      }
      
      const result = await Effect.runPromise(
        enhancedMQTTPlugin.generateMessageBinding!(messageData)
      )
      
      expect(MQTTTestingUtils.validateBindingOutput(result)).toBe(true)
      expect(result).toHaveProperty("mqtt")
      expect(result.mqtt).toHaveProperty("correlationData", "correlation-123")
      expect(result.mqtt).toHaveProperty("responseTopic", "response/topic")
      expect(result.mqtt).toHaveProperty("payloadFormatIndicator", 1)
    })

    it("should generate MQTT server binding with connection settings", async () => {
      const serverData = MQTTTestingUtils.createTestServerData()
      
      const result = await Effect.runPromise(
        enhancedMQTTPlugin.generateServerBinding!(serverData)
      )
      
      expect(MQTTTestingUtils.validateBindingOutput(result)).toBe(true)
      expect(result).toHaveProperty("mqtt")
      expect(result.mqtt).toHaveProperty("keepAlive", 60)
    })

    it("should validate comprehensive MQTT configuration", async () => {
      const config = {
        topic: {
          template: "iot/devices/{deviceId}/telemetry",
          levels: ["iot", "devices", "{deviceId}", "telemetry"],
          wildcard: "+" as const
        },
        qos: 2 as const,
        retain: true,
        lastWill: {
          topic: "devices/{deviceId}/status",
          message: '{"status": "offline"}',
          qos: 1 as const,
          retain: true
        },
        connection: {
          keepAlive: 60,
          cleanSession: true,
          clientId: "device-001"
        },
        mqtt5: MQTTTestingUtils.createMQTT5Config()
      }

      const isValid = await Effect.runPromise(
        enhancedMQTTPlugin.validateConfig!(config)
      )
      
      expect(isValid).toBe(true)
    })

    it("should reject invalid MQTT configuration", async () => {
      const config = {
        qos: 3 as any,  // Invalid QoS level
        lastWill: {
          topic: "",  // Empty topic should fail
          message: ""  // Empty message should fail
        },
        connection: {
          keepAlive: 70000,  // Invalid keep-alive (max 65535)
          clientId: "a".repeat(70000)  // Too long client ID
        },
        mqtt5: {
          topicAlias: 0,  // Invalid topic alias (must be 1-65535)
          messageExpiryInterval: -1  // Invalid expiry interval
        }
      }

      const isValid = await Effect.runPromise(
        enhancedMQTTPlugin.validateConfig!(config)
      )
      
      expect(isValid).toBe(false)
    })
  })

  describe("TASK M30: MQTT Topic Hierarchy Utilities", () => {
    
    it("should parse topic hierarchy correctly", () => {
      const template = "iot/devices/sensor-001/temperature"
      const levels = MQTTTopicUtils.parseTopicHierarchy(template)
      
      expect(levels).toEqual(["iot", "devices", "sensor-001", "temperature"])
    })

    it("should validate topic patterns", () => {
      expect(MQTTTopicUtils.isValidTopicPattern("valid/topic")).toBe(true)
      expect(MQTTTopicUtils.isValidTopicPattern("valid/+/topic")).toBe(true)
      expect(MQTTTopicUtils.isValidTopicPattern("valid/topic/#")).toBe(true)
      
      expect(MQTTTopicUtils.isValidTopicPattern("")).toBe(false)
      expect(MQTTTopicUtils.isValidTopicPattern("invalid/#/topic")).toBe(false)
      expect(MQTTTopicUtils.isValidTopicPattern("invalid/topic#")).toBe(false)
    })

    it("should match topics against patterns", () => {
      expect(MQTTTopicUtils.matchesPattern("devices/sensor1/temp", "devices/+/temp")).toBe(true)
      expect(MQTTTopicUtils.matchesPattern("devices/sensor1/temp", "devices/sensor2/temp")).toBe(false)
      expect(MQTTTopicUtils.matchesPattern("devices/sensor1/temp/current", "devices/+/#")).toBe(true)
      expect(MQTTTopicUtils.matchesPattern("devices/sensor1", "devices/+/#")).toBe(true)
    })

    it("should create shared subscription topics", () => {
      const sharedTopic = MQTTTopicUtils.createSharedSubscription("group1", "devices/+/telemetry")
      expect(sharedTopic).toBe("$share/group1/devices/+/telemetry")
    })

    it("should create IoT device topic hierarchy", () => {
      const topic = MQTTTestingUtils.createIoTTopicHierarchy("sensor-001", "temperature")
      expect(topic).toBe("iot/devices/sensor-001/temperature")
    })
  })

  describe("Cross-Plugin Compatibility", () => {
    
    it("should all plugins have consistent versioning", () => {
      expect(enhancedWebSocketPlugin.version).toBe("2.0.0")
      expect(enhancedAMQPPlugin.version).toBe("2.0.0")
      expect(enhancedMQTTPlugin.version).toBe("2.0.0")
    })

    it("should all plugins have proper protocol names", () => {
      expect(enhancedWebSocketPlugin.name).toBe("websocket")
      expect(enhancedAMQPPlugin.name).toBe("amqp")  
      expect(enhancedMQTTPlugin.name).toBe("mqtt")
    })

    it("should all plugins implement required methods", () => {
      const plugins = [enhancedWebSocketPlugin, enhancedAMQPPlugin, enhancedMQTTPlugin]
      
      for (const plugin of plugins) {
        expect(typeof plugin.generateOperationBinding).toBe("function")
        expect(typeof plugin.generateMessageBinding).toBe("function")
        expect(typeof plugin.generateServerBinding).toBe("function")
        expect(typeof plugin.validateConfig).toBe("function")
      }
    })
  })
})