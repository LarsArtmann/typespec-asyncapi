import "@larsartmann/typespec-asyncapi";

using AsyncAPI;

@server("main", {
  url: "localhost:9092",
  protocol: "kafka"
})
namespace UserEvents;

@channel("/users/{id}/events")
@publish
op publishUserEvent(id: string, event: UserEventPayload): void;

@channel("/users/{id}/notifications") 
@subscribe
op subscribeToUserNotifications(id: string): UserNotification;

model UserEventPayload {
  type: string;
  timestamp: utcDateTime;
  data: Record<unknown>;
}

model UserNotification {
  message: string;
  priority: "low" | "medium" | "high";
}