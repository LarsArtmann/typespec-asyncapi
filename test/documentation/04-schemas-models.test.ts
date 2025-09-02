/**
 * Documentation Test Suite: 04-schemas-models.md
 * 
 * BDD tests validating TypeSpec schema and model transformations to AsyncAPI
 * as documented in docs/map-typespec-to-asyncapi/04-schemas-models.md
 */

import { describe, expect, it, beforeEach } from "bun:test"
import { createTypeSpecTestCompiler } from "./helpers/typespec-compiler.js"
import { createAsyncAPIValidator } from "./helpers/asyncapi-validator.js"
import { TypeSpecFixtures } from "./helpers/test-fixtures.js"

describe("Documentation: Schema and Models Mapping", () => {
  let compiler: ReturnType<typeof createTypeSpecTestCompiler>
  let validator: ReturnType<typeof createAsyncAPIValidator>

  beforeEach(() => {
    compiler = createTypeSpecTestCompiler()
    validator = createAsyncAPIValidator()
  })

  describe("GIVEN event sourcing patterns", () => {
    describe("WHEN using domain events", () => {
      it("THEN should create proper event schemas", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.schemasEventSourcing,
          emitAsyncAPI: true
        })

        const messages = result.asyncapi!.components!.messages!
        expect(messages.DomainEvent).toBeDefined()
        expect(messages.OrderCreatedEvent).toBeDefined()
        expect(messages.OrderCancelledEvent).toBeDefined()

        const domainEvent = messages.DomainEvent.payload
        expect(domainEvent.properties!.eventId).toEqual({ type: "string" })
        expect(domainEvent.properties!.aggregateId).toEqual({ type: "string" })
        expect(domainEvent.properties!.aggregateVersion).toEqual({ type: "integer", format: "int32" })
      })
    })

    describe("WHEN using event inheritance", () => {
      it("THEN should handle extends relationships with allOf", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.schemasEventSourcing,
          emitAsyncAPI: true
        })

        const orderCreatedEvent = result.asyncapi!.components!.messages!.OrderCreatedEvent.payload
        expect(orderCreatedEvent.allOf).toBeDefined()
        expect(orderCreatedEvent.allOf).toContainEqual({
          $ref: "#/components/schemas/DomainEvent"
        })
      })
    })
  })

  describe("GIVEN schema versioning", () => {
    describe("WHEN handling multiple schema versions", () => {
      it("THEN should maintain version-specific schemas", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.schemasVersioning,
          emitAsyncAPI: true
        })

        const messages = result.asyncapi!.components!.messages!
        expect(messages.UserEventV1).toBeDefined()
        expect(messages.UserEventV2).toBeDefined()

        const v1Schema = messages.UserEventV1.payload
        const v2Schema = messages.UserEventV2.payload

        expect(v1Schema.properties!.schemaVersion).toEqual({ type: "string", enum: ["1.0"] })
        expect(v2Schema.properties!.schemaVersion).toEqual({ type: "string", enum: ["2.0"] })
        expect(v2Schema.properties!.metadata).toBeDefined()
      })
    })
  })

  describe("GIVEN message envelope patterns", () => {
    describe("WHEN using message headers", () => {
      it("THEN should structure message envelopes properly", async () => {
        const envelopeCode = `
          @service({ title: "Message Envelope Service" })
          namespace MessageEnvelopeService {
            @channel("enveloped-messages")
            @publish
            op publishEnveloped(@body message: EnvelopedMessage): void;
          }
          
          @message("EnvelopedMessage")
          model EnvelopedMessage {
            @header
            messageId: string;
            
            @header
            timestamp: utcDateTime;
            
            @header
            source: string;
            
            payload: MessagePayload;
          }
          
          model MessagePayload {
            data: string;
            metadata: Record<string>;
          }
        `

        const result = await compiler.compileTypeSpec({
          code: envelopeCode,
          emitAsyncAPI: true
        })

        const message = result.asyncapi!.components!.messages!.EnvelopedMessage
        expect(message.payload.properties!.payload).toBeDefined()
        expect(message.headers).toBeDefined()
      })
    })
  })

  describe("GIVEN schema composition", () => {
    describe("WHEN using model spreading", () => {
      it("THEN should compose schemas correctly", async () => {
        const compositionCode = `
          @service({ title: "Schema Composition Service" })
          namespace SchemaCompositionService {
            @channel("composed")
            @publish
            op publishComposed(@body data: ComposedSchema): void;
          }
          
          model AuditFields {
            createdBy: string;
            createdAt: utcDateTime;
            updatedBy?: string;
            updatedAt?: utcDateTime;
          }
          
          model BaseEntity {
            id: string;
            version: int32;
          }
          
          @message("ComposedSchema")
          model ComposedSchema {
            ...BaseEntity;
            ...AuditFields;
            name: string;
            description?: string;
          }
        `

        const result = await compiler.compileTypeSpec({
          code: compositionCode,
          emitAsyncAPI: true
        })

        const message = result.asyncapi!.components!.messages!.ComposedSchema
        const props = message.payload.properties!

        expect(props.id).toEqual({ type: "string" })
        expect(props.version).toEqual({ type: "integer", format: "int32" })
        expect(props.createdBy).toEqual({ type: "string" })
        expect(props.createdAt).toEqual({ type: "string", format: "date-time" })
        expect(props.name).toEqual({ type: "string" })
      })
    })
  })

  describe("GIVEN polymorphic schemas", () => {
    describe("WHEN using discriminated unions", () => {
      it("THEN should create proper discriminator schemas", async () => {
        const polymorphicCode = `
          @service({ title: "Polymorphic Service" })
          namespace PolymorphicService {
            @channel("polymorphic")
            @publish
            op publishPolymorphic(@body event: BaseEvent): void;
          }
          
          @discriminator("eventType")
          @message("BaseEvent")
          union BaseEvent {
            user: UserEvent,
            order: OrderEvent,
            system: SystemEvent,
          }
          
          model UserEvent {
            eventType: "user";
            userId: string;
            action: string;
          }
          
          model OrderEvent {
            eventType: "order";
            orderId: string;
            status: string;
          }
          
          model SystemEvent {
            eventType: "system";
            component: string;
            level: "info" | "warning" | "error";
          }
        `

        const result = await compiler.compileTypeSpec({
          code: polymorphicCode,
          emitAsyncAPI: true
        })

        const message = result.asyncapi!.components!.messages!.BaseEvent
        expect(message.payload.discriminator).toBeDefined()
        expect(message.payload.discriminator.propertyName).toBe("eventType")
        expect(message.payload.oneOf).toHaveLength(3)
      })
    })
  })
})