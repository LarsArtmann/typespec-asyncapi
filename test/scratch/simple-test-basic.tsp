using TypeSpec.Reflection;

namespace TypeSpec.AsyncAPI;

@channel("test-channel")
@publish 
op publishTest(): string;
