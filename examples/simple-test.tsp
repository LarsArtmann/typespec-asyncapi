import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;
namespace SimpleTest;

model SimpleMessage {
  id: string;
  content: string;
}

@channel("test.messages")
@publish
op sendMessage(): SimpleMessage;
