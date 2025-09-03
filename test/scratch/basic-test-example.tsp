import "./lib/main.tsp";

@channel("test-channel")
@publish 
op publishTest(): string;
