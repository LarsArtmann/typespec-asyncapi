/**
 * Core Test Fixtures for TypeSpec-AsyncAPI
 * 
 * Essential TypeSpec code snippets and expected AsyncAPI outputs for core functionality.
 * Split from massive 1822-line test-fixtures.ts for maintainability.
 */

import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js"

/**
 * Core TypeSpec code snippets for fundamental concepts
 */
export const CoreTypeSpecFixtures = {
  // Core Concepts Fixtures
  coreConceptsService: `
    @service({
      title: "Order Service",
      version: "1.0.0"
    })
    namespace OrderService {
      @channel("orders/{orderId}")
      @publish
      op createOrder(@path orderId: string, @body order: CreateOrderRequest): CreateOrderResponse;
      
      @channel("orders/{orderId}/status")
      @subscribe  
      op orderStatusUpdated(@path orderId: string): OrderStatusEvent;
    }
    
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
    
    @message("OrderStatusEvent")
    model OrderStatusEvent {
      orderId: string;
      status: string;
      timestamp: utcDateTime;
    }
  `,

  // Data Types Fixtures
  dataTypesPrimitives: `
    @service({ title: "Data Types Service" })
    namespace DataTypesService {
      
      @message("PrimitiveTypesMessage")
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
      
      @message("ArrayTypesMessage")
      model ArrayTypesMessage {
        stringArray: string[];
        numberArray: int32[];
        objectArray: OrderItem[];
      }
      
      @message("UnionTypesMessage")
      model UnionTypesMessage {
        statusUnion: "active" | "inactive" | "pending";
        typeUnion: string | int32 | boolean;
      }
      
      @message("OptionalFieldsMessage")
      model OptionalFieldsMessage {
        requiredField: string;
        optionalField?: string;
        nullableField: string | null;
      }
    }
  `,

  dataTypesRecords: `
    @service({ title: "Records Service" })
    namespace RecordsService {
      
      @message("RecordTypesMessage")
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
    }
  `,

  dataTypesEnums: `
    @service({ title: "Enums Service" })
    namespace EnumsService {
      
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
      
      @message("EnumMessage")
      model EnumMessage {
        status: OrderStatus;
        priority: Priority;
      }
    }
  `,

  // Operations & Channels Fixtures
  operationsPublishSubscribe: `
    @service({ title: "Event Service" })
    namespace EventService {
      
      @channel("user-events")
      @publish
      op publishUserEvent(@body event: UserEvent): void;
      
      @channel("user-events") 
      @subscribe
      op subscribeToUserEvents(): UserEvent;
      
      @channel("orders/{orderId}/updates")
      @publish
      op publishOrderUpdate(@path orderId: string, @body update: OrderUpdate): void;
      
      @channel("orders/{orderId}/updates")
      @subscribe
      op subscribeToOrderUpdates(@path orderId: string): OrderUpdate;
    }
    
    @message("UserEvent")
    model UserEvent {
      userId: string;
      eventType: "login" | "logout" | "profile_updated";
      timestamp: utcDateTime;
      metadata: Record<string>;
    }
    
    @message("OrderUpdate")
    model OrderUpdate {
      orderId: string;
      status: string;
      updatedAt: utcDateTime;
      changes: Record<string>;
    }
  `,

  operationsRequestReply: `
    @service({ title: "Request Reply Service" })
    namespace RequestReplyService {
      
      @channel("order-requests")
      @publish
      op requestOrderValidation(@body request: OrderValidationRequest): void;
      
      @channel("order-responses")
      @subscribe
      op receiveOrderValidation(): OrderValidationResponse;
    }
    
    @message("OrderValidationRequest")
    model OrderValidationRequest {
      orderId: string;
      items: OrderItem[];
      correlationId: string;
    }
    
    @message("OrderValidationResponse")
    model OrderValidationResponse {
      orderId: string;
      isValid: boolean;
      errors: string[];
      correlationId: string;
    }
  `,

  // Schema & Models Fixtures
  schemasEventSourcing: `
    @service({ title: "Event Sourcing Service" })
    namespace EventSourcingService {
      
      @message("DomainEvent")
      model DomainEvent {
        eventId: string;
        aggregateId: string;
        aggregateVersion: int32;
        eventType: string;
        occurredAt: utcDateTime;
        payload: Record<string>;
      }
      
      @message("OrderCreatedEvent")
      model OrderCreatedEvent extends DomainEvent {
        eventType: "OrderCreated";
        payload: OrderCreatedPayload;
      }
      
      model OrderCreatedPayload {
        customerId: string;
        items: OrderItem[];
        totalAmount: float64;
      }
      
      @message("OrderCancelledEvent") 
      model OrderCancelledEvent extends DomainEvent {
        eventType: "OrderCancelled";
        payload: OrderCancelledPayload;
      }
      
      model OrderCancelledPayload {
        reason: string;
        cancelledBy: string;
      }
    }
  `,

  schemasVersioning: `
    @service({ title: "Versioned Schema Service" })
    namespace VersionedSchemaService {
      
      @message("UserEventV1")
      model UserEventV1 {
        schemaVersion: "1.0";
        userId: string;
        action: string;
        timestamp: utcDateTime;
      }
      
      @message("UserEventV2")
      model UserEventV2 {
        schemaVersion: "2.0";
        userId: string;
        action: string;
        timestamp: utcDateTime;
        metadata: UserEventMetadata;
      }
      
      model UserEventMetadata {
        sessionId: string;
        userAgent: string;
        ipAddress: string;
      }
    }
  `,

  // Decorators Fixtures  
  decoratorsChannel: `
    @service({ title: "Channel Decorators Service" })
    namespace ChannelDecoratorsService {
      
      @channel("simple-channel")
      @publish
      op publishSimple(@body data: SimpleMessage): void;
      
      @channel("parameterized/{userId}/events/{eventType}")
      @subscribe
      op subscribeParameterized(@path userId: string, @path eventType: string): ParameterizedMessage;
    }
    
    @message("SimpleMessage")
    model SimpleMessage {
      content: string;
    }
    
    @message("ParameterizedMessage")
    model ParameterizedMessage {
      userId: string;
      eventType: string;
      payload: Record<string>;
    }
  `,

  decoratorsMessage: `
    @service({ title: "Message Decorators Service" })
    namespace MessageDecoratorsService {
      
      @channel("messages")
      @publish
      op publishMessage(@body msg: MessageWithDecorators): void;
    }
    
    @message("MessageWithDecorators")
    model MessageWithDecorators {
      @header
      messageId: string;
      
      @header
      correlationId?: string;
      
      payload: MessagePayload;
      
      @correlationId
      traceId: string;
    }
    
    model MessagePayload {
      data: string;
      timestamp: utcDateTime;
    }
  `,

  // Best Practices Fixtures
  bestPracticesNaming: `
    @service({ title: "Naming Conventions Service" })
    namespace NamingConventionsService {
      
      // Good: Descriptive, follows kebab-case for channels
      @channel("user-profile-updates")
      @publish
      op publishUserProfileUpdate(@body event: UserProfileUpdatedEvent): void;
      
      // Good: Clear action-oriented operation names
      @channel("order-fulfillment-requests") 
      @subscribe
      op processOrderFulfillmentRequest(): OrderFulfillmentRequestedEvent;
      
      // Good: Descriptive message names with Event suffix
      @channel("inventory-level-changes")
      @publish
      op publishInventoryLevelChange(@body event: InventoryLevelChangedEvent): void;
    }
    
    // Good: Clear, descriptive model names
    @message("UserProfileUpdatedEvent")
    model UserProfileUpdatedEvent {
      userId: string;
      updatedFields: string[];
      previousValues: Record<string>;
      newValues: Record<string>;
      updatedAt: utcDateTime;
      updatedBy: string;
    }
    
    @message("OrderFulfillmentRequestedEvent")
    model OrderFulfillmentRequestedEvent {
      orderId: string;
      customerId: string;
      warehouseId: string;
      items: FulfillmentItem[];
      requestedBy: utcDateTime;
      priority: "standard" | "expedited" | "urgent";
    }
    
    model FulfillmentItem {
      productId: string;
      quantity: int32;
      warehouseLocation: string;
    }
    
    @message("InventoryLevelChangedEvent")
    model InventoryLevelChangedEvent {
      productId: string;
      warehouseId: string;
      previousLevel: int32;
      newLevel: int32;
      changeReason: "sale" | "restock" | "adjustment" | "damage";
      changedAt: utcDateTime;
    }
  `
}

