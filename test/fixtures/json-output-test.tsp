import "@larsartmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

namespace TestService;

@channel("user.events")
@protocol({
  type: "kafka",
  kafka: {
    topic: "user-events",
    partitions: 3,
    replicas: 2
  }
})
op publishUserEvent(data: UserEventMessage): void;

@channel("notification.alerts")
@security({
  name: "apiKey",
  scheme: {
    type: "apiKey",
    in: "header"
  }
})
op subscribeToAlerts(): NotificationMessage;

@message({
  name: "UserEvent",
  title: "User Event Message",
  contentType: "application/json"
})
model UserEventMessage {
  userId: string;
  eventType: string;
  timestamp: string;
  payload: Record<unknown>;
}

@message({
  name: "Notification",
  title: "Notification Message"
})
model NotificationMessage {
  id: string;
  message: string;
  priority: "high" | "medium" | "low";
}