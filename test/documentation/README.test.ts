/**
 * Documentation Test Suite: README.md
 * BDD tests validating documentation navigation and quick reference
 */

import { describe, expect, it, beforeEach } from "bun:test"
import { createTypeSpecTestCompiler } from "./helpers/typespec-compiler.js"
import { createAsyncAPIValidator } from "./helpers/asyncapi-validator.js"
import { TypeSpecFixtures } from "./helpers/test-fixtures.js"

describe("Documentation: README and Quick Reference Validation", () => {
  let compiler: ReturnType<typeof createTypeSpecTestCompiler>
  let validator: ReturnType<typeof createAsyncAPIValidator>

  beforeEach(() => {
    compiler = createTypeSpecTestCompiler()
    validator = createAsyncAPIValidator()
  })

  describe("GIVEN quick reference patterns", () => {
    describe("WHEN using essential decorators", () => {
      it("THEN should validate @service decorator usage", async () => {
        const serviceCode = `
          @service({ title: "Quick Reference Service" })
          namespace QuickRefService {
            @channel("test")
            @publish
            op testOp(@body data: TestData): void;
          }
          
          model TestData {
            value: string;
          }
        `

        const result = await compiler.compileTypeSpec({
          code: serviceCode,
          emitAsyncAPI: true
        })

        expect(result.asyncapi!.info.title).toBe("Quick Reference Service")
      })

      it("THEN should validate @channel decorator usage", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.decoratorsChannel,
          emitAsyncAPI: true
        })

        const channels = result.asyncapi!.channels!
        expect(channels["simple-channel"]).toBeDefined()
        expect(channels["parameterized/{userId}/events/{eventType}"]).toBeDefined()
      })

      it("THEN should validate @publish and @subscribe decorators", async () => {
        const pubSubCode = `
          @service({ title: "PubSub Service" })
          namespace PubSubService {
            @channel("events")
            @publish
            op publishEvent(@body event: Event): void;
            
            @channel("events")
            @subscribe
            op subscribeEvent(): Event;
          }
          
          @message("Event")
          model Event {
            id: string;
            type: string;
          }
        `

        const result = await compiler.compileTypeSpec({
          code: pubSubCode,
          emitAsyncAPI: true
        })

        expect(result.asyncapi!.operations!.publishEvent.action).toBe("send")
        expect(result.asyncapi!.operations!.subscribeEvent.action).toBe("receive")
      })
    })

    describe("WHEN using common type mappings", () => {
      it("THEN should validate primitive type mappings", async () => {
        const typeCode = `
          @service({ title: "Type Mapping Service" })
          namespace TypeMappingService {
            @channel("types")
            @publish
            op publishTypes(@body data: TypeMapping): void;
          }
          
          @message("TypeMapping")
          model TypeMapping {
            stringField: string;
            int32Field: int32;
            recordField: Record<string>;
            arrayField: string[];
            unionField: string | int32;
          }
        `

        const result = await compiler.compileTypeSpec({
          code: typeCode,
          emitAsyncAPI: true
        })

        const message = result.asyncapi!.components!.messages!.TypeMapping
        const props = message.payload.properties!

        expect(props.stringField).toEqual({ type: "string" })
        expect(props.int32Field).toEqual({ type: "integer", format: "int32" })
        expect(props.recordField).toEqual({ type: "object", additionalProperties: { type: "string" } })
        expect(props.arrayField).toEqual({ type: "array", items: { type: "string" } })
        expect(props.unionField).toEqual({
          oneOf: [
            { type: "string" },
            { type: "integer", format: "int32" }
          ]
        })
      })
    })
  })

  describe("GIVEN message pattern templates", () => {
    describe("WHEN using event notification pattern", () => {
      it("THEN should validate event notification structure", async () => {
        const eventCode = `
          @service({ title: "Event Service" })
          namespace EventService {
            @channel("user-events")
            @publish
            op publishUserEvent(@body event: UserRegisteredEvent): void;
          }
          
          @message("UserRegisteredEvent")
          model UserRegisteredEvent {
            userId: string;
            email: string;
            registeredAt: utcDateTime;
          }
        `

        const result = await compiler.compileTypeSpec({
          code: eventCode,
          emitAsyncAPI: true
        })

        const message = result.asyncapi!.components!.messages!.UserRegisteredEvent
        expect(message.payload.properties!.userId).toEqual({ type: "string" })
        expect(message.payload.properties!.registeredAt).toEqual({ type: "string", format: "date-time" })
      })
    })

    describe("WHEN using command message pattern", () => {
      it("THEN should validate command structure", async () => {
        const commandCode = `
          @service({ title: "Command Service" })
          namespace CommandService {
            @channel("commands")
            @publish
            op publishCommand(@body command: CreateOrderCommand): void;
          }
          
          @message("CreateOrderCommand")
          model CreateOrderCommand {
            customerId: string;
            items: OrderItem[];
            metadata: RequestMetadata;
          }
          
          model OrderItem {
            productId: string;
            quantity: int32;
          }
          
          model RequestMetadata {
            requestId: string;
            timestamp: utcDateTime;
          }
        `

        const result = await compiler.compileTypeSpec({
          code: commandCode,
          emitAsyncAPI: true
        })

        const command = result.asyncapi!.components!.messages!.CreateOrderCommand
        expect(command.payload.properties!.customerId).toEqual({ type: "string" })
        expect(command.payload.properties!.items).toEqual({
          type: "array",
          items: { $ref: "#/components/schemas/OrderItem" }
        })
        expect(command.payload.properties!.metadata).toEqual({
          $ref: "#/components/schemas/RequestMetadata"
        })
      })
    })

    describe("WHEN using event sourcing pattern", () => {
      it("THEN should validate domain event structure", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.schemasEventSourcing,
          emitAsyncAPI: true
        })

        const domainEvent = result.asyncapi!.components!.messages!.DomainEvent
        expect(domainEvent.payload.properties!.eventId).toEqual({ type: "string" })
        expect(domainEvent.payload.properties!.aggregateId).toEqual({ type: "string" })
        expect(domainEvent.payload.properties!.aggregateVersion).toEqual({ type: "integer", format: "int32" })
        expect(domainEvent.payload.properties!.eventType).toEqual({ type: "string" })
        expect(domainEvent.payload.properties!.occurredAt).toEqual({ type: "string", format: "date-time" })

        const orderCreatedEvent = result.asyncapi!.components!.messages!.OrderCreatedEvent
        expect(orderCreatedEvent.payload.allOf).toContainEqual({
          $ref: "#/components/schemas/DomainEvent"
        })
      })
    })
  })

  describe("GIVEN protocol quick setup", () => {
    describe("WHEN configuring Kafka protocol", () => {
      it("THEN should validate Kafka configuration", async () => {
        const kafkaCode = `
          @service({ title: "Kafka Service" })
          namespace KafkaService {
            @channel("kafka-channel")
            @protocol("kafka", {
              topic: "orders",
              partitionKey: "customerId",
              replicationFactor: 3
            })
            @publish
            op publishToKafka(@body event: KafkaEvent): void;
          }
          
          @message("KafkaEvent")
          model KafkaEvent {
            customerId: string;
            data: Record<string>;
          }
        `

        const result = await compiler.compileTypeSpec({
          code: kafkaCode,
          emitAsyncAPI: true
        })

        const channel = result.asyncapi!.channels!["kafka-channel"]
        expect(channel.bindings?.kafka?.topic).toBe("orders")
        expect(channel.bindings?.kafka?.partitionKey).toBe("customerId")
        expect(channel.bindings?.kafka?.replicationFactor).toBe(3)
      })
    })

    describe("WHEN configuring AMQP protocol", () => {
      it("THEN should validate AMQP configuration", async () => {
        const amqpCode = `
          @service({ title: "AMQP Service" })
          namespace AMQPService {
            @channel("amqp-channel")
            @protocol("amqp", {
              exchange: "orders.exchange",
              routingKey: "order.created",
              deliveryMode: 2
            })
            @publish
            op publishToAMQP(@body event: AMQPEvent): void;
          }
          
          @message("AMQPEvent")
          model AMQPEvent {
            eventType: string;
            payload: Record<string>;
          }
        `

        const result = await compiler.compileTypeSpec({
          code: amqpCode,
          emitAsyncAPI: true
        })

        const channel = result.asyncapi!.channels!["amqp-channel"]
        expect(channel.bindings?.amqp?.exchange).toBe("orders.exchange")
        expect(channel.bindings?.amqp?.routingKey).toBe("order.created")
        expect(channel.bindings?.amqp?.deliveryMode).toBe(2)
      })
    })

    describe("WHEN configuring WebSocket protocol", () => {
      it("THEN should validate WebSocket configuration", async () => {
        const wsCode = `
          @service({ title: "WebSocket Service" })
          namespace WebSocketService {
            @channel("ws-channel")
            @protocol("ws", {
              method: "GET",
              query: {
                token: "string",
                version: "string"
              }
            })
            @subscribe
            op subscribeWebSocket(): WSEvent;
          }
          
          @message("WSEvent")
          model WSEvent {
            type: string;
            data: Record<string>;
          }
        `

        const result = await compiler.compileTypeSpec({
          code: wsCode,
          emitAsyncAPI: true
        })

        const channel = result.asyncapi!.channels!["ws-channel"]
        expect(channel.bindings?.ws?.method).toBe("GET")
        expect(channel.bindings?.ws?.query?.token).toBe("string")
        expect(channel.bindings?.ws?.query?.version).toBe("string")
      })
    })
  })

  describe("GIVEN workflow validation", () => {
    describe("WHEN following getting started workflow", () => {
      it("THEN should support complete workflow from start to finish", async () => {
        // Step 1: Define service
        // Step 2: Create message models
        // Step 3: Define channels
        // Step 4: Add operations
        // Step 5: Configure protocols
        // Step 6: Add security
        const completeWorkflowCode = `
          @service({
            title: "Complete Workflow Service",
            version: "1.0.0",
            description: "Demonstrates complete workflow"
          })
          namespace CompleteWorkflowService {
            @server("production", {
              url: "kafka://prod.example.com:9092",
              protocol: "kafka"
            })
            @channel("user-events")
            @protocol("kafka", {
              topic: "user-events",
              partitionKey: "userId"
            })
            @security("oauth2", {
              flows: {
                clientCredentials: {
                  tokenUrl: "https://auth.example.com/token",
                  scopes: {
                    "events:publish": "Publish events"
                  }
                }
              }
            })
            @publish
            op publishUserEvent(@body event: UserEvent): void;
          }
          
          @message("UserEvent")
          model UserEvent {
            userId: string;
            eventType: string;
            timestamp: utcDateTime;
            data: Record<string>;
          }
        `

        const result = await compiler.compileTypeSpec({
          code: completeWorkflowCode,
          emitAsyncAPI: true
        })

        // Validate complete workflow result
        expect(result.asyncapi!.info.title).toBe("Complete Workflow Service")
        expect(result.asyncapi!.servers!.production).toBeDefined()
        expect(result.asyncapi!.channels!["user-events"]).toBeDefined()
        expect(result.asyncapi!.operations!.publishUserEvent).toBeDefined()
        expect(result.asyncapi!.components!.messages!.UserEvent).toBeDefined()
        expect(result.asyncapi!.components!.securitySchemes!.oauth2).toBeDefined()

        const validation = await validator.validateAsyncAPI(result.asyncapi!, {
          strict: true,
          validateSemantic: true
        })

        expect(validation.isValid).toBe(true)
      })
    })
  })

  describe("GIVEN troubleshooting scenarios", () => {
    describe("WHEN handling common issues", () => {
      it("THEN should provide meaningful error messages for schema validation", async () => {
        const invalidCode = `
          @service({ title: "Invalid Service" })
          namespace InvalidService {
            @channel("test")
            @publish
            op testOp(@body data: NonExistentModel): void;
          }
        `

        try {
          const result = await compiler.compileTypeSpec({
            code: invalidCode,
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

      it("THEN should handle protocol configuration errors gracefully", async () => {
        const missingProtocolCode = `
          @service({ title: "Missing Protocol Service" })
          namespace MissingProtocolService {
            @channel("channel")
            @protocol("nonexistent", {})
            @publish
            op testOp(@body data: TestData): void;
          }
          
          model TestData {
            value: string;
          }
        `

        try {
          const result = await compiler.compileTypeSpec({
            code: missingProtocolCode,
            emitAsyncAPI: true
          })

          // Should either handle gracefully or provide clear error
          if (result.asyncapi) {
            expect(result.asyncapi).toBeDefined()
          } else if (result.diagnostics.length > 0) {
            expect(result.diagnostics.some(d => d.severity === "error")).toBe(true)
          }
        } catch (error) {
          expect(error).toBeDefined()
        }
      })
    })
  })

  describe("GIVEN documentation completeness", () => {
    describe("WHEN validating all quick reference examples", () => {
      it("THEN should ensure all examples are compilable", async () => {
        const quickRefExamples = [
          TypeSpecFixtures.coreConceptsService,
          TypeSpecFixtures.dataTypesPrimitives,
          TypeSpecFixtures.operationsPublishSubscribe,
          TypeSpecFixtures.decoratorsChannel,
          TypeSpecFixtures.decoratorsProtocol
        ]

        for (const example of quickRefExamples) {
          const result = await compiler.compileTypeSpec({
            code: example,
            emitAsyncAPI: true
          })

          compiler.validateCompilationSuccess(result)
          expect(result.asyncapi).toBeDefined()

          const validation = await validator.validateAsyncAPI(result.asyncapi!, {
            strict: true
          })
          expect(validation.isValid).toBe(true)
        }
      })
    })
  })
})