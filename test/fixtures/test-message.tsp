import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

namespace TestMessage;

@message(#{
  name: "UserRegistered",
  title: "User Registration Event",
  contentType: "application/json",
  description: "Emitted when a new user registers"
})
model UserRegistered {
  userId: string;
  email: string;
  timestamp: utcDateTime;
}

@channel("user.registered")
@publish
op publishUserRegistered(): UserRegistered;