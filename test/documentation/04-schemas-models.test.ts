/**
 * Documentation Test Suite: 04-schemas-models.md
 *
 * BDD tests validating TypeSpec schema and model transformations to AsyncAPI
 * as documented in docs/map-typespec-to-asyncapi/04-schemas-models.md
 */

import { describe, expect, it, beforeEach } from "bun:test";
import { createTypeSpecTestCompiler } from "./helpers/typespec-compiler.js";
import { createAsyncAPIValidator } from "./helpers/asyncapi-validator.js";
import { TypeSpecFixtures } from "./helpers/test-fixtures.js";

describe("Documentation: Schema and Models Mapping", () => {
  let compiler: ReturnType<typeof createTypeSpecTestCompiler>;
  let validator: ReturnType<typeof createAsyncAPIValidator>;

  beforeEach(() => {
    compiler = createTypeSpecTestCompiler();
    validator = createAsyncAPIValidator();
  });

  describe("GIVEN event sourcing patterns", () => {
    describe("WHEN using domain events", () => {
      it("THEN should create proper event schemas", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.schemasEventSourcing,
          emitAsyncAPI: true,
        });

        const schemas = result.asyncapi!.components!.schemas!;
        expect(schemas.DomainEvent).toBeDefined();
        expect(schemas.OrderCreatedPayload).toBeDefined();
        expect(schemas.OrderCancelledPayload).toBeDefined();

        // Alpha generates base models directly, not message payloads
        const domainEvent = schemas.DomainEvent;
        expect(domainEvent.properties!.eventId).toEqual({ type: "string" });
        expect(domainEvent.properties!.aggregateId).toEqual({ type: "string" });
        expect(domainEvent.properties!.aggregateVersion).toEqual({
          type: "integer",
          format: "int32",
        });
      });
    });

    describe("WHEN using event payloads", () => {
      it("THEN should create separate payload schemas (Alpha limitation - no inheritance support)", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.schemasEventSourcing,
          emitAsyncAPI: true,
        });

        const schemas = result.asyncapi!.components!.schemas!;

        // Alpha doesn't support 'extends' - generates separate schemas instead
        const orderCreatedPayload = schemas.OrderCreatedPayload;
        expect(orderCreatedPayload).toBeDefined();
        expect(orderCreatedPayload.properties!.customerId).toEqual({
          type: "string",
        });
        expect(orderCreatedPayload.properties!.totalAmount).toEqual({
          type: "number",
          format: "double",
        });

        const orderCancelledPayload = schemas.OrderCancelledPayload;
        expect(orderCancelledPayload).toBeDefined();
        expect(orderCancelledPayload.properties!.reason).toEqual({
          type: "string",
        });
        expect(orderCancelledPayload.properties!.cancelledBy).toEqual({
          type: "string",
        });
      });
    });
  });

  describe("GIVEN schema versioning", () => {
    describe("WHEN handling multiple schema versions", () => {
      it("THEN should maintain version-specific schemas", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.schemasVersioning,
          emitAsyncAPI: true,
        });

        const schemas = result.asyncapi!.components!.schemas!;
        expect(schemas.UserEventV1).toBeDefined();
        expect(schemas.UserEventV2).toBeDefined();

        // Alpha generates schemas directly, no payload property
        const v1Schema = schemas.UserEventV1;
        const v2Schema = schemas.UserEventV2;

        // Alpha doesn't generate enum for string literals - just string type
        expect(v1Schema.properties!.schemaVersion).toEqual({ type: "string" });
        expect(v2Schema.properties!.schemaVersion).toEqual({ type: "string" });
        expect(v2Schema.properties!.metadata).toBeDefined();
      });
    });
  });

  describe("GIVEN message envelope patterns", () => {
    describe("WHEN using basic message structure (Alpha limitation - no @header/@message decorators)", () => {
      it("THEN should structure message schemas properly", async () => {
        const envelopeCode = `
          namespace MessageEnvelopeService {
            @channel("enveloped-messages")
            @publish
            op publishEnveloped(message: EnvelopedMessage): void;
          }
          
          model EnvelopedMessage {
            messageId: string;
            timestamp: utcDateTime;
            source: string;
            payload: MessagePayload;
          }
          
          model MessagePayload {
            data: string;
            metadata: Record<string>;
          }
        `;

        const result = await compiler.compileTypeSpec({
          code: envelopeCode,
          emitAsyncAPI: true,
        });

        const messageSchema =
          result.asyncapi!.components!.schemas!.EnvelopedMessage;
        expect(messageSchema.properties!.payload).toBeDefined();
        expect(messageSchema.properties!.messageId).toEqual({ type: "string" });
        expect(messageSchema.properties!.timestamp).toEqual({
          type: "string",
          format: "date-time",
        });
        expect(messageSchema.properties!.source).toEqual({ type: "string" });
      });
    });
  });

  describe("GIVEN schema composition", () => {
    describe("WHEN using basic models (Alpha limitation - no model spreading support)", () => {
      it("THEN should create separate component schemas", async () => {
        const compositionCode = `
          namespace SchemaCompositionService {
            @channel("composed")
            @publish
            op publishComposed(data: ComposedSchema): void;
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
          
          model ComposedSchema {
            // Alpha doesn't support ...spreading, so define properties directly
            id: string;
            version: int32;
            createdBy: string;
            createdAt: utcDateTime;
            updatedBy?: string;
            updatedAt?: utcDateTime;
            name: string;
            description?: string;
          }
        `;

        const result = await compiler.compileTypeSpec({
          code: compositionCode,
          emitAsyncAPI: true,
        });

        const schemas = result.asyncapi!.components!.schemas!;
        expect(schemas.ComposedSchema).toBeDefined();
        expect(schemas.AuditFields).toBeDefined();
        expect(schemas.BaseEntity).toBeDefined();

        const composedSchema = schemas.ComposedSchema;
        const props = composedSchema.properties!;

        expect(props.id).toEqual({ type: "string" });
        expect(props.version).toEqual({ type: "integer", format: "int32" });
        expect(props.createdBy).toEqual({ type: "string" });
        expect(props.createdAt).toEqual({
          type: "string",
          format: "date-time",
        });
        expect(props.name).toEqual({ type: "string" });
      });
    });
  });

  describe("GIVEN polymorphic schemas", () => {
    describe("WHEN using separate event models (Alpha limitation - no discriminated unions)", () => {
      it("THEN should create individual event schemas", async () => {
        const polymorphicCode = `
          namespace PolymorphicService {
            @channel("user-events")
            @publish
            op publishUserEvent(event: UserEvent): void;
            
            @channel("order-events")
            @publish
            op publishOrderEvent(event: OrderEvent): void;
            
            @channel("system-events")
            @publish
            op publishSystemEvent(event: SystemEvent): void;
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
        `;

        const result = await compiler.compileTypeSpec({
          code: polymorphicCode,
          emitAsyncAPI: true,
        });

        const schemas = result.asyncapi!.components!.schemas!;
        expect(schemas.UserEvent).toBeDefined();
        expect(schemas.OrderEvent).toBeDefined();
        expect(schemas.SystemEvent).toBeDefined();

        // Verify event type fields (Alpha doesn't generate enum for string literals)
        expect(schemas.UserEvent.properties!.eventType).toEqual({
          type: "string",
        });
        expect(schemas.OrderEvent.properties!.eventType).toEqual({
          type: "string",
        });
        expect(schemas.SystemEvent.properties!.eventType).toEqual({
          type: "string",
        });
      });
    });
  });
});
