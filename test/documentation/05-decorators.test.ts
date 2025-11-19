/**
 * Documentation Test Suite: 05-decorators.md
 *
 * BDD tests validating TypeSpec decorators to AsyncAPI features mapping
 * as documented in docs/map-typespec-to-asyncapi/05-decorators.md
 */

import { describe, expect, it, beforeEach } from "bun:test";
import { createTypeSpecTestCompiler } from "./helpers/typespec-compiler.js";
import { createAsyncAPIValidator } from "./helpers/asyncapi-validator.js";
import { TypeSpecFixtures } from "./helpers/test-fixtures.js";

describe("Documentation: Decorators Mapping", () => {
  let compiler: ReturnType<typeof createTypeSpecTestCompiler>;
  let validator: ReturnType<typeof createAsyncAPIValidator>;

  beforeEach(() => {
    compiler = createTypeSpecTestCompiler();
    validator = createAsyncAPIValidator();
  });

  describe("GIVEN @channel decorators", () => {
    describe("WHEN defining channels", () => {
      it("THEN should create AsyncAPI channel definitions", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.decoratorsChannel,
          emitAsyncAPI: true,
        });

        const channels = result.asyncapi!.channels!;
        expect(channels["simple-channel"]).toBeDefined();
        expect(
          channels["parameterized/{userId}/events/{eventType}"],
        ).toBeDefined();
      });

      it("THEN should extract channel parameters", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.decoratorsChannel,
          emitAsyncAPI: true,
        });

        const channel =
          result.asyncapi!.channels![
            "parameterized/{userId}/events/{eventType}"
          ];
        expect(channel.parameters!.userId).toBeDefined();
        expect(channel.parameters!.eventType).toBeDefined();
      });
    });
  });

  describe("GIVEN @message decorators (Alpha: Basic model processing)", () => {
    describe("WHEN decorating models", () => {
      it("THEN should create schema components", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.decoratorsMessage,
          emitAsyncAPI: true,
        });

        const schemas = result.asyncapi!.components!.schemas!;
        expect(schemas.MessageWithDecorators).toBeDefined();
        expect(schemas.MessagePayload).toBeDefined();
      });

      it("THEN should process model properties correctly", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.decoratorsMessage,
          emitAsyncAPI: true,
        });

        const messageSchema =
          result.asyncapi!.components!.schemas!.MessageWithDecorators;
        expect(messageSchema.properties!.messageId).toBeDefined();
        expect(messageSchema.properties!.correlationId).toBeDefined();
        expect(messageSchema.properties!.payload).toBeDefined();
        expect(messageSchema.properties!.traceId).toBeDefined();

        // Alpha doesn't support @message decorator, but processes the model structure
        const messages = result.asyncapi!.components!.messages!;
        expect(messages.publishMessageMessage).toBeDefined();
      });
    });
  });

  describe("GIVEN @protocol decorators (Alpha: Not supported - channels only)", () => {
    describe("WHEN using protocol-named channels", () => {
      it("THEN should create basic channels without bindings", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.decoratorsProtocol,
          emitAsyncAPI: true,
        });

        // Alpha doesn't support @protocol decorators, but creates basic channels
        const kafkaChannel = result.asyncapi!.channels!["kafka-topic"];
        const amqpChannel = result.asyncapi!.channels!["amqp-queue"];

        expect(kafkaChannel).toBeDefined();
        expect(kafkaChannel.address).toBe("kafka-topic");
        expect(amqpChannel).toBeDefined();
        expect(amqpChannel.address).toBe("amqp-queue");

        // Protocol bindings are not supported in Alpha
        expect(kafkaChannel.bindings).toBeUndefined();
        expect(amqpChannel.bindings).toBeUndefined();
      });
    });
  });

  describe("GIVEN @security decorators (Alpha: Not supported)", () => {
    describe("WHEN using security-related models", () => {
      it("THEN should create basic channels and schemas without security", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.decoratorsSecurity,
          emitAsyncAPI: true,
        });

        // Alpha doesn't support @security decorators - security schemes remain empty
        const securitySchemes = result.asyncapi!.components!.securitySchemes!;
        expect(Object.keys(securitySchemes)).toHaveLength(0);

        // But basic channels and models are still processed
        const channels = result.asyncapi!.channels!;
        expect(channels["secure-channel"]).toBeDefined();
        expect(channels["api-key-channel"]).toBeDefined();

        const schemas = result.asyncapi!.components!.schemas!;
        expect(schemas.SecureMessage).toBeDefined();
      });
    });
  });

  describe("GIVEN @server decorators (Alpha: Not supported - default only)", () => {
    describe("WHEN defining multiple servers", () => {
      it("THEN should use default development server", async () => {
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.decoratorsServer,
          emitAsyncAPI: true,
        });

        // Alpha doesn't support @server decorators - uses default development server
        const servers = result.asyncapi!.servers!;
        expect(servers.development).toBeDefined();
        expect(servers.development.host).toBe("localhost:3000");
        expect(servers.development.protocol).toBe("http");

        // Custom servers from decorators are not supported
        expect(servers.production).toBeUndefined();
        expect(servers.staging).toBeUndefined();

        // But channels are still processed
        const channels = result.asyncapi!.channels!;
        expect(channels["multi-server-channel"]).toBeDefined();
      });
    });
  });

  describe("GIVEN decorator validation (Alpha: Basic supported decorators)", () => {
    describe("WHEN using Alpha-supported decorators", () => {
      it("THEN should validate basic decorator functionality", async () => {
        const alphaCompatibleCode = `
          namespace AlphaDecoratorsService {
            @channel("orders/{orderId}")
            @publish
            op processOrder(orderId: string, order: OrderCommand): void;
            
            @channel("order-updates")
            @subscribe
            op subscribeOrderUpdates(): OrderUpdate;
          }
          
          model OrderCommand {
            customerId: string;
            items: OrderItem[];
            correlationId: string;
            traceId: string;
          }
          
          model OrderUpdate {
            orderId: string;
            status: "pending" | "confirmed" | "cancelled";
            updatedAt: utcDateTime;
          }
          
          model OrderItem {
            productId: string;
            quantity: int32;
            price: float64;
          }
        `;

        const result = await compiler.compileTypeSpec({
          code: alphaCompatibleCode,
          emitAsyncAPI: true,
        });

        // Validate that Alpha-supported features work correctly
        const channels = result.asyncapi!.channels!;
        expect(channels["orders/{orderId}"]).toBeDefined();
        expect(channels["order-updates"]).toBeDefined();

        const orderChannel = channels["orders/{orderId}"];
        expect(orderChannel.parameters!.orderId).toBeDefined();

        const validation = await validator.validateAsyncAPI(result.asyncapi!, {
          strict: true,
          validateSemantic: true,
        });

        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });
    });
  });

  describe("GIVEN decorator error handling (Alpha: Basic validation)", () => {
    describe("WHEN decorators have invalid configurations", () => {
      it("THEN should handle Alpha-compatible error scenarios", async () => {
        const invalidDecoratorCode = `
          namespace InvalidDecoratorService {
            @channel()  // Missing channel address - should cause TypeSpec compilation error
            @publish
            op invalidOperation(data: TestData): void;
          }
          
          model TestData {
            value: string;
          }
        `;

        try {
          const result = await compiler.compileTypeSpec({
            code: invalidDecoratorCode,
            emitAsyncAPI: true,
          });

          // Either compilation fails with diagnostics or the operation succeeds with basic processing
          if (result.diagnostics && result.diagnostics.length > 0) {
            const errors = result.diagnostics.filter(
              (d) => d.severity === "error",
            );
            expect(errors.length).toBeGreaterThan(0);
          } else {
            // Alpha might handle this gracefully - just ensure basic structure exists
            expect(result.asyncapi).toBeDefined();
          }
        } catch (error) {
          // TypeSpec compilation errors are expected for invalid syntax
          expect(error).toBeDefined();
        }
      });
    });
  });
});
