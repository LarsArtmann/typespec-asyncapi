/**
 * Core Test Fixtures for TypeSpec-AsyncAPI
 * 
 * Essential TypeSpec code snippets and expected AsyncAPI outputs for core functionality.
 * Split from massive 1822-line test-fixtures.ts for maintainability.
 * 
 * ALPHA VERSION - Uses only supported decorators: @channel, @publish, @subscribe
 */

import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js"

/**
 * Core TypeSpec code snippets for fundamental concepts
 */
export const CoreTypeSpecFixtures = {
  // Core Concepts Fixtures - Alpha Compatible
  coreConceptsService: `
    namespace OrderService;
    
    model CreateOrderRequest {
      customerId: string;
      items: OrderItem[];
    }
    
    model OrderItem {
      productId: string;
      quantity: int32;
      price: float64;
    }
    
    model CreateOrderResponse {
      orderId: string;
      status: "pending" | "confirmed" | "rejected";
    }
    
    model OrderStatusEvent {
      orderId: string;
      status: string;
      timestamp: utcDateTime;
    }
    
    @channel("orders/{orderId}")
    @publish
    op createOrder(orderId: string, order: CreateOrderRequest): CreateOrderResponse;
    
    @channel("orders/{orderId}/status")
    @subscribe  
    op orderStatusUpdated(orderId: string): OrderStatusEvent;
  `,

  // Data Types Fixtures - Alpha Compatible
  dataTypesPrimitives: `
    namespace DataTypesService;
    
    model PrimitiveTypesMessage {
      stringField: string;
      int32Field: int32;
      int64Field: int64;
      float32Field: float32;
      float64Field: float64;
      booleanField: boolean;
      dateTimeField: utcDateTime;
      durationField: duration;
      urlField: url;
    }
    
    model ArrayTypesMessage {
      stringArray: string[];
      numberArray: int32[];
      objectArray: OrderItem[];
    }
    
    model OrderItem {
      productId: string;
      quantity: int32;
    }
    
    model UnionTypesMessage {
      statusUnion: "active" | "inactive" | "pending";
      typeUnion: string | int32 | boolean;
    }
    
    model OptionalFieldsMessage {
      requiredField: string;
      optionalField?: string;
      nullableField: string | null;
    }
    
    @channel("data.primitives")
    @publish
    op publishPrimitiveTypes(): PrimitiveTypesMessage;
    
    @channel("data.arrays")
    @publish
    op publishArrayTypes(): ArrayTypesMessage;
  `,

  dataTypesRecords: `
    namespace RecordsService;
    
    model RecordTypesMessage {
      dynamicObject: Record<string>;
      typedRecord: Record<UserProfile>;
      nestedRecord: Record<Record<string>>;
    }
    
    model UserProfile {
      name: string;
      age: int32;
      email: string;
    }
    
    @channel("records.data")
    @publish
    op publishRecordTypes(): RecordTypesMessage;
  `,

  dataTypesEnums: `
    namespace EnumsService;
    
    enum OrderStatus {
      Pending: "pending",
      Processing: "processing", 
      Shipped: "shipped",
      Delivered: "delivered",
      Cancelled: "cancelled"
    }
    
    enum Priority {
      Low: 1,
      Medium: 2,
      High: 3,
      Critical: 4
    }
    
    model EnumMessage {
      status: OrderStatus;
      priority: Priority;
    }
    
    @channel("enums.data")
    @publish
    op publishEnumMessage(): EnumMessage;
  `,

  // Operations & Channels Fixtures - Alpha Compatible
  operationsPublishSubscribe: `
    namespace EventService;
    
    model UserEvent {
      userId: string;
      eventType: "login" | "logout" | "profile_updated";
      timestamp: utcDateTime;
      metadata: Record<string>;
    }
    
    model OrderUpdate {
      orderId: string;
      status: string;
      updatedAt: utcDateTime;
      changes: Record<string>;
    }
    
    @channel("user-events")
    @publish
    op publishUserEvent(event: UserEvent): void;
    
    @channel("user-events") 
    @subscribe
    op subscribeToUserEvents(): UserEvent;
    
    @channel("orders/{orderId}/updates")
    @publish
    op publishOrderUpdate(orderId: string, update: OrderUpdate): void;
    
    @channel("orders/{orderId}/updates")
    @subscribe
    op subscribeToOrderUpdates(orderId: string): OrderUpdate;
  `,

  operationsRequestReply: `
    namespace RequestReplyService;
    
    model OrderItem {
      productId: string;
      quantity: int32;
    }
    
    model OrderValidationRequest {
      orderId: string;
      items: OrderItem[];
      correlationId: string;
    }
    
    model OrderValidationResponse {
      orderId: string;
      isValid: boolean;
      errors: string[];
      correlationId: string;
    }
    
    @channel("order-requests")
    @publish
    op requestOrderValidation(request: OrderValidationRequest): void;
    
    @channel("order-responses")
    @subscribe
    op receiveOrderValidation(): OrderValidationResponse;
  `,

  // Schema & Models Fixtures - Alpha Compatible
  schemasEventSourcing: `
    namespace EventSourcingService;
    
    model DomainEvent {
      eventId: string;
      aggregateId: string;
      aggregateVersion: int32;
      eventType: string;
      occurredAt: utcDateTime;
      payload: Record<string>;
    }
    
    model OrderCreatedPayload {
      customerId: string;
      items: OrderItem[];
      totalAmount: float64;
    }
    
    model OrderItem {
      productId: string;
      quantity: int32;
    }
    
    model OrderCreatedEvent extends DomainEvent {
      eventType: "OrderCreated";
      payload: OrderCreatedPayload;
    }
    
    model OrderCancelledPayload {
      reason: string;
      cancelledBy: string;
    }
    
    model OrderCancelledEvent extends DomainEvent {
      eventType: "OrderCancelled";  
      payload: OrderCancelledPayload;
    }
    
    @channel("events.domain")
    @publish
    op publishDomainEvent(): DomainEvent;
  `,

  schemasVersioning: `
    namespace VersionedSchemaService;
    
    model UserEventV1 {
      schemaVersion: "1.0";
      userId: string;
      action: string;
      timestamp: utcDateTime;
    }
    
    model UserEventMetadata {
      sessionId: string;
      userAgent: string;
      ipAddress: string;
    }
    
    model UserEventV2 {
      schemaVersion: "2.0";
      userId: string;
      action: string;
      timestamp: utcDateTime;
      metadata: UserEventMetadata;
    }
    
    @channel("events.v1")
    @publish
    op publishUserEventV1(): UserEventV1;
    
    @channel("events.v2") 
    @publish
    op publishUserEventV2(): UserEventV2;
  `,

  // Decorators Fixtures - Alpha Compatible
  decoratorsChannel: `
    namespace ChannelDecoratorsService;
    
    model SimpleMessage {
      content: string;
    }
    
    model ParameterizedMessage {
      userId: string;
      eventType: string;
      payload: Record<string>;
    }
    
    @channel("simple-channel")
    @publish
    op publishSimple(data: SimpleMessage): void;
    
    @channel("parameterized/{userId}/events/{eventType}")
    @subscribe
    op subscribeParameterized(userId: string, eventType: string): ParameterizedMessage;
  `,

  decoratorsMessage: `
    namespace MessageDecoratorsService;
    
    model MessagePayload {
      data: string;
      timestamp: utcDateTime;
    }
    
    model MessageWithDecorators {
      messageId: string;
      correlationId?: string;
      payload: MessagePayload;
      traceId: string;
    }
    
    @channel("messages")
    @publish
    op publishMessage(msg: MessageWithDecorators): void;
  `,

  // Best Practices Fixtures - Alpha Compatible
  bestPracticesNaming: `
    namespace NamingConventionsService;
    
    model UserProfileUpdatedEvent {
      userId: string;
      updatedFields: string[];
      previousValues: Record<string>;
      newValues: Record<string>;
      updatedAt: utcDateTime;
      updatedBy: string;
    }
    
    model FulfillmentItem {
      productId: string;
      quantity: int32;
      warehouseLocation: string;
    }
    
    model OrderFulfillmentRequestedEvent {
      orderId: string;
      customerId: string;
      warehouseId: string;
      items: FulfillmentItem[];
      requestedBy: utcDateTime;
      priority: "standard" | "expedited" | "urgent";
    }
    
    model InventoryLevelChangedEvent {
      productId: string;
      warehouseId: string;
      previousLevel: int32;
      newLevel: int32;
      changeReason: "sale" | "restock" | "adjustment" | "damage";
      changedAt: utcDateTime;
    }
    
    @channel("user-profile-updates")
    @publish
    op publishUserProfileUpdate(event: UserProfileUpdatedEvent): void;
    
    @channel("order-fulfillment-requests") 
    @subscribe
    op processOrderFulfillmentRequest(): OrderFulfillmentRequestedEvent;
    
    @channel("inventory-level-changes")
    @publish
    op publishInventoryLevelChange(event: InventoryLevelChangedEvent): void;
  `
}

