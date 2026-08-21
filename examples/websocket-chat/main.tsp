/**
 * WebSocket Chat — bidirectional messaging with headers and correlation.
 *
 * Demonstrates: ws protocol with channel bindings (method/query/headers at
 * CHANNEL placement), @header, @correlationId, @reply, generic models
 * (Page<T> -> PageChatMessage schema naming).
 */
import "@lars-artmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

@service(#{ title: "Chat WebSocket API" })
@apiVersion("1.2.0")
@server("chat", #{
  url: "ws://chat.example.com:8080/ws",
  protocol: "ws",
  description: "Chat websocket gateway"
})
namespace Chat;

model ChatMessage {
  @minLength(1)
  @maxLength(512)
  text: string;

  @doc("Author of the message.")
  author: string;

  sentAt: utcDateTime;
}

@doc("A message routed to one specific room.")
@correlationId("$message.header#/x-correlation-id")
model DirectMessage {
  @header("x-room", "general")
  @header("x-priority", "normal")
  message: ChatMessage;

  room: string;
}

model Page<T> {
  items: T[];
  @minValue(0)
  total: int32;
}

model RoomHistoryPage {
  page: Page<ChatMessage>;
}

@doc("Send a chat message to a room.")
@channel("chat/send")
@publish
@protocol(#{
  protocol: "ws",
  method: "POST",
  query: #{
    room: "general"
  }
})
op sendChatMessage(): DirectMessage;

@doc("Fetch recent messages; the reply carries the history page.")
@channel("chat/history")
@subscribe
@reply(RoomHistoryPage, "$message.header#/replyTo")
op requestHistory(): ChatMessage;
