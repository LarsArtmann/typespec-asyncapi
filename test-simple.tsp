import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@message({
  title: "Test Message",
  description: "A simple test message"
})
model TestMessage {
  message: string;
}

@channel("/test")
@publish(TestMessage)
op publishTest(): TestMessage;