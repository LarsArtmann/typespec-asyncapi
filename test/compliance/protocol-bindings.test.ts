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

import { inlineObject } from "../utils/type-guards.js";
import { compileAndValidateOrThrow } from "../utils/schema-validator.js";
import { LATEST_BINDING_VERSIONS } from "../../src/constants/binding-versions.js";
import { compileAsyncAPISpecWithoutErrors } from "../utils/test-helpers.js";
import { parse as parseYAML } from "yaml";
import type {
  MessageObject,
  OperationObject,
  ParsedAsyncAPIDocument,
  ProtocolBindings,
} from "../../src/domain/models/asyncapi-document.js";

async function compileAndGetDoc(
  source: string,
): Promise<ParsedAsyncAPIDocument> {
  const result = await compileAsyncAPISpecWithoutErrors(source);
  for (const [, content] of result.outputFiles) {
    if (typeof content === "string" && content.startsWith("asyncapi")) {
      return parseYAML(content) as ParsedAsyncAPIDocument;
    }
  }
  throw new Error("No AsyncAPI output found");
}

function getOp(doc: ParsedAsyncAPIDocument): OperationObject {
  return Object.values(doc.operations!)[0];
}

function getMsgBindings(
  doc: ParsedAsyncAPIDocument,
  name: string,
): ProtocolBindings {
  const msg = doc.components!.messages![name] as MessageObject;
  return inlineObject(msg.bindings, "bindings");
}

// ============================================================================
// Kafka Bindings
// ============================================================================

describe("spec Compliance: Kafka Bindings", () => {
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

    const binding = inlineObject(doc.channels!["events"].bindings, "bindings");
    expect(binding.kafka).toBeDefined();
    expect(binding.kafka.topic).toBe("events-topic");
    expect(binding.kafka.partitions).toBe(3);
    expect(binding.kafka.replicas).toBe(2);
    expect(binding.kafka.bindingVersion).toBe(LATEST_BINDING_VERSIONS.kafka);
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

    const binding = inlineObject(doc.channels!["events"].bindings, "bindings");
    expect(binding.kafka.bindingVersion).toBe(LATEST_BINDING_VERSIONS.kafka);
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
    const binding = inlineObject(op.bindings, "bindings");
    expect(binding.kafka).toBeDefined();
    expect(binding.kafka.groupId).toBeDefined();
    expect(binding.kafka.clientId).toBeDefined();
    expect(binding.kafka.bindingVersion).toBe(LATEST_BINDING_VERSIONS.kafka);
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
    const { kafka } = binding;
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
    const binding = inlineObject(op.bindings, "bindings");
    expect(binding.kafka.bindingVersion).toBe("0.4.0");
  });
});

// ============================================================================
// AMQP Bindings
// ============================================================================

describe("spec Compliance: AMQP Bindings", () => {
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
    const binding = inlineObject(op.bindings, "bindings");
    expect(binding.amqp).toBeDefined();
    expect(binding.amqp.priority).toBe(5);
    expect(binding.amqp.deliveryMode).toBe(2);
    expect(binding.amqp.bindingVersion).toBe(LATEST_BINDING_VERSIONS.amqp);
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
    const { amqp } = binding;
    expect(amqp).toBeDefined();
    expect(amqp.contentEncoding).toBe("application/octet-stream");
    expect(amqp.bindingVersion).toBe("0.3.0");
  });
});

// ============================================================================
// MQTT Bindings
// ============================================================================

describe("spec Compliance: MQTT Bindings", () => {
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
    const binding = inlineObject(op.bindings, "bindings");
    expect(binding.mqtt).toBeDefined();
    expect(binding.mqtt.qos).toBe(2);
    expect(binding.mqtt.retain).toBeTruthy();
    expect(binding.mqtt.bindingVersion).toBe(LATEST_BINDING_VERSIONS.mqtt);
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

    expect(doc.servers!["mqtt-broker"].protocol).toBe("mqtt");
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
    const binding = inlineObject(op.bindings, "bindings");
    expect(binding.mqtt.qos).toBe(0);
    expect(binding.mqtt.bindingVersion).toBe(LATEST_BINDING_VERSIONS.mqtt);
  });
});

// ============================================================================
// WebSocket Bindings
// ============================================================================

describe("spec Compliance: WebSocket Bindings", () => {
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

    const binding = inlineObject(doc.channels!["ws-channel"].bindings, "bindings");
    expect(binding.ws).toBeDefined();
    expect(binding.ws.method).toBe("GET");
    expect(binding.ws.bindingVersion).toBe(LATEST_BINDING_VERSIONS.ws);
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

    const binding = inlineObject(doc.channels!["ws-channel"].bindings, "bindings");
    expect(binding.ws).toBeDefined();
    expect(binding.websocket).toBeUndefined();
    expect(binding.ws.method).toBe("GET");
    expect(binding.ws.bindingVersion).toBe(LATEST_BINDING_VERSIONS.ws);
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

    const binding = inlineObject(doc.channels!["ws-channel"].bindings, "bindings");
    expect(binding.ws.method).toBe("POST");
    expect(binding.ws.bindingVersion).toBe(LATEST_BINDING_VERSIONS.ws);
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

    expect(doc.servers!["secure-ws"].protocol).toBe("wss");
  });
});

