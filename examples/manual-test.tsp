import "@lars-artmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

@server("production", #{
  url: "kafka://broker:9092",
  protocol: "kafka"
})
namespace ManualTest;

model Event { id: string; }

@channel("events")
op publishEvent(): Event;
