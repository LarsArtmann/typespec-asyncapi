export const heroCode = `import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

namespace MyAPI;

model Event {
  id: string;
  timestamp: utcDateTime;
}

@channel("events")
op publishEvent(): Event;`;
