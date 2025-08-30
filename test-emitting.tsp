// Test file to verify the emitter actually works
import "@typespec/asyncapi";

using AsyncAPI;

@asyncapi({
  info: {
    title: "Test API",
    version: "1.0.0"
  }
})
namespace TestAPI;

model UserEvent {
  userId: string;
  action: string;
}

@channel("user-events")
model UserEventChannel {
  @message
  payload: UserEvent;
}

@operation("publish", UserEventChannel)
op publishUserEvent(): void;