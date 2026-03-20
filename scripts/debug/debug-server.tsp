import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

// Test @server decorator storage
@server("test", #{
  url: "test.example.com",
  protocol: "http"
})
namespace TestDebug;

// Simple model to trigger compilation
model TestMessage {
  message: string;
}

@channel("test.channel")
@publish
op publishTest(): TestMessage;