/**
 * Domain Object Schema Integration Tests
 * 
 * Tests for @effect/schema Step 3 - Domain Objects
 * Validates complex object schemas using modern Effect.TS patterns
 */

import { Effect, Schema } from "effect"
import {
  createChannel,
  createMessage,
  createOperation,
  createServer,
  createAsyncAPISpec,
  createAsyncAPIChannels,
  createAsyncAPIMessages,
  createAsyncAPIOperations,
  createAsyncAPIServers,
  isChannel,
  isMessage,
  isOperation,
  isServer,
  isAsyncAPISpec,
  channelSchema,
  messageSchema,
  operationSchema,
  serverSchema,
  asyncapiSchema
} from "../../dist/src/types/domain/asyncapi-domain-types.js"
import {
  createChannelPath,
  createMessageId,
  createSchemaName,
  createOperationId,
  createServerUrl
} from "../../src/types/domain/asyncapi-branded-types.js"

describe("Domain Object Schema Integration Tests", () => {
  describe("Channel Schema", () => {
    it("should create valid channels", async () => {
      const channelInput = {
        path: "/user/events",
        description: "User event channel"
      }
      
      const result = await Effect.runPromise(createChannel(channelInput))
      
      expect(result.path).toBe("/user/events")
      expect(result.description).toBe("User event channel")
      expect(isChannel(result)).toBe(true)
    })

    it("should reject invalid channels", async () => {
      const channelInput = {
        path: "invalid-path" // missing leading slash
      }
      
      const result = await Effect.flip(createChannel(channelInput))
      
      expect(result._tag).toBe("Fail")
      expect(result.message).toContain("validation failed")
    })

    it("should validate channel schema directly", () => {
      const validChannel = {
        path: "/test/channel",
        description: "Test channel"
      }
      
      const decodeResult = Schema.decodeSync(channelSchema)(validChannel)
      expect(decodeResult.path).toBe("/test/channel")
      expect(decodeResult.description).toBe("Test channel")
    })
  })

  describe("Message Schema", () => {
    it("should create valid messages", async () => {
      const messageInput = {
        id: "user.created",
        schemaName: "UserCreatedEvent",
        description: "User created event",
        contentType: "application/json"
      }
      
      const result = await Effect.runPromise(createMessage(messageInput))
      
      expect(result.id).toBe("user.created")
      expect(result.schemaName).toBe("UserCreatedEvent")
      expect(result.description).toBe("User created event")
      expect(result.contentType).toBe("application/json")
      expect(isMessage(result)).toBe(true)
    })

    it("should reject invalid messages", async () => {
      const messageInput = {
        id: "invalid id with spaces", // invalid message ID
        schemaName: "TestMessage"
      }
      
      const result = await Effect.flip(createMessage(messageInput))
      
      expect(result._tag).toBe("Fail")
      expect(result.message).toContain("validation failed")
    })

    it("should validate message schema directly", () => {
      const validMessage = {
        id: "test.message",
        schemaName: "TestMessage"
      }
      
      const decodeResult = Schema.decodeSync(messageSchema)(validMessage)
      expect(decodeResult.id).toBe("test.message")
      expect(decodeResult.schemaName).toBe("TestMessage")
    })
  })

  describe("Operation Schema", () => {
    it("should create valid operations", async () => {
      const operationInput = {
        id: "publishUserEvent",
        type: "send" as const,
        description: "Publish user event operation"
      }
      
      const result = await Effect.runPromise(createOperation(operationInput))
      
      expect(result.id).toBe("publishUserEvent")
      expect(result.type).toBe("send")
      expect(result.description).toBe("Publish user event operation")
      expect(isOperation(result)).toBe(true)
    })

    it("should reject invalid operations", async () => {
      const operationInput = {
        id: "invalid operation", // invalid operation ID
        type: "invalid" as const // invalid operation type
      }
      
      const result = await Effect.flip(createOperation(operationInput))
      
      expect(result._tag).toBe("Fail")
      expect(result.message).toContain("validation failed")
    })

    it("should validate operation schema directly", () => {
      const validOperation = {
        id: "test.operation",
        type: "send" as const
      }
      
      const decodeResult = Schema.decodeSync(operationSchema)(validOperation)
      expect(decodeResult.id).toBe("test.operation")
      expect(decodeResult.type).toBe("send")
    })
  })

  describe("Server Schema", () => {
    it("should create valid servers", async () => {
      const serverInput = {
        url: "https://api.example.com",
        protocol: "https" as const,
        description: "Example API server"
      }
      
      const result = await Effect.runPromise(createServer(serverInput))
      
      expect(result.url).toBe("https://api.example.com")
      expect(result.protocol).toBe("https")
      expect(result.description).toBe("Example API server")
      expect(isServer(result)).toBe(true)
    })

    it("should reject invalid servers", async () => {
      const serverInput = {
        url: "invalid-url", // invalid URL
        protocol: "invalid" as const // invalid protocol
      }
      
      const result = await Effect.flip(createServer(serverInput))
      
      expect(result._tag).toBe("Fail")
      expect(result.message).toContain("validation failed")
    })

    it("should validate server schema directly", () => {
      const validServer = {
        url: "https://test.com",
        protocol: "ws" as const
      }
      
      const decodeResult = Schema.decodeSync(serverSchema)(validServer)
      expect(decodeResult.url).toBe("https://test.com")
      expect(decodeResult.protocol).toBe("ws")
    })
  })

  describe("AsyncAPI Spec Schema", () => {
    it("should create complete AsyncAPI specifications", async () => {
      const specInput = {
        asyncapi: "3.0.0" as const,
        info: {
          title: "Example API",
          version: "1.0.0",
          description: "Example AsyncAPI specification"
        }
      }
      
      const result = await Effect.runPromise(createAsyncAPISpec(specInput))
      
      expect(result.asyncapi).toBe("3.0.0")
      expect(result.info.title).toBe("Example API")
      expect(result.info.version).toBe("1.0.0")
      expect(result.info.description).toBe("Example AsyncAPI specification")
      expect(isAsyncAPISpec(result)).toBe(true)
    })

    it("should reject invalid AsyncAPI specifications", async () => {
      const specInput = {
        asyncapi: "2.0.0" as const, // invalid version
        info: {
          title: "", // empty title
          version: "1.0.0"
        }
      }
      
      const result = await Effect.flip(createAsyncAPISpec(specInput))
      
      expect(result._tag).toBe("Fail")
      expect(result.message).toContain("validation failed")
    })

    it("should validate AsyncAPI spec schema directly", () => {
      const validSpec = {
        asyncapi: "3.0.0" as const,
        info: {
          title: "Test API",
          version: "1.0.0"
        }
      }
      
      const decodeResult = Schema.decodeSync(asyncapiSchema)(validSpec)
      expect(decodeResult.asyncapi).toBe("3.0.0")
      expect(decodeResult.info.title).toBe("Test API")
      expect(decodeResult.info.version).toBe("1.0.0")
    })
  })

  describe("Collection Constructors", () => {
    it("should create channels collection", async () => {
      const channelsInput = {
        "/user/events": {
          path: "/user/events",
          description: "User events"
        },
        "/order/events": {
          path: "/order/events",
          description: "Order events"
        }
      }
      
      const result = await Effect.runPromise(createAsyncAPIChannels(channelsInput))
      
      expect(result["/user/events"]).toBeDefined()
      expect(result["/order/events"]).toBeDefined()
      expect(result["/user/events"].path).toBe("/user/events")
      expect(result["/order/events"].path).toBe("/order/events")
    })

    it("should create messages collection", async () => {
      const messagesInput = {
        "user.created": {
          id: "user.created",
          schemaName: "UserCreated"
        },
        "order.completed": {
          id: "order.completed",
          schemaName: "OrderCompleted"
        }
      }
      
      const result = await Effect.runPromise(createAsyncAPIMessages(messagesInput))
      
      expect(result["user.created"]).toBeDefined()
      expect(result["order.completed"]).toBeDefined()
      expect(result["user.created"].id).toBe("user.created")
      expect(result["order.completed"].id).toBe("order.completed")
    })

    it("should create operations collection", async () => {
      const operationsInput = {
        "publishUser": {
          id: "publishUser",
          type: "send" as const
        },
        "subscribeToEvents": {
          id: "subscribeToEvents",
          type: "receive" as const
        }
      }
      
      const result = await Effect.runPromise(createAsyncAPIOperations(operationsInput))
      
      expect(result["publishUser"]).toBeDefined()
      expect(result["subscribeToEvents"]).toBeDefined()
      expect(result["publishUser"].type).toBe("send")
      expect(result["subscribeToEvents"].type).toBe("receive")
    })

    it("should create servers collection", async () => {
      const serversInput = {
        "https://api.example.com": {
          url: "https://api.example.com",
          protocol: "https" as const
        },
        "wss://ws.example.com": {
          url: "wss://ws.example.com",
          protocol: "ws" as const
        }
      }
      
      const result = await Effect.runPromise(createAsyncAPIServers(serversInput))
      
      expect(result["https://api.example.com"]).toBeDefined()
      expect(result["wss://ws.example.com"]).toBeDefined()
      expect(result["https://api.example.com"].protocol).toBe("https")
      expect(result["wss://ws.example.com"].protocol).toBe("ws")
    })
  })

  describe("Schema Integration with Branded Types", () => {
    it("should work with branded channel paths", async () => {
      const channelPath = await Effect.runPromise(createChannelPath("/test/channel"))
      const channelInput = {
        path: channelPath
      }
      
      const result = await Effect.runPromise(createChannel(channelInput))
      expect(result.path).toBe("/test/channel")
    })

    it("should work with branded message IDs", async () => {
      const messageId = await Effect.runPromise(createMessageId("test.message"))
      const messageInput = {
        id: messageId,
        schemaName: "TestMessage"
      }
      
      const result = await Effect.runPromise(createMessage(messageInput))
      expect(result.id).toBe("test.message")
    })

    it("should work with branded operation IDs", async () => {
      const operationId = await Effect.runPromise(createOperationId("test.operation"))
      const operationInput = {
        id: operationId,
        type: "send" as const
      }
      
      const result = await Effect.runPromise(createOperation(operationInput))
      expect(result.id).toBe("test.operation")
    })

    it("should work with branded server URLs", async () => {
      const serverUrl = await Effect.runPromise(createServerUrl("https://example.com"))
      const serverInput = {
        url: serverUrl,
        protocol: "https" as const
      }
      
      const result = await Effect.runPromise(createServer(serverInput))
      expect(result.url).toBe("https://example.com")
    })
  })

  describe("Error Handling and Validation", () => {
    it("should provide detailed error messages", async () => {
      const invalidInput = { invalid: "data" }
      
      const channelResult = await Effect.flip(createChannel(invalidInput))
      const messageResult = await Effect.flip(createMessage(invalidInput))
      const operationResult = await Effect.flip(createOperation(invalidInput))
      const serverResult = await Effect.flip(createServer(invalidInput))
      
      expect(channelResult.message).toContain("validation failed")
      expect(messageResult.message).toContain("validation failed")
      expect(operationResult.message).toContain("validation failed")
      expect(serverResult.message).toContain("validation failed")
    })

    it("should handle missing optional fields gracefully", async () => {
      const minimalInput = {
        id: "test.id",
        schemaName: "TestSchema"
      }
      
      const result = await Effect.runPromise(createMessage(minimalInput))
      expect(result.id).toBe("test.id")
      expect(result.schemaName).toBe("TestSchema")
      expect(result.description).toBeUndefined()
      expect(result.contentType).toBeUndefined()
      expect(result.payload).toBeUndefined()
    })

    it("should validate protocol literals", async () => {
      const validProtocols = ["kafka", "mqtt", "amqp", "ws", "http"] as const
      const invalidProtocol = "invalid" as const
      
      for (const protocol of validProtocols) {
        const serverInput = {
          url: "https://example.com",
          protocol
        }
        const result = await Effect.runPromise(createServer(serverInput))
        expect(result.protocol).toBe(protocol)
      }
      
      const invalidServerInput = {
        url: "https://example.com",
        protocol: invalidProtocol
      }
      const invalidResult = await Effect.flip(createServer(invalidServerInput))
      expect(invalidResult.message).toContain("validation failed")
    })
  })

  describe("Type Guards", () => {
    it("should correctly identify valid domain objects", () => {
      const validChannel = {
        path: "/test/channel"
      }
      const validMessage = {
        id: "test.message",
        schemaName: "TestSchema"
      }
      const validOperation = {
        id: "test.operation",
        type: "send" as const
      }
      const validServer = {
        url: "https://example.com",
        protocol: "https" as const
      }
      const validSpec = {
        asyncapi: "3.0.0" as const,
        info: {
          title: "Test API",
          version: "1.0.0"
        }
      }
      
      expect(isChannel(validChannel)).toBe(true)
      expect(isMessage(validMessage)).toBe(true)
      expect(isOperation(validOperation)).toBe(true)
      expect(isServer(validServer)).toBe(true)
      expect(isAsyncAPISpec(validSpec)).toBe(true)
    })

    it("should correctly identify invalid domain objects", () => {
      const invalidChannel = { path: "invalid" }
      const invalidMessage = { id: "invalid id with spaces" }
      const invalidOperation = { id: "invalid", type: "invalid" }
      const invalidServer = { url: "invalid-url", protocol: "invalid" }
      const invalidSpec = { asyncapi: "2.0.0" as const }
      
      expect(isChannel(invalidChannel)).toBe(false)
      expect(isMessage(invalidMessage)).toBe(false)
      expect(isOperation(invalidOperation)).toBe(false)
      expect(isServer(invalidServer)).toBe(false)
      expect(isAsyncAPISpec(invalidSpec)).toBe(false)
    })
  })
})