// ============================================================================
// HTTP Bindings
// ============================================================================

describe("spec Compliance: HTTP Bindings", () => {
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
    const binding = inlineObject(op.bindings, "bindings");
    expect(binding.http).toBeDefined();
    expect(binding.http.method).toBe("POST");
    expect(binding.http.bindingVersion).toBe(LATEST_BINDING_VERSIONS.http);
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
    const { http } = binding;
    expect(http).toBeDefined();
    expect(http.headers).toBeDefined();
    expect(http.bindingVersion).toBe("0.3.0");
  });
});

// ============================================================================
// @protocol Config Field Placement
// ============================================================================

describe("spec Compliance: @protocol Field Placement", () => {
  it("emits kafka config fields across channel and operation placements", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @protocol(#{
        protocol: "kafka",
        partitions: 3,
        replicationFactor: 2,
        consumerGroup: "order-service"
      })
      op publish(): Event;
    `);

    const channelBinding = inlineObject(doc.channels!["events"].bindings, "bindings");
    expect(channelBinding.kafka.partitions).toBe(3);
    expect(channelBinding.kafka.replicas).toBe(2);
    expect(channelBinding.kafka.bindingVersion).toBe(LATEST_BINDING_VERSIONS.kafka);

    const opBinding = inlineObject(getOp(doc).bindings, "bindings");
    expect(opBinding.kafka.groupId).toStrictEqual({
      type: "string",
      const: "order-service",
    });
    expect(opBinding.kafka.bindingVersion).toBe(LATEST_BINDING_VERSIONS.kafka);
  });

  it("does not fabricate binding fields the user did not write", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @protocol(#{ protocol: "kafka" })
      op publish(): Event;
    `);

    expect(doc.channels!["events"].bindings).toBeUndefined();
  });

  it("emits mqtt qos/retain on the operation binding, not the channel", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @protocol(#{ protocol: "mqtt", qos: 2, retain: true })
      op publish(): Event;
    `);

    expect(doc.channels!["events"].bindings).toBeUndefined();
    const opBinding = inlineObject(getOp(doc).bindings, "bindings");
    expect(opBinding.mqtt.qos).toBe(2);
    expect(opBinding.mqtt.retain).toBe(true);
    expect(opBinding.mqtt.bindingVersion).toBeDefined();
  });

  it("maps ws headers and queryParams onto the channel binding", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @protocol(#{
        protocol: "websocket",
        headers: #{ authorization: "Bearer" },
        queryParams: #{ room: "general" }
      })
      op publish(): Event;
    `);

    const channelBinding = inlineObject(doc.channels!["events"].bindings, "bindings");
    expect(channelBinding.ws).toBeDefined();
    expect(channelBinding.ws.headers).toStrictEqual({
      authorization: "Bearer",
    });
    expect(channelBinding.ws.query).toStrictEqual({ room: "general" });
  });

  it("merges @protocol operation binding with @bindings without clobbering", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { id: string; }
      @channel("events")
      @protocol(#{ protocol: "kafka", consumerGroup: "order-service" })
      @bindings(#{
        kafka: #{
          clientId: #{ type: "string" },
          bindingVersion: "0.5.0"
        }
      })
      op publish(): Event;
    `);

    const opBinding = inlineObject(getOp(doc).bindings, "bindings");
    expect(opBinding.kafka.groupId).toStrictEqual({
      type: "string",
      const: "order-service",
    });
    expect(opBinding.kafka.clientId).toStrictEqual({ type: "string" });
  });
});

// ============================================================================
// Multi-Protocol Binding Integration
// ============================================================================

describe("spec Compliance: Multi-Protocol Bindings", () => {
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

    expect(doc.servers!["kafka-server"].protocol).toBe("kafka");
    expect(doc.servers!["ws-server"].protocol).toBe("ws");

    const channels = doc.channels!;
    expect(channels["kafka-topic"].bindings!.kafka).toBeDefined();
    expect(channels["ws-channel"].bindings!.ws).toBeDefined();
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

    const channels = doc.channels!;
    const kBinding = inlineObject(channels["kafka-ch"].bindings, "bindings");
    expect(kBinding.kafka?.bindingVersion).toBe(LATEST_BINDING_VERSIONS.kafka);

    const wsBinding = inlineObject(channels["ws-ch"].bindings, "bindings");
    expect(wsBinding.ws?.bindingVersion).toBe(LATEST_BINDING_VERSIONS.ws);
  });
});
