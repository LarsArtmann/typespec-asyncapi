import "@larsartmann/typespec-asyncapi";

@channel("test-channel")
@publish 
op publishTest(): string;
