import "@lars-artmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

@server("development", #{
  url: "localhost:9092",
  protocol: "kafka",
  description: "Local development Kafka"
})
namespace SimpleChatAPI;

model ChatMessagePayload {
  messageId: string;
  userId: string;
  username: string;
  content: string;
  timestamp: utcDateTime;
  channelId: string;
}

@channel("chat.messages")
@publish
op sendChatMessage(): ChatMessagePayload;

@channel("chat.messages")
@subscribe
op receiveChatMessages(): ChatMessagePayload;

model UserJoinedPayload {
  userId: string;
  username: string;
  channelId: string;
  joinedAt: utcDateTime;
}

@channel("chat.user.joined")
@publish
op publishUserJoined(): UserJoinedPayload;

@channel("chat.user.joined")
@subscribe
op subscribeUserJoined(): UserJoinedPayload;
