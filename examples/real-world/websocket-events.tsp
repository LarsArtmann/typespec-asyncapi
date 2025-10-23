import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

/**
 * Real-World WebSocket Events Example
 *
 * This example demonstrates a real-time collaboration platform
 * using WebSocket for live updates and notifications.
 */

namespace Collaboration;

/**
 * User joined a collaboration session
 */
@message(#{
  name: "UserJoined",
  title: "User Joined Session",
  contentType: "application/json",
  description: "Emitted when a user joins a WebSocket collaboration session"
})
model UserJoined {
  sessionId: string;
  userId: string;
  username: string;
  role: "owner" | "editor" | "viewer";
  timestamp: utcDateTime;
}

/**
 * User left a collaboration session
 */
@message(#{
  name: "UserLeft",
  title: "User Left Session", 
  contentType: "application/json",
  description: "Emitted when a user leaves a WebSocket collaboration session"
})
model UserLeft {
  sessionId: string;
  userId: string;
  timestamp: utcDateTime;
}

/**
 * Real-time cursor position update
 */
@message(#{
  name: "CursorUpdate",
  title: "Cursor Position Update",
  contentType: "application/json",
  description: "Emitted when a user moves their cursor in the document"
})
model CursorUpdate {
  sessionId: string;
  userId: string;
  position: CursorPosition;
  timestamp: utcDateTime;
}

/**
 * Cursor position coordinates
 */
model CursorPosition {
  x: int32;
  y: int32;
  documentId?: string;
}

/**
 * Document content change
 */
model DocumentChange {
  sessionId: string;
  userId: string;
  documentId: string;
  operation: TextOperation;
  timestamp: utcDateTime;
}

/**
 * Text operation for collaborative editing
 */
model TextOperation {
  type: "insert" | "delete" | "retain";
  position: int32;
  content?: string;
  length?: int32;
}

/**
 * Chat message in collaboration session
 */
model ChatMessage {
  sessionId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: utcDateTime;
}

/**
 * Notification for session events
 */
model SessionNotification {
  sessionId: string;
  type: "document_saved" | "user_invited" | "session_locked" | "session_unlocked";
  message: string;
  data?: Record<string>;
  timestamp: utcDateTime;
}

/**
 * Publish user joined events when someone joins a session
 */
@channel("session.{sessionId}.user.joined")
@publish
op publishUserJoined(sessionId: string): UserJoined;

/**
 * Publish user left events when someone leaves a session
 */
@channel("session.{sessionId}.user.left")
@publish
op publishUserLeft(sessionId: string): UserLeft;

/**
 * Publish cursor updates for real-time collaboration
 */
@channel("session.{sessionId}.cursor")
@publish
op publishCursorUpdate(sessionId: string): CursorUpdate;

/**
 * Publish document changes for collaborative editing
 */
@channel("session.{sessionId}.document.{documentId}.changes")
@publish
op publishDocumentChange(sessionId: string, documentId: string): DocumentChange;

/**
 * Publish chat messages
 */
@channel("session.{sessionId}.chat")
@publish
op publishChatMessage(sessionId: string): ChatMessage;

/**
 * Publish session notifications
 */
@channel("session.{sessionId}.notifications")
@publish
op publishSessionNotification(sessionId: string): SessionNotification;

/**
 * Subscribe to session updates from other users
 */
@channel("session.{sessionId}.updates")
@subscribe
op onSessionUpdates(sessionId: string): SessionUpdate;

/**
 * Generic session update event
 */
model SessionUpdate {
  sessionId: string;
  type: "user_joined" | "user_left" | "cursor_update" | "document_change" | "chat_message";
  payload: Record<string>;
  timestamp: utcDateTime;
}