import "@typespec/asyncapi";

namespace TestApi;

model UserEvent {
  userId: string;
  email: string;
}

@channel("user.events")  
@subscribe
op handleUserSignup(): UserEvent;