/**
 * Expected AsyncAPI outputs for core concepts validation
 */
export const CoreAsyncAPIFixtures = {
  coreConceptsExpected: {
    asyncapi: "3.0.0",
    info: {
      title: "Order Service",
      version: "1.0.0"
    },
    channels: {
      "orders/{orderId}": {
        address: "orders/{orderId}",
        parameters: {
          orderId: {
            schema: { type: "string" }
          }
        },
        messages: {
          "createOrder": {
            $ref: "#/components/messages/CreateOrderRequest"
          }
        }
      },
      "orders/{orderId}/status": {
        address: "orders/{orderId}/status",
        parameters: {
          orderId: {
            schema: { type: "string" }
          }
        },
        messages: {
          "OrderStatusEvent": {
            $ref: "#/components/messages/OrderStatusEvent"
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
      schemas: {},
      messages: {
        CreateOrderRequest: {
          payload: {
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
          }
        },
        OrderStatusEvent: {
          payload: {
            type: "object",
            properties: {
              orderId: { type: "string" },
              status: { type: "string" },
              timestamp: { type: "string", format: "date-time" }
            },
            required: ["orderId", "status", "timestamp"]
          }
        }
      },
      securitySchemes: {}
    }
  },

  dataTypesPrimitivesExpected: {
    asyncapi: "3.0.0",
    info: {
      title: "Data Types Service"
    },
    channels: {},
    operations: {},
    components: {
      schemas: {},
      messages: {
        PrimitiveTypesMessage: {
          payload: {
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
          }
        },
        ArrayTypesMessage: {
          payload: {
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
          }
        }
      },
      securitySchemes: {}
    }
  }
}