// =============================================================================
// Canonical AsyncAPI Spec: Real-Time Chat (WebSocket)
//
// A WebSocket chat application — bidirectional messaging, user presence,
// typing indicators. Ported from the AsyncAPI Gitter-style streaming example.
//
// Real-world patterns: WebSocket protocol, bidirectional messaging, user
// presence, message arrays, timestamped events, soft-delete messages.
// =============================================================================

@service(#{ title: "Real-Time Chat API", version: "1.0.0" })
@server("production", #{ url: "chat.example.com", protocol: "wss" })
@defaultContentType("application/json")
namespace ChatAPI;

// --- User model ---
model User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  status: "online" | "away" | "busy" | "offline";
  lastSeen: string;
}

// --- Chat message ---
model ChatMessage {
  id: string;
  text: string;
  userId: string;
  roomId: string;
  createdAt: string;
  updatedAt: string;
  edited: boolean = false;
  mentions: string[];
  replyTo: string;
  reactions: MessageReaction[];
}

model MessageReaction {
  emoji: string;
  userId: string;
  createdAt: string;
}

// --- Typing indicator ---
model TypingEvent {
  userId: string;
  roomId: string;
  isTyping: boolean;
  timestamp: string;
}

// --- Room model ---
model ChatRoom {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  createdAt: string;
  isPrivate: boolean = false;
  unreadCount: int32 = 0;
}

// --- Presence event ---
model PresenceEvent {
  userId: string;
  status: "online" | "away" | "busy" | "offline";
  lastSeen: string;
}

// --- Message deleted event ---
model MessageDeletedEvent {
  messageId: string;
  roomId: string;
  deletedBy: string;
  deletedAt: string;
  reason: "user_request" | "moderator_action" | "policy_violation";
}

// --- Operations ---
@doc("Send a chat message to a room")
@channel("chat.rooms.{roomId}.messages")
@publish
op sendMessage(roomId: string): ChatMessage;

@doc("Receive new chat messages from a room")
@channel("chat.rooms.{roomId}.messages")
@subscribe
op receiveMessages(roomId: string): ChatMessage;

@doc("User is typing in a room")
@channel("chat.rooms.{roomId}.typing")
@publish
op sendTypingIndicator(roomId: string): TypingEvent;

@doc("Receive typing indicators")
@channel("chat.rooms.{roomId}.typing")
@subscribe
op receiveTypingIndicator(roomId: string): TypingEvent;

@doc("User presence updates")
@channel("chat.users.{userId}.presence")
@publish
op publishPresence(userId: string): PresenceEvent;

@doc("Subscribe to user presence")
@channel("chat.users.{userId}.presence")
@subscribe
op subscribePresence(userId: string): PresenceEvent;

@doc("Message deleted notification")
@channel("chat.rooms.{roomId}.messages.deleted")
@publish
op publishMessageDeleted(roomId: string): MessageDeletedEvent;

@doc("Receive message deletion notifications")
@channel("chat.rooms.{roomId}.messages.deleted")
@subscribe
op subscribeMessageDeleted(roomId: string): MessageDeletedEvent;
