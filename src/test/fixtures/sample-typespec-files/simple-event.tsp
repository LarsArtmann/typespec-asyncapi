import "@typespec/asyncapi";
using TypeSpec.AsyncAPI;

@doc("Simple event system for testing")
namespace SimpleEventSystem;

@doc("Basic event message")
@message({
  name: "SimpleEvent",
  title: "Simple Event Message",
  contentType: "application/json",
  description: "A basic event message for testing"
})
model SimpleEvent {
  @doc("Unique event identifier")
  eventId: string;
  
  @doc("Event timestamp")
  timestamp: utcDateTime;
  
  @doc("Event payload")
  payload: string;
}

@channel("simple.events")
@doc("Channel for simple events")
@publish
op publishSimpleEvent(): SimpleEvent;