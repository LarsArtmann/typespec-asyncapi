using TypeSpec.AsyncAPI;

@channel("test/events")
@publish
op publishTest(): void;
