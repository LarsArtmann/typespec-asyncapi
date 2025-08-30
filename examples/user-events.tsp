// Example: User Events AsyncAPI specification
// This demonstrates a real-world event-driven API for user management

import "@typespec/asyncapi";

using AsyncAPI;

@asyncapi({
  info: {
    title: "User Events API",
    version: "1.2.0",
    description: "Event-driven API for user lifecycle management",
    contact: {
      name: "API Support",
      email: "support@example.com"
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT"
    }
  },
  servers: {
    production: {
      host: "events.example.com",
      protocol: "kafka",
      description: "Production Kafka cluster"
    },
    staging: {
      host: "events-staging.example.com", 
      protocol: "kafka",
      description: "Staging environment"
    }
  }
})
namespace UserEvents;

// User Created Event
@channel("user.created")
model UserCreatedChannel {
  @message
  payload: UserCreatedPayload;
}

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

@operation("publish", UserCreatedChannel)
op publishUserCreated(): void;

// User Updated Event
@channel("user.updated")
model UserUpdatedChannel {
  @message
  payload: UserUpdatedPayload;
}

model UserUpdatedPayload {
  userId: string;
  updatedFields: string[];
  previousValues: Record<string>;
  newValues: Record<string>;
  updatedAt: utcDateTime;
  updatedBy: string;
}

@operation("publish", UserUpdatedChannel)
op publishUserUpdated(): void;

// User Deleted Event  
@channel("user.deleted")
model UserDeletedChannel {
  @message
  payload: UserDeletedPayload;
}

model UserDeletedPayload {
  userId: string;
  email: string;
  deletedAt: utcDateTime;
  deletionReason: "user_request" | "admin_action" | "compliance" | "inactive";
  retentionUntil?: utcDateTime;
}

@operation("publish", UserDeletedChannel)
op publishUserDeleted(): void;

// Subscription Operations (for consumers)
@operation("subscribe", UserCreatedChannel)
op subscribeToUserCreated(): void;

@operation("subscribe", UserUpdatedChannel)  
op subscribeToUserUpdated(): void;

@operation("subscribe", UserDeletedChannel)
op subscribeToUserDeleted(): void;