import "@lars-artmann/typespec-asyncapi";

// Test minimal decorators
@channel("/test/simple")
op simpleOp(): void;

@server({
  name: "test-server",
  url: "test://localhost",
  protocol: "test"
})
namespace TestNamespace;