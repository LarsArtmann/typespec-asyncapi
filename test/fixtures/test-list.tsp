import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

namespace TestList;

model Event {
  items: string[];
}

@channel("events")
@publish
op publishEvents(): Event;
