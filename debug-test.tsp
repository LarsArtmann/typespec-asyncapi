import "@larsartmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

namespace MyAPI {
  @channel("user/notifications")
  @publish
  op sendMessage(message: string): void;
}