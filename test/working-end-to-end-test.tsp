import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

model UserEvent {
  userId: string;
  action: string;
  timestamp: utcDateTime;
}

@channel("/users/{userId}/events")
@publish
op publishUserEvent(userEvent: UserEvent): void;