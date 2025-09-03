/**
 * Documentation Test Suite: 03-operations-channels.md
 * 
 * BDD tests validating TypeSpec operations to AsyncAPI channels and operations mapping
 * as documented in docs/map-typespec-to-asyncapi/03-operations-channels.md
 */

import { describe, expect, it, beforeEach } from "bun:test"
import { createTypeSpecTestCompiler } from "./helpers/typespec-compiler.js"
import { createAsyncAPIValidator } from "./helpers/asyncapi-validator.js"
import { TypeSpecFixtures } from "./helpers/test-fixtures.js"

describe("Documentation: Operations and Channels Mapping", () => {
  let compiler: ReturnType<typeof createTypeSpecTestCompiler>
  let validator: ReturnType<typeof createAsyncAPIValidator>

  beforeEach(() => {
    compiler = createTypeSpecTestCompiler()
    validator = createAsyncAPIValidator()
  })

  describe("GIVEN TypeSpec publish operations", () => {
    describe("WHEN using @publish decorator", () => {
      it("THEN should create AsyncAPI 'send' operations", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.operationsPublishSubscribe,
          emitAsyncAPI: true
        })

        const operations = result.asyncapi!.operations!
        expect(operations.publishUserEvent.action).toBe("send")
        expect(operations.publishOrderUpdate.action).toBe("send")
      })

      it("THEN should link to correct channel references", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.operationsPublishSubscribe,
          emitAsyncAPI: true
        })

        const operation = result.asyncapi!.operations!.publishUserEvent
        expect(operation.channel?.$ref).toContain("#/channels/")
      })
    })
  })

  describe("GIVEN TypeSpec subscribe operations", () => {
    describe("WHEN using @subscribe decorator", () => {
      it("THEN should create AsyncAPI 'receive' operations", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.operationsPublishSubscribe,
          emitAsyncAPI: true
        })

        const operations = result.asyncapi!.operations!
        expect(operations.subscribeToUserEvents.action).toBe("receive")
        expect(operations.subscribeToOrderUpdates.action).toBe("receive")
      })
    })
  })

  describe("GIVEN channel parameters", () => {
    describe("WHEN channels have path parameters", () => {
      it("THEN should extract parameters from channel addresses", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.operationsPublishSubscribe,
          emitAsyncAPI: true
        })

        const channels = result.asyncapi!.channels!
        const paramChannel = channels["orders/{orderId}/updates"]
        expect(paramChannel.parameters!.orderId).toBeDefined()
        expect(paramChannel.parameters!.orderId.schema.type).toBe("string")
      })
    })
  })

  describe("GIVEN request-reply patterns", () => {
    describe("WHEN using correlation IDs", () => {
      it("THEN should handle request-reply messaging", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.operationsRequestReply,
          emitAsyncAPI: true
        })

        const schemas = result.asyncapi!.components!.schemas!
        expect(schemas.OrderValidationRequest.properties!.correlationId).toBeDefined()
        expect(schemas.OrderValidationResponse.properties!.correlationId).toBeDefined()
      })
    })
  })

  describe("GIVEN message validation", () => {
    describe("WHEN operations reference messages", () => {
      it("THEN should validate referential integrity", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.operationsPublishSubscribe,
          emitAsyncAPI: true
        })

        const validation = await validator.validateAsyncAPI(result.asyncapi!, {
          validateSemantic: true
        })

        expect(validation.isValid).toBe(true)
      })
    })
  })

  // Continue with additional comprehensive tests...
  describe("GIVEN complex channel scenarios", () => {
    describe("WHEN channels have multiple operations", () => {
      it("THEN should support bidirectional channels", async () => {
        const bidirectionalCode = `
          @service({ title: "Bidirectional Service" })
          namespace BidirectionalService {
            @channel("chat/{roomId}")
            @publish
            op sendMessage(@path roomId: string, @body message: ChatMessage): void;
            
            @channel("chat/{roomId}")
            @subscribe
            op receiveMessage(@path roomId: string): ChatMessage;
          }
          
          @message("ChatMessage")
          model ChatMessage {
            messageId: string;
            content: string;
            timestamp: utcDateTime;
          }
        `

        const result = await compiler.compileTypeSpec({
          code: bidirectionalCode,
          emitAsyncAPI: true
        })

        expect(Object.keys(result.asyncapi!.operations!)).toHaveLength(2)
        expect(result.asyncapi!.operations!.sendMessage.action).toBe("send")
        expect(result.asyncapi!.operations!.receiveMessage.action).toBe("receive")
      })
    })
  })
})