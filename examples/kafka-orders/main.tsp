/**
 * Kafka Orders — protocol bindings with spec-correct field placement and
 * SASL/SCRAM security.
 *
 * Demonstrates: @protocol with kafka channel fields (topic partitions/
 * replicas at CHANNEL placement, groupId at OPERATION placement via
 * @bindings), @security scramSha512, @operationSecurity, model
 * inheritance with @discriminator.
 */
import "@lars-artmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

@service(#{ title: "Orders Event API" })
@apiVersion("2.1.0")
@server("kafka-prod", #{
  url: "kafka.orders.prod:9092",
  protocol: "kafka",
  description: "Production order broker"
})
@security(#{
  name: "order-broker-scram",
  scheme: #{
    type: "scramSha512"
  }
})
@security(#{
  name: "audit-reader",
  scheme: #{
    type: "httpApiKey",
    in: "header",
    name: "X-Audit-Key"
  }
})
namespace Orders;

model OrderEvent {
  orderId: string;
  @minValue(1)
  amount: decimal;
  createdAt: utcDateTime;
}

@discriminator("kind")
model OrderCreated extends OrderEvent {
  kind: "created";
  customerId: string;
}

@discriminator("kind")
model OrderCancelled extends OrderEvent {
  kind: "cancelled";
  reason: string;
}

@doc("All order lifecycle events, discriminated by kind.")
union OrderLifecycle {
  created: OrderCreated;
  cancelled: OrderCancelled;
}

@doc("Publish order lifecycle events to the orders topic.")
@channel("orders.events")
@publish
@protocol(#{
  protocol: "kafka",
  topic: "orders-events",
  partitions: 6,
  replicationFactor: 3
})
@bindings(#{
  kafka: #{
    groupId: #{ type: "string" }
  }
})
@tags(#[ "orders", "kafka" ])
op publishOrderEvent(): OrderLifecycle;

@doc("Subscribe to audit events (restricted).")
@channel("orders.audit")
@subscribe
@operationSecurity(#{ name: "audit-reader" })
op receiveAuditEvent(): OrderEvent;
