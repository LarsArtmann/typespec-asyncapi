import "@typespec/asyncapi";

using TypeSpec.AsyncAPI;

@server("kafka-server", {url: "kafka://localhost:9092", protocol: "kafka", description: "Kafka message broker"})
namespace TestService {
  
  @message
  model UserCreatedMessage {
    userId: string;
    email: string;
    timestamp: utcDateTime;
  }
  
  @channel("user.events")
  @protocol({type: "kafka", groupId: "test-group", clientId: "test-client"})
  @publish
  op publishUserCreated(message: UserCreatedMessage): void;
  
  @channel("user.events") 
  @protocol({type: "kafka", groupId: "test-group", clientId: "test-client"})
  @subscribe  
  op subscribeUserEvents(): UserCreatedMessage;
  
  @message
  model NotificationMessage {
    recipientId: string;
    content: string;
    type: "email" | "sms" | "push";
  }
  
  @channel("notifications")
  @protocol({type: "websocket", path: "/notifications"}) 
  @publish
  op sendNotification(message: NotificationMessage): void;
  
  @message
  model ApiRequestMessage {
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string;
    headers?: Record<string>;
  }
  
  @channel("api.requests")
  @protocol({type: "http", method: "POST"})
  @publish
  op handleApiRequest(message: ApiRequestMessage): void;
}