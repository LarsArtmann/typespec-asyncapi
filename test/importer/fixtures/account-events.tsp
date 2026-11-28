import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@service(#{ title: "Account Notifications" })
@apiVersion("1.0.0")
@defaultContentType("application/vnd.account+json")
@server("events", #{ url: "broker.example.test", protocol: "kafka" })
namespace Account_Notifications;

@messageId("Registered")
@message(#{
  title: "Registration completed",
  contentType: "application/vnd.account+json",
})
@jsonSchemaExtension("additionalProperties", false)
model AccountRegistration {
  @jsonSchemaExtension("minLength", 3)
  userId: string;

  @jsonSchemaExtension("default", false)
  verified?: boolean;

  previous?: AccountRegistration;
}

@publish
@channel("accounts/registered")
@useChannelServer("events")
op sendRegistration(): AccountRegistration;

@subscribe
@channel("accounts/registered")
@useChannelServer("events")
op receiveRegistration(): AccountRegistration;
