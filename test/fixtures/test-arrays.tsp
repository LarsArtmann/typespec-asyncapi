import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

namespace TestArrays;

model Item {
  id: string;
  name: string;
  tags: string[];
}

model Event {
  items: Item[];
  status: Status[];
  timestamp: utcDateTime;
  data: StatusData;
}

@channel("test.items")
@publish
op publishTestItems(): Event;
