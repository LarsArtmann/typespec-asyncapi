//TODO: HARDCODED PROTOCOL UNION! VIOLATES ASYNCAPI EXTENSIBILITY PRINCIPLES!
//TODO: CRITICAL ASYNCAPI VIOLATION - AsyncAPI spec supports custom protocols, this hardcoded union prevents them!
//TODO: MACHINE-READABLE INTERFACE FAILURE - Protocol types should be discoverable, not hardcoded literals!
//TODO: BUSINESS LOGIC LIMITATION - Custom enterprise protocols cannot be added without code changes!
//TODO: PROPER ASYNCAPI SOLUTION - Use protocol registry or enum from AsyncAPI specification!
export type ProtocolType =
  | "kafka"
  | "websocket"
  | "http"
  | "amqp"
  | "mqtt"
  | "redis";
