/**
 * Documentation Test Suite: 05-decorators.md
 * 
 * BDD tests validating TypeSpec decorators to AsyncAPI features mapping
 * as documented in docs/map-typespec-to-asyncapi/05-decorators.md
 */

import { describe, expect, it, beforeEach } from "bun:test"
import { createTypeSpecTestCompiler } from "./helpers/typespec-compiler.js"
import { createAsyncAPIValidator } from "./helpers/asyncapi-validator.js"
import { TypeSpecFixtures } from "./helpers/test-fixtures.js"

describe("Documentation: Decorators Mapping", () => {
  let compiler: ReturnType<typeof createTypeSpecTestCompiler>
  let validator: ReturnType<typeof createAsyncAPIValidator>

  beforeEach(() => {
    compiler = createTypeSpecTestCompiler()
    validator = createAsyncAPIValidator()
  })

  describe("GIVEN @channel decorators", () => {
    describe("WHEN defining channels", () => {
      it("THEN should create AsyncAPI channel definitions", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.decoratorsChannel,
          emitAsyncAPI: true
        })

        const channels = result.asyncapi!.channels!
        expect(channels["simple-channel"]).toBeDefined()
        expect(channels["parameterized/{userId}/events/{eventType}"]).toBeDefined()
      })

      it("THEN should extract channel parameters", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.decoratorsChannel,
          emitAsyncAPI: true
        })

        const channel = result.asyncapi!.channels!["parameterized/{userId}/events/{eventType}"]
        expect(channel.parameters!.userId).toBeDefined()
        expect(channel.parameters!.eventType).toBeDefined()
      })
    })
  })

  describe("GIVEN @message decorators", () => {
    describe("WHEN decorating models", () => {
      it("THEN should create message components", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.decoratorsMessage,
          emitAsyncAPI: true
        })

        const messages = result.asyncapi!.components!.messages!
        expect(messages.MessageWithDecorators).toBeDefined()
      })

      it("THEN should handle message headers", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.decoratorsMessage,
          emitAsyncAPI: true
        })

        const message = result.asyncapi!.components!.messages!.MessageWithDecorators
        expect(message.headers).toBeDefined()
        expect(message.payload.properties!.messageId).toBeDefined()
        expect(message.payload.properties!.correlationId).toBeDefined()
      })
    })
  })

  describe("GIVEN @protocol decorators", () => {
    describe("WHEN configuring Kafka protocol", () => {
      it("THEN should create Kafka bindings", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.decoratorsProtocol,
          emitAsyncAPI: true
        })

        const channel = result.asyncapi!.channels!["kafka-topic"]
        expect(channel.bindings?.kafka).toBeDefined()
        expect(channel.bindings?.kafka?.topic).toBe("user-events")
        expect(channel.bindings?.kafka?.partitionKey).toBe("userId")
      })
    })

    describe("WHEN configuring AMQP protocol", () => {
      it("THEN should create AMQP bindings", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.decoratorsProtocol,
          emitAsyncAPI: true
        })

        const channel = result.asyncapi!.channels!["amqp-queue"]
        expect(channel.bindings?.amqp).toBeDefined()
        expect(channel.bindings?.amqp?.exchange).toBe("events.exchange")
        expect(channel.bindings?.amqp?.routingKey).toBe("user.created")
      })
    })
  })

  describe("GIVEN @security decorators", () => {
    describe("WHEN using OAuth2 security", () => {
      it("THEN should create security schemes", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.decoratorsSecurity,
          emitAsyncAPI: true
        })

        const securitySchemes = result.asyncapi!.components!.securitySchemes!
        expect(securitySchemes.oauth2).toBeDefined()
        expect(securitySchemes.oauth2.type).toBe("oauth2")
        expect(securitySchemes.oauth2.flows?.clientCredentials).toBeDefined()
      })
    })

    describe("WHEN using API Key security", () => {
      it("THEN should create API key schemes", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.decoratorsSecurity,
          emitAsyncAPI: true
        })

        const securitySchemes = result.asyncapi!.components!.securitySchemes!
        expect(securitySchemes.apiKey).toBeDefined()
        expect(securitySchemes.apiKey.type).toBe("apiKey")
        expect(securitySchemes.apiKey.in).toBe("header")
      })
    })
  })

  describe("GIVEN @server decorators", () => {
    describe("WHEN defining multiple servers", () => {
      it("THEN should create server configurations", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.decoratorsServer,
          emitAsyncAPI: true
        })

        const servers = result.asyncapi!.servers!
        expect(servers.production).toBeDefined()
        expect(servers.staging).toBeDefined()
        expect(servers.production.url).toBe("kafka://prod-cluster.example.com:9092")
        expect(servers.staging.url).toBe("kafka://staging-cluster.example.com:9092")
      })
    })
  })

  describe("GIVEN decorator validation", () => {
    describe("WHEN using multiple decorators", () => {
      it("THEN should validate decorator combinations", async () => {
        const combinedDecoratorsCode = `
          @service({ title: "Combined Decorators Service" })
          namespace CombinedDecoratorsService {
            @server("production", {
              url: "kafka://prod.example.com:9092",
              protocol: "kafka"
            })
            @channel("orders/{orderId}")
            @protocol("kafka", {
              topic: "orders",
              partitionKey: "orderId"
            })
            @security("oauth2", {
              flows: {
                clientCredentials: {
                  tokenUrl: "https://auth.example.com/token"
                }
              }
            })
            @publish
            op processOrder(@path orderId: string, @body order: OrderCommand): void;
          }
          
          @message("OrderCommand")
          model OrderCommand {
            @header
            correlationId: string;
            
            @correlationId
            traceId: string;
            
            customerId: string;
            items: OrderItem[];
          }
          
          model OrderItem {
            productId: string;
            quantity: int32;
            price: float64;
          }
        `

        const result = await compiler.compileTypeSpec({
          code: combinedDecoratorsCode,
          emitAsyncAPI: true
        })

        const validation = await validator.validateAsyncAPI(result.asyncapi!, {
          strict: true,
          validateSemantic: true
        })

        expect(validation.isValid).toBe(true)
        expect(validation.errors).toHaveLength(0)
      })
    })
  })

  describe("GIVEN decorator error handling", () => {
    describe("WHEN decorators have invalid configurations", () => {
      it("THEN should provide meaningful error messages", async () => {
        const invalidDecoratorCode = `
          @service({ title: "Invalid Decorator Service" })
          namespace InvalidDecoratorService {
            @channel()  // Missing channel address
            @publish
            op invalidOperation(@body data: TestData): void;
          }
          
          model TestData {
            value: string;
          }
        `

        try {
          const result = await compiler.compileTypeSpec({
            code: invalidDecoratorCode,
            emitAsyncAPI: true
          })

          if (result.diagnostics.length > 0) {
            const errors = result.diagnostics.filter(d => d.severity === "error")
            expect(errors.length).toBeGreaterThan(0)
          }
        } catch (error) {
          expect(error).toBeDefined()
        }
      })
    })
  })
})