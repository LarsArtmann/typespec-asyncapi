export interface PlaygroundExample {
  id: string;
  label: string;
  hint: string;
  source: string;
}

export const playgroundExamples: PlaygroundExample[] = [
  {
    id: "kafka",
    label: "Kafka",
    hint: "Channel + partitions binding",
    source: `import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@service(#{ title: "Orders" })
namespace Orders;

model OrderPlaced {
  orderId: string;
  total: decimal;
  placedAt: utcDateTime;
}

@channel("orders.placed")
@publish
@protocol(#{ protocol: "kafka", topic: "orders.placed", partitions: 6 })
op publishOrderPlaced(): OrderPlaced;
`,
  },
  {
    id: "mqtt",
    label: "MQTT",
    hint: "QoS + retain, operation placement",
    source: `import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@service(#{ title: "Sensors" })
namespace Sensors;

model Reading {
  sensorId: string;
  celsius: float32;
  at: utcDateTime;
}

@channel("sensors.reading")
@publish
@protocol(#{ protocol: "mqtt", qos: 1, retain: false })
op publishReading(): Reading;
`,
  },
  {
    id: "websocket",
    label: "WebSocket",
    hint: "Chat messages over ws",
    source: `import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@service(#{ title: "Chat" })
namespace Chat;

model ChatMessage {
  room: string;
  author: string;
  text: string;
  sentAt: utcDateTime;
}

@channel("chat.messages")
@publish
@protocol(#{ protocol: "ws" })
op publishMessage(): ChatMessage;
`,
  },
  {
    id: "both",
    label: "Two channels",
    hint: "One namespace, two protocols",
    source: `import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@service(#{ title: "Inventory" })
namespace Inventory;

@message(#{ title: "StockLevel" })
model StockLevel {
  sku: string;
  available: int32;
}

@channel("inventory.stock")
@subscribe
@protocol(#{ protocol: "kafka", topic: "inventory-stock" })
op onStockLevel(): StockLevel;

@channel("inventory.alerts")
@publish
@protocol(#{ protocol: "mqtt", qos: 2 })
op publishAlert(): StockLevel;
`,
  },
];

export const defaultExampleId = "kafka";
