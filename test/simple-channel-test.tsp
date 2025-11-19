import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

// Test just @channel decorator
@channel("/test/simple")
op testOp(): void;