/**
 * AsyncAPI 3.1.0 Spec Compliance: Protocol Bindings
 *
 * Validates that all protocol bindings (Kafka, AMQP, MQTT, WebSocket, HTTP)
 * produce output that validates against the official AsyncAPI 3.1.0 JSON Schema.
 *
 * Binding fields that reference JSON Schema objects (e.g. Kafka groupId, WS query)
 * MUST be proper Schema objects, not plain strings.
 *
 * Spec reference: https://github.com/asyncapi/bindings
 */

import { describe, it, expect } from "vitest";
import { compileAndValidateOrThrow } from "../utils/schema-validator.js";
import { compileAsyncAPISpecWithoutErrors } from "../utils/test-helpers.js";
import { parse as parseYAML } from "yaml";

async function compileAndGetDoc(source: string): Promise<Record<string, unknown>> {
  const result = await compileAsyncAPISpecWithoutErrors(source);
  for (const [, content] of result.outputFiles) {
    if (typeof content === "string" && content.startsWith("asyncapi")) {
      return parseYAML(content);
    }
  }
  throw new Error("No AsyncAPI output found");
}

function getOp(doc: Record<string, unknown>): Record<string, unknown> {
  const operations = doc.operations as Record<string, Record<string, unknown>>;
  return Object.values(operations)[0];
}

function getMsgBindings(doc: Record<string, unknown>, name: string): Record<string, unknown> {
  const components = doc.components as Record<string, Record<string, Record<string, unknown>>>;
  return components.messages[name].bindings as Record<string, unknown>;
}

// ============================================================================
// Kafka Bindings
// ============================================================================

