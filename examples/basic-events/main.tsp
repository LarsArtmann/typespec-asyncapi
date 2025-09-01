import "@typespec/asyncapi";

using AsyncAPI;

/**
 * Simple Event-Driven Chat API
 * Demonstrates basic usage of TypeSpec AsyncAPI decorators
 */

@asyncapi({
  info: {
    title: "Simple Chat Events API",
    version: "1.0.0",
    description: "Basic example showing TypeSpec AsyncAPI emitter usage"
  },
  servers: {
    development: {
      host: "localhost:9092",
      protocol: "kafka",
      description: "Local development Kafka"
    }
  }
})
namespace SimpleChatAPI;

// Basic message payload
model ChatMessagePayload {
  messageId: string;
  userId: string;
  username: string;
  content: string;
  timestamp: utcDateTime;
  channelId: string;
}

// Simple channel definition
@channel("chat.messages")
model ChatChannel {
  @message({
    name: "ChatMessage",
    title: "Chat Message",
    description: "A message sent in a chat channel"
  })
  payload: ChatMessagePayload;
}

// Basic publish operation
@publish
op sendChatMessage(): ChatChannel;

// Basic subscribe operation
@subscribe
op receiveChatMessages(): ChatChannel;

// User events
model UserJoinedPayload {
  userId: string;
  username: string;
  channelId: string;
  joinedAt: utcDateTime;
}

@channel("chat.user.joined")
model UserJoinedChannel {
  @message({
    name: "UserJoined",
    title: "User Joined Channel", 
    description: "Event when user joins a chat channel"
  })
  payload: UserJoinedPayload;
}

@publish
op publishUserJoined(): UserJoinedChannel;

@subscribe
op subscribeUserJoined(): UserJoinedChannel;