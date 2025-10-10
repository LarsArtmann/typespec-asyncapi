import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

namespace TestProtocol;

@message(#{
  name: "OrderCreated",
  title: "Order Created Event"
})
model OrderCreated {
  orderId: string;
  userId: string;
  totalAmount: float64;
  timestamp: utcDateTime;
}

@protocol(#{
  protocol: "kafka",
  binding: #{
    topic: "orders.created",
    key: "orderId",
    partitions: 6,
    replicas: 3
  }
})
@channel("orders.created")
@publish
op publishOrderCreated(): OrderCreated;