describe("Spec Compliance: Kafka Bindings", () => {
  it("emits valid Kafka channel binding via @protocol", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @protocol(#{
        protocol: "kafka",
        binding: #{
          topic: "events-topic",
          partitions: 3,
          replicas: 2
        }
      })
      op publish(): Event;
    `);

    const channels = doc.channels as Record<string, Record<string, unknown>>;
    const binding = channels["events"].bindings as Record<string, Record<string, unknown>>;
    expect(binding.kafka).toBeDefined();
    expect(binding.kafka.topic).toBe("events-topic");
    expect(binding.kafka.partitions).toBe(3);
    expect(binding.kafka.replicas).toBe(2);
    expect(binding.kafka.bindingVersion).toBe("0.5.0");
  });

  it("auto-injects bindingVersion when missing", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @protocol(#{
        protocol: "kafka",
        binding: #{ topic: "test" }
      })
      op publish(): Event;
    `);

    const channels = doc.channels as Record<string, Record<string, unknown>>;
    const binding = channels["events"].bindings as Record<string, Record<string, unknown>>;
    expect(binding.kafka.bindingVersion).toBe("0.5.0");
  });

  it("emits valid Kafka operation binding with Schema-typed fields", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @bindings(#{
        kafka: #{
          groupId: #{ type: "string" },
          clientId: #{ type: "string" }
        }
      })
      op subscribe(): Event;
    `);

    const op = getOp(doc);
    const binding = op.bindings as Record<string, Record<string, unknown>>;
    expect(binding.kafka).toBeDefined();
    expect(binding.kafka.groupId).toBeDefined();
    expect(binding.kafka.clientId).toBeDefined();
    expect(binding.kafka.bindingVersion).toBe("0.5.0");
  });

  it("emits valid Kafka message binding with Schema-typed key", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @bindings(#{
        kafka: #{
          key: #{ type: "string" },
          schemaIdLocation: "header"
        }
      })
      model OrderEvent { orderId: string; }
      @channel("orders")
      op publish(): OrderEvent;
    `);

    const binding = getMsgBindings(doc, "OrderEvent");
    const kafka = binding.kafka as Record<string, unknown>;
    expect(kafka).toBeDefined();
    expect(kafka.schemaIdLocation).toBe("header");
    expect(kafka.bindingVersion).toBe("0.5.0");
  });

  it("preserves explicitly set bindingVersion", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @bindings(#{
        kafka: #{
          groupId: #{ type: "string" },
          bindingVersion: "0.4.0"
        }
      })
      op subscribe(): Event;
    `);

    const op = getOp(doc);
    const binding = op.bindings as Record<string, Record<string, unknown>>;
    expect(binding.kafka.bindingVersion).toBe("0.4.0");
  });
});

// ============================================================================
// AMQP Bindings
// ============================================================================

describe("Spec Compliance: AMQP Bindings", () => {
  it("emits valid AMQP operation binding with priority and deliveryMode", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("amqp-events")
      @bindings(#{
        amqp: #{
          priority: 5,
          deliveryMode: 2,
          timestamp: true,
          ack: true
        }
      })
      op publish(): Event;
    `);

    const op = getOp(doc);
    const binding = op.bindings as Record<string, Record<string, unknown>>;
    expect(binding.amqp).toBeDefined();
    expect(binding.amqp.priority).toBe(5);
    expect(binding.amqp.deliveryMode).toBe(2);
    expect(binding.amqp.bindingVersion).toBe("0.3.0");
  });

  it("emits valid AMQP message binding with contentEncoding", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @bindings(#{
        amqp: #{
          contentEncoding: "application/octet-stream",
          messageType: "amqp-1.0"
        }
      })
      model AmqpEvent { payload: bytes; }
      @channel("amqp-channel")
      op publish(): AmqpEvent;
    `);

    const binding = getMsgBindings(doc, "AmqpEvent");
    const amqp = binding.amqp as Record<string, unknown>;
    expect(amqp).toBeDefined();
    expect(amqp.contentEncoding).toBe("application/octet-stream");
    expect(amqp.bindingVersion).toBe("0.3.0");
  });
});

// ============================================================================
// MQTT Bindings
// ============================================================================

describe("Spec Compliance: MQTT Bindings", () => {
  it("emits valid MQTT operation binding with QoS", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("mqtt-events")
      @bindings(#{
        mqtt: #{
          qos: 2,
          retain: true
        }
      })
      op publish(): Event;
    `);

    const op = getOp(doc);
    const binding = op.bindings as Record<string, Record<string, unknown>>;
    expect(binding.mqtt).toBeDefined();
    expect(binding.mqtt.qos).toBe(2);
    expect(binding.mqtt.retain).toBe(true);
    expect(binding.mqtt.bindingVersion).toBe("0.2.0");
  });

  it("emits valid MQTT server binding via @server protocol", async () => {
    const doc = await compileAndValidateOrThrow(`
      @server("mqtt-broker", #{
        url: "mqtt://broker.example.com:1883",
        protocol: "mqtt"
      })
      namespace Test;
      model Event { id: string; }
      @channel("mqtt-topic")
      op publish(): Event;
    `);

    const servers = doc.servers as Record<string, Record<string, unknown>>;
    expect(servers["mqtt-broker"].protocol).toBe("mqtt");
  });

  it("emits QoS 0 for fire-and-forget pattern", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("sensor-data")
      @bindings(#{
        mqtt: #{ qos: 0 }
      })
      op publish(): Event;
    `);

    const op = getOp(doc);
    const binding = op.bindings as Record<string, Record<string, unknown>>;
    expect(binding.mqtt.qos).toBe(0);
    expect(binding.mqtt.bindingVersion).toBe("0.2.0");
  });
});

// ============================================================================
// WebSocket Bindings
// ============================================================================

describe("Spec Compliance: WebSocket Bindings", () => {
  it("emits valid WebSocket channel binding via @protocol", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Message { text: string; }
      @channel("ws-channel")
      @protocol(#{
        protocol: "ws",
        binding: #{
          method: "GET"
        }
      })
      op subscribe(): Message;
    `);

    const channels = doc.channels as Record<string, Record<string, unknown>>;
    const binding = channels["ws-channel"].bindings as Record<string, Record<string, unknown>>;
    expect(binding.ws).toBeDefined();
    expect(binding.ws.method).toBe("GET");
    expect(binding.ws.bindingVersion).toBe("0.1.0");
  });

  it("normalizes websocket alias to ws in binding keys", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("ws-channel")
      @protocol(#{
        protocol: "websocket",
        binding: #{ method: "GET" }
      })
      op subscribe(): Event;
    `);

    const channels = doc.channels as Record<string, Record<string, unknown>>;
    const binding = channels["ws-channel"].bindings as Record<string, Record<string, unknown>>;
    expect(binding.ws).toBeDefined();
    expect(binding.websocket).toBeUndefined();
    expect(binding.ws.method).toBe("GET");
    expect(binding.ws.bindingVersion).toBe("0.1.0");
  });

  it("emits WebSocket binding with POST method", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("ws-channel")
      @protocol(#{
        protocol: "ws",
        binding: #{ method: "POST" }
      })
      op subscribe(): Event;
    `);

    const channels = doc.channels as Record<string, Record<string, unknown>>;
    const binding = channels["ws-channel"].bindings as Record<string, Record<string, unknown>>;
    expect(binding.ws.method).toBe("POST");
    expect(binding.ws.bindingVersion).toBe("0.1.0");
  });

  it("works with wss (secure WebSocket) server protocol", async () => {
    const doc = await compileAndValidateOrThrow(`
      @server("secure-ws", #{
        url: "wss://api.example.com",
        protocol: "wss"
      })
      namespace Test;
      model Event { id: string; }
      @channel("ws-channel")
      @protocol(#{
        protocol: "wss",
        binding: #{ method: "GET" }
      })
      op subscribe(): Event;
    `);

    const servers = doc.servers as Record<string, Record<string, unknown>>;
    expect(servers["secure-ws"].protocol).toBe("wss");
  });
});

