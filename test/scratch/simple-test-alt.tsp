import "@lars-artmann/typespec-asyncapi"; using TypeSpec.AsyncAPI; @channel("test.simple") @publish op testMessage(): string;
