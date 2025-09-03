import "@lars-artmann/typespec-asyncapi";

using AsyncAPI;

@server("production", {
  url: "kafka://broker.example.com:9092",
  protocol: "kafka",
  description: "Production Kafka cluster"
})
namespace TestNamespace {
  model Event {
    id: string;
    timestamp: utcDateTime;
    data: string;
  }
  
  @channel("user.events")
  @publish
  op publishUserEvent(): Event;
  
  @channel("notifications")
  @subscribe  
  op subscribeNotifications(): Event;
}