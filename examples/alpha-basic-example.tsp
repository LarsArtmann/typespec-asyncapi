// 🚨 ALPHA v0.0.1 BASIC EXAMPLE
// This example shows ONLY the features available in Alpha v0.0.1
// Advanced decorators (@server, @security, @protocol, etc.) are NOT available in Alpha

import "@lars-artmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

namespace AlphaUserEvents;

//
// ✅ ALPHA SUPPORTED: Basic Message Models
//

model UserCreatedPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: utcDateTime;
  accountType: "free" | "premium" | "enterprise";
  metadata?: {
    source: string;
    campaign?: string;
  };
}

model UserUpdatedPayload {
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  updatedAt: utcDateTime;
  changes: string[];
}

//
// ✅ ALPHA SUPPORTED: Basic Message Models (NO @channel on models)
//

// Models define the payload structure only
model UserCreatedChannel {
  payload: UserCreatedPayload;
}

model UserUpdatedChannel {
  payload: UserUpdatedPayload;
}

// ✅ ALPHA SUPPORTED: Parameterized channels
model UserNotificationChannel {
  payload: {
    message: string;
    priority: "low" | "medium" | "high";
    timestamp: utcDateTime;
  };
}

//
// ✅ ALPHA SUPPORTED: @publish and @subscribe decorators
//

// Publisher operations (send messages TO channels)
@channel("user.created")
@publish
op publishUserCreated(): UserCreatedChannel;

@channel("user.updated")
@publish  
op publishUserUpdated(): UserUpdatedChannel;

@channel("user.{userId}.notifications")
@publish
op publishUserNotification(): UserNotificationChannel;

// Subscriber operations (receive messages FROM channels)
@channel("user.created")
@subscribe
op subscribeToUserCreated(): UserCreatedChannel;

@channel("user.updated") 
@subscribe
op subscribeToUserUpdated(): UserUpdatedChannel;

@channel("user.{userId}.notifications")
@subscribe
op subscribeToUserNotifications(): UserNotificationChannel;

//
// ✅ ALPHA SUPPORTED: Multiple operations on same channel
//

model ChatMessageChannel {
  payload: {
    messageId: string;
    userId: string;
    content: string;
    timestamp: utcDateTime;
    roomId: string;
  };
}

// Both publish and subscribe for bidirectional communication
@channel("chat.messages")
@publish
op sendChatMessage(): ChatMessageChannel;

@channel("chat.messages")
@subscribe
op receiveChatMessage(): ChatMessageChannel;

//
// 🚨 NOT SUPPORTED IN ALPHA (Will be added in Beta/v1.0)
//

// ❌ @server decorator - Basic server info only
// @server("kafka-prod", {
//   url: "kafka://events.example.com:9092",
//   protocol: "kafka"
// })

// ❌ @security decorator - No authentication
// @security({
//   name: "apiKey",
//   scheme: { type: "apiKey", in: "header", name: "X-API-Key" }
// })

// ❌ @protocol decorator - No advanced bindings  
// @protocol({
//   protocol: "kafka",
//   binding: { topic: "user-events", groupId: "user-service" }
// })

// ❌ @message decorator - No rich metadata
// @message({
//   name: "UserCreatedEvent",
//   title: "User Registration Event",
//   description: "Triggered when user completes registration"
// })

//
// ✅ COMPILATION COMMANDS FOR ALPHA
//

// Compile this example:
// npx tsp compile alpha-basic-example.tsp --emit @lars-artmann/typespec-asyncapi

// Expected output location:
// tsp-output/@lars-artmann/typespec-asyncapi/AsyncAPI.yaml
// tsp-output/@lars-artmann/typespec-asyncapi/AsyncAPI.json