import "@larsartmann/typespec-asyncapi";
using TypeSpec.Reflection;

@channel("test-channel")
@publish 
op publishTest(): string;