/**
 * Expected AsyncAPI outputs for core concepts validation
 * Updated for Alpha version - actual output structure from current emitter
 */
export const CoreAsyncAPIFixtures = {
  coreConceptsExpected: {
    asyncapi: "3.0.0",
    info: {
      title: "AsyncAPI", // Alpha version uses default title
      version: "1.0.0"
    },
    channels: {
      "orders/{orderId}": {
        address: "orders/{orderId}",
        parameters: {
          orderId: {
            schema: { type: "string" }
          }
        }
      },
      "orders/{orderId}/status": {
        address: "orders/{orderId}/status", 
        parameters: {
          orderId: {
            schema: { type: "string" }
          }
        }
      }
    },
    operations: {
      createOrder: {
        action: "send",
        channel: {
          $ref: "#/channels/orders~1{orderId}"
        }
      },
      orderStatusUpdated: {
        action: "receive",
        channel: {
          $ref: "#/channels/orders~1{orderId}~1status"
        }
      }
    },
    components: {
      schemas: {
        CreateOrderRequest: {
          type: "object",
          properties: {
            customerId: { type: "string" },
            items: {
              type: "array",
              items: {
                $ref: "#/components/schemas/OrderItem"
              }
            }
          },
          required: ["customerId", "items"]
        },
        OrderItem: {
          type: "object",
          properties: {
            productId: { type: "string" },
            quantity: { type: "integer", format: "int32" },
            price: { type: "number", format: "double" }
          },
          required: ["productId", "quantity", "price"]
        },
        CreateOrderResponse: {
          type: "object", 
          properties: {
            orderId: { type: "string" },
            status: { 
              type: "string",
              enum: ["pending", "confirmed", "rejected"]
            }
          },
          required: ["orderId", "status"]
        },
        OrderStatusEvent: {
          type: "object",
          properties: {
            orderId: { type: "string" },
            status: { type: "string" },
            timestamp: { type: "string", format: "date-time" }
          },
          required: ["orderId", "status", "timestamp"]
        }
      }
    }
  },

  dataTypesPrimitivesExpected: {
    asyncapi: "3.0.0",
    info: {
      title: "AsyncAPI",
      version: "1.0.0"
    },
    channels: {
      "data.primitives": {
        address: "data.primitives"
      },
      "data.arrays": {
        address: "data.arrays"
      }
    },
    operations: {
      publishPrimitiveTypes: {
        action: "send",
        channel: {
          $ref: "#/channels/data.primitives"
        }
      },
      publishArrayTypes: {
        action: "send",
        channel: {
          $ref: "#/channels/data.arrays"
        }
      }
    },
    components: {
      schemas: {
        PrimitiveTypesMessage: {
          type: "object",
          properties: {
            stringField: { type: "string" },
            int32Field: { type: "integer", format: "int32" },
            int64Field: { type: "integer", format: "int64" },
            float32Field: { type: "number", format: "float" },
            float64Field: { type: "number", format: "double" },
            booleanField: { type: "boolean" },
            dateTimeField: { type: "string", format: "date-time" },
            durationField: { type: "string", format: "duration" },
            urlField: { type: "string", format: "uri" }
          },
          required: [
            "stringField", "int32Field", "int64Field", "float32Field",
            "float64Field", "booleanField", "dateTimeField", "durationField", "urlField"
          ]
        },
        ArrayTypesMessage: {
          type: "object", 
          properties: {
            stringArray: {
              type: "array",
              items: { type: "string" }
            },
            numberArray: {
              type: "array", 
              items: { type: "integer", format: "int32" }
            },
            objectArray: {
              type: "array",
              items: {
                $ref: "#/components/schemas/OrderItem"
              }
            }
          },
          required: ["stringArray", "numberArray", "objectArray"]
        },
        OrderItem: {
          type: "object",
          properties: {
            productId: { type: "string" },
            quantity: { type: "integer", format: "int32" }
          },
          required: ["productId", "quantity"]
        }
      }
    }
  }
}