import "@lars-artmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

@server("production", #{
  url: "chat.example.com",
  protocol: "wss",
  description: "Production WebSocket server"
})
namespace SimpleChat;

model ChatMessage {
  userId: string;
  text: string;
  timestamp: utcDateTime;
}

@channel("chat.messages")
@publish
op sendMessage(): ChatMessage;

@channel("chat.messages")
@subscribe
op receiveMessage(): ChatMessage;
