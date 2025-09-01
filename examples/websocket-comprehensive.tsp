// Comprehensive WebSocket Binding Example - AsyncAPI 3.0 + WebSocket Bindings v0.1.0
// This example demonstrates all official WebSocket binding features from:
// https://github.com/asyncapi/bindings/tree/master/websockets

import "@typespec/asyncapi";

using AsyncAPI;

@asyncapi({
  info: {
    title: "WebSocket Comprehensive Bindings Example",
    version: "1.0.0",
    description: "Complete demonstration of AsyncAPI WebSocket Bindings v0.1.0 specification"
  },
  servers: {
    websocketServer: {
      host: "ws://api.example.com/v1/websocket",
      protocol: "websocket",
      description: "Real-time WebSocket server",
      bindings: {
        ws: {
          bindingVersion: "0.1.0"
        }
      }
    },
    secureWebSocket: {
      host: "wss://api.example.com/v1/secure-websocket",
      protocol: "wss",
      description: "Secure WebSocket server with authentication"
    }
  }
})
namespace WebSocketDemo;

// === BASIC WEBSOCKET CHANNEL BINDINGS ===

model ChatMessagePayload {
  messageId: string;
  roomId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: utcDateTime;
  messageType: "text" | "image" | "file" | "system";
}

@channel("chat.{roomId}")
model ChatChannel {
  @message({
    name: "ChatMessage",
    title: "Chat Room Message",
    description: "Real-time chat messages in a specific room",
    bindings: {
      ws: {
        bindingVersion: "0.1.0"
      }
    }
  })
  payload: ChatMessagePayload;
}

// Basic WebSocket subscription with query parameters
@protocol({
  protocol: "websocket",
  binding: {
    method: "GET",
    query: {
      type: "object",
      properties: {
        roomId: { 
          type: "string",
          description: "Chat room identifier"
        },
        userId: { 
          type: "string",
          description: "User identifier for authorization"
        }
      },
      required: ["roomId", "userId"]
    },
    bindingVersion: "0.1.0"
  }
})
@subscribe
op subscribeToChatRoom(): ChatChannel;

// WebSocket message publishing
@protocol({
  protocol: "websocket", 
  binding: {
    method: "GET",
    bindingVersion: "0.1.0"
  }
})
@publish
op sendChatMessage(): ChatChannel;

// === AUTHENTICATED WEBSOCKET WITH HEADERS ===

model NotificationPayload {
  notificationId: string;
  userId: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  data?: Record<unknown>;
  timestamp: utcDateTime;
  expiresAt?: utcDateTime;
}

@channel("notifications.{userId}")
model NotificationChannel {
  @message({
    name: "UserNotification",
    title: "User Notification",
    description: "Real-time notifications for authenticated users",
    bindings: {
      ws: {
        bindingVersion: "0.1.0"
      }
    }
  })
  payload: NotificationPayload;
}

// Authenticated WebSocket connection with headers and query parameters
@protocol({
  protocol: "websocket",
  binding: {
    method: "GET",
    query: {
      type: "object", 
      properties: {
        token: { 
          type: "string",
          description: "JWT authentication token"
        },
        version: { 
          type: "string",
          enum: ["v1", "v2"],
          description: "API version"
        }
      },
      required: ["token"]
    },
    headers: {
      type: "object",
      properties: {
        "Authorization": {
          type: "string",
          pattern: "^Bearer .+",
          description: "JWT Bearer token for authentication"
        },
        "X-Client-Version": {
          type: "string",
          description: "Client application version"
        },
        "X-Device-ID": {
          type: "string", 
          description: "Unique device identifier"
        },
        "User-Agent": {
          type: "string",
          description: "Client user agent string"
        }
      },
      required: ["Authorization"]
    },
    bindingVersion: "0.1.0"
  }
})
@subscribe
op subscribeToNotifications(): NotificationChannel;

// === LIVE DATA STREAMING ===

model LiveDataPayload {
  streamId: string;
  dataType: "metrics" | "logs" | "events" | "alerts";
  timestamp: utcDateTime;
  source: string;
  data: Record<unknown>;
  metadata: {
    version: string;
    compression?: "gzip" | "deflate";
    encoding?: "json" | "msgpack" | "protobuf";
  };
}

@channel("stream.{dataType}")
model LiveDataChannel {
  @message({
    name: "LiveDataStream",
    title: "Live Data Stream",
    description: "Real-time streaming of live application data",
    bindings: {
      ws: {
        bindingVersion: "0.1.0"
      }
    }
  })
  payload: LiveDataPayload;
}

