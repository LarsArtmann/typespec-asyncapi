/**
 * Documentation Test Suite: 01-core-concepts.md
 *
 * BDD tests validating TypeSpec to AsyncAPI core concept mappings
 * as documented in docs/map-typespec-to-asyncapi/01-core-concepts.md
 */

import { describe, expect, it, beforeEach } from "bun:test";
import {
  createTypeSpecTestCompiler,
  type TypeSpecCompileResult,
} from "./helpers/typespec-compiler.js";
import {
  createAsyncAPIValidator,
  type AsyncAPIValidationResult,
} from "./helpers/asyncapi-validator.js";
import { TypeSpecFixtures, AsyncAPIFixtures } from "./helpers/test-fixtures.js";

describe("Documentation: Core Concepts Mapping", () => {
  let compiler: ReturnType<typeof createTypeSpecTestCompiler>;
  let validator: ReturnType<typeof createAsyncAPIValidator>;

  beforeEach(() => {
    compiler = createTypeSpecTestCompiler();
    validator = createAsyncAPIValidator();
  });

  describe("GIVEN a TypeSpec service definition", () => {
    describe("WHEN mapping @service decorator to AsyncAPI", () => {
      it("THEN should create AsyncAPI root document with info section", async () => {
        // Arrange
        const typeSpecCode = `
          @service({
            title: "User Management Service",
            version: "2.1.0"
          })
          namespace UserManagement {
            @channel("users")
            @publish
            op createUser(@body user: User): void;
          }
          
          model User {
            id: string;
            email: string;
          }
        `;

        // Act
        const result: TypeSpecCompileResult = await compiler.compileTypeSpec({
          code: typeSpecCode,
          emitAsyncAPI: true,
        });

        // Assert
        compiler.validateCompilationSuccess(result);
        expect(result.asyncapi).toBeDefined();
        expect(result.asyncapi!.asyncapi).toBe("3.0.0");
        expect(result.asyncapi!.info.title).toBe("User Management Service");
        expect(result.asyncapi!.info.version).toBe("2.1.0");
      });

      it("THEN should include proper AsyncAPI document structure", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.coreConceptsService,
          emitAsyncAPI: true,
        });

        // Assert
        compiler.validateCompilationSuccess(result);
        const asyncapi = result.asyncapi!;

        expect(asyncapi.channels).toBeDefined();
        expect(asyncapi.operations).toBeDefined();
        expect(asyncapi.components).toBeDefined();
        expect(asyncapi.components.schemas).toBeDefined();
        expect(asyncapi.components.schemas).toBeDefined();
        expect(asyncapi.components.securitySchemes).toBeDefined();
      });

      it("THEN should validate against AsyncAPI 3.0 specification", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.coreConceptsService,
          emitAsyncAPI: true,
        });

        // Assert
        const validation: AsyncAPIValidationResult = await validator.validateAsyncAPI(
          result.asyncapi!,
          {
            strict: true,
            validateSemantic: true,
            customRules: validator.createTypeSpecValidationRules(),
          },
        );

        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });
    });

    describe("WHEN mapping nested namespaces to channel organization", () => {
      it("THEN should structure channels based on namespace hierarchy", async () => {
        // Arrange
        const nestedNamespaceCode = `
          @service({ title: "Multi-Service API" })
          namespace MultiService {
            namespace UserEvents {
              @channel("user-events/created")
              @publish
              op userCreated(@body event: UserCreatedEvent): void;
            }
            
            namespace OrderEvents {
              @channel("order-events/processed") 
              @publish
              op orderProcessed(@body event: OrderProcessedEvent): void;
            }
          }
          
          @message("UserCreatedEvent")
          model UserCreatedEvent {
            userId: string;
            timestamp: utcDateTime;
          }
          
          @message("OrderProcessedEvent")
          model OrderProcessedEvent {
            orderId: string;
            status: string;
          }
        `;

        // Act
        const result = await compiler.compileTypeSpec({
          code: nestedNamespaceCode,
          emitAsyncAPI: true,
        });

        // Assert
        compiler.validateCompilationSuccess(result);
        const channels = Object.keys(result.asyncapi!.channels || {});

        expect(channels).toContain("user-events/created");
        expect(channels).toContain("order-events/processed");
      });

      it("THEN should maintain namespace context in operation names", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.coreConceptsService,
          emitAsyncAPI: true,
        });

        // Assert
        const operations = Object.keys(result.asyncapi!.operations || {});
        expect(operations.length).toBeGreaterThan(0);
        expect(operations).toContain("createOrder");
        expect(operations).toContain("orderStatusUpdated");
      });
    });

    describe("WHEN mapping TypeSpec operations to AsyncAPI operations", () => {
      it("THEN @publish operations should create 'send' actions", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.coreConceptsService,
          emitAsyncAPI: true,
        });

        // Assert
        const operations = result.asyncapi!.operations;
        const publishOperation = operations!["createOrder"];

        expect(publishOperation).toBeDefined();
        expect(publishOperation.action).toBe("send");
        expect(publishOperation.channel).toBeDefined();
      });

      it("THEN @subscribe operations should create 'receive' actions", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.coreConceptsService,
          emitAsyncAPI: true,
        });

        // Assert
        const operations = result.asyncapi!.operations;
        const subscribeOperation = operations!["orderStatusUpdated"];

        expect(subscribeOperation).toBeDefined();
        expect(subscribeOperation.action).toBe("receive");
        expect(subscribeOperation.channel).toBeDefined();
      });

      it("THEN should link operations to correct channels", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.coreConceptsService,
          emitAsyncAPI: true,
        });

        // Assert
        const operations = result.asyncapi!.operations!;
        const channels = result.asyncapi!.channels!;

        // Validate channel references exist
        for (const [operationId, operation] of Object.entries(operations)) {
          const channelRef = operation.channel?.$ref;
          if (channelRef) {
            const channelName = channelRef.replace("#/channels/", "").replace(/~/g, "/");
            expect(Object.keys(channels)).toContain(channelName);
          }
        }
      });
    });

    describe("WHEN mapping TypeSpec models to AsyncAPI schemas", () => {
      it("THEN should create component schemas for models", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.coreConceptsService,
          emitAsyncAPI: true,
        });

        // Assert
        const schemas = result.asyncapi!.components!.schemas!;
        expect(Object.keys(schemas).length).toBeGreaterThan(0);
      });

      it("THEN @message decorated models should create message components", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.coreConceptsService,
          emitAsyncAPI: true,
        });

        // Assert
        const schemas = result.asyncapi!.components!.schemas!;
        expect(schemas["OrderStatusEvent"]).toBeDefined();
        expect(schemas["OrderStatusEvent"].type).toBe("object");
      });

      it("THEN should maintain type structure in schema mapping", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.coreConceptsService,
          emitAsyncAPI: true,
        });

        // Assert
        const schemas = result.asyncapi!.components!.schemas!;
        const orderStatusSchema = schemas["OrderStatusEvent"];

        expect(orderStatusSchema.type).toBe("object");
        expect(orderStatusSchema.properties).toBeDefined();
        expect(orderStatusSchema.properties!.orderId).toEqual({
          type: "string",
        });
        expect(orderStatusSchema.properties!.timestamp).toEqual({
          type: "string",
          format: "date-time",
        });
      });
    });

    describe("WHEN handling channel parameters", () => {
      it("THEN should extract path parameters from channel addresses", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.coreConceptsService,
          emitAsyncAPI: true,
        });

        // Assert
        const channels = result.asyncapi!.channels!;
        const parameterizedChannel = channels["orders/{orderId}/status"];

        expect(parameterizedChannel).toBeDefined();
        expect(parameterizedChannel.parameters).toBeDefined();
        expect(parameterizedChannel.parameters!.orderId).toBeDefined();
        expect(parameterizedChannel.parameters!.orderId.schema).toEqual({
          type: "string",
        });
      });

      it("THEN should validate parameter types match operation parameters", async () => {
        // Arrange
        const parameterizedOperationCode = `
          @service({ title: "Parameterized Service" })
          namespace ParameterizedService {
            @channel("orders/{orderId}/items/{itemId}")
            @publish
            op updateOrderItem(@path orderId: string, @path itemId: int32, @body update: ItemUpdate): void;
          }
          
          model ItemUpdate {
            quantity: int32;
            price: float64;
          }
        `;

        // Act
        const result = await compiler.compileTypeSpec({
          code: parameterizedOperationCode,
          emitAsyncAPI: true,
        });

        // Assert
        const channel = result.asyncapi!.channels!["orders/{orderId}/items/{itemId}"];
        expect(channel.parameters!.orderId.schema).toEqual({ type: "string" });
        expect(channel.parameters!.itemId.schema).toEqual({
          type: "integer",
          format: "int32",
        });
      });
    });

    describe("WHEN validating complete transformation", () => {
      it("THEN should match expected AsyncAPI structure for core concepts", async () => {
        // Arrange & Act - Use fixture with @service decorator for title validation
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.coreConceptsServiceWithTitle,
          emitAsyncAPI: true,
        });

        // Assert - Structure validation
        const structureErrors = validator.validateStructure(result.asyncapi!, {
          version: "3.0.0",
          info: {
            title: "Order Service",
          },
          channelCount: 2, // orders/{orderId} and orders/{orderId}/status
          operationCount: 2, // createOrder and orderStatusUpdated
        });

        expect(structureErrors).toHaveLength(0);
      });

      it("THEN should pass comprehensive AsyncAPI validation", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.coreConceptsService,
          emitAsyncAPI: true,
        });

        // Assert
        const validation = await validator.validateAsyncAPI(result.asyncapi!, {
          strict: true,
          validateSemantic: true,
          includeWarnings: true,
          customRules: [
            {
              name: "Core Concepts Validation",
              description: "Validates core concept mapping requirements",
              validate: (asyncapi) => {
                const errors: string[] = [];

                // Must have both channels and operations
                if (!asyncapi.channels || Object.keys(asyncapi.channels).length === 0) {
                  errors.push("Must have at least one channel");
                }

                if (!asyncapi.operations || Object.keys(asyncapi.operations).length === 0) {
                  errors.push("Must have at least one operation");
                }

                // Must have component structure
                if (!asyncapi.components || !asyncapi.components.schemas) {
                  errors.push("Must have complete components structure");
                }

                return errors;
              },
            },
          ],
        });

        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });

      it("THEN should maintain referential integrity between operations and channels", async () => {
        // Arrange & Act
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.coreConceptsService,
          emitAsyncAPI: true,
        });

        // Assert
        const operations = result.asyncapi!.operations!;
        const channels = result.asyncapi!.channels!;

        for (const [operationId, operation] of Object.entries(operations)) {
          const channelRef = operation.channel?.$ref;
          if (channelRef) {
            const channelName = channelRef.replace("#/channels/", "").replace(/~/g, "/");
            expect(channels[channelName]).toBeDefined();
          }
        }
      });

      it("THEN should preserve TypeSpec semantic meaning in AsyncAPI output", async () => {
        // Arrange & Act - Use fixture with @service decorator for title validation
        const result = await compiler.compileTypeSpec({
          code: TypeSpecFixtures.coreConceptsServiceWithTitle,
          emitAsyncAPI: true,
        });

        // Assert - Semantic preservation
        const asyncapi = result.asyncapi!;

        // Service title and version preserved
        expect(asyncapi.info.title).toBe("Order Service");
        expect(asyncapi.info.version).toBe("1.0.0");

        // Operation semantics preserved (@publish → send, @subscribe → receive)
        expect(asyncapi.operations!.createOrder.action).toBe("send");
        expect(asyncapi.operations!.orderStatusUpdated.action).toBe("receive");

        // Model structures preserved with proper types
        const orderStatusSchema = asyncapi.components!.schemas!.OrderStatusEvent;
        expect(orderStatusSchema.properties!.status).toEqual({
          type: "string",
        });
        expect(orderStatusSchema.properties!.timestamp).toEqual({
          type: "string",
          format: "date-time",
        });
      });
    });
  });

  describe("GIVEN edge cases and error scenarios", () => {
    describe("WHEN service has no operations", () => {
      it("THEN should create valid AsyncAPI with empty channels and operations", async () => {
        // Arrange
        const emptyServiceCode = `
          @service({ title: "Empty Service" })
          namespace EmptyService {
            // No operations
          }
        `;

        // Act
        const result = await compiler.compileTypeSpec({
          code: emptyServiceCode,
          emitAsyncAPI: true,
        });

        // Assert
        compiler.validateCompilationSuccess(result);
        expect(result.asyncapi!.channels).toEqual({});
        expect(result.asyncapi!.operations).toEqual({});
        expect(result.asyncapi!.components).toBeDefined();
      });
    });

    describe("WHEN @service decorator is missing", () => {
      it("THEN should handle compilation gracefully", async () => {
        // Arrange
        const noServiceCode = `
          namespace NoServiceDecorator {
            @channel("test")
            @publish
            op testOperation(@body data: TestData): void;
          }
          
          model TestData {
            value: string;
          }
        `;

        // Act & Assert
        try {
          const result = await compiler.compileTypeSpec({
            code: noServiceCode,
            emitAsyncAPI: true,
          });

          // Should either succeed with defaults or provide meaningful diagnostics
          if (result.diagnostics.length > 0) {
            const errors = result.diagnostics.filter((d) => d.severity === "error");
            expect(errors.length).toBeGreaterThan(0);
          }
        } catch (error) {
          // Compilation failure is acceptable for missing @service
          expect(error).toBeDefined();
        }
      });
    });

    describe("WHEN namespace nesting is deeply nested", () => {
      it("THEN should handle complex namespace hierarchies", async () => {
        // Arrange
        const deeplyNestedCode = `
          @service({ title: "Deep Nesting Service" })
          namespace Level1 {
            namespace Level2 {
              namespace Level3 {
                @channel("deeply/nested/channel")
                @publish
                op deepOperation(@body data: DeepData): void;
              }
            }
          }
          
          model DeepData {
            depth: int32;
          }
        `;

        // Act
        const result = await compiler.compileTypeSpec({
          code: deeplyNestedCode,
          emitAsyncAPI: true,
        });

        // Assert
        compiler.validateCompilationSuccess(result);
        expect(result.asyncapi!.channels!["deeply/nested/channel"]).toBeDefined();
        expect(result.asyncapi!.operations!.deepOperation).toBeDefined();
      });
    });
  });

  describe("GIVEN performance and scalability requirements", () => {
    describe("WHEN compiling large service definitions", () => {
      it("THEN should handle multiple operations efficiently", async () => {
        // Arrange
        const largeServiceCode = `
          @service({ title: "Large Service", version: "1.0.0" })
          namespace LargeService {
            ${Array.from(
              { length: 10 },
              (_, i) => `
              @channel("channel-${i}")
              @publish
              op operation${i}(@body data: Data${i}): void;
            `,
            ).join("\n")}
          }
          
          ${Array.from(
            { length: 10 },
            (_, i) => `
            model Data${i} {
              id${i}: string;
              value${i}: int32;
            }
          `,
          ).join("\n")}
        `;

        // Act
        const startTime = Date.now();
        const result = await compiler.compileTypeSpec({
          code: largeServiceCode,
          emitAsyncAPI: true,
        });
        const compilationTime = Date.now() - startTime;

        // Assert
        compiler.validateCompilationSuccess(result);
        expect(Object.keys(result.asyncapi!.channels!)).toHaveLength(10);
        expect(Object.keys(result.asyncapi!.operations!)).toHaveLength(10);
        expect(compilationTime).toBeLessThan(5000); // Should complete within 5 seconds
      });
    });
  });
});
