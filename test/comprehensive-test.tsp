import "@typespec/asyncapi";

namespace ComprehensiveTest;

model NotificationEvent {
  id: string;
  message: string;
  timestamp: utcDateTime;
}

model SystemEvent {
  component: string;
  level: "info" | "warning" | "error";
}

// Test @subscribe decorator
@channel("notifications.user")
@subscribe
op receiveNotification(): NotificationEvent;

// Test @publish decorator  
@channel("events.system")
@publish
op publishSystemEvent(): SystemEvent;

// Test operation without type decorator (should default to send)
@channel("default.events")
op defaultTypeEvent(): NotificationEvent;