import "@typespec/asyncapi";

namespace TestApi;

model EventData {
  data: string;
}

@channel("user.events")  
@publish
@subscribe
op conflictingOperation(): EventData;