// ============================================================================
// HTTP Bindings
// ============================================================================

describe("Spec Compliance: HTTP Bindings", () => {
  it("emits valid HTTP operation binding with method", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model WebhookEvent { id: string; type: string; }
      @channel("webhook")
      @bindings(#{
        http: #{
          method: "POST"
        }
      })
      op publish(): WebhookEvent;
    `);

    const op = getOp(doc);
    const binding = op.bindings as Record<string, Record<string, unknown>>;
    expect(binding.http).toBeDefined();
    expect(binding.http.method).toBe("POST");
    expect(binding.http.bindingVersion).toBe("0.3.0");
  });

  it("emits valid HTTP message binding with headers schema", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @bindings(#{
        http: #{
          headers: #{
            type: "object",
            properties: #{
              XRequestId: #{ type: "string" }
            }
          }
        }
      })
      model HttpEvent { payload: string; }
      @channel("http-events")
      op publish(): HttpEvent;
    `);

    const binding = getMsgBindings(doc, "HttpEvent");
    const http = binding.http as Record<string, unknown>;
    expect(http).toBeDefined();
    expect(http.headers).toBeDefined();
    expect(http.bindingVersion).toBe("0.3.0");
  });
});

// ============================================================================
// Multi-Protocol Binding Integration
// ============================================================================

describe("Spec Compliance: Multi-Protocol Bindings", () => {
  it("supports multiple protocols in a single document", async () => {
    const doc = await compileAndValidateOrThrow(`
      @server("kafka-server", #{
        url: "kafka://broker:9092",
        protocol: "kafka"
      })
      @server("ws-server", #{
        url: "ws://localhost:8080",
        protocol: "ws"
      })
      namespace Multi;
      model KafkaEvent { id: string; }
      model WsMessage { text: string; }

      @channel("kafka-topic")
      @protocol(#{
        protocol: "kafka",
        binding: #{ partitions: 5 }
      })
      op publishKafka(): KafkaEvent;

      @channel("ws-channel")
      @protocol(#{
        protocol: "ws",
        binding: #{ method: "GET" }
      })
      op subscribeWs(): WsMessage;
    `);

    const servers = doc.servers as Record<string, Record<string, unknown>>;
    expect(servers["kafka-server"].protocol).toBe("kafka");
    expect(servers["ws-server"].protocol).toBe("ws");

    const channels = doc.channels as Record<string, Record<string, unknown>>;
    expect((channels["kafka-topic"].bindings as Record<string, unknown>).kafka).toBeDefined();
    expect((channels["ws-channel"].bindings as Record<string, unknown>).ws).toBeDefined();
  });

  it("all binding versions auto-injected correctly per protocol", async () => {
    const doc = await compileAndGetDoc(`
      namespace Test;
      model Event { id: string; }

      @channel("kafka-ch")
      @protocol(#{
        protocol: "kafka",
        binding: #{ topic: "test" }
      })
      op publishKafka(): Event;

      @channel("ws-ch")
      @protocol(#{
        protocol: "ws",
        binding: #{ method: "GET" }
      })
      op subscribeWs(): Event;
    `);

    const channels = doc.channels as Record<string, Record<string, unknown>>;
    const kBinding = channels["kafka-ch"].bindings as Record<string, Record<string, unknown>>;
    expect(kBinding.kafka?.bindingVersion).toBe("0.5.0");

    const wsBinding = channels["ws-ch"].bindings as Record<string, Record<string, unknown>>;
    expect(wsBinding.ws?.bindingVersion).toBe("0.1.0");
  });
});
