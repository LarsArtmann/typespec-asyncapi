
import "./lib/main.tsp";

using TypeSpec.AsyncAPI;

@service
namespace TestAPI {
  @channel("test.channel")
  @publish
  op publishTest(): void;
}

