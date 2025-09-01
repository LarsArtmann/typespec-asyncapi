// Comprehensive Kafka Binding Example - AsyncAPI 3.0 + Kafka Bindings v0.5.0
// This example demonstrates all official Kafka binding features from:
// https://github.com/asyncapi/bindings/tree/master/kafka

import "@typespec/asyncapi";

using AsyncAPI;

@asyncapi({
  info: {
    title: "Kafka Comprehensive Bindings Example",
    version: "1.0.0",
    description: "Complete demonstration of AsyncAPI Kafka Bindings v0.5.0 specification"
  },
  servers: {
    kafkaCluster: {
      host: "kafka.example.com:9092",
      protocol: "kafka",
      description: "Production Kafka cluster",
      protocolVersion: "3.4.0",
      bindings: {
        kafka: {
          schemaRegistryUrl: "https://schema-registry.example.com",
          schemaRegistryVendor: "confluent",
          bindingVersion: "0.5.0"
        }
      }
    }
  }
})
namespace KafkaDemo;

// === SERVER BINDINGS EXAMPLE ===
// Server-level Kafka configuration

// === CHANNEL BINDINGS - Topic Configuration ===

model UserEventPayload {
  userId: string;
  action: "created" | "updated" | "deleted";
  timestamp: utcDateTime;
  metadata: Record<unknown>;
}

@channel("user.events")
model UserEventChannel {
  @message({
    name: "UserEvent",
    title: "User Lifecycle Event",
    description: "Events related to user account lifecycle",
    bindings: {
      kafka: {
        key: {
          type: "string",
          description: "User ID for partitioning"
        },
        schemaIdLocation: "header",
        schemaIdPayloadEncoding: "apicurio-new",
        schemaLookupStrategy: "TopicIdStrategy",
        bindingVersion: "0.5.0"
      }
    }
  })
  payload: UserEventPayload;
}

// === OPERATION BINDINGS - Publisher Configuration ===

// Publisher with comprehensive Kafka bindings
@protocol({
  protocol: "kafka",
  binding: {
    // Operation-level Kafka bindings v0.5.0
    groupId: "user-service-publishers",
    clientId: "user-event-publisher",
    bindingVersion: "0.5.0"
  }
})
@publish
op publishUserEvent(): UserEventChannel;

// Consumer with detailed configuration
@protocol({
  protocol: "kafka", 
  binding: {
    groupId: "notification-service",
    clientId: "notification-consumer",
    bindingVersion: "0.5.0"
  }
})
@subscribe
op subscribeToUserEvents(): UserEventChannel;

// === ADVANCED KAFKA FEATURES ===

model OrderEventPayload {
  orderId: string;
  customerId: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  amount: float64;
  currency: string;
  items: Array<{
    productId: string;
    quantity: int32;
    price: float64;
  }>;
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

// Channel with advanced topic configuration
@channel("orders.events")
model OrderEventChannel {
  @message({
    name: "OrderEvent",
    title: "Order State Change Event",
    description: "Critical order processing events with guaranteed delivery",
    bindings: {
      kafka: {
        key: {
          type: "object",
          properties: {
            customerId: { type: "string" },
            orderId: { type: "string" }
          },
          description: "Composite key for optimal partitioning"
        },
        schemaIdLocation: "payload",
        schemaIdPayloadEncoding: "confluent",
        schemaLookupStrategy: "RecordNameStrategy",
        bindingVersion: "0.5.0"
      }
    }
  })
  payload: OrderEventPayload;
}

// High-throughput publisher with custom configuration
@protocol({
  protocol: "kafka",
  binding: {
    groupId: "order-service",
    clientId: "order-publisher-01",
    bindingVersion: "0.5.0"
  }
})
@publish
op publishOrderEvent(): OrderEventChannel;

// Consumer group with specific processing guarantees
@protocol({
  protocol: "kafka",
  binding: {
    groupId: "payment-processor",
    clientId: "payment-consumer",
    bindingVersion: "0.5.0"
  }
})
@subscribe
op processOrderPayment(): OrderEventChannel;

// === ANALYTICS EVENTS WITH PARTITIONING STRATEGY ===

model AnalyticsEventPayload {
  sessionId: string;
  userId?: string;
  eventType: "page_view" | "click" | "conversion" | "error";
  properties: Record<unknown>;
  timestamp: utcDateTime;
  sourceSystem: string;
}

@channel("analytics.events")
model AnalyticsEventChannel {
  @message({
    name: "AnalyticsEvent", 
    title: "User Analytics Event",
    description: "High-volume analytics events for data processing pipeline",
    bindings: {
      kafka: {
        key: {
          type: "string",
          description: "Session ID for maintaining event order per session"
        },
        schemaIdLocation: "header",
        schemaIdPayloadEncoding: "apicurio-legacy", 
        schemaLookupStrategy: "TopicRecordNameStrategy",
        bindingVersion: "0.5.0"
      }
    }
  })
  payload: AnalyticsEventPayload;
}

// High-volume analytics publisher
@protocol({
  protocol: "kafka",
  binding: {
    groupId: "analytics-collectors",
    clientId: "web-analytics-publisher",
    bindingVersion: "0.5.0"
  }
})
@publish
op publishAnalyticsEvent(): AnalyticsEventChannel;

// Stream processing consumer
@protocol({
  protocol: "kafka",
  binding: {
    groupId: "analytics-stream-processor",
    clientId: "stream-processor-01", 
    bindingVersion: "0.5.0"
  }
})
@subscribe  
op processAnalyticsStream(): AnalyticsEventChannel;

// === ERROR HANDLING AND DLQ PATTERN ===

model ErrorEventPayload {
  originalTopic: string;
  originalPartition: int32;
  originalOffset: int64;
  originalMessage: Record<unknown>;
  errorCode: string;
  errorMessage: string;
  errorTimestamp: utcDateTime;
  retryCount: int32;
  maxRetries: int32;
}

@channel("errors.dlq")
model ErrorChannel {
  @message({
    name: "ErrorEvent",
    title: "Dead Letter Queue Event", 
    description: "Failed messages sent to dead letter queue for manual processing",
    bindings: {
      kafka: {
        key: {
          type: "string",
          description: "Original message key preserved for debugging"
        },
        schemaIdLocation: "header",
        schemaIdPayloadEncoding: "confluent",
        schemaLookupStrategy: "TopicNameStrategy",
        bindingVersion: "0.5.0"
      }
    }
  })
  payload: ErrorEventPayload;
}

@protocol({
  protocol: "kafka",
  binding: {
    groupId: "error-handlers",
    clientId: "dlq-processor",
    bindingVersion: "0.5.0"
  }
})
@publish
op publishErrorEvent(): ErrorChannel;

@protocol({
  protocol: "kafka",
  binding: {
    groupId: "manual-error-review",
    clientId: "error-reviewer",
    bindingVersion: "0.5.0"
  }
})
@subscribe
op processErrorQueue(): ErrorChannel;