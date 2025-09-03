/**
 * Edge Case Test Fixtures for TypeSpec-AsyncAPI
 * 
 * Edge cases, error scenarios, validation tests, and boundary conditions.
 * Split from massive 1822-line test-fixtures.ts for maintainability.
 */

import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js"

/**
 * Edge cases and boundary conditions for testing
 */
export const EdgeCaseFixtures = {
  emptyService: `
    namespace EmptyService {
      // No operations or models
    }
  `,
  
  invalidTypeSpecSyntax: `
    namespace InvalidService {
      @channel("invalid-channel"
      @publish
      op invalidOp(data: NonExistentModel): void;
    }
  `,
  
  missingDecorators: `
    namespace NoServiceDecorator {
      op operationWithoutChannel(data: SimpleModel): void;
    }
    
    model SimpleModel {
      field: string;
    }
  `,

  circularReferences: `
    namespace CircularReferencesService {
      @channel("circular")
      @publish
      op publishCircular(data: ModelA): void;
    }
    
    model ModelA {
      reference: ModelB;
    }
    
    model ModelB {
      reference: ModelA;
    }
  `,

  deeplyNestedModels: `
    namespace DeeplyNestedService {
      @channel("nested")
      @publish
      op publishNested(data: Level1): void;
    }
    
    model Level1 {
      level2: Level2;
    }
    
    model Level2 {
      level3: Level3;
    }
    
    model Level3 {
      level4: Level4;
    }
    
    model Level4 {
      level5: Level5;
    }
    
    model Level5 {
      deepValue: string;
    }
  `,

  largeNumberOfFields: `
    namespace LargeModelService {
      @channel("large")
      @publish
      op publishLarge(data: LargeModel): void;
    }
    
    model LargeModel {
      field001: string; field002: string; field003: string; field004: string; field005: string;
      field006: string; field007: string; field008: string; field009: string; field010: string;
      field011: int32; field012: int32; field013: int32; field014: int32; field015: int32;
      field016: float64; field017: float64; field018: float64; field019: float64; field020: float64;
      field021: boolean; field022: boolean; field023: boolean; field024: boolean; field025: boolean;
    }
  `,

  conflictingNames: `
    namespace NameConflictsService {
      @channel("conflict")
      @publish
      op publishConflict(data: Message): void;
    }
    
    model Message {
      message: string;
      Message: string;
      MESSAGE: string;
    }
  `,

  // Alpha-compatible protocol tests (without @protocol decorators)
  decoratorsProtocol: `
    namespace ProtocolDecoratorsService {
      
      @channel("kafka-topic")
      @publish
      op publishToKafka(event: KafkaEvent): void;
      
      @channel("amqp-queue")
      @subscribe
      op subscribeFromAMQP(): AMQPEvent;
    }
    
    model KafkaEvent {
      userId: string;
      eventData: Record<string>;
    }
    
    model AMQPEvent {
      eventType: string;
      payload: Record<string>;
    }
  `,

  decoratorsSecurity: `
    namespace SecurityDecoratorsService {
      
      @channel("secure-channel")
      @publish
      op publishSecure(msg: SecureMessage): void;
      
      @channel("api-key-channel")
      @subscribe
      op subscribeSecure(): SecureMessage;
    }
    
    model SecureMessage {
      content: string;
      sensitive: boolean;
    }
  `,

  decoratorsServer: `
    namespace ServerDecoratorsService {
      
      @channel("multi-server-channel")
      @publish
      op publishMultiServer(msg: MultiServerMessage): void;
    }
    
    model MultiServerMessage {
      environment: "production" | "staging";
      data: Record<string>;
    }
  `
}

/**
 * Error scenarios for negative testing
 */
export const ErrorFixtures = {
  compilationErrors: [
    {
      name: "Missing closing brace",
      code: `
        namespace BrokenService {
          @channel("test")
          @publish
          op testOp(data: TestModel): void;
        
        model TestModel {
          field: string;
        // Missing closing brace
      `
    },
    {
      name: "Invalid decorator syntax",
      code: `
        namespace InvalidDecoratorService {
          @channel(
          @publish
          op testOp(data: TestModel): void;
        }
        
        model TestModel {
          field: string;
        }
      `
    },
    {
      name: "Undefined model reference",
      code: `
        namespace UndefinedReferenceService {
          @channel("test")
          @publish
          op testOp(data: NonExistentModel): void;
        }
      `
    }
  ],

  validationErrors: [
    {
      name: "Invalid AsyncAPI version",
      asyncapi: {
        asyncapi: "2.0.0", // Should be 3.0.0
        info: { title: "Test", version: "1.0.0" },
        channels: {},
        operations: {},
        components: { schemas: {}, messages: {}, securitySchemes: {} }
      }
    },
    {
      name: "Missing required info fields",
      asyncapi: {
        asyncapi: "3.0.0",
        info: {}, // Missing title and version
        channels: {},
        operations: {},
        components: { schemas: {}, messages: {}, securitySchemes: {} }
      }
    },
    {
      name: "Channel reference mismatch",
      asyncapi: {
        asyncapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
        channels: {
          "existing-channel": {
            address: "existing-channel",
            messages: {}
          }
        },
        operations: {
          testOp: {
            action: "send",
            channel: { $ref: "#/channels/non-existent-channel" }
          }
        },
        components: { schemas: {}, messages: {}, securitySchemes: {} }
      }
    }
  ]
}

/**
 * Protocol binding edge cases for testing
 */
export const ProtocolEdgeCases = {
  protocolKafka: `
    namespace KafkaProtocolService {
      
      @channel("user-events")
      @publish
      op publishUserEvent(event: UserEvent): void;
      
      @channel("order-events")
      @subscribe
      op subscribeOrderEvents(): OrderEvent;
    }
  `,

  protocolAMQP: `
    namespace AMQPProtocolService {
      
      @channel("notifications")
      @publish
      op publishNotification(notification: Notification): void;
      
      @channel("dead-letter")
      @subscribe
      op processDeadLetter(): FailedMessage;
    }
  `,

  protocolWebSocket: `
    namespace WebSocketProtocolService {
      
      @channel("live-updates/{userId}")
      @subscribe
      op subscribeLiveUpdates(userId: string): LiveUpdate;
      
      @channel("chat/{roomId}")
      @publish
      op sendChatMessage(roomId: string, message: ChatMessage): void;
    }
  `
}