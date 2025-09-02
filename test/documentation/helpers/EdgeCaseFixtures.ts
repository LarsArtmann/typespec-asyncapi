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
    @service({ title: "Empty Service" })
    namespace EmptyService {
      // No operations or models
    }
  `,
  
  invalidTypeSpecSyntax: `
    @service({ title: "Invalid Service" })
    namespace InvalidService {
      @channel("invalid-channel"
      @publish
      op invalidOp(@body data: NonExistentModel): void;
    }
  `,
  
  missingDecorators: `
    namespace NoServiceDecorator {
      op operationWithoutChannel(@body data: SimpleModel): void;
    }
    
    model SimpleModel {
      field: string;
    }
  `,

  circularReferences: `
    @service({ title: "Circular References Service" })
    namespace CircularReferencesService {
      @channel("circular")
      @publish
      op publishCircular(@body data: ModelA): void;
    }
    
    model ModelA {
      reference: ModelB;
    }
    
    model ModelB {
      reference: ModelA;
    }
  `,

  deeplyNestedModels: `
    @service({ title: "Deeply Nested Service" })
    namespace DeeplyNestedService {
      @channel("nested")
      @publish
      op publishNested(@body data: Level1): void;
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
    @service({ title: "Large Model Service" })
    namespace LargeModelService {
      @channel("large")
      @publish
      op publishLarge(@body data: LargeModel): void;
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
    @service({ title: "Name Conflicts Service" })
    namespace NameConflictsService {
      @channel("conflict")
      @publish
      op publishConflict(@body data: Message): void;
    }
    
    @message("Message")
    model Message {
      message: string;
      Message: string;
      MESSAGE: string;
    }
  `,

  // Protocol-specific edge cases
  decoratorsProtocol: `
    @service({ title: "Protocol Decorators Service" })  
    namespace ProtocolDecoratorsService {
      
      @channel("kafka-topic")
      @protocol("kafka", {
        topic: "user-events",
        partitionKey: "userId", 
        replicationFactor: 3
      })
      @publish
      op publishToKafka(@body event: KafkaEvent): void;
      
      @channel("amqp-queue")
      @protocol("amqp", {
        exchange: "events.exchange",
        routingKey: "user.created",
        deliveryMode: 2
      })
      @subscribe
      op subscribeFromAMQP(): AMQPEvent;
    }
    
    @message("KafkaEvent")
    model KafkaEvent {
      userId: string;
      eventData: Record<string>;
    }
    
    @message("AMQPEvent")
    model AMQPEvent {
      eventType: string;
      payload: Record<string>;
    }
  `,

  decoratorsSecurity: `
    @service({ title: "Security Decorators Service" })
    namespace SecurityDecoratorsService {
      
      @channel("secure-channel")
      @security("oauth2", {
        flows: {
          clientCredentials: {
            tokenUrl: "https://auth.example.com/token",
            scopes: {
              "read:messages": "Read messages",
              "write:messages": "Write messages"
            }
          }
        }
      })
      @publish
      op publishSecure(@body msg: SecureMessage): void;
      
      @channel("api-key-channel")
      @security("apiKey", {
        type: "apiKey",
        in: "header",
        name: "X-API-Key"
      })
      @subscribe
      op subscribeSecure(): SecureMessage;
    }
    
    @message("SecureMessage")
    model SecureMessage {
      content: string;
      sensitive: boolean;
    }
  `,

  decoratorsServer: `
    @service({ title: "Server Decorators Service" })
    namespace ServerDecoratorsService {
      
      @server("production", {
        url: "kafka://prod-cluster.example.com:9092",
        protocol: "kafka",
        description: "Production Kafka cluster"
      })
      @server("staging", {
        url: "kafka://staging-cluster.example.com:9092", 
        protocol: "kafka",
        description: "Staging Kafka cluster"
      })
      @channel("multi-server-channel")
      @publish
      op publishMultiServer(@body msg: MultiServerMessage): void;
    }
    
    @message("MultiServerMessage")
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
        @service({ title: "Broken Service" })
        namespace BrokenService {
          @channel("test")
          @publish
          op testOp(@body data: TestModel): void;
        
        model TestModel {
          field: string;
        // Missing closing brace
      `
    },
    {
      name: "Invalid decorator syntax",
      code: `
        @service({ title: "Invalid Decorator Service" })
        namespace InvalidDecoratorService {
          @channel(
          @publish
          op testOp(@body data: TestModel): void;
        }
        
        model TestModel {
          field: string;
        }
      `
    },
    {
      name: "Undefined model reference",
      code: `
        @service({ title: "Undefined Reference Service" })
        namespace UndefinedReferenceService {
          @channel("test")
          @publish
          op testOp(@body data: NonExistentModel): void;
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
    @service({ title: "Kafka Protocol Service" })
    namespace KafkaProtocolService {
      
      @channel("user-events")
      @protocol("kafka", {
        topic: "user-events",
        partitions: 12,
        replicationFactor: 3,
        retentionMs: 604800000,
        cleanupPolicy: "delete"
      })
      @publish
      op publishUserEvent(@body event: UserEvent): void;
      
      @channel("order-events")
      @protocol("kafka", {
        topic: "order-events", 
        partitionKey: "customerId",
        headers: {
          "Content-Type": "application/json",
          "Schema-Version": "1.0"
        }
      })
      @subscribe
      op subscribeOrderEvents(): OrderEvent;
    }
  `,

  protocolAMQP: `
    @service({ title: "AMQP Protocol Service" })
    namespace AMQPProtocolService {
      
      @channel("notifications")
      @protocol("amqp", {
        exchange: "notifications.topic",
        exchangeType: "topic",
        routingKey: "user.notification",
        queue: "user-notifications",
        durable: true,
        autoDelete: false,
        exclusive: false
      })
      @publish
      op publishNotification(@body notification: Notification): void;
      
      @channel("dead-letter")
      @protocol("amqp", {
        exchange: "dlx.exchange",
        routingKey: "failed.message",
        ttl: 86400000,
        maxRetries: 3
      })
      @subscribe
      op processDeadLetter(): FailedMessage;
    }
  `,

  protocolWebSocket: `
    @service({ title: "WebSocket Protocol Service" })
    namespace WebSocketProtocolService {
      
      @channel("live-updates/{userId}")
      @protocol("ws", {
        method: "GET",
        query: {
          token: "string",
          version: "string"
        },
        headers: {
          "Sec-WebSocket-Protocol": "chat"
        }
      })
      @subscribe
      op subscribeLiveUpdates(@path userId: string): LiveUpdate;
      
      @channel("chat/{roomId}")
      @protocol("ws", {
        bindings: {
          query: {
            type: "object", 
            properties: {
              auth: { type: "string" }
            }
          }
        }
      })
      @publish
      op sendChatMessage(@path roomId: string, @body message: ChatMessage): void;
    }
  `
}