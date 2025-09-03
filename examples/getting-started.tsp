// 🚀 Getting Started Example - TypeSpec AsyncAPI Emitter
// Copy this file and run: npx tsp compile getting-started.tsp --emit @lars-artmann/typespec-asyncapi

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

@channel("user.messages")
@subscribe
op receiveUserMessage(): UserMessage;

// ✨ That's it! This generates a complete AsyncAPI 3.0 specification
// Output will be in: tsp-output/@lars-artmann/typespec-asyncapi/AsyncAPI.yaml