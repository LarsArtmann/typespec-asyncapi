import "@lars-artmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

@server("broker", #{
  url: "kafka://broker1:9092",
  protocol: "kafka",
  description: "Kafka production cluster"
})
namespace KafkaEvents;

@bindings(#{
  kafka: #{
    bindingVersion: "0.5.0"
  }
})
model OrderCreated {
  @doc("Unique order identifier")
  orderId: string;
  customerId: string;
  total: decimal;
  items: string[];
}

@bindings(#{
  kafka: #{
    bindingVersion: "0.5.0"
  }
})
@channel("orders.created")
@publish
op publishOrderCreated(): OrderCreated;

@channel("orders.created")
@subscribe
op subscribeOrderCreated(): OrderCreated;
