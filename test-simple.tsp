/**
 * Simple test for AsyncAPI emitter
 */

import "@lars-artmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

namespace TestAPI;

model User {
  id: string;
  name: string;
  email: string;
}

@message({
  name: "UserCreated",
  title: "User Created Event",
  description: "Emitted when a new user is created"
})
model UserCreatedMessage {
  user: User;
  timestamp: utcDateTime;
}

@channel("user.created")
@publish
op publishUserCreated(): UserCreatedMessage;

@channel("user.created")
@subscribe
op subscribeUserCreated(): UserCreatedMessage;
