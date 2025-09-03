// Test file to verify the emitter actually works
import "@lars-artmann/typespec-asyncapi";

using AsyncAPI;

namespace TestAPI;

model UserEvent {
  userId: string;
  action: string;
}

@channel("user-events")
model UserEventChannel {
  @AsyncAPI.message
  payload: UserEvent;
}

@AsyncAPI.publish(UserEventChannel)
op publishUserEvent(): void;