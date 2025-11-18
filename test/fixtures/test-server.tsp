import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@server("production", #{
  url: "api.example.com",
  protocol: "https",
  description: "Production API"
})
@server("development", #{
  url: "dev-api.example.com",
  protocol: "http",
  description: "Development API"
})
namespace TestServer;

@message(#{
  name: "UserEvent",
  title: "User Event Message"
})
model UserEvent {
  userId: string;
  event: string;
  timestamp: utcDateTime;
}

@channel("user.events")
@publish
op publishUserEvent(): UserEvent;