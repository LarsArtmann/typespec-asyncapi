// Advanced example test - Alpha compatible syntax
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

namespace UserEvents;

// Define message payload
model UserCreatedPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: utcDateTime;
  accountType: "free" | "premium" | "enterprise";
  metadata?: {
    source: string;
    campaign?: string;
  };
}

// Simple approach that should work with current Alpha
@channel("user.created")
@publish
op publishUserCreated(payload: UserCreatedPayload): void;

@channel("user.created")
@subscribe
op subscribeToUserCreated(): UserCreatedPayload;