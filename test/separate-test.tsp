import "@typespec/asyncapi";

namespace TestApi;

model UserEvent {
  userId: string;
  action: string;
}

@channel("user.events.out")
@publish
op publishUserAction(): UserEvent;

@channel("user.events.in")
@subscribe
op handleUserEvent(): UserEvent;