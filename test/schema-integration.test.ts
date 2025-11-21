import { describe, it, expect } from "bun:test"
import { Effect } from "effect"
import { 
  createChannelPath, 
  createMessageId, 
  createSchemaName, 
  createOperationId, 
  createServerUrl,
  isChannelPath,
  isMessageId,
  isSchemaName,
  isOperationId,
  isServerUrl
} from "../src/types/domain/asyncapi-branded-types.js"

describe("Schema Integration Tests", () => {
  
  describe("Channel Path Schema", () => {
    it("should create valid channel paths", async () => {
      const result = await Effect.runPromise(createChannelPath("/user/events"))
      expect(result).toBe("/user/events")
    })

    it("should reject invalid channel paths", async () => {
      const result = await Effect.runPromise(
        Effect.flip(createChannelPath("user/events")) // missing leading slash
      )
      expect(result).toBeInstanceOf(Error)
    })

    it("should reject empty channel paths", async () => {
      const result = await Effect.runPromise(
        Effect.flip(createChannelPath(""))
      )
      expect(result).toBeInstanceOf(Error)
    })
  })

  describe("Message ID Schema", () => {
    it("should create valid message IDs", async () => {
      const result = await Effect.runPromise(createMessageId("user.created"))
      expect(result).toBe("user.created")
    })

    it("should reject message IDs with invalid characters", async () => {
      const result = await Effect.runPromise(
        Effect.flip(createMessageId("user created")) // contains space
      )
      expect(result).toBeInstanceOf(Error)
    })
  })

  describe("Schema Name Schema", () => {
    it("should create valid schema names", async () => {
      const result = await Effect.runPromise(createSchemaName("UserEvent"))
      expect(result).toBe("UserEvent")
    })
  })

  describe("Operation ID Schema", () => {
    it("should create valid operation IDs", async () => {
      const result = await Effect.runPromise(createOperationId("publishUserEvent"))
      expect(result).toBe("publishUserEvent")
    })
  })

  describe("Server URL Schema", () => {
    it("should create valid server URLs", async () => {
      const result = await Effect.runPromise(createServerUrl("https://api.example.com"))
      expect(result).toBe("https://api.example.com")
    })

    it("should reject invalid server URLs", async () => {
      const result = await Effect.runPromise(
        Effect.flip(createServerUrl("not-a-url"))
      )
      expect(result).toBeInstanceOf(Error)
    })
  })

  describe("Schema Type Guards", () => {
    it("should correctly identify valid branded types", () => {
      expect(isChannelPath("/user/events")).toBe(true)
      expect(isMessageId("valid.id")).toBe(true)
      expect(isSchemaName("ValidSchema")).toBe(true)
      expect(isOperationId("validOperation")).toBe(true)
      expect(isServerUrl("https://example.com")).toBe(true)
    })

    it("should correctly identify invalid values", () => {
      expect(isChannelPath("user/events")).toBe(false) // missing /
      expect(isMessageId("invalid id")).toBe(false) // contains space
      expect(isSchemaName("")).toBe(false) // empty
      expect(isOperationId("")).toBe(false) // empty
      expect(isServerUrl("not-a-url")).toBe(false) // invalid URL
      expect(isServerUrl("")).toBe(false) // empty
    })
  })

})