// High-performance streaming with custom headers
@protocol({
  protocol: "websocket",
  binding: {
    method: "GET",
    query: {
      type: "object",
      properties: {
        streams: {
          type: "array",
          items: { 
            type: "string",
            enum: ["metrics", "logs", "events", "alerts"]
          },
          description: "List of data streams to subscribe to"
        },
        batchSize: {
          type: "integer",
          minimum: 1,
          maximum: 1000,
          default: 100,
          description: "Number of messages to batch together"
        },
        compression: {
          type: "string", 
          enum: ["none", "gzip", "deflate"],
          default: "none",
          description: "Message compression algorithm"
        }
      },
      required: ["streams"]
    },
    headers: {
      type: "object",
      properties: {
        "X-Stream-Format": {
          type: "string",
          enum: ["json", "msgpack", "protobuf"],
          description: "Preferred message format"
        },
        "X-Rate-Limit": {
          type: "integer",
          minimum: 1,
          maximum: 10000,
          description: "Maximum messages per second"
        },
        "Accept-Encoding": {
          type: "string",
          description: "Supported compression algorithms"
        }
      }
    },
    bindingVersion: "0.1.0"
  }
})
@subscribe
op subscribeToLiveData(): LiveDataChannel;

// === GAMING/REAL-TIME UPDATES ===

model GameStatePayload {
  gameId: string;
  playerId?: string;
  eventType: "player_join" | "player_leave" | "game_start" | "game_end" | "state_update";
  gameState: {
    status: "waiting" | "active" | "paused" | "finished";
    players: Array<{
      id: string;
      name: string;
      score: int32;
      status: "active" | "disconnected";
    }>;
    currentRound?: int32;
    timeRemaining?: int32;
  };
  timestamp: utcDateTime;
}

@channel("game.{gameId}")
model GameChannel {
  @message({
    name: "GameUpdate",
    title: "Game State Update",
    description: "Real-time game state synchronization between players",
    bindings: {
      ws: {
        bindingVersion: "0.1.0"
      }
    }
  })
  payload: GameStatePayload;
}

// Gaming WebSocket with player authentication
@protocol({
  protocol: "websocket",
  binding: {
    method: "GET",
    query: {
      type: "object",
      properties: {
        gameId: {
          type: "string",
          pattern: "^[a-zA-Z0-9-]{8,32}$",
          description: "Unique game session identifier"
        },
        playerId: {
          type: "string", 
          pattern: "^player_[a-zA-Z0-9]{8,16}$",
          description: "Player identifier"
        },
        spectator: {
          type: "boolean",
          default: false,
          description: "Connect as spectator (read-only)"
        }
      },
      required: ["gameId", "playerId"]
    },
    headers: {
      type: "object",
      properties: {
        "X-Game-Token": {
          type: "string",
          description: "Game session authentication token"
        },
        "X-Player-Secret": {
          type: "string",
          description: "Player authentication secret"
        }
      },
      required: ["X-Game-Token", "X-Player-Secret"]
    },
    bindingVersion: "0.1.0"
  }
})
@subscribe
op subscribeToGameUpdates(): GameChannel;

@protocol({
  protocol: "websocket",
  binding: {
    method: "GET",
    bindingVersion: "0.1.0"
  }
})
@publish
op sendGameAction(): GameChannel;

// === ERROR HANDLING AND HEARTBEAT ===

model HeartbeatPayload {
  timestamp: utcDateTime;
  connectionId: string;
  clientInfo: {
    version: string;
    platform: string;
    features: Array<string>;
  };
}

@channel("heartbeat")
model HeartbeatChannel {
  @message({
    name: "Heartbeat", 
    title: "Connection Heartbeat",
    description: "Keep-alive messages to maintain WebSocket connection",
    bindings: {
      ws: {
        bindingVersion: "0.1.0"
      }
    }
  })
  payload: HeartbeatPayload;
}

// Simple heartbeat mechanism
@protocol({
  protocol: "websocket",
  binding: {
    method: "GET",
    bindingVersion: "0.1.0"
  }
})
@subscribe
op subscribeToHeartbeat(): HeartbeatChannel;

@protocol({
  protocol: "websocket",
  binding: {
    method: "GET",
    bindingVersion: "0.1.0"
  }
})
@publish
op sendHeartbeat(): HeartbeatChannel;