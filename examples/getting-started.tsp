// 🚀 Getting Started with TypeSpec AsyncAPI Emitter
// 
// This is the simplest example to get started with AsyncAPI generation.
// For comprehensive real-world examples, see:
// - Kafka Events: examples/real-world/kafka-events.tsp (e-commerce streaming)
// - WebSocket Events: examples/real-world/websocket-events.tsp (real-time collaboration)
// - HTTP Events: examples/real-world/http-events.tsp (microservices webhooks)
// - Multi-Protocol: examples/real-world/multi-protocol-simple.tsp (IoT integration)

import "@lars-artmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

namespace GettingStarted;

// Define a simple message payload
model UserMessage {
  userId: string;
  message: string;
  timestamp: utcDateTime;
}

// Create operations with @channel, @publish, and @subscribe decorators
@channel("user.messages")
@publish
op sendUserMessage(): UserMessage;

// Subscribe to user messages for real-time updates
@channel("user.notifications")
@subscribe  
op receiveUserNotification(): Notification;

// Simple notification model
model Notification {
  type: "info" | "warning" | "error";
  message: string;
  userId?: string;
  timestamp: utcDateTime;
}

@channel("user.messages")
@subscribe
op receiveUserMessage(): UserMessage;

// ✨ That's it! This generates a complete AsyncAPI 3.0 specification
// Output will be in: tsp-output/@lars-artmann/typespec-asyncapi/AsyncAPI.yaml