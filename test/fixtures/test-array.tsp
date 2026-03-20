import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

namespace TestArray;

model Event {
  ids: string[];
}

@channel("events")
@publish
op publishEvents(): Event;
