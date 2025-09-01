// Test Standard AsyncAPI Binding Generation
// This tests the migration from custom bindings to official AsyncAPI bindings

import "@larsartmann/typespec-asyncapi";

using AsyncAPI;

namespace TestStandardBindings;

model UserEvent {
  userId: string;
  action: "created" | "updated" | "deleted";  
  timestamp: utcDateTime;
}

// Test Kafka bindings using the @protocol decorator
@channel("user.events")
@protocol({
  protocol: "kafka",
  binding: {
    groupId: "user-service",
    clientId: "user-publisher",
    bindingVersion: "0.5.0"
  }
})
@publish
op publishUserEvent(): UserEvent;

@channel("user.events") 
@protocol({
  protocol: "kafka",
  binding: {
    groupId: "notification-service", 
    clientId: "user-subscriber",
    bindingVersion: "0.5.0"
  }
})
@subscribe
op subscribeToUserEvents(): UserEvent;

// Test WebSocket bindings
model ChatMessage {
  messageId: string;
  content: string;
  timestamp: utcDateTime;
}

@channel("chat.room")
@protocol({
  protocol: "websocket",
  binding: {
    method: "GET",
    bindingVersion: "0.1.0"
  }
})
@publish 
op sendChatMessage(): ChatMessage;

@channel("chat.room")
@protocol({
  protocol: "websocket", 
  binding: {
    method: "GET",
    query: {
      type: "object",
      properties: {
        roomId: { type: "string" }
      }
    },
    bindingVersion: "0.1.0"
  }
})
@subscribe
op subscribeToChatMessages(): ChatMessage;