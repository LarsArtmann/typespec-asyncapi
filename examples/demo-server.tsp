import "@typespec/compiler";

using TypeSpec.Reflection;

namespace TypeSpec.AsyncAPI;

// Simple demo without decorators to test compilation
namespace SimpleDemo {
  model Event {
    id: string;
    timestamp: utcDateTime;
  }
}